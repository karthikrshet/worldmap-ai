"use client";

import { useMapStore } from "@/stores/mapStore";
import { X, Building2, Sparkles, MapPin } from "lucide-react";

export default function CityPanel() {
  const { selectedCity, setSelectedCity, cityPanelOpen, setCityPanelOpen, setAiAssistantOpen } =
    useMapStore();

  if (!cityPanelOpen || !selectedCity) return null;

  const p = selectedCity.properties;
  const coords = selectedCity.geometry.coordinates;

  return (
    <div className="fixed top-16 right-4 z-40 w-80 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-4 text-slate-200 animate-in slide-in-from-right-3 duration-150">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
            <Building2 className="w-3 h-3" />
            <span>
              {p.adm0cap === 1 ? "National Capital" : p.megacity === 1 ? "Megacity" : "City"}
            </span>
          </div>
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
          className="w-7 h-7 rounded-lg bg-slate-800/70 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 space-y-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex justify-between items-center font-mono">
          <span className="text-slate-400">Coordinates</span>
          <span className="text-slate-200 font-medium">
            {coords[1].toFixed(2)}°N, {coords[0].toFixed(2)}°E
          </span>
        </div>

        {p.pop_max > 0 && (
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-400">Population</span>
              <span className="text-white font-bold">
                {p.pop_max.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Natural Earth Populated Places v5.1.2 estimate
            </p>
          </div>
        )}

        {p.timezone && (
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex justify-between items-center font-mono">
            <span className="text-slate-400">Timezone</span>
            <span className="text-slate-300">{p.timezone}</span>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 text-[10px] font-mono">NE v5.1.2</span>
        <button
          onClick={() => setAiAssistantOpen(true)}
          className="text-sky-400 hover:text-sky-300 text-xs font-medium flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>Ask about {p.name}</span>
        </button>
      </div>
    </div>
  );
}
