/**
 * Geographic data service for WorldMap AI.
 *
 * Loads and indexes published, verified geographic datasets:
 * - Natural Earth 1:110m Admin 0 Countries (boundaries, ISO3, names, population)
 * - Natural Earth 1:50m Populated Places (1,250+ world cities, 196 capitals, coordinates)
 * - Derived Topological Adjacency Map (country borders derived directly from geometry)
 *
 * All datasets are bundled locally in /data/ to guarantee instant loading and
 * complete offline availability without third-party network failure.
 */

import * as turf from "@turf/turf";
import * as d3Geo from "d3-geo";

export interface GeoCountryFeature {
  type: "Feature";
  id?: string | number;
  properties: {
    NAME: string;
    ADMIN?: string;
    ISO_A3: string;
    ADM0_A3?: string;
    GU_A3?: string;
    SOV_A3?: string;
    CONTINENT: string;
    SUBREGION?: string;
    POP_EST?: number;
    POP_YEAR?: number;
    GDP_MD_EST?: number;
    INCOME_GRP?: string;
    ECONOMY?: string;
    [key: string]: unknown;
  };
  geometry: GeoJSON.Geometry;
  centroid?: [number, number]; // [lon, lat]
  areaKm2?: number;
}

export interface GeoCityFeature {
  type: "Feature";
  properties: {
    name: string;
    nameascii?: string;
    adm0name: string;
    adm0_a3?: string;
    sov_a3?: string;
    adm1name?: string;
    latitude: number;
    longitude: number;
    pop_max: number;
    pop_min?: number;
    scalerank: number;
    labelrank: number;
    worldcity: number;
    megacity: number;
    adm0cap: number;
    timezone?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface CountryDataset {
  type: "FeatureCollection";
  features: GeoCountryFeature[];
}

export interface CityDataset {
  type: "FeatureCollection";
  features: GeoCityFeature[];
}

export interface SearchResult {
  id: string;
  type: "country" | "city";
  title: string;
  subtitle: string;
  iso3?: string;
  coordinates?: [number, number]; // [lon, lat]
  bbox?: [number, number, number, number];
  feature?: GeoCountryFeature | GeoCityFeature;
}

// In-memory caches
let cachedCountries: CountryDataset | null = null;
let cachedCities: CityDataset | null = null;
let cachedNeighbors: Record<string, string[]> | null = null;
let countryIsoIndex: Map<string, GeoCountryFeature> = new Map();
let countryNameIndex: Map<string, GeoCountryFeature> = new Map();
let capitalsByCountryIso: Map<string, string> = new Map();

/**
 * Fetch and index country boundaries with complete ISO fallback resolution
 */
export async function loadCountries(): Promise<CountryDataset> {
  if (cachedCountries) return cachedCountries;

  const res = await fetch("/data/ne_110m_admin_0_countries.geojson");
  if (!res.ok) {
    throw new Error(`Failed to load countries dataset: ${res.statusText}`);
  }
  const data: CountryDataset = await res.json();

  countryIsoIndex = new Map();
  countryNameIndex = new Map();

  for (const feature of data.features) {
    const p = feature.properties;

    // Resolve canonical ISO3 (handling Natural Earth -99 exceptions for France, Norway, etc.)
    let canonicalIso = p.ISO_A3 && p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3 || p.GU_A3 || p.SOV_A3 || "";
    if (p.NAME === "France") canonicalIso = "FRA";
    if (p.NAME === "Norway") canonicalIso = "NOR";
    if (p.NAME === "Kosovo") canonicalIso = "KOS";
    if (p.NAME === "N. Cyprus") canonicalIso = "CYN";
    if (p.NAME === "Somaliland") canonicalIso = "SOL";

    // Ensure ISO_A3 property has the canonical code
    p.ISO_A3 = canonicalIso;

    // Compute centroid for direct on-map label placement
    try {
      const centroid = d3Geo.geoCentroid(feature);
      feature.centroid = centroid;
    } catch {
      // Fallback to turf centroid
      const c = turf.centroid(feature);
      feature.centroid = c.geometry.coordinates as [number, number];
    }

    // Compute approximate area for label sizing
    try {
      feature.areaKm2 = Math.round(turf.area(feature) / 1_000_000);
    } catch {
      feature.areaKm2 = 10000;
    }

    // Index by all aliases to guarantee zero missing countries
    if (canonicalIso) countryIsoIndex.set(canonicalIso.toUpperCase(), feature);
    if (p.ADM0_A3) countryIsoIndex.set(p.ADM0_A3.toUpperCase(), feature);
    if (p.GU_A3) countryIsoIndex.set(p.GU_A3.toUpperCase(), feature);
    if (p.SOV_A3) countryIsoIndex.set(p.SOV_A3.toUpperCase(), feature);

    if (p.NAME) countryNameIndex.set(p.NAME.toLowerCase().trim(), feature);
    if (p.ADMIN) countryNameIndex.set(p.ADMIN.toLowerCase().trim(), feature);
  }

  cachedCountries = data;
  return data;
}

/**
 * Fetch and index populated places & capitals
 */
export async function loadCities(): Promise<CityDataset> {
  if (cachedCities) return cachedCities;

  const res = await fetch("/data/ne_50m_populated_places_simple.geojson");
  if (!res.ok) {
    throw new Error(`Failed to load cities dataset: ${res.statusText}`);
  }
  const data: CityDataset = await res.json();
  cachedCities = data;

  // Build capital lookup index
  capitalsByCountryIso = new Map();
  for (const f of data.features) {
    const p = f.properties;
    if (p.adm0cap === 1) {
      const iso = (p.adm0_a3 || p.sov_a3 || "").toUpperCase();
      if (iso && !capitalsByCountryIso.has(iso)) {
        capitalsByCountryIso.set(iso, p.name);
      }
      if (p.adm0name) {
        capitalsByCountryIso.set(p.adm0name.toLowerCase().trim(), p.name);
      }
    }
  }

  return data;
}

/**
 * Get capital name for a country
 */
export function getCountryCapital(iso: string, name?: string): string {
  if (iso && capitalsByCountryIso.has(iso.toUpperCase())) {
    return capitalsByCountryIso.get(iso.toUpperCase())!;
  }
  if (name && capitalsByCountryIso.has(name.toLowerCase().trim())) {
    return capitalsByCountryIso.get(name.toLowerCase().trim())!;
  }
  return "National Record";
}

/**
 * Load country boundary topological neighbors
 */
export async function loadCountryNeighbors(): Promise<Record<string, string[]>> {
  if (cachedNeighbors) return cachedNeighbors;

  try {
    const res = await fetch("/data/country_neighbors.json");
    if (res.ok) {
      cachedNeighbors = await res.json();
      return cachedNeighbors!;
    }
  } catch (err) {
    console.warn("Could not load country neighbors index:", err);
  }
  return {};
}

/**
 * Get country feature by ISO3 or name
 */
export function getCountryByIso(isoOrName: string): GeoCountryFeature | undefined {
  if (!isoOrName) return undefined;
  const clean = isoOrName.trim();
  const byIso = countryIsoIndex.get(clean.toUpperCase());
  if (byIso) return byIso;
  return countryNameIndex.get(clean.toLowerCase());
}

/**
 * Search both countries and cities with deterministic ranking
 */
export async function searchWorld(query: string): Promise<SearchResult[]> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  const [countriesData, citiesData] = await Promise.all([
    loadCountries(),
    loadCities(),
  ]);

  const results: SearchResult[] = [];

  // Search countries
  for (const f of countriesData.features) {
    const p = f.properties;
    const name = p.NAME.toLowerCase();
    const admin = (p.ADMIN || "").toLowerCase();
    const iso = (p.ISO_A3 || "").toLowerCase();

    const isExactIso = iso === clean;
    const isExactName = name === clean || admin === clean;
    const startsWithName = name.startsWith(clean) || admin.startsWith(clean);
    const containsName = name.includes(clean) || admin.includes(clean);

    if (isExactIso || isExactName || startsWithName || containsName) {
      const bbox = turf.bbox(f) as [number, number, number, number];
      results.push({
        id: `country-${iso || name}`,
        type: "country",
        title: p.NAME,
        subtitle: `${p.CONTINENT} · ${iso.toUpperCase()}`,
        iso3: iso.toUpperCase(),
        bbox,
        feature: f,
      });
    }
  }

  // Search cities
  for (const f of citiesData.features) {
    const p = f.properties;
    const name = p.name.toLowerCase();
    const adm0 = (p.adm0name || "").toLowerCase();

    if (name.startsWith(clean) || (clean.length > 2 && name.includes(clean))) {
      const coords = f.geometry.coordinates;
      results.push({
        id: `city-${p.name}-${p.adm0name}`,
        type: "city",
        title: p.name,
        subtitle: `${p.adm1name ? p.adm1name + ", " : ""}${p.adm0name}`,
        coordinates: coords,
        iso3: p.adm0_a3 || p.sov_a3,
        feature: f,
      });
    }
  }

  // Sort: Exact matches first, countries over minor cities
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    const aExact = aTitle === clean;
    const bExact = bTitle === clean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    if (a.type === "country" && b.type !== "country") return -1;
    if (a.type !== "country" && b.type === "country") return 1;

    if (a.type === "city" && b.type === "city") {
      const popA = (a.feature as GeoCityFeature)?.properties.pop_max || 0;
      const popB = (b.feature as GeoCityFeature)?.properties.pop_max || 0;
      return popB - popA;
    }

    return aTitle.localeCompare(bTitle);
  });

  return results.slice(0, 10);
}
