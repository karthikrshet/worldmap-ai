# 🌍 WorldMap AI

> **See the world at its true scale.**
>
> Explore projections. Measure distortion. Compare geography. Ask the map.

WorldMap AI is an open-source geospatial + AI platform for exploring map projections, comparing real geographic areas, measuring projection distortion, and asking geographic questions backed by deterministic calculations and traceable data.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Data: Public Domain](https://img.shields.io/badge/Data-Natural%20Earth%20Public%20Domain-green.svg)](https://www.naturalearthdata.com/about/terms-of-use/)

---

## Core Principle

> **AI should help people understand the map — not invent the map.**

WorldMap AI uses AI to interpret natural-language questions and explain results. Geographic measurements are produced by deterministic geospatial tools and versioned datasets.

**No fake data. No AI-made numbers. Every result is traceable.**

---

## What WorldMap AI Does

| Feature | Description |
|---------|-------------|
| **Equal Earth default** | Opens to an equal-area world map by default |
| **Projection Explorer** | Compare 10 projections side by side |
| **Geodesic area engine** | Calculates country areas from actual polygon geometry |
| **Country comparator** | Compares any two countries with calculated ratio |
| **Distance tool** | Geodesic distances with WGS84 methodology |
| **True Size mode** | Drag countries across latitudes to show Mercator distortion |
| **Source panel** | Full provenance for every calculation |
| **AI query bar** | Natural-language queries — answered by the calculation engine |
| **UN Resolution page** | Accurate explanation of A/80/L.104 (September 4, 2026) |

---

## Architecture

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │ Natural language / map
┌──────▼──────────────────────┐
│         Next.js             │
│      Map Interface          │
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼─────────┐   ┌───────▼────────┐
│ AI Planner  │   │ Geospatial API │
│  (Phase 3)  │   │   (FastAPI)    │
└───┬─────────┘   └───────┬────────┘
    │ structured tools     │ deterministic
    └──────────┬───────────┘
               │
    ┌──────────▼──────────┐
    │  Calculation Engine  │
    │   PROJ / PostGIS     │
    │  Shapely / pyproj    │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Versioned datasets  │
    │   Natural Earth      │
    │   EPSG:4326 / WGS84  │
    └─────────────────────┘
```

**AI interprets questions. Deterministic geospatial engines calculate answers.**

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/worldmap-ai/worldmap-ai.git
cd worldmap-ai

# 2. Configure
cp .env.example .env
# Edit .env — no required secrets for core map functionality

# 3. Start services
docker compose up -d db api web

# 4. Ingest Natural Earth dataset (run once)
docker compose --profile ingestion run ingestion

# 5. Open http://localhost:3000
```

That's it. The map is the product.

---

## Data Sources

All geographic data comes from authoritative, versioned datasets. See [DATA_SOURCES.md](docs/DATA_SOURCES.md).

| Dataset | Provider | License | Purpose |
|---------|----------|---------|---------|
| Admin 0 Countries 1:10m | Natural Earth | **Public Domain** | Country boundaries, centroids, areas |

Every calculation response includes the dataset name, version, and URL it used.

---

## UN Resolution A/80/L.104

The UN General Assembly adopted resolution **A/80/L.104** on **September 4, 2026**, by **164–1** with **6 abstentions**.

The resolution:
- ✅ **Encourages** the use of equal-area projections where relative area matters
- ❌ **Does not** create one universally compulsory world map
- ❌ **Does not** prohibit Mercator
- ❌ **Does not** mandate Equal Earth specifically

See [/correct-the-map](http://localhost:3000/correct-the-map) for the full educational explanation.

---

## Development

```
worldmap-ai/
├── apps/web/              # Next.js frontend (TypeScript, Tailwind, MapLibre GL JS)
├── services/api/          # FastAPI geospatial service (Python, pyproj, PostGIS)
├── services/ingestion/    # Natural Earth ingestion pipeline
├── packages/              # Shared TypeScript packages
│   ├── projection-catalog/
│   └── shared-types/
├── database/schema/       # PostgreSQL + PostGIS migrations
├── tests/                 # Geospatial golden tests, API tests, E2E
└── docs/                  # Architecture, calculations, projections, data sources
```

### Running Tests

```bash
# Python geospatial tests (no database required)
cd services/api
pip install -r requirements.txt
pytest ../../tests/geospatial/ -v

# Frontend unit tests
cd apps/web
npm test

# E2E tests
cd apps/web
npx playwright test
```

---

## Documentation

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and component overview |
| [CALCULATIONS.md](docs/CALCULATIONS.md) | Geodesic area and distance methodology |
| [PROJECTIONS.md](docs/PROJECTIONS.md) | All 10 projections with mathematical properties |
| [DATA_SOURCES.md](docs/DATA_SOURCES.md) | Dataset licensing, versions, and update strategy |
| [BOUNDARY_POLICY.md](docs/BOUNDARY_POLICY.md) | Political boundary representation policy |
| [AI_SAFETY.md](docs/AI_SAFETY.md) | AI hallucination controls and grounding rules |
| [SECURITY.md](docs/SECURITY.md) | Security policy and reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Every contribution adding geographic data must include source, license, version, methodology, and validation. No unexplained constants.

---

## License

Software: [MIT License](LICENSE)

Dataset licenses are independent. Natural Earth data is **Public Domain**. See [DATA_SOURCES.md](docs/DATA_SOURCES.md) and the [LICENSE](LICENSE) file for details.

---

*WorldMap AI — Open source. Every number is earned, not invented.*
