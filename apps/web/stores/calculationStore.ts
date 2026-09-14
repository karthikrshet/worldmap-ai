/**
 * Calculation store — manages the state of geospatial calculations.
 *
 * Every calculation result retains its full provenance metadata.
 * Results are NEVER fabricated — they come from the API or show "unavailable."
 */

import { create } from "zustand";

export type CalculationStatus = "idle" | "loading" | "success" | "error";

export interface ProvenanceSource {
  dataset_name: string;
  dataset_version: string;
  dataset_url?: string;
  dataset_license?: string;
  retrieved_at?: string;
}

export interface AreaResult {
  area_km2: number | null;
  area_m2: number | null;
  method: string;
  ellipsoid: string;
  algorithm?: string;
  source?: ProvenanceSource;
  calculation?: {
    engine: string;
    engine_version?: string;
    proj_version?: string;
    ellipsoid: string;
    crs: string;
  };
  precision_note?: string;
}

export interface CompareResult {
  entity_a: {
    name: string;
    iso3: string;
    area_km2: number;
  };
  entity_b: {
    name: string;
    iso3: string;
    area_km2: number;
  };
  comparison: {
    ratio: number;
    ratio_display: string;
    difference_km2: number;
    percentage_difference: number;
    formulas: Record<string, string>;
  };
  method: string;
  ellipsoid: string;
}

export interface DistanceResult {
  point_a: { lon: number; lat: number; label: string };
  point_b: { lon: number; lat: number; label: string };
  distance_km: number;
  distance_m: number;
  forward_bearing_deg: number;
  method: string;
  ellipsoid: string;
}

interface CalculationState {
  // Single country area
  areaResult: AreaResult | null;
  areaStatus: CalculationStatus;
  areaError: string | null;
  setAreaResult: (result: AreaResult | null, status: CalculationStatus, error?: string) => void;

  // Country comparison
  compareResult: CompareResult | null;
  compareStatus: CalculationStatus;
  compareError: string | null;
  setCompareResult: (
    result: CompareResult | null,
    status: CalculationStatus,
    error?: string
  ) => void;

  // Distance measurement
  distanceResult: DistanceResult | null;
  distanceStatus: CalculationStatus;
  distanceError: string | null;
  setDistanceResult: (
    result: DistanceResult | null,
    status: CalculationStatus,
    error?: string
  ) => void;

  // Reset
  clearAll: () => void;
}

export const useCalculationStore = create<CalculationState>()((set) => ({
  // Area
  areaResult: null,
  areaStatus: "idle",
  areaError: null,
  setAreaResult: (result, status, error?: string) =>
    set({ areaResult: result, areaStatus: status, areaError: error ?? null }),

  // Compare
  compareResult: null,
  compareStatus: "idle",
  compareError: null,
  setCompareResult: (result, status, error?: string) =>
    set({ compareResult: result, compareStatus: status, compareError: error ?? null }),

  // Distance
  distanceResult: null,
  distanceStatus: "idle",
  distanceError: null,
  setDistanceResult: (result, status, error?: string) =>
    set({ distanceResult: result, distanceStatus: status, distanceError: error ?? null }),

  clearAll: () =>
    set({
      areaResult: null,
      areaStatus: "idle",
      areaError: null,
      compareResult: null,
      compareStatus: "idle",
      compareError: null,
      distanceResult: null,
      distanceStatus: "idle",
      distanceError: null,
    }),
}));
