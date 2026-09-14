# DATA_SOURCES.md

# WorldMap AI — Data Sources

Every dataset used by WorldMap AI is listed here with its license, version,
source URL, and intended purpose.

**Policy:** No dataset is used without a verified license that permits the
intended use. Dataset licenses are independent from the software license (MIT).

---

## Active Datasets

### Natural Earth — Admin 0 Countries (1:10m)

| Field | Value |
|-------|-------|
| **Dataset** | ne_10m_admin_0_countries |
| **Provider** | Natural Earth |
| **Scale** | 1:10 million |
| **License** | **Public Domain** |
| **Source URL** | https://www.naturalearthdata.com/downloads/10m-cultural-vectors/ |
| **NACIS CDN** | https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip |
| **Purpose** | Country boundary polygons, centroids, ISO codes for display and geodesic calculations |
| **Update strategy** | Dataset version is pinned in `NATURAL_EARTH_VERSION` env var; updates require explicit pipeline re-run and checksum verification |
| **Checksum** | Recorded in `datasets/manifests/` on each ingestion |

**Natural Earth terms of use:**
> "All versions of Natural Earth raster + vector map data found on this website
> are in the public domain. You may use the data in any manner, including
> modifying the content and using it in proprietary products. We kindly ask
> you to give attribution."

Source: https://www.naturalearthdata.com/about/terms-of-use/

**Why 1:10m scale?**
The 1:10m dataset provides the best available balance of boundary accuracy and file size
for world-scale interactive maps. For local or regional detail, higher-resolution datasets
would be needed. See `docs/CALCULATIONS.md` — Coastline Paradox section — for why
geometry resolution affects calculated area values.

---

## Planned Datasets (Future Phases)

| Dataset | Provider | License | Purpose |
|---------|----------|---------|---------|
| Natural Earth 1:50m countries | Natural Earth | Public Domain | Simplified display at lower zoom levels |
| Natural Earth 1:110m countries | Natural Earth | Public Domain | Low-zoom tile generation |
| Natural Earth populated places | Natural Earth | Public Domain | Capital city search |
| UN M49 regional groupings | UN Statistics Division | CC BY | Continental/regional aggregates |
| World Bank country metadata | World Bank | CC BY 4.0 | Socioeconomic layer (Phase 5) |

---

## Datasets NOT Used

The following data sources were considered and explicitly excluded:

| Source | Reason |
|--------|--------|
| Random country-area JSON APIs | No verifiable provenance; no version control |
| Wikipedia area tables | Secondary source; may be inaccurate or stale |
| LLM-generated values | Prohibited by spec — AI must never produce geographic measurements |
| Unsourced blog posts | Not authoritative |

---

## Checksum Verification

Every downloaded dataset archive is verified with SHA-256 before ingestion.
Checksums are stored in `datasets/manifests/` alongside dataset metadata.

If a checksum fails, the ingestion pipeline **stops** and reports an error.
It never proceeds with a potentially corrupted dataset.

---

## Dataset Version Tracking

Each ingested entity references a `dataset_id` UUID that points to a `datasets`
table record containing:
- Provider, name, version
- Source URL
- SHA-256 checksum
- Retrieval timestamp
- Processing timestamp
- Entity count

This means every calculation result can be traced back to the exact dataset version
that produced it.

See `docs/CALCULATIONS.md` for how dataset version affects calculation results.
