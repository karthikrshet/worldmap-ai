"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";
import {
  SlidersHorizontal,
  Scan,
  Move,
  Scale,
  Info,
  GitFork,
  Landmark,
  ChevronDown,
} from "lucide-react";

export default function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    activeMode,
    setActiveMode,
    setMapTruthModalOpen,
    setSourceGraphModalOpen,
    setCorrectTheMapModalOpen,
    setComparePanelOpen,
  } = useMapStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
          open || activeMode !== "explore"
            ? "bg-slate-800 border-slate-600 text-white"
            : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
        }`}
      >
        <span>Tools</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <div className="p-1 space-y-0.5">
            <button
              onClick={() => {
                setActiveMode(activeMode === "difference-slider" ? "explore" : "difference-slider");
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                activeMode === "difference-slider"
                  ? "bg-purple-950/60 text-purple-200 border border-purple-800/50"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Difference Slider</span>
              </div>
              {activeMode === "difference-slider" && (
                <span className="text-[10px] text-purple-400 font-mono">ON</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveMode(activeMode === "lens" ? "explore" : "lens");
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                activeMode === "lens"
                  ? "bg-indigo-950/60 text-indigo-200 border border-indigo-800/50"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Scan className="w-3.5 h-3.5 text-indigo-400" />
                <span>Projection Lens</span>
              </div>
              {activeMode === "lens" && (
                <span className="text-[10px] text-indigo-400 font-mono">ON</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveMode(activeMode === "true-size" ? "explore" : "true-size");
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                activeMode === "true-size"
                  ? "bg-amber-950/60 text-amber-200 border border-amber-800/50"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>True-Size Drag</span>
              </div>
              {activeMode === "true-size" && (
                <span className="text-[10px] text-amber-400 font-mono">ON</span>
              )}
            </button>

            <button
              onClick={() => {
                setComparePanelOpen(true);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>Compare Areas</span>
            </button>
          </div>

          <div className="p-1 space-y-0.5">
            <button
              onClick={() => {
                setMapTruthModalOpen(true);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Map Truth Protocol</span>
            </button>

            <button
              onClick={() => {
                setSourceGraphModalOpen(true);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>Source Graph</span>
            </button>

            <button
              onClick={() => {
                setCorrectTheMapModalOpen(true);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              <span>UN Resolution Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
