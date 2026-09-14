/**
 * Map store — manages projection, viewport, selected countries,
 * interactive comparison modes, and UI state.
 *
 * Uses Zustand for lightweight, TypeScript-friendly state management.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DistanceCalculationResult } from "@/lib/geoCalculations";
import type { GeoCityFeature } from "@/lib/geoData";

export type ProjectionId =
  | "equal-earth"
  | "mercator"
  | "robinson"
  | "winkel-tripel"
  | "mollweide"
  | "orthographic";

export type ActiveMode =
  | "explore"
  | "difference-slider"
  | "lens"
  | "true-size"
  | "projection-story";

export interface SelectedCountry {
  iso3: string;
  name: string;
  centroid?: { lon: number; lat: number };
  area_km2?: number | null;
  continent?: string;
  subregion?: string;
  source?: {
    dataset_name: string;
    dataset_version: string;
    dataset_url?: string;
  };
}

export type ActiveTool = "select" | "measure-distance" | "none";

interface MapState {
  // Projection
  activeProjection: ProjectionId;
  setProjection: (id: ProjectionId) => void;

  // Active interactive mode
  activeMode: ActiveMode;
  setActiveMode: (mode: ActiveMode) => void;

  // Viewport
  viewport: {
    center: [number, number]; // [lon, lat]
    zoom: number;
  };
  setViewport: (center: [number, number], zoom: number) => void;

  // Selected countries (up to 2 for comparison)
  selectedCountries: SelectedCountry[];
  selectCountry: (country: SelectedCountry) => void;
  clearCountries: () => void;
  removeCountry: (iso3: string) => void;

  // Selected city
  selectedCity: GeoCityFeature | null;
  setSelectedCity: (city: GeoCityFeature | null) => void;

  // Highlights & Neighbors
  highlightedCountries: string[]; // ISO3 list
  setHighlightedCountries: (isos: string[]) => void;
  clearHighlights: () => void;

  neighborCountries: string[];
  setNeighborCountries: (isos: string[]) => void;

  // True-Size Drag mode
  trueSizeIso3: string | null;
  setTrueSizeIso3: (iso3: string | null) => void;
  trueSizeCoords: [number, number]; // [lon, lat] of dragged center
  setTrueSizeCoords: (coords: [number, number]) => void;

  // Map Difference slider position (0 - 100 percentage)
  sliderPosition: number;
  setSliderPosition: (pos: number) => void;

  // Projection Lens
  lensPosition: { x: number; y: number; radius: number };
  setLensPosition: (pos: { x: number; y: number; radius: number }) => void;

  // Active tool & Measurements
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  distanceResult: DistanceCalculationResult | null;
  setDistanceResult: (res: DistanceCalculationResult | null) => void;

  // Layers
  showGraticule: boolean;
  toggleGraticule: () => void;
  showCities: boolean;
  toggleCities: () => void;

  // Modals & Drawers
  countryPanelOpen: boolean;
  setCountryPanelOpen: (open: boolean) => void;

  cityPanelOpen: boolean;
  setCityPanelOpen: (open: boolean) => void;

  comparePanelOpen: boolean;
  setComparePanelOpen: (open: boolean) => void;

  mapTruthModalOpen: boolean;
  setMapTruthModalOpen: (open: boolean) => void;

  sourceGraphModalOpen: boolean;
  setSourceGraphModalOpen: (open: boolean) => void;

  correctTheMapModalOpen: boolean;
  setCorrectTheMapModalOpen: (open: boolean) => void;

  aiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>()(
  subscribeWithSelector((set, get) => ({
    // ── Projection ──────────────────────────────────────────────────
    activeProjection: "equal-earth",
    setProjection: (id) => set({ activeProjection: id }),

    // ── Active Mode ─────────────────────────────────────────────────
    activeMode: "explore",
    setActiveMode: (mode) => set({ activeMode: mode }),

    // ── Viewport ────────────────────────────────────────────────────
    viewport: {
      center: [0, 20],
      zoom: 1.0,
    },
    setViewport: (center, zoom) =>
      set({ viewport: { center, zoom } }),

    // ── Selected countries ───────────────────────────────────────────
    selectedCountries: [],
    selectCountry: (country) => {
      const current = get().selectedCountries;
      const exists = current.find((c) => c.iso3 === country.iso3);
      if (exists) {
        set({ countryPanelOpen: true });
        return;
      }
      const next = current.length >= 2 ? [current[1], country] : [...current, country];
      set({ selectedCountries: next, countryPanelOpen: true, selectedCity: null });
    },
    clearCountries: () =>
      set({ selectedCountries: [], countryPanelOpen: false, neighborCountries: [] }),
    removeCountry: (iso3) =>
      set((state) => ({
        selectedCountries: state.selectedCountries.filter((c) => c.iso3 !== iso3),
      })),

    // ── Selected City ────────────────────────────────────────────────
    selectedCity: null,
    setSelectedCity: (city) =>
      set({ selectedCity: city, cityPanelOpen: !!city }),

    // ── Highlights & Neighbors ───────────────────────────────────────
    highlightedCountries: [],
    setHighlightedCountries: (isos) => set({ highlightedCountries: isos }),
    clearHighlights: () => set({ highlightedCountries: [], neighborCountries: [] }),

    neighborCountries: [],
    setNeighborCountries: (isos) => set({ neighborCountries: isos }),

    // ── True-Size Drag ───────────────────────────────────────────────
    trueSizeIso3: "GRL", // Greenland default demonstration
    setTrueSizeIso3: (iso3) => set({ trueSizeIso3: iso3 }),
    trueSizeCoords: [0, 10], // Initially moved to equatorial Africa latitude
    setTrueSizeCoords: (coords) => set({ trueSizeCoords: coords }),

    // ── Slider & Lens ────────────────────────────────────────────────
    sliderPosition: 50,
    setSliderPosition: (pos) => set({ sliderPosition: pos }),

    lensPosition: { x: 500, y: 300, radius: 130 },
    setLensPosition: (pos) => set({ lensPosition: pos }),

    // ── Active Tool & Measurement ────────────────────────────────────
    activeTool: "select",
    setActiveTool: (tool) => set({ activeTool: tool }),
    distanceResult: null,
    setDistanceResult: (res) => set({ distanceResult: res }),

    // ── Layers ───────────────────────────────────────────────────────
    showGraticule: true,
    toggleGraticule: () =>
      set((state) => ({ showGraticule: !state.showGraticule })),

    showCities: true,
    toggleCities: () =>
      set((state) => ({ showCities: !state.showCities })),

    // ── Modals & Drawers ─────────────────────────────────────────────
    countryPanelOpen: false,
    setCountryPanelOpen: (open) => set({ countryPanelOpen: open }),

    cityPanelOpen: false,
    setCityPanelOpen: (open) => set({ cityPanelOpen: open }),

    comparePanelOpen: false,
    setComparePanelOpen: (open) => set({ comparePanelOpen: open }),

    mapTruthModalOpen: false,
    setMapTruthModalOpen: (open) => set({ mapTruthModalOpen: open }),

    sourceGraphModalOpen: false,
    setSourceGraphModalOpen: (open) => set({ sourceGraphModalOpen: open }),

    correctTheMapModalOpen: false,
    setCorrectTheMapModalOpen: (open) => set({ correctTheMapModalOpen: open }),

    aiAssistantOpen: false,
    setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),
  }))
);
