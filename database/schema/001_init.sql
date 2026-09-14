-- WorldMap AI — PostgreSQL + PostGIS Schema
-- Migration: 001_init
-- Created: 2026-09-15
--
-- This schema stores versioned geographic entities and datasets
-- for deterministic geodesic calculations.
--
-- All geometry is stored in EPSG:4326 (WGS84 geographic coordinates).

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── datasets ──────────────────────────────────────────────────────
-- Records every ingested dataset with full provenance.
-- A calculation result must reference the dataset version it used.

CREATE TABLE IF NOT EXISTS datasets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    provider        TEXT NOT NULL,
    version         TEXT NOT NULL,
    license         TEXT NOT NULL,
    source_url      TEXT NOT NULL,
    checksum        TEXT NOT NULL,          -- SHA-256 of downloaded archive
    checksum_algo   TEXT NOT NULL DEFAULT 'sha256',
    retrieved_at    TIMESTAMPTZ NOT NULL,
    processed_at    TIMESTAMPTZ,
    scale           TEXT,                   -- e.g. '1:10m', '1:50m', '1:110m'
    entity_count    INTEGER,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforce unique dataset version per provider
    CONSTRAINT datasets_provider_version_unique UNIQUE (provider, name, version)
);

COMMENT ON TABLE datasets IS
    'Versioned dataset records. Every geographic fact must reference a dataset_id.';
COMMENT ON COLUMN datasets.checksum IS
    'SHA-256 hash of the downloaded source archive for integrity verification.';

-- ── geographic_entities ───────────────────────────────────────────
-- Stores countries, territories, and continental aggregates.
-- Geometry is always stored as EPSG:4326 (WGS84).

CREATE TYPE entity_type AS ENUM (
    'country',
    'territory',
    'disputed',
    'continent',
    'region',
    'custom'
);

CREATE TABLE IF NOT EXISTS geographic_entities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         entity_type NOT NULL DEFAULT 'country',
    name                TEXT NOT NULL,
    name_long           TEXT,
    official_name       TEXT,
    iso2                CHAR(2),
    iso3                CHAR(3),
    iso_n3              CHAR(3),
    -- Full-resolution geometry (EPSG:4326)
    geometry            GEOMETRY(MultiPolygon, 4326),
    -- Simplified geometry for tile rendering (EPSG:4326)
    geometry_simplified GEOMETRY(MultiPolygon, 4326),
    -- Computed centroid (EPSG:4326)
    centroid            GEOMETRY(Point, 4326),
    -- Bounding box
    bbox_minx           DOUBLE PRECISION,
    bbox_miny           DOUBLE PRECISION,
    bbox_maxx           DOUBLE PRECISION,
    bbox_maxy           DOUBLE PRECISION,
    -- Dataset provenance — every entity must point to its source
    dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
    -- Geometry-derived area in square metres (calculated by engine, not from stats)
    area_m2             DOUBLE PRECISION,
    -- Alternate names for search
    name_alt            TEXT[],
    -- Continent membership (documented methodology — see BOUNDARY_POLICY.md)
    continent           TEXT,
    -- Subregion
    subregion           TEXT,
    -- Administrative notes (e.g. boundary disputes, dataset notes)
    boundary_notes      TEXT,
    -- Source feature ID for traceability back to original dataset
    source_feature_id   TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_entities_iso3_dataset_unique UNIQUE (iso3, dataset_id)
);

COMMENT ON TABLE geographic_entities IS
    'Countries, territories, and regions with versioned geometry from authoritative datasets.';
COMMENT ON COLUMN geographic_entities.area_m2 IS
    'Geodesic area in square metres calculated by the calculation engine (not a statistical figure).';
COMMENT ON COLUMN geographic_entities.boundary_notes IS
    'Notes about boundary representation, disputes, or dataset-specific considerations.';

-- ── calculation_runs ──────────────────────────────────────────────
-- Audit log for reproducibility. Caching key is derived from
-- geometry version + dataset version + method + parameters.

CREATE TABLE IF NOT EXISTS calculation_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_type    TEXT NOT NULL,   -- 'area', 'distance', 'compare-area', 'distortion'
    parameters          JSONB NOT NULL,  -- input parameters (entity IDs, projection, etc.)
    dataset_versions    JSONB NOT NULL,  -- snapshot of dataset_id → version at run time
    engine_version      TEXT NOT NULL,   -- pyproj/PROJ version
    result              JSONB NOT NULL,  -- full structured result including provenance
    duration_ms         INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE calculation_runs IS
    'Audit log of geospatial calculations for reproducibility and caching.';

-- ── search_aliases ────────────────────────────────────────────────
-- Additional name aliases to support alternate spellings and languages.

CREATE TABLE IF NOT EXISTS search_aliases (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id   UUID NOT NULL REFERENCES geographic_entities(id) ON DELETE CASCADE,
    alias       TEXT NOT NULL,
    alias_type  TEXT,   -- 'common_name', 'local_name', 'historical', 'iso2', 'iso3'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
