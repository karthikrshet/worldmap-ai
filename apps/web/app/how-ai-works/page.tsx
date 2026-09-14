import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How AI Works & Anti-Hallucination Architecture | WorldMap AI",
  description:
    "Explanation of WorldMap AI's decoupled intelligence pipeline: deterministic geospatial tools vs RAG vs web retrieval.",
};

export default function HowAiWorksPage() {
  return (
    <main className="min-h-screen bg-[#090d16] text-slate-200 pt-20 pb-24 px-4 sm:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <Link
            href="/"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to WorldMap AI
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-400 pt-2">
            <span>●</span>
            <span>AI Architecture & Safety Policy</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            How AI Works in WorldMap AI
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI is used to understand questions, retrieve evidence, and explain results. AI is <strong>never</strong> the source of geographic truth.
          </p>
        </div>

        {/* Architecture Pipeline Diagram */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono">
          <h2 className="text-base font-bold text-white uppercase text-xs tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            Decoupled Pipeline Architecture
          </h2>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
{`User Natural-Language Question ("How large is India compared to Greenland?")
  │
  ▼
Intent Parser & Entity Resolver (Extracts subjects: IND, GRL; Intent: Compare)
  │
  ├──► A. Deterministic Map Calculation?
  │       └── YES ──► Geodesic Engine (WGS84 surface area, ratio calculation)
  │                    [Turf.js / pyproj — 100% mathematical, zero hallucination]
  │
  ├──► B. Reference Country Knowledge?
  │       └── YES ──► Authoritative Indexed Repositories (UN, Census, World Bank)
  │                    [Requires verified citation and publication year]
  │
  └──► C. Current Factual Inquiries?
          └── YES ──► Live Official Retrieval / RAG Engine
                       [Domain trust filter; official records only]
  │
  ▼
Evidence Collection & Safety Validation Layer
  │  (Validates that every numeric fact is grounded in tool execution)
  │  (Validates that every factual statement has an authoritative citation)
  │
  ▼
Structured Output Generation:
  ├── Natural Language Cartographic Explanation
  ├── Deterministic Geometric Tool Metrics
  ├── Verified Citations with Source URLs & Retrieval Timestamps
  └── Structured Map Actions (navigate, compare, highlight, switch projection)`}
          </div>
        </section>

        {/* The WorldMap AI Trust Promise */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <span>🛡</span>
            <span>Core Guarantee</span>
          </div>
          <h2 className="text-xl font-bold text-white">The WorldMap AI Trust Promise</h2>
          
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-white font-mono">1. No AI-Generated Geography</span>
              <p className="text-slate-400">
                All country borders, coastlines, and city coordinates originate from published, curated datasets (Natural Earth, OpenStreetMap, UN geospatial data). AI is strictly forbidden from generating or modifying vector geography.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-white font-mono">2. Deterministic Geographic Calculations</span>
              <p className="text-slate-400">
                When you ask for the area of a country, the distance between two cities, or the ratio between two landmasses, the number is computed by mathematical algorithms executing spherical or ellipsoidal geodesy—never by an LLM guessing numbers from training text.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-white font-mono">3. Structured Map Actions</span>
              <p className="text-slate-400">
                The AI controls the map through validated structured JSON actions (`navigate`, `compare`, `switch_projection`, `measure`). It is never allowed to execute arbitrary JavaScript code on your browser.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-white font-mono">4. Strict Citation Provenance</span>
              <p className="text-slate-400">
                Every external factual statement (such as population or capital city) must be linked to its publishing agency (UN, National Census Bureau, World Bank) and publication year. If unverified, the system explicitly reports data unavailability rather than guessing.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
