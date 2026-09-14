"use client";

import { useMapStore } from "@/stores/mapStore";
import { GitFork, X, ExternalLink } from "lucide-react";

export default function SourceGraphModal() {
  const { sourceGraphModalOpen, setSourceGraphModalOpen, selectedCountries } = useMapStore();

  if (!sourceGraphModalOpen) return null;

  const subject = selectedCountries[0]?.name || "World Feature";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200">
        <button
          onClick={() => setSourceGraphModalOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1.5">
          <GitFork className="w-4 h-4" />
          <span>Data Provenance Graph</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Source Lineage: {subject}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Visual trace connecting every displayed metric to its primary source.
        </p>

        {/* ASCII Provenance Tree */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
          <div className="text-emerald-400 font-bold">{subject}</div>
          <div className="text-slate-400">├── <span className="text-white">Polygon Boundaries</span> → <span className="text-sky-300">Natural Earth Vector (1:110m, Public Domain)</span></div>
          <div className="text-slate-400">├── <span className="text-white">Capitals & Populated Places</span> → <span className="text-sky-300">Natural Earth Populated Places v5.1.2</span></div>
          <div className="text-slate-400">├── <span className="text-white">Geodesic Surface Area</span> → <span className="text-emerald-300">Deterministic WGS84 Geodesic Integration</span></div>
          <div className="text-slate-400">├── <span className="text-white">Boundary Adjacency (Neighbors)</span> → <span className="text-emerald-300">Shared Polygon Vertex Intersections</span></div>
          <div className="text-slate-400">├── <span className="text-white">Reference Indicators</span> → <span className="text-amber-300">UN Population Division / World Bank API</span></div>
          <div className="text-slate-400">└── <span className="text-white">Cartographic Projection Engine</span> → <span className="text-purple-300">d3-geo / PROJ (Equal Earth Formulation)</span></div>
        </div>

        <div className="mt-5 flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
          <a
            href="/sources"
            className="text-sky-400 hover:text-sky-300 underline flex items-center gap-1 font-mono"
          >
            <span>Complete Data Catalog</span>
            <ExternalLink className="w-3 h-3 inline" />
          </a>
          <button
            onClick={() => setSourceGraphModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
