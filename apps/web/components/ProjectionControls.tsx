"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore, type ProjectionId } from "@/stores/mapStore";
import { PROJECTIONS } from "@/lib/projections";
import { ChevronDown, Check } from "lucide-react";

export default function ProjectionControls() {
  const { activeProjection, setProjection } = useMapStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentDef = PROJECTIONS[activeProjection] || PROJECTIONS["equal-earth"];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
      >
        <span className="text-slate-400 text-[11px]">Projection:</span>
        <span className="font-semibold text-white">{currentDef.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-950/40">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Select Projection
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {(Object.keys(PROJECTIONS) as ProjectionId[]).map((projId) => {
              const def = PROJECTIONS[projId];
              const isActive = activeProjection === projId;
              const isEqualArea = def.type.toLowerCase().includes("equal-area");

              return (
                <button
                  key={projId}
                  onClick={() => {
                    setProjection(projId);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-white border border-blue-500/30"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{def.name}</span>
                      {isEqualArea && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                          Equal-area
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {def.aspectRatio === 1 ? "Conformal" : def.aspectRatio === 2.05 ? "Relative area preserved" : def.type}
                    </p>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
