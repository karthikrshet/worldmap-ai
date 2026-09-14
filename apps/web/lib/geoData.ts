/**
 * Geographic data service for WorldMap AI.
 *
 * Loads and indexes published, verified geographic datasets:
 * - Natural Earth 1:110m Admin 0 Countries (boundaries, ISO3, names)
 * - Natural Earth 1:50m Populated Places (1,250+ major world cities, coordinates, population, timezone)
 * - Derived Topological Adjacency Map (country borders derived directly from geometry)
 *
 * All datasets are bundled locally in /data/ to guarantee instant loading and
 * complete offline availability without third-party network failure.
 */

import * as turf from "@turf/turf";

export interface GeoCountryFeature {
  type: "Feature";
  id?: string | number;
  properties: {
    NAME: string;
    ADMIN?: string;
    ISO_A3: string;
    ADM0_A3?: string;
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

// In-memory cache
let cachedCountries: CountryDataset | null = null;
let cachedCities: CityDataset | null = null;
let cachedNeighbors: Record<string, string[]> | null = null;
let countryIsoIndex: Map<string, GeoCountryFeature> = new Map();

/**
 * Fetch and index country boundaries
 */
export async function loadCountries(): Promise<CountryDataset> {
  if (cachedCountries) return cachedCountries;

  const res = await fetch("/data/ne_110m_admin_0_countries.geojson");
  if (!res.ok) {
    throw new Error(`Failed to load countries dataset: ${res.statusText}`);
  }
  const data: CountryDataset = await res.json();
  cachedCountries = data;

  // Build ISO index
  countryIsoIndex = new Map();
  for (const feature of data.features) {
    const p = feature.properties;
    const iso = (p.ISO_A3 && p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "";
    if (iso) {
      countryIsoIndex.set(iso.toUpperCase(), feature);
    }
  }

  return data;
}

/**
 * Fetch and index populated places
 */
export async function loadCities(): Promise<CityDataset> {
  if (cachedCities) return cachedCities;

  const res = await fetch("/data/ne_50m_populated_places_simple.geojson");
  if (!res.ok) {
    throw new Error(`Failed to load cities dataset: ${res.statusText}`);
  }
  const data: CityDataset = await res.json();
  cachedCities = data;
  return data;
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
 * Get country feature by ISO3
 */
export function getCountryByIso(iso: string): GeoCountryFeature | undefined {
  return countryIsoIndex.get(iso.toUpperCase());
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
    const iso = ((p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3) || "").toLowerCase();

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

  // Search cities (major cities first)
  for (const f of citiesData.features) {
    const p = f.properties;
    const name = p.name.toLowerCase();
    const adm0 = (p.adm0name || "").toLowerCase();
    const adm1 = (p.adm1name || "").toLowerCase();

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

  // Rank results:
  // 1. Exact ISO or exact country name
  // 2. Exact city name with high population
  // 3. Country prefix match
  // 4. City prefix match (sorted by population)
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    const aExact = aTitle === clean;
    const bExact = bTitle === clean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Countries prioritized over minor cities
    if (a.type === "country" && b.type !== "country") return -1;
    if (a.type !== "country" && b.type === "country") return 1;

    // If both cities, sort by population
    if (a.type === "city" && b.type === "city") {
      const popA = (a.feature as GeoCityFeature)?.properties.pop_max || 0;
      const popB = (b.feature as GeoCityFeature)?.properties.pop_max || 0;
      return popB - popA;
    }

    return aTitle.localeCompare(bTitle);
  });

  return results.slice(0, 10);
}
