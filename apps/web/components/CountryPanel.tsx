"use client";

import { useState, useMemo } from "react";
import { useMapStore } from "@/stores/mapStore";
import { getCountryByIso, loadCountryNeighbors } from "@/lib/geoData";
import { calculateCountryArea } from "@/lib/geoCalculations";
import {
  X,
  Scale,
  Sparkles,
  Compass,
  Move,
  ChevronDown,
  ChevronRight,
  Info,
  GitFork,
} from "lucide-react";

export default function CountryPanel() {
  const {
    selectedCountries,
    countryPanelOpen,
    setCountryPanelOpen,
    setComparePanelOpen,
    activeProjection,
    setNeighborCountries,
    setActiveMode,
    setTrueSizeIso3,
    setMapTruthModalOpen,
    setSourceGraphModalOpen,
    setAiAssistantOpen,
  } = useMapStore();

  const [expandedSection, setExpandedSection] = useState<"geography" | "provenance" | null>(null);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  const primary = selectedCountries[0];

  const feature = useMemo(() => {
    if (!primary?.iso3) return null;
    return getCountryByIso(primary.iso3) || null;
  }, [primary?.iso3]);

  const areaResult = useMemo(() => {
    if (!feature) return null;
    return calculateCountryArea(feature);
  }, [feature]);

  const handleShowNeighbors = async () => {
    if (!primary?.iso3) return;
    setLoadingNeighbors(true);
    try {
      const neighborMap = await loadCountryNeighbors();
      const neighbors = neighborMap[primary.iso3.toUpperCase()] || [];
      setNeighborCountries(neighbors);
    } catch (err) {
      console.error("Failed to load neighbors:", err);
    } finally {
      setLoadingNeighbors(false);
    }
  };

  if (!countryPanelOpen || !primary) return null;

  return (
    <aside className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-16 md:right-5 md:left-auto z-40 w-full md:w-84 max-h-[75vh] md:max-h-[85vh] bg-slate-900/95 border-t md:border border-slate-800 rounded-t-2xl md:rounded-xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-200 animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-800/80 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {primary.iso3}
            </span>
            <span className="text-xs text-slate-400">
              {primary.continent || "Global"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            {primary.name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {feature?.properties.ADMIN || primary.name} · {primary.subregion || "Region"}
          </p>
        </div>

        <button
          onClick={() => setCountryPanelOpen(false)}
          className="w-7 h-7 rounded-lg bg-slate-800/70 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Clean Level 1 Summary Cards */}
      <div className="p-4 overflow-y-auto space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Surface Area */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Surface Area
            </span>
            <span className="text-base font-bold text-white font-mono block">
              {areaResult ? `${(areaResult.areaKm2 / 1_000_000).toFixed(2)}M km²` : "..."}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {areaResult ? `${areaResult.areaKm2.toLocaleString()} km²` : ""}
            </span>
          </div>

          {/* Projection Status */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Projection
            </span>
            <span className="text-sm font-semibold text-white block truncate">
              {activeProjection === "equal-earth" ? "Equal Earth" : activeProjection}
            </span>
            <span className="text-[10px] text-emerald-400">
              {activeProjection === "equal-earth" ? "Area Preserved 1:1" : "Distorted Scale"}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => setComparePanelOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex flex-col items-center justify-center gap-1 text-center"
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium">Compare</span>
          </button>

          <button
            onClick={() => {
              setTrueSizeIso3(primary.iso3);
              setActiveMode("true-size");
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex flex-col items-center justify-center gap-1 text-center"
          >
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium">True Size</span>
          </button>

          <button
            onClick={() => setAiAssistantOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex flex-col items-center justify-center gap-1 text-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-medium">Ask AI</span>
          </button>
        </div>

        {/* Progressive Disclosure Accordions */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          {/* Geography & Neighbors Accordion */}
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "geography" ? null : "geography")
              }
              className="w-full p-2.5 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-medium">Geography & Borders</span>
              </div>
              {expandedSection === "geography" ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSection === "geography" && (
              <div className="p-3 pt-0 text-xs text-slate-400 space-y-2 border-t border-slate-800/40 mt-1">
                <p className="text-[11px] leading-relaxed">
                  Calculated from WGS84 polygon rings. Land boundary adjacency derived from shared vertex topology.
                </p>
                <button
                  onClick={handleShowNeighbors}
                  disabled={loadingNeighbors}
                  className="w-full py-1.5 rounded-lg bg-teal-950/60 border border-teal-800/60 text-teal-300 hover:bg-teal-900/60 text-[11px] font-medium transition-colors"
                >
                  {loadingNeighbors ? "Analyzing..." : "Highlight Neighbor Countries"}
                </button>
              </div>
            )}
          </div>

          {/* Provenance & Methodology Accordion */}
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "provenance" ? null : "provenance")
              }
              className="w-full p-2.5 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Sources & Provenance</span>
              </div>
              {expandedSection === "provenance" ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSection === "provenance" && (
              <div className="p-3 pt-0 text-xs text-slate-400 space-y-2 border-t border-slate-800/40 mt-1">
                <div className="text-[11px] space-y-1">
                  <div>Geometry: Natural Earth 1:110m (Public Domain)</div>
                  <div>Area Engine: Turf.js WGS84 ellipsoidal integration</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMapTruthModalOpen(true)}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                  >
                    Map Truth
                  </button>
                  <button
                    onClick={() => setSourceGraphModalOpen(true)}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center gap-1"
                  >
                    <GitFork className="w-3 h-3 text-emerald-400" />
                    <span>Source Graph</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
