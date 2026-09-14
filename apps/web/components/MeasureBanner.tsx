"use client";

import { useMapStore } from "@/stores/mapStore";

export default function MeasureBanner() {
  const { distanceResult, setDistanceResult } = useMapStore();

  if (!distanceResult) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-sky-500/50 shadow-2xl backdrop-blur-xl flex items-center gap-4 text-xs font-mono text-slate-200 animate-in slide-in-from-top-4 duration-200">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        <span className="font-semibold text-sky-300">Geodesic Distance:</span>
      </div>

      <div className="flex items-center gap-2 text-slate-300 font-sans">
        <span className="font-medium text-white">{distanceResult.fromName}</span>
        <span className="text-sky-400">→</span>
        <span className="font-medium text-white">{distanceResult.toName}</span>
        <span className="text-slate-500">|</span>
        <span className="font-mono font-bold text-sky-400 text-sm">
          {distanceResult.distanceKm.toLocaleString()} km
        </span>
        <span className="text-slate-400 text-xs">
          ({distanceResult.distanceMiles.toLocaleString()} mi)
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-xs text-slate-400 font-mono">
          Azimuth: {distanceResult.initialBearingDeg}° ({distanceResult.compassDirection})
        </span>
      </div>

      <button
        onClick={() => setDistanceResult(null)}
        className="ml-2 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        title="Clear measurement"
      >
        ✕
      </button>
    </div>
  );
}
