"use client";

import { useMapStore } from "@/stores/mapStore";

const PRESETS = [
  { iso3: "GRL", label: "Greenland", note: "Compare with Africa or South America" },
  { iso3: "IND", label: "India", note: "Compare with Europe or North America" },
  { iso3: "AUS", label: "Australia", note: "Compare with United States" },
  { iso3: "BRA", label: "Brazil", note: "Compare with Europe" },
  { iso3: "MDG", label: "Madagascar", note: "Compare with UK" },
];

export default function TrueSizeBar() {
  const { activeMode, setActiveMode, trueSizeIso3, setTrueSizeIso3 } = useMapStore();

  if (activeMode !== "true-size") return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[90vw] px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl flex flex-wrap items-center gap-3 text-xs font-mono text-slate-200 animate-in slide-in-from-top-4 duration-200">
      <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-semibold text-amber-300">True-Size Drag:</span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Drag the orange silhouette across latitudes
        </span>
      </div>

      {/* Preset country selectors */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {PRESETS.map((p) => {
          const isSelected = trueSizeIso3 === p.iso3;
          return (
            <button
              key={p.iso3}
              onClick={() => setTrueSizeIso3(p.iso3)}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                isSelected
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title={p.note}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setActiveMode("explore")}
        className="ml-auto px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
      >
        Exit True-Size ✕
      </button>
    </div>
  );
}
