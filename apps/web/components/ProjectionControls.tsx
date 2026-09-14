"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore, type ProjectionId } from "@/stores/mapStore";
import { PROJECTIONS } from "@/lib/projections";

export default function ProjectionControls() {
  const {
    activeProjection,
    setProjection,
    activeMode,
    setActiveMode,
    setCorrectTheMapModalOpen,
  } = useMapStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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
    <div className="flex items-center gap-2" ref={dropdownRef}>
      {/* September 2026 UN "Correct the Map" Badge */}
      <button
        onClick={() => setCorrectTheMapModalOpen(true)}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono hover:bg-emerald-900/60 transition-colors shadow-sm"
        title="Learn about UN General Assembly Resolution A/80/L.104 (Sep 4, 2026)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>UN &quot;Correct the Map&quot; · Sep 2026</span>
      </button>

      {/* Projection Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-200 hover:border-slate-500 transition-all shadow-md backdrop-blur"
        >
          <span className="text-slate-400 text-[10px] uppercase tracking-wider">Projection:</span>
          <span className="font-semibold text-white">{currentDef.name}</span>
          <span className="text-[10px] text-slate-400">▾</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 bg-slate-950/60">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Cartographic Projections
              </p>
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
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-start justify-between transition-colors ${
                      isActive
                        ? "bg-blue-600/20 text-white border border-blue-500/40"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{def.name}</span>
                        {isEqualArea && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                            Equal-Area
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {def.type}
                      </p>
                    </div>
                    {isActive && <span className="text-blue-400 text-xs">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="p-2 bg-slate-950/40 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Equal Earth</span> is the default
              in alignment with the Sept 2026 UN &quot;Correct the Map&quot; resolution.
            </div>
          </div>
        )}
      </div>

      {/* Quick Compare / Difference Mode Trigger */}
      <div className="hidden lg:flex items-center rounded-lg bg-slate-900/90 border border-slate-800 p-0.5 text-xs font-mono">
        <button
          onClick={() => setActiveMode("explore")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeMode === "explore"
              ? "bg-slate-800 text-white font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setActiveMode("difference-slider")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeMode === "difference-slider"
              ? "bg-purple-900/50 text-purple-200 border border-purple-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Split screen comparing Traditional Mercator on left and Equal Earth on right"
        >
          Difference Slider
        </button>
        <button
          onClick={() => setActiveMode("lens")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeMode === "lens"
              ? "bg-indigo-900/50 text-indigo-200 border border-indigo-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Circular movable distortion lens"
        >
          Lens
        </button>
        <button
          onClick={() => setActiveMode("true-size")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            activeMode === "true-size"
              ? "bg-amber-900/50 text-amber-200 border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Drag country silhouette across latitudes to reveal true scale"
        >
          True Size Drag
        </button>
      </div>
    </div>
  );
}
