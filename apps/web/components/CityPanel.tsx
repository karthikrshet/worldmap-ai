"use client";

import { useMapStore } from "@/stores/mapStore";

export default function CityPanel() {
  const { selectedCity, setSelectedCity, cityPanelOpen, setCityPanelOpen } = useMapStore();

  if (!cityPanelOpen || !selectedCity) return null;

  const p = selectedCity.properties;
  const coords = selectedCity.geometry.coordinates;

  return (
    <div className="fixed top-16 right-4 z-40 w-80 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl p-5 text-slate-200 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-semibold">
            {p.adm0cap === 1 ? "National Capital" : p.megacity === 1 ? "Global Megacity" : "Populated Place"}
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
            {p.name}
          </h3>
          <p className="text-xs text-slate-400">
            {p.adm1name ? `${p.adm1name}, ` : ""}
            <span className="text-slate-200">{p.adm0name}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setCityPanelOpen(false);
            setSelectedCity(null);
          }}
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Verified Details */}
      <div className="mt-4 space-y-2.5 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400">Coordinates</span>
          <span className="text-slate-200 font-semibold">
            {coords[1].toFixed(4)}°N, {coords[0].toFixed(4)}°E
          </span>
        </div>

        {p.pop_max > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Population</span>
              <span className="text-white font-semibold">
                {p.pop_max.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">
              Source: Natural Earth Populated Places v5.1.2 (LandScan reference estimate)
            </p>
          </div>
        )}

        {p.timezone && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Timezone</span>
            <span className="text-slate-300">{p.timezone}</span>
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400">Country Code</span>
          <span className="text-emerald-400 font-semibold">{p.adm0_a3 || p.sov_a3 || "N/A"}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500 text-[10px]">Natural Earth v5.1.2</span>
        <button
          onClick={() => {
            // Set as measurement origin or ask about it
            useMapStore.getState().setAiAssistantOpen(true);
          }}
          className="text-pink-400 hover:text-pink-300 text-xs font-medium"
        >
          Ask about {p.name} →
        </button>
      </div>
    </div>
  );
}
