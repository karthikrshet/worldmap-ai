-- WorldMap AI — Indexes
-- Migration: 002_indexes
-- Created: 2026-09-15
--
-- Spatial and search indexes for performance.

-- ── Spatial indexes (GiST) ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_geo_entities_geometry
    ON geographic_entities USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_geo_entities_geometry_simplified
    ON geographic_entities USING GIST (geometry_simplified);

CREATE INDEX IF NOT EXISTS idx_geo_entities_centroid
    ON geographic_entities USING GIST (centroid);

-- ── Lookup indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_geo_entities_iso3
    ON geographic_entities (iso3);

CREATE INDEX IF NOT EXISTS idx_geo_entities_iso2
    ON geographic_entities (iso2);

CREATE INDEX IF NOT EXISTS idx_geo_entities_entity_type
    ON geographic_entities (entity_type);

CREATE INDEX IF NOT EXISTS idx_geo_entities_dataset_id
    ON geographic_entities (dataset_id);

CREATE INDEX IF NOT EXISTS idx_geo_entities_continent
    ON geographic_entities (continent);

-- ── Full-text / trigram search ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_geo_entities_name_trgm
    ON geographic_entities USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_geo_entities_name_long_trgm
    ON geographic_entities USING GIN (name_long gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_search_aliases_alias_trgm
    ON search_aliases USING GIN (alias gin_trgm_ops);

-- ── Calculation audit indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calc_runs_type_created
    ON calculation_runs (calculation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calc_runs_parameters
    ON calculation_runs USING GIN (parameters);

-- ── Dataset indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_datasets_provider_name
    ON datasets (provider, name);

-- ── Trigger: update updated_at on geographic_entities ─────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_geo_entities_updated_at
    BEFORE UPDATE ON geographic_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
