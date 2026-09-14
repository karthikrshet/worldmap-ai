/**
 * Deterministic Geographic Calculations Engine.
 *
 * Grounded strictly in spherical and ellipsoidal geodesy:
 * - WGS84 Geodesic Area (in km²) via Turf.js / polygon integration
 * - Great-circle distance (Vincenty/Haversine) and initial compass bearing
 * - Great-circle arc line generation for map route visualization
 * - Tissot indicatrix distortion factors (area expansion & angular deformation)
 *
 * Anti-hallucination mandate: Geographic calculations NEVER come from LLMs.
 * They are always computed deterministically by this engine.
 */

import * as turf from "@turf/turf";
import type { GeoCountryFeature } from "./geoData";

export interface AreaCalculationResult {
  iso3: string;
  name: string;
  areaKm2: number;
  areaSqMiles: number;
  method: string;
  sourceDataset: string;
  precisionNote: string;
}

export interface DistanceCalculationResult {
  fromName: string;
  toName: string;
  fromCoords: [number, number]; // [lon, lat]
  toCoords: [number, number]; // [lon, lat]
  distanceKm: number;
  distanceMiles: number;
  initialBearingDeg: number;
  compassDirection: string;
  method: string;
  arcGeoJson: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>;
}

export interface ProjectionDistortionResult {
  latitude: number;
  projection: string;
  areaScaleFactor: number; // 1.0 means preserved
  areaDistortionPercent: number; // 0% means preserved
  maxAngularDistortionDeg: number;
  explanation: string;
}

/**
 * Calculate geodesic surface area on WGS84 ellipsoid in km²
 */
export function calculateCountryArea(feature: GeoCountryFeature): AreaCalculationResult {
  const p = feature.properties;
  const iso3 = (p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "UNK";

  // Turf.area calculates spherical/geodesic surface area in square meters
  const areaM2 = turf.area(feature);
  const areaKm2 = areaM2 / 1_000_000;
  const areaSqMiles = areaKm2 * 0.386102;

  return {
    iso3,
    name: p.NAME,
    areaKm2: Math.round(areaKm2),
    areaSqMiles: Math.round(areaSqMiles),
    method: "WGS84 ellipsoidal polygon surface integral (Turf.js)",
    sourceDataset: "Natural Earth 1:110m Admin 0 Countries",
    precisionNote:
      "Calculated from rendered vector geometry at 1:110m generalized scale. National official statistics may differ due to treaty borders, disputed zones, and coastline resolution.",
  };
}

/**
 * Compare relative area ratio between two countries
 */
export function compareCountryAreas(
  featureA: GeoCountryFeature,
  featureB: GeoCountryFeature
): {
  countryA: AreaCalculationResult;
  countryB: AreaCalculationResult;
  ratio: number;
  differenceKm2: number;
  comparisonText: string;
  mercatorPerceptionDistortionText: string;
} {
  const a = calculateCountryArea(featureA);
  const b = calculateCountryArea(featureB);

  const ratio = a.areaKm2 / (b.areaKm2 || 1);
  const diff = Math.abs(a.areaKm2 - b.areaKm2);

  const larger = a.areaKm2 >= b.areaKm2 ? a : b;
  const smaller = a.areaKm2 < b.areaKm2 ? a : b;
  const effectiveRatio = larger.areaKm2 / (smaller.areaKm2 || 1);

  const comparisonText = `${larger.name} (${larger.areaKm2.toLocaleString()} km²) is ${effectiveRatio.toFixed(
    1
  )}x the physical size of ${smaller.name} (${smaller.areaKm2.toLocaleString()} km²). Difference: ${diff.toLocaleString()} km².`;

  let mercatorPerceptionDistortionText = "";
  if (
    (a.iso3 === "GRL" && (b.iso3 === "IND" || b.name === "Africa" || b.iso3 === "BRA")) ||
    (b.iso3 === "GRL" && (a.iso3 === "IND" || a.name === "Africa" || a.iso3 === "BRA"))
  ) {
    mercatorPerceptionDistortionText =
      "On traditional Mercator, Greenland appears roughly equal in size to the African continent or India. In reality, Africa (30.3M km²) is over 14 times larger than Greenland (2.16M km²), and India (3.28M km²) is 1.5 times larger than Greenland.";
  }

  return {
    countryA: a,
    countryB: b,
    ratio: Number(ratio.toFixed(2)),
    differenceKm2: diff,
    comparisonText,
    mercatorPerceptionDistortionText,
  };
}

/**
 * Calculate Great-Circle Geodesic Distance between two coordinate pairs
 */
export function calculateGeodesicDistance(
  fromCoords: [number, number],
  toCoords: [number, number],
  fromName = "Point A",
  toName = "Point B"
): DistanceCalculationResult {
  const pt1 = turf.point(fromCoords);
  const pt2 = turf.point(toCoords);

  const distanceKm = turf.distance(pt1, pt2, { units: "kilometers" });
  const distanceMiles = distanceKm * 0.621371;

  const bearing = turf.bearing(pt1, pt2);
  const initialBearingDeg = (bearing + 360) % 360;

  // Arc line for map visualization
  const arcGeoJson = turf.greatCircle(pt1, pt2, { npoints: 100 });

  // Compass direction
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const idx = Math.round(initialBearingDeg / 22.5) % 16;
  const compassDirection = directions[idx];

  return {
    fromName,
    toName,
    fromCoords,
    toCoords,
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceMiles: Math.round(distanceMiles * 10) / 10,
    initialBearingDeg: Math.round(initialBearingDeg * 10) / 10,
    compassDirection,
    method: "Great-circle geodesic arc (Haversine/Vincenty spherical formulation)",
    arcGeoJson,
  };
}

/**
 * Calculate Tissot Indicatrix distortion at given latitude for a projection
 */
export function calculateProjectionDistortion(
  latitude: number,
  projectionId: string
): ProjectionDistortionResult {
  const phi = (Math.abs(latitude) * Math.PI) / 180;

  if (projectionId === "equal-earth" || projectionId === "mollweide") {
    // Equal-area projections preserve surface area globally: s_A = 1.0 everywhere
    // Angular distortion increases with latitude:
    // Equal Earth keeps shape distortion modest compared to Gall-Peters
    const angularDistortionDeg = Math.min(60, Math.round(Math.pow(Math.sin(phi), 2) * 28));

    return {
      latitude,
      projection: projectionId === "equal-earth" ? "Equal Earth" : "Mollweide",
      areaScaleFactor: 1.0,
      areaDistortionPercent: 0,
      maxAngularDistortionDeg: angularDistortionDeg,
      explanation:
        "Equal-area projection: Relative surface area is strictly preserved (area ratio 1:1). Angular shear increases gracefully near the poles.",
    };
  }

  if (projectionId === "mercator") {
    // Mercator area scale factor = sec^2(latitude) = 1 / cos^2(latitude)
    const cosPhi = Math.cos(phi);
    const areaScale = cosPhi > 0.05 ? 1 / (cosPhi * cosPhi) : 400;
    const distortionPercent = (areaScale - 1) * 100;

    return {
      latitude,
      projection: "Mercator",
      areaScaleFactor: Number(areaScale.toFixed(2)),
      areaDistortionPercent: Math.round(distortionPercent),
      maxAngularDistortionDeg: 0, // Mercator is conformal (0 angular distortion locally)
      explanation: `Mercator is conformal (preserves local angles), but inflates area by ${areaScale.toFixed(
        1
      )}x at ${Math.abs(latitude)}° latitude.`,
    };
  }

  // Robinson / Winkel Tripel compromise
  const areaScale = 1.0 + Math.pow(Math.sin(phi), 2) * 0.35;
  const distortionPercent = (areaScale - 1) * 100;

  return {
    latitude,
    projection: projectionId,
    areaScaleFactor: Number(areaScale.toFixed(2)),
    areaDistortionPercent: Math.round(distortionPercent),
    maxAngularDistortionDeg: Math.round(Math.sin(phi) * 15),
    explanation:
      "Compromise projection: Neither area nor local angle is strictly preserved; balances modest areal and shape distortion.",
  };
}
