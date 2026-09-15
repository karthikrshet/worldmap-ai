<div align="center">

# 🌍 WorldMap AI

### See the world differently. Ask the map. Verify the answer.

**An open-source, AI-powered interactive world map for exploring geographic scale,  
map projections, country comparisons, cities, distortion, and real-world geographic intelligence.**

<br />

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-TypeScript-black)
![Python](https://img.shields.io/badge/Python-FastAPI-3776AB)
![PostGIS](https://img.shields.io/badge/PostGIS-Geospatial-336791)
![PROJ](https://img.shields.io/badge/PROJ-Geodesy-4A90E2)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-success)

<br />

**Equal Earth · Mercator · Projection Comparison · True Size · Geodesic Calculations · Ask the Map**

<br />

[Explore the Project](#-what-can-you-do-with-worldmap-ai) ·
[How It Works](#-how-worldmap-ai-works) ·
[Architecture](#-architecture) ·
[Run Locally](#-quick-start) ·
[Contribute](#-contributing)

</div>

---

## The map you know is not the Earth itself.

Every flat world map makes trade-offs.

Some preserve angles.  
Some preserve area.  
Some distort size dramatically toward the poles.

That means the map projection you use can change how large countries and continents **appear**.

**WorldMap AI turns that problem into something you can explore.**

Instead of looking at a static map, you can:

- hover over countries
- click and zoom into them
- discover cities progressively
- compare geographic areas
- switch map projections
- inspect distortion
- drag countries across latitudes
- measure geodesic distances
- ask geographic questions in natural language
- inspect exactly where the answer came from

And most importantly:

> **AI helps people understand the map — it does not invent the map.**

WorldMap AI separates AI reasoning from geographic computation.

**Geographic measurements come from geometry and mathematics.  
External facts come from traceable sources.  
AI explains and orchestrates the experience.**

---

# ✨ Preview

> Replace these paths with the final screenshots after the responsive UI cleanup is complete.

<p align="center">
  <img src="docs/assets/worldmap-ai-hero.png" alt="WorldMap AI Equal Earth interactive world map" width="100%" />
</p>

### Explore the world

<p align="center">
  <img src="docs/assets/world-view.png" alt="WorldMap AI clean world view" width="100%" />
</p>

### Select a country and explore it

<p align="center">
  <img src="docs/assets/country-focus-india.png" alt="WorldMap AI India country exploration" width="100%" />
</p>

### Compare projections

<p align="center">
  <img src="docs/assets/projection-comparison.png" alt="Mercator and Equal Earth comparison" width="100%" />
</p>

### Ask the Map

<p align="center">
  <img src="docs/assets/ask-the-map.png" alt="WorldMap AI geographic AI assistant" width="100%" />
</p>

---

# 🚀 What is WorldMap AI?

WorldMap AI is an open-source **geospatial intelligence and interactive cartography platform**.

It combines:

**🗺️ Interactive cartography**  
Explore countries, cities, boundaries, projections, coordinates and geographic relationships.

**📐 Deterministic geospatial computation**  
Calculate area, distance, ratios, projection transformations and other geographic measurements using geospatial engines instead of LLM guesses.

**🤖 AI geographic exploration**  
Ask natural-language questions and let AI translate them into validated map actions and calculations.

**🔎 Source-backed research**  
Retrieve external geographic information with source and date provenance.

**🌐 Projection education**  
Move between Equal Earth, Mercator and other projections to understand how flattening Earth changes what we see.

---

# 🌎 September 2026 — “Correct the Map”

WorldMap AI uses **Equal Earth** as its default global projection.

This is particularly relevant following the September 2026 UN General Assembly discussion around equal-area cartography.

On **September 4, 2026**, the UN General Assembly adopted resolution **A/80/L.104**, encouraging the use of equal-area world maps where accurate relative area matters.

### What this means

✅ Equal-area projections can represent the relative areas of countries and continents more faithfully.

✅ Equal Earth is one important equal-area projection.

### What it does NOT mean

❌ The UN did not create a brand-new projection in September 2026.

❌ Mercator was not globally banned.

❌ The resolution did not establish one universally compulsory replacement map.

❌ No flat map is perfectly distortion-free.

Equal Earth itself was introduced in **2018**.

WorldMap AI therefore treats the September 2026 development as an important moment in the conversation around **how we represent the world**, rather than claiming that Earth suddenly received one new official map.

---

# 🗺️ What can you do with WorldMap AI?

## 1. Explore a clean interactive world map

The map is the product.

WorldMap AI opens directly into an interactive **Equal Earth** world view.

At global scale, the interface deliberately avoids displaying hundreds of city labels.

Instead, information is progressively revealed:

```text
WORLD
  ↓
COUNTRY
  ↓
CITY
  ↓
GEOGRAPHIC DETAIL
  ↓
AI RESEARCH
```

This keeps the map readable on desktop, tablet and mobile.

---

## 2. Hover over any supported country

Move across the map and WorldMap AI identifies geographic features directly from loaded geometry.

```text
India
Asia
```

No LLM call is needed.

No AI guesses which country you are pointing at.

---

## 3. Click a country to enter Country Focus

Selecting a country:

- highlights its actual geometry
- calculates its geographic bounds
- smoothly zooms to the country
- reduces unrelated world labels
- reveals relevant cities
- opens contextual geographic information
- updates the application state
- makes Ask the Map aware of your selection

For example:

```text
INDIA

South Asia

Area
[computed result]

Capital
[source-backed result]

Projection
Equal Earth

Compare · Measure · Ask AI
```

---

## 4. Discover cities progressively

WorldMap AI does not render every city at once.

City visibility depends on:

- zoom
- importance
- viewport
- selected country
- label collisions
- available dataset metadata

At world scale, only high-priority places may appear.

Zoom into a country and additional cities become visible.

Select India, for example, and the map can prioritize Indian cities instead of continuing to display unrelated labels across the entire planet.

---

# 📐 Projection Explorer

Earth is approximately spherical.

Your screen is flat.

There is no way to flatten the entire Earth without introducing distortion.

WorldMap AI makes those trade-offs interactive.

Supported/proposed projection catalog includes:

| Projection | Property / Use |
|---|---|
| **Equal Earth** | Equal-area · Default WorldMap AI view |
| **Mercator** | Conformal · Historically important for navigation |
| **Robinson** | Compromise world projection |
| **Winkel Tripel** | Compromise projection |
| **Mollweide** | Equal-area |
| **Gall-Peters / Cylindrical Equal Area** | Equal-area |
| **Equirectangular** | Simple latitude/longitude representation |
| **Natural Earth** | Compromise world projection |
| **Orthographic** | Globe-like perspective |
| **Azimuthal Equal Area** | Area-preserving azimuthal view |

WorldMap AI does not claim that one projection is universally “correct.”

Different projections preserve different properties.

---

# 🔥 Signature Experiences

## Difference Slider

Compare two representations of the same world directly.

```text
        MERCATOR       │       EQUAL EARTH
                       │
                       │
                       ↔
```

Drag the divider and see how landmasses change.

---

## 🔍 Projection Lens

A movable geographic lens lets you inspect one projection inside another.

For example:

**Outside:** Equal Earth  
**Inside lens:** Mercator

Move the lens toward Greenland, Europe or Antarctica and visually inspect projection differences.

---

## 📏 True Size Mode

Select a country and relocate its comparison silhouette to another latitude.

For example:

```text
Greenland
     ↓
Drag toward the Equator
     ↓
Observe the projection effect
```

The original country geometry is not changed.

Relocated shapes are explicitly treated as **comparison overlays**, not geographic relocation.

---

## 🌍 Globe Mode

Switch from a planar map to an orthographic globe-style view.

A globe provides an intuitive baseline for understanding why every flat projection must make compromises.

---

# 📐 Real geographic calculations

WorldMap AI follows one core architecture rule:

> **AI interprets questions. Deterministic geospatial engines calculate answers.**

Ask:

```text
How much larger is Africa than Greenland?
```

WorldMap AI should not ask an LLM to remember the answer.

Instead:

```text
Question
   │
   ▼
Intent Resolver
   │
   ▼
Entity Resolver
   │
   ▼
Versioned Geographic Geometry
   │
   ▼
Geodesic Area Engine
   │
   ▼
Ratio Calculation
   │
   ▼
Structured Result
   │
   ▼
AI Explanation
```

---

# 📏 Geodesic Area Engine

Country areas can be calculated from polygon geometry using geodesic methods.

A result carries methodology such as:

```json
{
  "value": "<calculated>",
  "unit": "km²",
  "method": "geodesic-area",
  "source": {
    "dataset": "Natural Earth",
    "version": "<dataset-version>"
  },
  "calculation": {
    "engine": "pyproj / PROJ",
    "ellipsoid": "WGS84"
  }
}
```

The value is produced at runtime.

It is not generated by an LLM.

---

# ↔️ Country Comparison

Select two countries and compare:

- geometry-derived area
- absolute area difference
- area ratio
- percentage difference
- projection appearance
- source dataset
- calculation methodology

Example query:

```text
Compare India and Greenland
```

The comparison is calculated from data instead of storing statements such as:

```text
"Country A is X times Country B"
```

as application constants.

---

# 📍 Distance Measurement

Select two points or resolved places.

WorldMap AI can calculate geodesic distance using geographic coordinates and an explicitly documented calculation method.

Example:

```text
Bengaluru → Tokyo

Geodesic distance
[calculated value]

Method
WGS84
```

A displayed geodesic connection represents geographic distance — **not a road or flight route**.

---

# 🤖 Ask the Map

WorldMap AI's AI interface is called:

## Ask the Map

Instead of treating AI as a chatbot floating beside geography, WorldMap AI makes AI an interface **into the map itself**.

Ask:

```text
Show Japan
```

```text
Take me to Bengaluru
```

```text
Compare India and Australia
```

```text
How large is Greenland?
```

```text
Why does Russia look so large in Mercator?
```

```text
Switch to Mercator
```

```text
Show countries larger than India
```

```text
Measure Bengaluru to Tokyo
```

The assistant can translate natural language into validated structured actions.

```json
{
  "intent": "compare_area",
  "entities": ["IND", "GRL"]
}
```

The application executes the action.

The model does **not** execute arbitrary JavaScript or SQL.

---

# 🧠 Map-aware AI

Ask the Map understands the current map context.

If India is selected and you ask:

```text
How big is it?
```

the assistant receives structured context similar to:

```json
{
  "selectedEntity": "IND",
  "projection": "equal-earth",
  "activeLayers": [],
  "comparisonEntities": []
}
```

The map and AI therefore operate as one system.

---

# 🔎 Geographic knowledge + RAG

Not every geographic question is a mathematical calculation.

WorldMap AI separates three types of questions.

### 1. Geographic calculations

Examples:

- area
- distance
- ratio
- projection transformations
- geometry
- coordinates

→ **Deterministic geospatial engine**

### 2. Stable geographic knowledge

Examples:

- geography
- projection history
- country context

→ **Trusted indexed sources / RAG**

### 3. Current information

Examples:

- latest population estimate
- current government information
- recently published statistics

→ **Fresh external retrieval with citations**

Conceptually:

```text
                    USER QUESTION
                          │
                          ▼
                 ┌─────────────────┐
                 │ Intent Resolver │
                 └────────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
      GEO CALCULATION   KNOWLEDGE     CURRENT DATA
            │             │             │
            ▼             ▼             ▼
       PROJ/PostGIS      RAG       Web / Official API
            │             │             │
            └─────────────┼─────────────┘
                          ▼
                  Evidence Validator
                          │
                          ▼
                Answer + Map Actions
                     + Sources
```

---

# 🛡️ No AI-made geography

WorldMap AI follows strict grounding rules.

### The AI must not invent:

- country areas
- geographic coordinates
- distance measurements
- projection distortion values
- city populations
- rankings
- comparison ratios
- source URLs
- citations
- confidence scores

If WorldMap AI cannot verify something, the correct response is:

```text
Data unavailable
```

or:

```text
I couldn't verify this calculation.
```

**Failure is better than fabrication.**

---

# 🔗 Provenance by design

Every factual result should be explainable.

Users should be able to ask:

> Where did this number come from?

WorldMap AI tracks:

```text
Value
  │
  ├── Source
  │
  ├── Dataset
  │
  ├── Dataset version
  │
  ├── Retrieval date
  │
  ├── Calculation method
  │
  ├── CRS / ellipsoid
  │
  └── Calculation engine
```

---

# 🧭 Map Truth

WorldMap AI includes a transparency concept called **Map Truth**.

It explains what the user is currently seeing.

Example:

```text
MAP TRUTH

Projection
Equal Earth

Projection property
Equal-area

Relative area
Preserved

Shape
May be distorted

Boundary geometry
Natural Earth

Calculation CRS
EPSG:4326 / WGS84

View methodology →
```

The goal is not merely to show a map.

The goal is to explain **how the map was constructed**.

---

# 🔬 Source Graph

WorldMap AI can expose the provenance behind individual facts.

Conceptually:

```text
                     INDIA
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
    Geometry       Population         Area
       │               │                │
       ▼               ▼                ▼
 Natural Earth   Verified Source    Geo Engine
                                         │
                                         ▼
                                  pyproj / PROJ
```

This prevents the AI layer from becoming an invisible source of truth.

---

# 🗺️ Geographic data

Core map data is based on versioned geographic datasets.

Initial dataset strategy:

| Dataset | Provider | Purpose |
|---|---|---|
| Admin 0 Countries | Natural Earth | Country geometry and boundaries |
| Populated Places | Natural Earth | Cities / populated places |
| CRS definitions | PROJ / EPSG ecosystem | Projection transformations |
| External country facts | Authoritative providers | Source-backed contextual information |

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

---

# ⚠️ Geometry area vs official statistical area

A polygon-derived country area is not always identical to an official government-published area.

Why?

Map datasets may use simplified coastlines.

This introduces effects related to geometry resolution and the **coastline paradox**.

WorldMap AI therefore distinguishes:

```text
Geometry-derived area
```

from:

```text
Official statistical area
```

when both are available.

They are not silently mixed.

---

# 🧭 Boundary policy

Political boundaries can be disputed.

WorldMap AI does not independently determine sovereignty.

The application:

- identifies the dataset being rendered
- records its version
- preserves attribution
- documents boundary methodology
- avoids presenting dataset geometry as an independent political judgment

See [`docs/BOUNDARY_POLICY.md`](docs/BOUNDARY_POLICY.md).

---

# 🏗️ Architecture

```text
                           ┌─────────────────┐
                           │      User       │
                           └────────┬────────┘
                                    │
                    Map interaction │ Natural language
                                    │
                           ┌────────▼────────┐
                           │   Next.js Web   │
                           │ Interactive Map │
                           └────────┬────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      Map Interaction        AI Orchestrator       Knowledge Layer
             │                      │                      │
             │               Structured Tools        RAG / Retrieval
             │                      │                      │
             └──────────────┬───────┴──────────────┬───────┘
                            │                      │
                            ▼                      ▼
                    Geospatial API          Evidence Validator
                       FastAPI
                            │
               ┌────────────┼────────────┐
               │            │            │
               ▼            ▼            ▼
            pyproj        PostGIS      Shapely
              │
              ▼
             PROJ
               │
               ▼
        Versioned Datasets
               │
               ▼
          Natural Earth
```

---

# 🧰 Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- D3 Geo
- D3 Geo Projection
- Zustand

### Geospatial backend

- Python
- FastAPI
- PostgreSQL
- PostGIS
- pyproj
- PROJ
- Shapely
- GeoPandas where appropriate

### AI & retrieval

- Provider-abstracted LLM layer
- Structured tool execution
- Schema-validated map actions
- RAG / trusted-source retrieval
- Citation validation
- Anti-hallucination guardrails

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- pytest
- Vitest
- Playwright

---

# 📁 Repository Structure

```text
worldmap-ai/
│
├── apps/
│   └── web/                     # Next.js interactive map
│
├── services/
│   ├── api/                     # FastAPI geospatial API
│   ├── ingestion/               # Geographic data pipeline
│   ├── geospatial/              # Calculation engines
│   ├── ai/                      # AI orchestration
│   └── knowledge/               # RAG / retrieval
│
├── packages/
│   ├── projection-catalog/      # Projection definitions
│   └── shared-types/            # Shared TypeScript types
│
├── database/
│   └── schema/                  # PostgreSQL + PostGIS
│
├── tests/
│   ├── geospatial/
│   ├── api/
│   ├── unit/
│   └── e2e/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CALCULATIONS.md
│   ├── DATA_SOURCES.md
│   ├── BOUNDARY_POLICY.md
│   ├── AI_SAFETY.md
│   └── PROJECTIONS.md
│
├── docker-compose.yml
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

---

# ⚙️ Data Pipeline

Geographic data should never appear mysteriously in the application.

WorldMap AI uses a reproducible pipeline:

```text
SOURCE
   │
   ▼
DOWNLOAD
   │
   ▼
CHECKSUM
   │
   ▼
EXTRACT
   │
   ▼
VALIDATE
   │
   ▼
NORMALIZE
   │
   ▼
GEOMETRY VALIDATION / REPAIR
   │
   ▼
POSTGIS
   │
   ▼
RENDER / CALCULATE
```

Each dataset records:

- provider
- source
- version
- license
- checksum
- retrieval time
- processing version

---

# 🚀 Quick Start

## Requirements

You should have:

- Git
- Docker
- Docker Compose

### 1. Clone WorldMap AI

```bash
git clone https://github.com/karthikrshet/worldmap-ai.git
cd worldmap-ai
```

### 2. Configure environment

```bash
cp .env.example .env
```

Core geographic functionality should not require an AI API key.

### 3. Start the stack

```bash
docker compose up -d db api web
```

### 4. Bootstrap geographic data

```bash
docker compose --profile ingestion run ingestion
```

### 5. Open WorldMap AI

```text
http://localhost:3000
```

That's it.

**The map is the product.**

---

# 🧪 Testing

Geographic software needs more than ordinary UI tests.

WorldMap AI tests both software behavior and geographic calculations.

### Geospatial tests

```bash
cd services/api
pytest ../../tests/geospatial/ -v
```

Tests include:

- geodesic area calculations
- geodesic distances
- projection transformations
- projection round trips
- geometry validity
- dataset integrity

### Frontend tests

```bash
cd apps/web
npm test
```

### End-to-end tests

```bash
cd apps/web
npx playwright test
```

E2E coverage should include:

- world map loading
- country hover
- country selection
- geometry-derived zoom
- city decluttering
- projection switching
- country comparison
- responsive mobile behavior
- Ask the Map actions

---

# 🔐 Security

WorldMap AI treats AI and geographic input as untrusted.

Important protections include:

- schema validation
- SQL injection prevention
- XSS protection
- prompt-injection controls
- GeoJSON validation
- geometry complexity limits
- API rate limiting where required
- no model-generated SQL execution
- no model-generated JavaScript execution
- secrets kept outside the repository

See [`SECURITY.md`](SECURITY.md).

---

# 📚 Documentation

| Document | What it explains |
|---|---|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture |
| [`CALCULATIONS.md`](docs/CALCULATIONS.md) | Area, distance and geodesic methodology |
| [`PROJECTIONS.md`](docs/PROJECTIONS.md) | Projection properties and trade-offs |
| [`DATA_SOURCES.md`](docs/DATA_SOURCES.md) | Dataset sources, versions and licenses |
| [`BOUNDARY_POLICY.md`](docs/BOUNDARY_POLICY.md) | Political boundary representation |
| [`AI_SAFETY.md`](docs/AI_SAFETY.md) | AI grounding and hallucination controls |
| [`SECURITY.md`](SECURITY.md) | Security and responsible disclosure |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution guide |

---

# 🛣️ Roadmap

### Core Cartography

- [x] Equal Earth world view
- [x] Country geometry
- [x] Country hover
- [x] Country selection
- [x] Multi-projection foundation
- [x] Geographic data provenance

### Exploration

- [x] Country search
- [x] City dataset integration
- [x] Contextual country information
- [ ] Advanced label collision optimization
- [ ] Mobile interaction refinement

### Projection Lab

- [x] Equal Earth
- [x] Mercator
- [x] Robinson
- [x] Winkel Tripel
- [x] Mollweide
- [x] Orthographic globe
- [ ] Projection Difference Slider refinement
- [ ] Projection Lens refinement
- [ ] True Size Drag refinement
- [ ] Tissot indicatrices
- [ ] Distortion heatmap

### Geographic Intelligence

- [x] Geospatial calculation foundation
- [x] Country comparison foundation
- [x] Distance measurement foundation
- [ ] Advanced spatial queries
- [ ] Viewport-aware geographic queries
- [ ] Multi-country comparisons

### Ask the Map

- [x] Natural-language interface foundation
- [x] Structured map actions
- [x] Context-aware selected country
- [ ] Production RAG pipeline
- [ ] Live authoritative retrieval
- [ ] Citation validation
- [ ] Multilingual geographic exploration

### Education

- [x] Correct the Map context
- [x] Methodology foundation
- [ ] Interactive projection stories
- [ ] Map myths
- [ ] Geography quizzes
- [ ] Educator mode

> Roadmap checkboxes should only be marked complete when the corresponding feature works in the repository. Do not mark planned or partial functionality as complete for presentation purposes.

---

# 🤝 Contributing

Contributions are welcome.

WorldMap AI is intended to become a serious open-source project for developers, cartographers, educators, students and geospatial researchers.

Before contributing geographic data, include:

- source
- provider
- license
- version
- methodology
- validation

### The rule is simple:

> **No unexplained geographic constants.**

If you add a geographic number, the project should be able to explain where it came from.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

# ⭐ Support the Project

If WorldMap AI helps you understand maps differently, consider starring the repository.

A star helps more developers, educators and geography enthusiasts discover the project.

You can also:

- report bugs
- suggest projection tools
- improve geographic methodology
- contribute datasets where licensing permits
- improve accessibility
- contribute educational material
- help test calculations

---

# 📜 License

WorldMap AI software is released under the [MIT License](LICENSE).

Geographic datasets retain their own licenses.

Natural Earth data is public domain.

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) before redistributing datasets or adding new geographic sources.

---

# 🌍 WorldMap AI

### Explore the map. Ask the map. Verify the map.

> **AI should help people understand the map — not invent the map.**

**No fake geographic data.  
No AI-made measurements.  
No fake citations.  
Every result should be explainable.**

---

<div align="center">

Built as an open-source experiment in **cartography × geospatial engineering × AI**.

### ⭐ Star WorldMap AI if you believe maps should be explorable, explainable and verifiable.

</div>
