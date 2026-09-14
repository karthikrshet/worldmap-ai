/**
 * WorldMap AI API client.
 *
 * All geographic facts come from this API — never from hardcoded values
 * or AI-generated responses.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(`API Error ${status}: ${detail}`);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }

  return res.json();
}

// ── Health ────────────────────────────────────────────────────────

export async function getHealth() {
  return apiFetch<{
    status: string;
    version: string;
    datasets: Array<{ name: string; version: string }>;
  }>("/api/v1/health");
}

// ── Projections ───────────────────────────────────────────────────

export async function getProjections() {
  return apiFetch<{ data: ProjectionMetadata[]; count: number }>(
    "/api/v1/projections"
  );
}

export async function getProjection(id: string) {
  return apiFetch<ProjectionMetadata>(`/api/v1/projections/${id}`);
}

// ── Countries ─────────────────────────────────────────────────────

export async function getCountries(params?: {
  limit?: number;
  offset?: number;
  continent?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  if (params?.continent) qs.set("continent", params.continent);
  return apiFetch<{ data: CountrySummary[]; meta: PaginationMeta }>(
    `/api/v1/countries?${qs}`
  );
}

export async function searchCountries(q: string) {
  const qs = new URLSearchParams({ q });
  return apiFetch<{ query: string; results: CountrySummary[] }>(
    `/api/v1/countries/search?${qs}`
  );
}

export async function getCountry(
  iso3: string,
  includeGeometry = false
) {
  const qs = includeGeometry ? "?include_geometry=true" : "";
  return apiFetch<CountryDetail>(`/api/v1/countries/${iso3}${qs}`);
}

// ── Calculations ──────────────────────────────────────────────────

export async function calculateArea(iso3: string) {
  return apiFetch<AreaCalculationResult>("/api/v1/calculations/area", {
    method: "POST",
    body: JSON.stringify({ iso3 }),
  });
}

export async function compareArea(entityA: string, entityB: string) {
  return apiFetch<CompareAreaResult>("/api/v1/calculations/compare-area", {
    method: "POST",
    body: JSON.stringify({ entity_a: entityA, entity_b: entityB }),
  });
}

export async function calculateDistance(params: {
  lon1: number;
  lat1: number;
  lon2: number;
  lat2: number;
  label_a?: string;
  label_b?: string;
}) {
  return apiFetch<DistanceResult>("/api/v1/calculations/distance", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function compareAreaMulti(
  entityCodes: string[],
  compareTo?: string
) {
  return apiFetch("/api/v1/calculations/compare-area/multi", {
    method: "POST",
    body: JSON.stringify({
      entity_codes: entityCodes,
      compare_to: compareTo,
    }),
  });
}

// ── Geometry ──────────────────────────────────────────────────────

export async function relocateGeometry(params: {
  geometry: GeoJSON.Geometry;
  target_lon: number;
  target_lat: number;
  entity_name?: string;
}) {
  return apiFetch("/api/v1/geometry/relocate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ── Types ─────────────────────────────────────────────────────────

export interface ProjectionMetadata {
  id: string;
  name: string;
  family: string;
  preserves_area: boolean;
  preserves_angles: boolean;
  preserves_distance_globally: boolean;
  projection_type: string;
  description: string;
  proj_definition?: string;
  epsg?: string;
  d3_projection?: string;
  appropriate_uses: string[];
  limitations: string[];
  references: string[];
  un_resolution_note?: string;
}

export interface CountrySummary {
  id: string;
  entity_type: string;
  name: string;
  name_long?: string;
  iso2?: string;
  iso3?: string;
  continent?: string;
  subregion?: string;
  area_km2?: number;
  centroid?: GeoJSON.Point;
  bbox?: { minx: number; miny: number; maxx: number; maxy: number };
  dataset: { name: string; version: string };
}

export interface CountryDetail extends CountrySummary {
  official_name?: string;
  name_alt?: string[];
  boundary_notes?: string;
  area: {
    area_km2: number | null;
    area_m2: number | null;
    label: string;
    method: string;
    ellipsoid: string;
    note: string;
  };
  source: {
    dataset_id: string;
    dataset_name: string;
    dataset_version: string;
    dataset_provider: string;
    dataset_license: string;
    dataset_url: string;
    dataset_scale?: string;
    retrieved_at?: string;
    source_feature_id?: string;
  };
  geometry?: GeoJSON.Geometry;
}

export interface AreaCalculationResult {
  entity: { name: string; iso3: string };
  area_km2: number;
  area_m2: number;
  method: string;
  ellipsoid: string;
  algorithm: string;
  source: { dataset_id: string; dataset_name: string; dataset_version: string };
  calculation: {
    engine: string;
    engine_version?: string;
    proj_version?: string;
    ellipsoid: string;
    crs: string;
  };
}

export interface CompareAreaResult {
  entity_a: { name: string; iso3: string; area_km2: number; area_m2: number };
  entity_b: { name: string; iso3: string; area_km2: number; area_m2: number };
  comparison: {
    ratio: number;
    ratio_display: string;
    difference_km2: number;
    percentage_difference: number;
    formulas: Record<string, string>;
  };
  method: string;
  ellipsoid: string;
  formulas: Record<string, string>;
  duration_ms: number;
  provenance_note: string;
}

export interface DistanceResult {
  point_a: { lon: number; lat: number; label: string };
  point_b: { lon: number; lat: number; label: string };
  distance_km: number;
  distance_m: number;
  forward_bearing_deg: number;
  back_bearing_deg: number;
  method: string;
  ellipsoid: string;
  algorithm: string;
  display_note: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  count: number;
}
