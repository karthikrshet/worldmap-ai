"use client";

import { useMapStore } from "@/stores/mapStore";
import { Move, X } from "lucide-react";

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
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[92vw] px-3.5 py-2 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-wrap items-center gap-2.5 text-xs text-slate-200 animate-in slide-in-from-top-3 duration-150">
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
        <Move className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-amber-300">True-Size Drag:</span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Drag silhouette across latitudes
        </span>
      </div>

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
        className="ml-auto p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        title="Exit True Size mode"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
