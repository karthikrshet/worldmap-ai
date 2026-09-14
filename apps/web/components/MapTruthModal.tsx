"use client";

import { useMapStore } from "@/stores/mapStore";
import { PROJECTIONS } from "@/lib/projections";

export default function MapTruthModal() {
  const { mapTruthModalOpen, setMapTruthModalOpen, activeProjection, selectedCountries } =
    useMapStore();

  if (!mapTruthModalOpen) return null;

  const currentDef = PROJECTIONS[activeProjection] || PROJECTIONS["equal-earth"];
  const selected = selectedCountries[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200">
        <button
          onClick={() => setMapTruthModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider mb-2">
          <span>●</span>
          <span>Cartographic Transparency</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Map Truth Protocol</h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Exact parameters and data provenance behind the currently rendered canvas.
        </p>

        <div className="mt-5 space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Active Projection</span>
            <span className="text-white font-semibold">{currentDef.name}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Classification</span>
            <span className="text-emerald-400">{currentDef.type}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Area Preservation</span>
            <span className={activeProjection === "equal-earth" || activeProjection === "mollweide" ? "text-emerald-400" : "text-amber-400"}>
              {currentDef.propertiesPreserved}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Vector Dataset</span>
            <span className="text-slate-200">Natural Earth 1:110m Admin 0 Countries</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Cities Dataset</span>
            <span className="text-slate-200">Natural Earth 1:50m Populated Places</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Area Engine</span>
            <span className="text-blue-400">Turf.js WGS84 Geodesic Ellipsoidal Integration</span>
          </div>

          {selected && (
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex justify-between items-center">
              <span className="text-blue-300">Selected Subject</span>
              <span className="text-white font-semibold">
                {selected.name} ({selected.iso3})
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
          <a
            href="/methodology"
            className="text-blue-400 hover:text-blue-300 underline font-mono"
          >
            Read Full Calculation Methodology →
          </a>
          <button
            onClick={() => setMapTruthModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
