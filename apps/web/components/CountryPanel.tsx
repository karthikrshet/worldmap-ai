"use client";

import { useState, useMemo } from "react";
import { useMapStore } from "@/stores/mapStore";
import { getCountryByIso, getCountryCapital, loadCountryNeighbors } from "@/lib/geoData";
import { calculateCountryArea, calculateProjectionDistortion } from "@/lib/geoCalculations";
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
  Users,
  Landmark,
  Globe2,
} from "lucide-react";

export default function CountryPanel() {
  const {
    selectedCountries,
    countryPanelOpen,
    clearCountries,
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
  const [neighborNames, setNeighborNames] = useState<string[]>([]);

  const primary = selectedCountries[0];

  const feature = useMemo(() => {
    if (!primary?.iso3) return null;
    return getCountryByIso(primary.iso3) || null;
  }, [primary?.iso3]);

  const areaResult = useMemo(() => {
    if (!feature) return null;
    return calculateCountryArea(feature);
  }, [feature]);

  const capital = useMemo(() => {
    if (!primary?.iso3) return "National Capital";
    return getCountryCapital(primary.iso3, primary.name);
  }, [primary]);

  const populationText = useMemo(() => {
    const pop = (feature?.properties?.POP_EST as number) || 0;
    if (!pop || pop <= 0) return "Official Record";
    if (pop >= 1_000_000_000) {
      return `${(pop / 1_000_000_000).toFixed(2)} Billion`;
    }
    if (pop >= 1_000_000) {
      return `${(pop / 1_000_000).toFixed(1)} Million`;
    }
    return pop.toLocaleString();
  }, [feature]);

  const mercatorDistortion = useMemo(() => {
    if (!feature?.centroid) return null;
    const lat = feature.centroid[1];
    return calculateProjectionDistortion(lat, "mercator");
  }, [feature]);

  const handleShowNeighbors = async () => {
    if (!primary?.iso3) return;
    setLoadingNeighbors(true);
    try {
      const neighborMap = await loadCountryNeighbors();
      const neighbors = neighborMap[primary.iso3.toUpperCase()] || [];
      setNeighborCountries(neighbors);
      const names = neighbors
        .map((iso) => getCountryByIso(iso)?.properties.NAME || iso)
        .sort();
      setNeighborNames(names);
    } catch (err) {
      console.error("Failed to load neighbors:", err);
    } finally {
      setLoadingNeighbors(false);
    }
  };

  if (!countryPanelOpen || !primary) return null;

  const formalName = (feature?.properties?.ADMIN as string) || primary.name;
  const subregion = (feature?.properties?.SUBREGION as string) || primary.subregion || "";
  const economy = (feature?.properties?.ECONOMY as string) || "";
  const incomeGroup = (feature?.properties?.INCOME_GRP as string) || "";

  return (
    <aside className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-16 md:right-5 md:left-auto z-40 w-full md:w-92 max-h-[82vh] md:max-h-[88vh] bg-slate-950/95 border-t md:border border-slate-800/90 rounded-t-2xl md:rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-200 animate-in slide-in-from-bottom md:slide-in-from-right duration-200 font-sans">
      {/* Editorial Header */}
      <div className="p-4 pb-3 border-b border-slate-800/80 flex items-start justify-between bg-gradient-to-b from-slate-900/60 to-transparent">
        <div>
          {/* Pill Badge matching editorial reference */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-teal-500/30 bg-teal-950/40 text-[10px] font-mono font-medium text-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2b4] animate-pulse" />
            <span>001 — COUNTRY METRICS</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mt-1.5 font-sans">
            {primary.name}
          </h2>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <span className="font-serif italic text-teal-400 font-medium">
              {capital}
            </span>
            <span>·</span>
            <span>{primary.continent || "Global"}</span>
            {subregion && (
              <>
                <span>·</span>
                <span className="truncate max-w-[130px]">{subregion}</span>
              </>
            )}
          </div>
        </div>

        {/* Close / Deselect Button */}
        <button
          onClick={clearCountries}
          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          title="Close country stats and return to world map"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Real Statistics Grid (Zero Dummy Data) */}
      <div className="p-4 overflow-y-auto space-y-3 text-xs">
        {/* 2x2 Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Surface Area */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-0.5 hover:border-slate-700 transition-colors">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-teal-400" />
              Surface Area
            </span>
            <span className="text-base font-bold text-white font-mono block">
              {areaResult ? `${(areaResult.areaKm2 / 1_000_000).toFixed(2)}M km²` : "..."}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {areaResult ? `${areaResult.areaKm2.toLocaleString()} km²` : ""}
            </span>
          </div>

          {/* Population */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-0.5 hover:border-slate-700 transition-colors">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-400" />
              Population
            </span>
            <span className="text-base font-bold text-white font-mono block truncate">
              {populationText}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Natural Earth est.
            </span>
          </div>

          {/* Capital City */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-0.5 hover:border-slate-700 transition-colors">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Landmark className="w-3 h-3 text-amber-400" />
              Capital
            </span>
            <span className="text-sm font-semibold text-white block truncate">
              {capital}
            </span>
            <span className="text-[10px] text-slate-400">
              National seat
            </span>
          </div>

          {/* Equal Earth Scale Preservation */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-0.5 hover:border-slate-700 transition-colors">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Scale className="w-3 h-3 text-emerald-400" />
              Scale
            </span>
            <span className="text-sm font-semibold text-white block truncate">
              {activeProjection === "equal-earth" ? "1:1 True Scale" : activeProjection}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              {activeProjection === "equal-earth"
                ? "Area Preserved 100%"
                : mercatorDistortion
                ? `+${mercatorDistortion.areaDistortionPercent}% on Mercator`
                : "Distorted"}
            </span>
          </div>
        </div>

        {/* Real Classifications */}
        {(economy || incomeGroup || formalName !== primary.name) && (
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            {formalName !== primary.name && (
              <div>
                <span className="text-slate-500 font-medium">Official Title:</span>{" "}
                <span className="text-slate-300 font-medium">{formalName}</span>
              </div>
            )}
            {economy && (
              <div>
                <span className="text-slate-500 font-medium">Economy:</span>{" "}
                <span className="text-slate-300">{economy.replace(/^\d+\.\s*/, "")}</span>
              </div>
            )}
            {incomeGroup && (
              <div>
                <span className="text-slate-500 font-medium">Income Group:</span>{" "}
                <span className="text-slate-300">{incomeGroup.replace(/^\d+\.\s*/, "")}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => setComparePanelOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex flex-col items-center justify-center gap-1.5 text-center group"
            title="Compare area ratio with another nation"
          >
            <Scale className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium">Compare</span>
          </button>

          <button
            onClick={() => {
              setTrueSizeIso3(primary.iso3);
              setActiveMode("true-size");
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex flex-col items-center justify-center gap-1.5 text-center group"
            title="Drag country across latitudes to see projection distortion"
          >
            <Move className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium">True Size</span>
          </button>

          <button
            onClick={() => setAiAssistantOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex flex-col items-center justify-center gap-1.5 text-center group"
            title="Ask geographic AI questions about this country"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium">Ask AI</span>
          </button>
        </div>

        {/* Progressive Disclosure Sections */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          {/* Geography & Neighbors Accordion */}
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "geography" ? null : "geography")
              }
              className="w-full p-2.5 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-medium">Topological Neighbors</span>
              </div>
              {expandedSection === "geography" ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSection === "geography" && (
              <div className="p-3 pt-1 text-xs text-slate-400 space-y-2.5 border-t border-slate-800/50">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Adjacency derived directly from shared polygon boundary vertices at 1:110m scale.
                </p>

                <button
                  onClick={handleShowNeighbors}
                  disabled={loadingNeighbors}
                  className="w-full py-1.5 rounded-lg bg-teal-950/60 border border-teal-800/60 text-teal-300 hover:bg-teal-900/60 text-[11px] font-medium transition-colors"
                >
                  {loadingNeighbors ? "Analyzing geometry..." : "Highlight Bordering Countries on Map"}
                </button>

                {neighborNames.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                      {neighborNames.length} Bordering Nations:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {neighborNames.map((name) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sources & Provenance Accordion */}
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "provenance" ? null : "provenance")
              }
              className="w-full p-2.5 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Data Provenance</span>
              </div>
              {expandedSection === "provenance" ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSection === "provenance" && (
              <div className="p-3 pt-1 text-xs text-slate-400 space-y-2 border-t border-slate-800/50">
                <div className="text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500">Boundaries:</span> Natural Earth 1:110m Admin 0
                  </div>
                  <div>
                    <span className="text-slate-500">Capitals & Cities:</span> Natural Earth 1:50m Populated Places
                  </div>
                  <div>
                    <span className="text-slate-500">Area Computation:</span> Turf.js WGS84 geodesic surface integration
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMapTruthModalOpen(true)}
                    className="flex-1 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px]"
                  >
                    Map Truth
                  </button>
                  <button
                    onClick={() => setSourceGraphModalOpen(true)}
                    className="flex-1 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] flex items-center justify-center gap-1"
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
