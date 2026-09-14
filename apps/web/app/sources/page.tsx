import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Sources & Provenance | WorldMap AI",
  description:
    "Complete directory of published geospatial datasets, reference registries, and licenses used in WorldMap AI.",
};

const DATASETS = [
  {
    name: "Natural Earth Admin 0 Countries",
    scale: "1:110m Vector",
    provider: "North American Cartographic Information Society (NACIS)",
    license: "Public Domain (CC0 equivalent)",
    url: "https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/",
    checksumPolicy: "SHA-256 integrity verification against NACIS repository",
    purpose: "Provides sovereign state boundaries, ISO 3166-1 alpha-3 codes, continent classifications, and baseline geometry.",
  },
  {
    name: "Natural Earth Populated Places",
    scale: "1:50m Vector",
    provider: "NACIS / LandScan / National Census Bureaus",
    license: "Public Domain",
    url: "https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-populated-places/",
    checksumPolicy: "SHA-256 verified at ingestion",
    purpose: "1,250+ world cities, national capitals, latitude/longitude, scaleranks, timezones, and reference population estimates.",
  },
  {
    name: "Topological Adjacency Map",
    scale: "Derived from 1:110m Vector",
    provider: "WorldMap AI Geometry Engine",
    license: "Open Source (MIT)",
    url: "/data/country_neighbors.json",
    checksumPolicy: "Deterministically generated from shared coordinate vertex intersections",
    purpose: "Land boundary sharing and neighbor queries (e.g. ST_Touches equivalent). Excludes maritime boundaries.",
  },
  {
    name: "United Nations Population Reference",
    scale: "Global Country Indicators",
    provider: "United Nations Population Division (UN DESA) / UNFPA",
    license: "Open Data / UN Terms of Use",
    url: "https://data.un.org/",
    checksumPolicy: "Verified authoritative publication year & URL",
    purpose: "Used strictly for factual knowledge retrieval and population citations in 'Ask the Map'.",
  },
  {
    name: "Equal Earth Projection Equations",
    scale: "Mathematical Formulation",
    provider: "Šavrič, Patterson, Jenny (2018)",
    license: "Published Academic Standard (IJGIS)",
    url: "https://doi.org/10.1080/13658816.2018.1504949",
    checksumPolicy: "Implemented via d3-geo / PROJ mathematical specification",
    purpose: "Pseudocylindrical equal-area projection preserving relative land surface area across all latitudes.",
  },
];

export default function SourcesPage() {
  return (
    <main className="min-h-screen bg-[#090d16] text-slate-200 pt-20 pb-24 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8 font-mono">
        <div className="space-y-2">
          <Link
            href="/"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to WorldMap AI
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400 pt-2">
            <span>●</span>
            <span>Cartographic Provenance Directory</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-sans">
            Authoritative Data Sources
          </h1>
          <p className="text-sm text-slate-400 font-sans leading-relaxed">
            WorldMap AI does not fabricate geography. Every polygon, coordinate, city, and statistic rendered in this platform originates from published, verified datasets under open and public domain licenses.
          </p>
        </div>

        {/* Dataset Cards */}
        <div className="space-y-4">
          {DATASETS.map((d, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{d.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{d.scale} · {d.provider}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                  {d.license}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {d.purpose}
              </p>

              <div className="text-[11px] text-slate-400 space-y-1">
                <div>
                  <span className="text-slate-500">Integrity Check:</span> {d.checksumPolicy}
                </div>
                <div>
                  <span className="text-slate-500">Source:</span>{" "}
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {d.url} ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Anti-Hallucination Commitment */}
        <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2 font-sans text-xs text-blue-100/90 leading-relaxed">
          <h4 className="font-bold text-white font-mono uppercase text-xs text-blue-300">
            Our Data Trust Standard
          </h4>
          <p>
            We strictly separate <strong>deterministic geospatial math</strong> (area, distance, bearings, adjacency) from <strong>statistical reference data</strong> (population, capitals, UN membership). Geographic calculations are never guessed by an LLM; they are computed directly from the coordinate rings of the source polygon.
          </p>
        </div>
      </div>
    </main>
  );
}
