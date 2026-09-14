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

interface HoverInfo {
  x: number;
  y: number;
  name: string;
  iso3: string;
  subtitle: string;
  type: "country" | "city";
  coords?: string;
}

export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Store state
  const {
    activeProjection,
    activeMode,
    selectedCountries,
    selectCountry,
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
    showCities,
  } = useMapStore();

  // Local dataset state
  const [countries, setCountries] = useState<CountryDataset | null>(null);
  const [cities, setCities] = useState<CityDataset | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 700,
  });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Current D3 zoom transform
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const zoomBehaviorRef = useRef<d3Zoom.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Measure tool point picker
  const [measureOrigin, setMeasureOrigin] = useState<GeoCityFeature | null>(null);

  // Dragging state for True-Size mode
  const [isDraggingTrueSize, setIsDraggingTrueSize] = useState(false);

  // Dragging state for Projection Lens
  const [isDraggingLens, setIsDraggingLens] = useState(false);

  // ── Load datasets on mount ─────────────────────────────────────────
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
        console.error("Failed to load map datasets:", err);
        if (mounted) setLoading(false);
      }
    }
    initData();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Track container dimensions ─────────────────────────────────────
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width),
          height: Math.max(400, rect.height),
        });
      }
    }
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // ── Build Base Projections ─────────────────────────────────────────
  const { width, height } = dimensions;

  // Primary Projection
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
        // Default: Equal Earth (September 2026 UNGA resolution A/80/L.104 view)
        return d3Geo
          .geoEqualEarth()
          .scale(scale * 1.25)
          .translate(center);
    }
  }, [activeProjection, width, height]);

  // Secondary Projection (Used for Mercator side in Difference Slider and Lens)
  const mercatorProjection = useMemo(() => {
    const scale = Math.min(width / 5.8, height / 3.0);
    return d3Geo
      .geoMercator()
      .scale(scale * 0.95)
      .translate([width / 2, height / 2]);
  }, [width, height]);

  // D3 Path Generators
  const geoPath = useMemo(() => d3Geo.geoPath().projection(baseProjection), [baseProjection]);
  const mercatorGeoPath = useMemo(
    () => d3Geo.geoPath().projection(mercatorProjection),
    [mercatorProjection]
  );

  // Graticule geometry
  const graticuleLines = useMemo(() => d3Geo.geoGraticule10(), []);
  const equatorLine = useMemo(() => {
    return {
      type: "LineString",
      coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, 0]),
    } as GeoJSON.LineString;
  }, []);

  // ── Setup Zoom & Pan Behavior ──────────────────────────────────────
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

    // Disable double click zoom so users can double click to select cleanly
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

      // Safe zoom bounds with sensible padding
      const maxZoom = 7;
      const minZoom = 1.4;
      const targetScale = Math.max(
        minZoom,
        Math.min(maxZoom, 0.75 / Math.max(dx / width, dy / height))
      );

      const translate: [number, number] = [
        width / 2 - targetScale * x,
        height / 2 - targetScale * y,
      ];

      const svg = d3Selection.select(svgRef.current);
      svg
        .transition()
        .duration(750)
        .call(
          zoomBehaviorRef.current.transform,
          d3Zoom.zoomIdentity.translate(translate[0], translate[1]).scale(targetScale)
        );
    },
    [geoPath, width, height]
  );

  // Handle country click
  const handleCountryClick = useCallback(
    (feature: GeoCountryFeature) => {
      const p = feature.properties;
      const iso3 = (p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "";

      // Select country in store
      selectCountry({
        iso3,
        name: p.NAME || p.ADMIN || "Unknown",
        continent: p.CONTINENT,
        subregion: p.SUBREGION,
        source: {
          dataset_name: "Natural Earth Admin 0 Countries",
          dataset_version: "v5.1.2 (1:110m)",
          dataset_url: "https://www.naturalearthdata.com/",
        },
      });

      // Update URL query state (?country=IND)
      if (typeof window !== "undefined" && iso3) {
        const url = new URL(window.location.href);
        url.searchParams.set("country", iso3);
        window.history.replaceState({}, "", url.toString());
      }

      // Smooth camera zoom
      zoomToCountry(feature);
    },
    [selectCountry, zoomToCountry]
  );

  // Handle city click
  const handleCityClick = useCallback(
    (city: GeoCityFeature) => {
      setSelectedCity(city);

      if (measureOrigin && measureOrigin.properties.name !== city.properties.name) {
        // Complete distance measurement
        const res = calculateGeodesicDistance(
          measureOrigin.geometry.coordinates,
          city.geometry.coordinates,
          `${measureOrigin.properties.name}, ${measureOrigin.properties.adm0name}`,
          `${city.properties.name}, ${city.properties.adm0name}`
        );
        setDistanceResult(res);
        setMeasureOrigin(null);
      }

      // Center on city
      if (svgRef.current && zoomBehaviorRef.current) {
        const projected = baseProjection(city.geometry.coordinates);
        if (projected) {
          const targetZoom = Math.max(3.5, currentZoom);
          const svg = d3Selection.select(svgRef.current);
          svg
            .transition()
            .duration(600)
            .call(
              zoomBehaviorRef.current.transform,
              d3Zoom.zoomIdentity
                .translate(width / 2 - targetZoom * projected[0], height / 2 - targetZoom * projected[1])
                .scale(targetZoom)
            );
        }
      }
    },
    [
      setSelectedCity,
      measureOrigin,
      setDistanceResult,
      baseProjection,
      currentZoom,
      width,
      height,
    ]
  );

  // ── True Size Feature Relocation ───────────────────────────────────
  // Calculate relocated geometry for True-Size overlay
  const trueSizeFeature = useMemo(() => {
    if (!trueSizeIso3 || !countries) return null;
    const match = countries.features.find((f) => {
      const iso = (f.properties.ISO_A3 !== "-99" ? f.properties.ISO_A3 : f.properties.ADM0_A3) || "";
      return iso.toUpperCase() === trueSizeIso3.toUpperCase();
    });
    return match || null;
  }, [trueSizeIso3, countries]);

  // Projected SVG path for true size relocated silhouette
  const trueSizeRelocatedPath = useMemo(() => {
    if (!trueSizeFeature) return "";

    // Compute centroid of original feature
    const centroid = d3Geo.geoCentroid(trueSizeFeature);
    const dLon = trueSizeCoords[0] - centroid[0];
    const dLat = trueSizeCoords[1] - centroid[1];

    // Create a rotated projection or shifted geometry
    // A spherical translation rotation:
    const shiftedProjection = d3Geo
      .geoEqualEarth()
      .scale(baseProjection.scale())
      .translate(baseProjection.translate())
      .rotate([-dLon, -dLat, 0]);

    const shiftedPath = d3Geo.geoPath().projection(shiftedProjection);
    return shiftedPath(trueSizeFeature) || "";
  }, [trueSizeFeature, trueSizeCoords, baseProjection]);

  // ── Selected Country Set for O(1) Lookup ───────────────────────────
  const selectedIsoSet = useMemo(() => {
    return new Set(selectedCountries.map((c) => c.iso3.toUpperCase()));
  }, [selectedCountries]);

  const highlightIsoSet = useMemo(() => {
    return new Set(highlightedCountries.map((i) => i.toUpperCase()));
  }, [highlightedCountries]);

  const neighborIsoSet = useMemo(() => {
    return new Set(neighborCountries.map((i) => i.toUpperCase()));
  }, [neighborCountries]);

  // ── City Decluttering by Zoom Level ────────────────────────────────
  const visibleCities = useMemo(() => {
    if (!cities || !showCities) return [];
    return cities.features.filter((city) => {
      const p = city.properties;
      if (currentZoom < 1.6) {
        // World scale: only tier 1 megacities
        return p.scalerank <= 1 || p.megacity === 1;
      }
      if (currentZoom < 3.2) {
        // Regional scale: capitals and major commercial hubs
        return p.scalerank <= 3 || p.worldcity === 1 || p.adm0cap === 1;
      }
      // Closer zoom: show more populated places
      return p.scalerank <= 6;
    });
  }, [cities, showCities, currentZoom]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-[#090d16]"
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
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#090d16]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <p className="text-xs font-mono text-slate-300 tracking-wider uppercase">
              Loading Natural Earth Geometry...
            </p>
          </div>
        </div>
      )}

      {/* SVG Canvas Map */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="ocean-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0d1527" />
            <stop offset="100%" stopColor="#070b12" />
          </radialGradient>

          {/* Clip path for Difference Slider (Left side: Mercator) */}
          <clipPath id="split-left-clip">
            <rect
              x={0}
              y={0}
              width={(width * sliderPosition) / 100}
              height={height}
            />
          </clipPath>

          {/* Clip path for Difference Slider (Right side: Equal Earth) */}
          <clipPath id="split-right-clip">
            <rect
              x={(width * sliderPosition) / 100}
              y={0}
              width={width - (width * sliderPosition) / 100}
              height={height}
            />
          </clipPath>

          {/* Clip path for Projection Lens */}
          <clipPath id="lens-circle-clip">
            <circle
              cx={lensPosition.x}
              cy={lensPosition.y}
              r={lensPosition.radius}
            />
          </clipPath>
        </defs>

        {/* Ocean Background */}
        <rect width={width} height={height} fill="url(#ocean-glow)" />

        {/* Main Zoomable & Pannable Group */}
        <g id="map-zoom-group">
          {/* ── STANDARD OR RIGHT-SIDE RENDERING (EQUAL EARTH / BASE) ── */}
          <g
            id="base-map-layer"
            clipPath={activeMode === "difference-slider" ? "url(#split-right-clip)" : undefined}
          >
            {/* Graticule lines (10° grid) */}
            {showGraticule && (
              <path
                d={geoPath(graticuleLines) || ""}
                fill="none"
                stroke="#1e293b"
                strokeWidth={0.5}
                strokeDasharray="2,3"
                opacity={0.65}
              />
            )}

            {/* Equator line */}
            {showGraticule && (
              <path
                d={geoPath(equatorLine) || ""}
                fill="none"
                stroke="#334155"
                strokeWidth={0.8}
                opacity={0.85}
              />
            )}

            {/* Country Polygons */}
            {countries && (
              <g id="countries-layer">
                {countries.features.map((feature, idx) => {
                  const p = feature.properties;
                  const iso = ((p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "").toUpperCase();
                  const isSelected = selectedIsoSet.has(iso);
                  const isHighlighted = highlightIsoSet.has(iso);
                  const isNeighbor = neighborIsoSet.has(iso);

                  // Colors: Muted natural cartographic tones
                  let fill = "#172033";
                  let stroke = "#2a374f";
                  let strokeWidth = 0.6;

                  if (isSelected) {
                    fill = "#2563eb";
                    stroke = "#60a5fa";
                    strokeWidth = 1.6;
                  } else if (isNeighbor) {
                    fill = "#0d9488";
                    stroke = "#5eead4";
                    strokeWidth = 1.2;
                  } else if (isHighlighted) {
                    fill = "#d97706";
                    stroke = "#fbbf24";
                    strokeWidth = 1.2;
                  }

                  return (
                    <path
                      key={feature.id || iso || idx}
                      d={geoPath(feature) || ""}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      className="transition-colors duration-150 cursor-pointer hover:fill-[#2d3d5f] hover:stroke-slate-300"
                      onMouseEnter={(e) => {
                        setHoverInfo({
                          x: e.clientX,
                          y: e.clientY,
                          name: p.NAME || p.ADMIN || "Unknown",
                          iso3: iso,
                          subtitle: p.CONTINENT || "",
                          type: "country",
                        });
                      }}
                      onMouseMove={(e) => {
                        setHoverInfo((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
                      }}
                      onMouseLeave={() => setHoverInfo(null)}
                      onClick={() => handleCountryClick(feature)}
                    />
                  );
                })}
              </g>
            )}

            {/* Geodesic Distance Arc Route Line */}
            {distanceResult && (
              <g id="geodesic-route-layer">
                <path
                  d={geoPath(distanceResult.arcGeoJson) || ""}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.2}
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
                {/* From point */}
                {baseProjection(distanceResult.fromCoords) && (
                  <circle
                    cx={baseProjection(distanceResult.fromCoords)![0]}
                    cy={baseProjection(distanceResult.fromCoords)![1]}
                    r={5}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
                {/* To point */}
                {baseProjection(distanceResult.toCoords) && (
                  <circle
                    cx={baseProjection(distanceResult.toCoords)![0]}
                    cy={baseProjection(distanceResult.toCoords)![1]}
                    r={5}
                    fill="#ec4899"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              </g>
            )}

            {/* Major Populated Places / Cities Layer */}
            {visibleCities.map((city, idx) => {
              const coords = baseProjection(city.geometry.coordinates);
              if (!coords) return null;
              const isSelected = selectedCity?.properties.name === city.properties.name;
              const isCapital = city.properties.adm0cap === 1;

              return (
                <g
                  key={idx}
                  transform={`translate(${coords[0]}, ${coords[1]})`}
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
                      iso3: p.adm0_a3 || p.sov_a3 || "",
                      subtitle: `${p.adm1name ? p.adm1name + ", " : ""}${p.adm0name}`,
                      type: "city",
                      coords: `${city.geometry.coordinates[1].toFixed(2)}°N, ${city.geometry.coordinates[0].toFixed(2)}°E`,
                    });
                  }}
                  onMouseMove={(e) => {
                    setHoverInfo((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
                  }}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  <circle
                    r={isSelected ? 5 : isCapital ? 3.5 : 2.5}
                    fill={isSelected ? "#ec4899" : isCapital ? "#fbbf24" : "#cbd5e1"}
                    stroke="#0b0f19"
                    strokeWidth={1}
                  />
                  {/* City Label (decluttered) */}
                  {(currentZoom > 1.8 || isCapital) && (
                    <text
                      x={6}
                      y={3}
                      fontSize={Math.max(9, 11 / Math.sqrt(currentZoom))}
                      fill={isSelected ? "#f472b6" : isCapital ? "#fde68a" : "#94a3b8"}
                      className="font-medium pointer-events-none drop-shadow-md select-none"
                    >
                      {city.properties.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── SPLIT SLIDER LEFT SIDE (TRADITIONAL MERCATOR) ── */}
          {activeMode === "difference-slider" && (
            <g id="mercator-split-layer" clipPath="url(#split-left-clip)">
              {/* Mercator Graticule */}
              <path
                d={mercatorGeoPath(graticuleLines) || ""}
                fill="none"
                stroke="#1e293b"
                strokeWidth={0.5}
                strokeDasharray="2,3"
                opacity={0.65}
              />
              {/* Mercator Countries */}
              {countries && (
                <g>
                  {countries.features.map((feature, idx) => {
                    const p = feature.properties;
                    const iso = ((p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "").toUpperCase();
                    const isSelected = selectedIsoSet.has(iso);

                    return (
                      <path
                        key={`merc-${iso}-${idx}`}
                        d={mercatorGeoPath(feature) || ""}
                        fill={isSelected ? "#3b82f6" : "#241e38"}
                        stroke="#4338ca"
                        strokeWidth={0.6}
                      />
                    );
                  })}
                </g>
              )}
            </g>
          )}

          {/* ── PROJECTION LENS OVERLAY ── */}
          {activeMode === "lens" && (
            <g id="projection-lens-layer">
              <g clipPath="url(#lens-circle-clip)">
                {/* Background inside lens */}
                <circle
                  cx={lensPosition.x}
                  cy={lensPosition.y}
                  r={lensPosition.radius}
                  fill="#110d22"
                />
                {/* Mercator projection inside lens */}
                {countries && (
                  <g>
                    {countries.features.map((feature, idx) => (
                      <path
                        key={`lens-${idx}`}
                        d={mercatorGeoPath(feature) || ""}
                        fill="#4338ca"
                        stroke="#818cf8"
                        strokeWidth={0.7}
                        opacity={0.85}
                      />
                    ))}
                  </g>
                )}
              </g>
              {/* Lens rim glass ring */}
              <circle
                cx={lensPosition.x}
                cy={lensPosition.y}
                r={lensPosition.radius}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2.5}
                className="cursor-move"
                onMouseDown={() => setIsDraggingLens(true)}
              />
              <text
                x={lensPosition.x}
                y={lensPosition.y - lensPosition.radius - 8}
                textAnchor="middle"
                fontSize={10}
                fill="#818cf8"
                className="font-mono font-semibold uppercase tracking-wider"
              >
                Mercator Lens (Conformal Distortion)
              </text>
            </g>
          )}

          {/* ── TRUE-SIZE RELOCATED SILHOUETTE DRAG OVERLAY ── */}
          {activeMode === "true-size" && trueSizeFeature && (
            <g id="true-size-overlay">
              {/* Original origin outline with dash */}
              <path
                d={geoPath(trueSizeFeature) || ""}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
              {/* Relocated silhouette */}
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

      {/* ── MAP DIFFERENCE SPLIT DIVIDER BAR ── */}
      {activeMode === "difference-slider" && (
        <div
          className="absolute top-0 bottom-0 z-20 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]"
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
          <div className="w-7 h-7 -ml-0.5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] text-white font-mono shadow-lg">
            ⇄
          </div>
          {/* Labels on sides */}
          <div className="absolute top-16 -left-36 px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-xs font-mono text-purple-300">
            Mercator (Conformal)
          </div>
          <div className="absolute top-16 left-4 px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-xs font-mono text-emerald-300">
            Equal Earth (Sep 2026 UN View)
          </div>
        </div>
      )}

      {/* ── ULTRA-FAST SLEEK HOVER TOOLTIP (<16ms) ── */}
      {hoverInfo && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur text-left transition-transform duration-75"
          style={{ left: hoverInfo.x, top: hoverInfo.y - 10 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-wide">
              {hoverInfo.name}
            </span>
            {hoverInfo.iso3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {hoverInfo.iso3}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span>{hoverInfo.subtitle}</span>
            {hoverInfo.coords && <span className="font-mono text-slate-500">· {hoverInfo.coords}</span>}
          </div>
        </div>
      )}

      {/* ── BOTTOM ATTRIBUTION BAR (MANDATORY SECTION 102) ── */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-3 px-2.5 py-1 rounded bg-slate-950/70 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-400">
        <span>Boundary geometry: Natural Earth (Public Domain)</span>
        <span>·</span>
        <span>Equal Earth: Šavrič, Patterson, Jenny (2018)</span>
        <span>·</span>
        <span className="text-emerald-400">UN GA Res A/80/L.104</span>
      </div>

      {/* ── COMPASS & ZOOM CONTROLS ── */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur p-1 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={() => {
            if (svgRef.current && zoomBehaviorRef.current) {
              d3Selection.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.4);
            }
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:bg-slate-800 transition-colors text-base font-semibold"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => {
            if (svgRef.current && zoomBehaviorRef.current) {
              d3Selection.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
            }
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:bg-slate-800 transition-colors text-base font-semibold"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => {
            if (svgRef.current && zoomBehaviorRef.current) {
              d3Selection
                .select(svgRef.current)
                .transition()
                .duration(500)
                .call(zoomBehaviorRef.current.transform, d3Zoom.zoomIdentity);
            }
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-mono"
          title="Reset to world view"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
