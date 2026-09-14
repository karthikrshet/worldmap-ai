"use client";

import { useMapStore } from "@/stores/mapStore";
import { Ruler, X, ArrowRight } from "lucide-react";

export default function MeasureBanner() {
  const { distanceResult, setDistanceResult } = useMapStore();

  if (!distanceResult) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-sky-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs text-slate-200 animate-in slide-in-from-top-3 duration-150">
      <div className="flex items-center gap-1.5 text-sky-400">
        <Ruler className="w-3.5 h-3.5" />
        <span className="font-semibold text-sky-300">Geodesic:</span>
      </div>

      <div className="flex items-center gap-2 text-slate-300">
        <span className="font-medium text-white">{distanceResult.fromName}</span>
        <ArrowRight className="w-3 h-3 text-sky-400" />
        <span className="font-medium text-white">{distanceResult.toName}</span>
        <span className="text-slate-600">|</span>
        <span className="font-mono font-bold text-sky-400">
          {distanceResult.distanceKm.toLocaleString()} km
        </span>
        <span className="text-slate-400 text-[11px]">
          ({distanceResult.distanceMiles.toLocaleString()} mi)
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 font-mono text-[11px]">
          Azimuth: {distanceResult.initialBearingDeg}° ({distanceResult.compassDirection})
        </span>
      </div>

      <button
        onClick={() => setDistanceResult(null)}
        className="ml-2 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        title="Clear measurement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
