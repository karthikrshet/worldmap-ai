"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3Geo from "d3-geo";
import * as d3GeoProj from "d3-geo-projection";
import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import "d3-transition";
import { useMapStore, type ProjectionId } from "@/stores/mapStore";
import {
  loadCountries,
  loadCities,
  type GeoCountryFeature,
  type GeoCityFeature,
  type CountryDataset,
  type CityDataset,
} from "@/lib/geoData";
import { calculateGeodesicDistance } from "@/lib/geoCalculations";
import { Plus, Minus, RotateCcw, Grid } from "lucide-react";

interface HoverInfo {
  x: number;
  y: number;
  name: string;
  subtitle: string;
  type: "country" | "city";
}

export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    activeProjection,
    activeMode,
    selectedCountries,
    selectCountry,
    clearCountries,
    selectedCity,
    setSelectedCity,
    highlightedCountries,
    neighborCountries,
    trueSizeIso3,
    trueSizeCoords,
    setTrueSizeCoords,
    sliderPosition,
    lensPosition,
    distanceResult,
    setDistanceResult,
    showGraticule,
    toggleGraticule,
  } = useMapStore();

  const [countries, setCountries] = useState<CountryDataset | null>(null);
  const [cities, setCities] = useState<CityDataset | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 700,
  });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Zoom transform tracking
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const zoomBehaviorRef = useRef<d3Zoom.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Dragging states
  const [isDraggingTrueSize, setIsDraggingTrueSize] = useState(false);
  const [isDraggingLens, setIsDraggingLens] = useState(false);

  // Measure origin picker
  const [measureOrigin, setMeasureOrigin] = useState<GeoCityFeature | null>(null);

  // ── Load datasets ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function initData() {
      try {
        const [cData, ciData] = await Promise.all([loadCountries(), loadCities()]);
        if (mounted) {
          setCountries(cData);
          setCities(ciData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
        if (mounted) setLoading(false);
      }
    }
    initData();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Window Resize ──────────────────────────────────────────────────
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(400, rect.width),
          height: Math.max(300, rect.height),
        });
      }
    }
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const { width, height } = dimensions;

  // ── Base Projection Setup ──────────────────────────────────────────
  const baseProjection = useMemo(() => {
    const scale = Math.min(width / 5.8, height / 3.0);
    const center: [number, number] = [width / 2, height / 2];

    switch (activeProjection) {
      case "mercator":
        return d3Geo
          .geoMercator()
          .scale(scale * 0.95)
          .translate(center);
      case "robinson":
        return (d3GeoProj.geoRobinson() as d3Geo.GeoProjection)
          .scale(scale * 1.1)
          .translate(center);
      case "winkel-tripel":
        return (d3GeoProj.geoWinkel3() as d3Geo.GeoProjection)
          .scale(scale * 1.05)
          .translate(center);
      case "mollweide":
        return (d3GeoProj.geoMollweide() as d3Geo.GeoProjection)
          .scale(scale * 1.15)
          .translate(center);
      case "orthographic":
        return d3Geo
          .geoOrthographic()
          .scale(scale * 1.5)
          .translate(center)
          .clipAngle(90);
      case "equal-earth":
      default:
        return d3Geo
          .geoEqualEarth()
          .scale(scale * 1.25)
          .translate(center);
    }
  }, [activeProjection, width, height]);

  // Secondary Mercator for split slider / lens
  const mercatorProjection = useMemo(() => {
    const scale = Math.min(width / 5.8, height / 3.0);
    return d3Geo
      .geoMercator()
      .scale(scale * 0.95)
      .translate([width / 2, height / 2]);
  }, [width, height]);

  const geoPath = useMemo(() => d3Geo.geoPath().projection(baseProjection), [baseProjection]);
  const mercatorGeoPath = useMemo(
    () => d3Geo.geoPath().projection(mercatorProjection),
    [mercatorProjection]
  );

  // Graticule geometry
  const graticuleLines = useMemo(() => d3Geo.geoGraticule10(), []);
  const equatorLine = useMemo(
    () =>
      ({
        type: "LineString",
        coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, 0]),
      } as GeoJSON.LineString),
    []
  );

  // ── Setup Zoom & Pan ───────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3Selection.select(svgRef.current);
    const g = svg.select<SVGGElement>("#map-zoom-group");

    const zoom = d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 12])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        setCurrentZoom(event.transform.k);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);
    svg.on("dblclick.zoom", null);
  }, []);

  // ── Smooth Zoom to Country Bounding Box ────────────────────────────
  const zoomToCountry = useCallback(
    (feature: GeoCountryFeature) => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;

      const bounds = geoPath.bounds(feature);
      if (!bounds || bounds[0].some(isNaN) || bounds[1].some(isNaN)) return;

      const [[x0, y0], [x1, y1]] = bounds;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const x = (x0 + x1) / 2;
      const y = (y0 + y1) / 2;

      // Safe responsive zoom
      const maxZoom = 6.5;
      const minZoom = 1.6;
      const targetScale = Math.max(
        minZoom,
        Math.min(maxZoom, 0.68 / Math.max(dx / width, dy / height))
      );

      // On desktop, offset slightly to left to accommodate right drawer
      const xOffset = width > 1024 ? width * 0.42 : width / 2;
      const translate: [number, number] = [
        xOffset - targetScale * x,
        height / 2 - targetScale * y,
      ];

      const svg = d3Selection.select(svgRef.current);
      svg
        .transition()
        .duration(650)
        .call(
          zoomBehaviorRef.current.transform,
          d3Zoom.zoomIdentity.translate(translate[0], translate[1]).scale(targetScale)
        );
    },
    [geoPath, width, height]
  );

  // Reset to World Scale
  const resetToWorld = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    clearCountries();
    setSelectedCity(null);

    // Update URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("country");
      window.history.replaceState({}, "", url.toString());
    }

    const svg = d3Selection.select(svgRef.current);
    svg
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.transform, d3Zoom.zoomIdentity);
  }, [clearCountries, setSelectedCity]);

  // Click country
  const handleCountryClick = useCallback(
    (feature: GeoCountryFeature) => {
      const p = feature.properties;
      const iso3 = ((p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "").toUpperCase();

      selectCountry({
        iso3,
        name: p.NAME || p.ADMIN || "Unknown",
        continent: p.CONTINENT,
        subregion: p.SUBREGION,
      });

      if (typeof window !== "undefined" && iso3) {
        const url = new URL(window.location.href);
        url.searchParams.set("country", iso3);
        window.history.replaceState({}, "", url.toString());
      }

      zoomToCountry(feature);
    },
    [selectCountry, zoomToCountry]
  );

  // Click city
  const handleCityClick = useCallback(
    (city: GeoCityFeature) => {
      setSelectedCity(city);

      if (measureOrigin && measureOrigin.properties.name !== city.properties.name) {
        const res = calculateGeodesicDistance(
          measureOrigin.geometry.coordinates,
          city.geometry.coordinates,
          `${measureOrigin.properties.name}, ${measureOrigin.properties.adm0name}`,
          `${city.properties.name}, ${city.properties.adm0name}`
        );
        setDistanceResult(res);
        setMeasureOrigin(null);
      }
    },
    [setSelectedCity, measureOrigin, setDistanceResult]
  );

  // Selected Country ISO Set
  const selectedIso = selectedCountries[0]?.iso3?.toUpperCase() || null;
  const highlightIsoSet = useMemo(
    () => new Set(highlightedCountries.map((i) => i.toUpperCase())),
    [highlightedCountries]
  );
  const neighborIsoSet = useMemo(
    () => new Set(neighborCountries.map((i) => i.toUpperCase())),
    [neighborCountries]
  );

  // ── STRICT CITY DECLUTTERING & SCREEN-SPACE COLLISION DETECTION ─────
  // Core Rule:
  // 1. When NO country is selected at world zoom: show almost NO city labels (max 6-8 global megacities/capitals).
  // 2. When a country IS selected: show ONLY that country's major cities, fading unrelated worldwide cities to 0.
  const declutteredCities = useMemo(() => {
    if (!cities) return [];

    let candidateCities: GeoCityFeature[] = [];

    if (selectedIso) {
      // Country Focus Mode: Only cities belonging to the selected country
      candidateCities = cities.features.filter((c) => {
        const p = c.properties;
        const cIso = (p.adm0_a3 || p.sov_a3 || "").toUpperCase();
        return cIso === selectedIso;
      });

      // Sort by prominence (Capitals > Megacities > Population)
      candidateCities.sort((a, b) => {
        const capA = Number(a.properties.adm0cap || 0);
        const capB = Number(b.properties.adm0cap || 0);
        if (capA !== capB) return capB - capA;
        return Number(b.properties.pop_max || 0) - Number(a.properties.pop_max || 0);
      });

      // Limit to max 10 prominent cities for the selected nation
      candidateCities = candidateCities.slice(0, 10);
    } else {
      // Global World View:
      if (currentZoom < 1.8) {
        // At world scale: Show top 6 major global capitals ONLY
        const worldCapitals = ["Tokyo", "London", "Washington, D.C.", "New Delhi", "Beijing", "Paris", "Brasília"];
        candidateCities = cities.features.filter((c) => worldCapitals.includes(c.properties.name));
      } else if (currentZoom < 3.0) {
        // Moderate zoom: National capitals only
        candidateCities = cities.features
          .filter((c) => c.properties.adm0cap === 1 && c.properties.scalerank <= 2)
          .slice(0, 20);
      } else {
        // Closer zoom: Major regional cities
        candidateCities = cities.features
          .filter((c) => c.properties.scalerank <= 4)
          .slice(0, 45);
      }
    }

    // Screen-space proximity collision avoidance:
    const finalCities: { city: GeoCityFeature; screenX: number; screenY: number }[] = [];
    const minDistance = selectedIso ? 24 : 45; // Minimum pixel gap between labels

    for (const city of candidateCities) {
      const pt = baseProjection(city.geometry.coordinates);
      if (!pt) continue;

      const [sx, sy] = pt;
      // Check collision against already accepted higher-priority cities
      const hasCollision = finalCities.some(
        (existing) => Math.hypot(existing.screenX - sx, existing.screenY - sy) < minDistance
      );

      if (!hasCollision) {
        finalCities.push({ city, screenX: sx, screenY: sy });
      }
    }

    return finalCities;
  }, [cities, selectedIso, currentZoom, baseProjection]);

  // ── True-Size Drag Feature Relocation ──────────────────────────────
  const trueSizeFeature = useMemo(() => {
    if (!trueSizeIso3 || !countries) return null;
    return (
      countries.features.find((f) => {
        const iso = ((f.properties.ISO_A3 !== "-99" ? f.properties.ISO_A3 : f.properties.ADM0_A3) || "").toUpperCase();
        return iso === trueSizeIso3.toUpperCase();
      }) || null
    );
  }, [trueSizeIso3, countries]);

  const trueSizeRelocatedPath = useMemo(() => {
    if (!trueSizeFeature) return "";
    const centroid = d3Geo.geoCentroid(trueSizeFeature);
    const dLon = trueSizeCoords[0] - centroid[0];
    const dLat = trueSizeCoords[1] - centroid[1];

    const shiftedProjection = d3Geo
      .geoEqualEarth()
      .scale(baseProjection.scale())
      .translate(baseProjection.translate())
      .rotate([-dLon, -dLat, 0]);

    return d3Geo.geoPath().projection(shiftedProjection)(trueSizeFeature) || "";
  }, [trueSizeFeature, trueSizeCoords, baseProjection]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-[#070b14]"
      style={{ cursor: activeMode === "true-size" ? "crosshair" : "grab" }}
      onMouseMove={(e) => {
        if (isDraggingTrueSize && activeMode === "true-size") {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const svgX = (e.clientX - rect.left - width / 2) / currentZoom + width / 2;
            const svgY = (e.clientY - rect.top - height / 2) / currentZoom + height / 2;
            const inverted = baseProjection.invert?.([svgX, svgY]);
            if (inverted) {
              setTrueSizeCoords([inverted[0], inverted[1]]);
            }
          }
        }
      }}
      onMouseUp={() => {
        setIsDraggingTrueSize(false);
        setIsDraggingLens(false);
      }}
    >
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#070b14]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
            <span className="text-[11px] font-mono text-slate-400 tracking-wider">
              Rendering Natural Earth...
            </span>
          </div>
        </div>
      )}

      {/* Main Map SVG */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onClick={(e) => {
          // Deselect on ocean / background click
          if ((e.target as SVGElement).tagName === "rect" || (e.target as SVGElement).id === "ocean-bg") {
            resetToWorld();
          }
        }}
      >
        <defs>
          <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#0b1222" />
            <stop offset="100%" stopColor="#060912" />
          </radialGradient>

          {/* Difference slider clips */}
          <clipPath id="split-left-clip">
            <rect x={0} y={0} width={(width * sliderPosition) / 100} height={height} />
          </clipPath>
          <clipPath id="split-right-clip">
            <rect x={(width * sliderPosition) / 100} y={0} width={width - (width * sliderPosition) / 100} height={height} />
          </clipPath>

          {/* Lens clip */}
          <clipPath id="lens-circle-clip">
            <circle cx={lensPosition.x} cy={lensPosition.y} r={lensPosition.radius} />
          </clipPath>
        </defs>

        {/* Ocean Background — Clickable to Deselect */}
        <rect id="ocean-bg" width={width} height={height} fill="url(#ocean-gradient)" className="cursor-default" />

        {/* Zoom & Pan Group */}
        <g id="map-zoom-group">
          {/* Base Layer */}
          <g id="base-layer" clipPath={activeMode === "difference-slider" ? "url(#split-right-clip)" : undefined}>
            {/* Graticule (subtle) */}
            {showGraticule && (
              <path
                d={geoPath(graticuleLines) || ""}
                fill="none"
                stroke="#172236"
                strokeWidth={0.5}
                strokeDasharray="2,3"
                opacity={0.6}
              />
            )}
            {showGraticule && (
              <path
                d={geoPath(equatorLine) || ""}
                fill="none"
                stroke="#233452"
                strokeWidth={0.8}
                opacity={0.8}
              />
            )}

            {/* Countries Layer */}
            {countries && (
              <g id="countries-layer">
                {countries.features.map((feature, idx) => {
                  const p = feature.properties;
                  const iso = ((p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "").toUpperCase();
                  const isSelected = selectedIso === iso;
                  const isHighlighted = highlightIsoSet.has(iso);
                  const isNeighbor = neighborIsoSet.has(iso);

                  // Restrained editorial colors
                  let fill = "#131b2e";
                  let stroke = "#212d45";
                  let strokeWidth = 0.55;

                  if (isSelected) {
                    fill = "#1d3b6f";
                    stroke = "#38bdf8";
                    strokeWidth = 1.6;
                  } else if (isNeighbor) {
                    fill = "#0f3d3e";
                    stroke = "#2dd4bf";
                    strokeWidth = 1.1;
                  } else if (isHighlighted) {
                    fill = "#3b2d18";
                    stroke = "#fbbf24";
                    strokeWidth = 1.1;
                  } else if (selectedIso) {
                    // Visually mute other countries when one is selected
                    fill = "#0f1626";
                    stroke = "#192338";
                  }

                  return (
                    <path
                      key={feature.id || iso || idx}
                      d={geoPath(feature) || ""}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      className="transition-colors duration-150 cursor-pointer hover:fill-[#1e2c47] hover:stroke-slate-400"
                      onMouseEnter={(e) => {
                        setHoverInfo({
                          x: e.clientX,
                          y: e.clientY,
                          name: p.NAME || p.ADMIN || "Unknown",
                          subtitle: p.CONTINENT || "",
                          type: "country",
                        });
                      }}
                      onMouseMove={(e) => {
                        setHoverInfo((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
                      }}
                      onMouseLeave={() => setHoverInfo(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCountryClick(feature);
                      }}
                    />
                  );
                })}
              </g>
            )}

            {/* Geodesic Distance Route Arc */}
            {distanceResult && (
              <g id="geodesic-route-layer">
                <path
                  d={geoPath(distanceResult.arcGeoJson) || ""}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
                {baseProjection(distanceResult.fromCoords) && (
                  <circle
                    cx={baseProjection(distanceResult.fromCoords)![0]}
                    cy={baseProjection(distanceResult.fromCoords)![1]}
                    r={4}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}
                {baseProjection(distanceResult.toCoords) && (
                  <circle
                    cx={baseProjection(distanceResult.toCoords)![0]}
                    cy={baseProjection(distanceResult.toCoords)![1]}
                    r={4}
                    fill="#ec4899"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            )}

            {/* Decluttered City Markers & Clean Labels */}
            {declutteredCities.map(({ city, screenX, screenY }, idx) => {
              const isSelected = selectedCity?.properties.name === city.properties.name;
              const isCapital = city.properties.adm0cap === 1;

              return (
                <g
                  key={idx}
                  transform={`translate(${screenX}, ${screenY})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCityClick(city);
                  }}
                  onMouseEnter={(e) => {
                    const p = city.properties;
                    setHoverInfo({
                      x: e.clientX,
                      y: e.clientY,
                      name: p.name,
                      subtitle: `${p.adm0name}${isCapital ? " (Capital)" : ""}`,
                      type: "city",
                    });
                  }}
                  onMouseMove={(e) => {
                    setHoverInfo((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
                  }}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {/* Subtle City Marker: Small warm gold for capitals, tiny mute dot for others */}
                  <circle
                    r={isSelected ? 4.5 : isCapital ? 3 : 2}
                    fill={isSelected ? "#ec4899" : isCapital ? "#f59e0b" : "#94a3b8"}
                    stroke="#070b14"
                    strokeWidth={1}
                  />
                  {/* Clean City Label (Off-white / Muted, Soft drop-shadow) */}
                  <text
                    x={6}
                    y={3.5}
                    fontSize={selectedIso ? 11 : 10}
                    fill={isSelected ? "#f472b6" : isCapital ? "#f1f5f9" : "#cbd5e1"}
                    className="font-medium pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  >
                    {city.properties.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Difference Slider Mercator Left Layer */}
          {activeMode === "difference-slider" && (
            <g id="mercator-split-layer" clipPath="url(#split-left-clip)">
              <path
                d={mercatorGeoPath(graticuleLines) || ""}
                fill="none"
                stroke="#172236"
                strokeWidth={0.5}
                strokeDasharray="2,3"
                opacity={0.6}
              />
              {countries && (
                <g>
                  {countries.features.map((feature, idx) => {
                    const p = feature.properties;
                    const iso = ((p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "").toUpperCase();
                    const isSelected = selectedIso === iso;

                    return (
                      <path
                        key={`merc-${iso}-${idx}`}
                        d={mercatorGeoPath(feature) || ""}
                        fill={isSelected ? "#1d3b6f" : "#1a162b"}
                        stroke="#3b2f5c"
                        strokeWidth={0.55}
                      />
                    );
                  })}
                </g>
              )}
            </g>
          )}

          {/* Projection Lens Overlay */}
          {activeMode === "lens" && (
            <g id="projection-lens-layer">
              <g clipPath="url(#lens-circle-clip)">
                <circle cx={lensPosition.x} cy={lensPosition.y} r={lensPosition.radius} fill="#0d091e" />
                {countries && (
                  <g>
                    {countries.features.map((feature, idx) => (
                      <path
                        key={`lens-${idx}`}
                        d={mercatorGeoPath(feature) || ""}
                        fill="#2c1f4d"
                        stroke="#6366f1"
                        strokeWidth={0.7}
                        opacity={0.9}
                      />
                    ))}
                  </g>
                )}
              </g>
              <circle
                cx={lensPosition.x}
                cy={lensPosition.y}
                r={lensPosition.radius}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                className="cursor-move"
                onMouseDown={() => setIsDraggingLens(true)}
              />
              <text
                x={lensPosition.x}
                y={lensPosition.y - lensPosition.radius - 8}
                textAnchor="middle"
                fontSize={10}
                fill="#a5b4fc"
                className="font-mono uppercase tracking-wider"
              >
                Mercator Conformal Lens
              </text>
            </g>
          )}

          {/* True Size Relocated Silhouette */}
          {activeMode === "true-size" && trueSizeFeature && (
            <g id="true-size-overlay">
              <path
                d={geoPath(trueSizeFeature) || ""}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.8}
                strokeDasharray="4,4"
              />
              <path
                d={trueSizeRelocatedPath}
                fill="rgba(245, 158, 11, 0.45)"
                stroke="#fbbf24"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={() => setIsDraggingTrueSize(true)}
              />
            </g>
          )}
        </g>
      </svg>

      {/* Difference Slider Handle */}
      {activeMode === "difference-slider" && (
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startPos = sliderPosition;
            const onMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const newPct = Math.max(10, Math.min(90, startPos + (deltaX / width) * 100));
              useMapStore.getState().setSliderPosition(newPct);
            };
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        >
          <div className="w-6 h-6 rounded-full bg-slate-900 border border-white flex items-center justify-center text-[10px] text-white font-mono shadow-md">
            ⇄
          </div>
        </div>
      )}

      {/* Minimal Fast Hover Tooltip */}
      {hoverInfo && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2.5 px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur text-left"
          style={{ left: hoverInfo.x, top: hoverInfo.y - 8 }}
        >
          <div className="text-xs font-semibold text-white tracking-wide leading-tight">
            {hoverInfo.name}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            {hoverInfo.subtitle}
          </div>
        </div>
      )}

      {/* Minimal Floating Map Controls (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
        <button
          onClick={() => {
            if (svgRef.current && zoomBehaviorRef.current) {
              d3Selection.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.4);
            }
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            if (svgRef.current && zoomBehaviorRef.current) {
              d3Selection.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.7);
            }
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetToWorld}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset to Global View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-slate-800 my-0.5" />
        <button
          onClick={toggleGraticule}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            showGraticule ? "text-sky-400 bg-slate-800/80" : "text-slate-500 hover:text-slate-300"
          }`}
          title="Toggle Graticule Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Map Footer (Section 18) */}
      <div className="absolute bottom-2 left-4 z-10 flex items-center gap-2 text-[11px] text-slate-500 font-sans">
        <span>Natural Earth</span>
        <span>·</span>
        <span className="text-slate-400">Equal Earth projection</span>
        <span>·</span>
        <a href="/sources" className="hover:text-slate-300 underline underline-offset-2">
          Sources
        </a>
      </div>
    </div>
  );
}
