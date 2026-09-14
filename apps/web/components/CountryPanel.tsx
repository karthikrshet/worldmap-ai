"use client";

import { useState, useMemo } from "react";
import { useMapStore } from "@/stores/mapStore";
import { getCountryByIso, loadCountryNeighbors } from "@/lib/geoData";
import { calculateCountryArea } from "@/lib/geoCalculations";

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

  const [disclosureLevel, setDisclosureLevel] = useState<1 | 2 | 3>(1);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  const primary = selectedCountries[0];

  // Lookup geometry feature
  const feature = useMemo(() => {
    if (!primary?.iso3) return null;
    return getCountryByIso(primary.iso3) || null;
  }, [primary?.iso3]);

  // Calculated area
  const areaResult = useMemo(() => {
    if (!feature) return null;
    return calculateCountryArea(feature);
  }, [feature]);

  // Show neighbors handler
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
    <aside className="fixed top-16 right-4 bottom-14 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-200 animate-in slide-in-from-right-4 duration-200">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold">
              {primary.iso3}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {primary.continent || "Global"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            {primary.name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rendered in {activeProjection === "equal-earth" ? "Equal Earth (Relative Area Preserved)" : activeProjection}
          </p>
        </div>

        <button
          onClick={() => setCountryPanelOpen(false)}
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Progressive Disclosure Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-mono bg-slate-950/20">
        <button
          onClick={() => setDisclosureLevel(1)}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
            disclosureLevel === 1
              ? "border-blue-500 text-white font-medium bg-slate-800/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setDisclosureLevel(2)}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
            disclosureLevel === 2
              ? "border-blue-500 text-white font-medium bg-slate-800/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Geography & Borders
        </button>
        <button
          onClick={() => setDisclosureLevel(3)}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
            disclosureLevel === 3
              ? "border-blue-500 text-white font-medium bg-slate-800/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Provenance & AI
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
        {/* ── LEVEL 1: Overview ── */}
        {disclosureLevel === 1 && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {/* Geodesic Area Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Calculated Surface Area</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  WGS84 Integral
                </span>
              </div>
              <div className="text-lg font-bold text-white tracking-tight">
                {areaResult ? `${areaResult.areaKm2.toLocaleString()} km²` : "Calculating..."}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {areaResult?.areaSqMiles.toLocaleString()} square miles (geometry-derived).
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 font-sans">
                {areaResult?.precisionNote}
              </div>
            </div>

            {/* Quick Metadata */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Subregion</span>
                <span className="text-slate-200 font-sans">
                  {primary.subregion || feature?.properties.SUBREGION || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Population Estimate</span>
                <span className="text-slate-200">
                  {feature?.properties.POP_EST
                    ? `${(Number(feature.properties.POP_EST) / 1_000_000).toFixed(1)}M (dataset reference)`
                    : "See Provenance"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Relative Scale Property</span>
                <span className="text-emerald-400">
                  {activeProjection === "equal-earth" ? "Area Preserved 1:1" : "Distorted at Latitude"}
                </span>
              </div>
            </div>

            {/* Interactive Tool Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setTrueSizeIso3(primary.iso3);
                  setActiveMode("true-size");
                }}
                className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 hover:bg-amber-900/40 transition-colors flex flex-col items-center justify-center gap-1 text-center"
              >
                <span className="text-sm">⇄</span>
                <span className="font-semibold text-[11px]">True Size Drag</span>
                <span className="text-[9px] text-amber-400/80 font-sans">Drag across latitudes</span>
              </button>

              <button
                onClick={() => setComparePanelOpen(true)}
                className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/40 text-blue-200 hover:bg-blue-900/40 transition-colors flex flex-col items-center justify-center gap-1 text-center"
              >
                <span className="text-sm">⚖</span>
                <span className="font-semibold text-[11px]">Compare Country</span>
                <span className="text-[9px] text-blue-400/80 font-sans">Relative scale analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* ── LEVEL 2: Geography & Borders ── */}
        {disclosureLevel === 2 && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {/* Border Adjacency Action */}
            <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-200">Land Boundary Adjacency</span>
                <button
                  onClick={handleShowNeighbors}
                  disabled={loadingNeighbors}
                  className="px-2.5 py-1 rounded bg-teal-800 hover:bg-teal-700 text-teal-100 text-[11px] font-medium transition-colors"
                >
                  {loadingNeighbors ? "Analyzing..." : "Highlight Neighbors"}
                </button>
              </div>
              <p className="text-[11px] text-teal-100/70 font-sans">
                Derives all topologically bordering nations directly from shared vector polygon boundaries.
              </p>
            </div>

            {/* Projection Distortion at this Entity */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs font-semibold">
                Projection Analysis for {primary.name}
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {activeProjection === "equal-earth"
                  ? "In Equal Earth, this country's area retains exact physical proportion to all other nations on Earth (preserves surface area). Angular shear is minimized."
                  : `In ${activeProjection}, relative area is mathematically distorted based on latitude. Switch to Equal Earth to see its true physical proportions.`}
              </p>
            </div>
          </div>
        )}

        {/* ── LEVEL 3: Provenance & AI ── */}
        {disclosureLevel === 3 && (
          <div className="space-y-3 animate-in fade-in duration-100">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs font-semibold">Authoritative Provenance</div>
              <div className="text-[11px] text-slate-300 space-y-1.5 font-sans">
                <p>
                  <strong>Vector Geometry:</strong> Natural Earth 1:110m Admin 0 Countries (Public Domain).
                </p>
                <p>
                  <strong>Calculation:</strong> WGS84 Geodesic Ellipsoidal Area (Turf.js). Zero LLM hallucinations.
                </p>
                <p>
                  <strong>International Status:</strong> UN GA Res A/80/L.104 encourages equal-area views for education.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setMapTruthModalOpen(true)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs text-center transition-colors"
                >
                  Inspect Map Truth Protocol →
                </button>
                <button
                  onClick={() => setSourceGraphModalOpen(true)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs text-center transition-colors"
                >
                  View Source Provenance Graph →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Ask the Map */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">
          Ask WorldMap AI
        </span>
        <button
          onClick={() => setAiAssistantOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <span>✦</span>
          <span>Ask about {primary.name}</span>
        </button>
      </div>
    </aside>
  );
}
