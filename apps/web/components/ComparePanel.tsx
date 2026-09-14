"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";
import { getCountryByIso } from "@/lib/geoData";
import { compareCountryAreas } from "@/lib/geoCalculations";

export default function ComparePanel() {
  const { selectedCountries, comparePanelOpen, setComparePanelOpen } = useMapStore();

  const [isoA, setIsoA] = useState("IND");
  const [isoB, setIsoB] = useState("GRL");
  const [result, setResult] = useState<any | null>(null);

  // Sync with selected countries
  useEffect(() => {
    if (selectedCountries[0]?.iso3) setIsoA(selectedCountries[0].iso3);
    if (selectedCountries[1]?.iso3) setIsoB(selectedCountries[1].iso3);
  }, [selectedCountries]);

  const handleCompare = () => {
    if (!isoA || !isoB) return;
    const fA = getCountryByIso(isoA);
    const fB = getCountryByIso(isoB);

    if (!fA || !fB) {
      return;
    }

    const comp = compareCountryAreas(fA, fB);
    setResult(comp);
  };

  // Run calculation initially when opened
  useEffect(() => {
    if (comparePanelOpen) {
      handleCompare();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparePanelOpen, isoA, isoB]);

  if (!comparePanelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-100"
        onClick={() => setComparePanelOpen(false)}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compare country areas"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200 font-mono animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-wider">
              <span>⚖</span>
              <span>True Relative Scale Comparison</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Geodesic Area Comparison
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Physical surface area derived from WGS84 polygon geometry integration.
            </p>
          </div>

          <button
            onClick={() => setComparePanelOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Country Selector Inputs */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400">Country A (ISO3)</label>
            <input
              type="text"
              value={isoA}
              onChange={(e) => setIsoA(e.target.value.toUpperCase())}
              placeholder="e.g. IND"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-400">Country B (ISO3)</label>
            <input
              type="text"
              value={isoB}
              onChange={(e) => setIsoB(e.target.value.toUpperCase())}
              placeholder="e.g. GRL"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Comparison Result Cards */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Country A Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-xs font-semibold text-blue-400 truncate">
                  {result.countryA.name} ({result.countryA.iso3})
                </div>
                <div className="text-base font-bold text-white">
                  {result.countryA.areaKm2.toLocaleString()} km²
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {result.countryA.areaSqMiles.toLocaleString()} sq mi
                </div>
              </div>

              {/* Country B Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-xs font-semibold text-emerald-400 truncate">
                  {result.countryB.name} ({result.countryB.iso3})
                </div>
                <div className="text-base font-bold text-white">
                  {result.countryB.areaKm2.toLocaleString()} km²
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {result.countryB.areaSqMiles.toLocaleString()} sq mi
                </div>
              </div>
            </div>

            {/* Ratio Summary */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-300 font-semibold">True Relative Scale Ratio:</span>
                <span className="text-white font-bold text-sm bg-blue-900/50 px-2 py-0.5 rounded border border-blue-700">
                  {result.ratio} : 1
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {result.comparisonText}
              </p>
              {result.mercatorPerceptionDistortionText && (
                <p className="text-xs text-amber-200/90 font-sans pt-1 border-t border-blue-900/40 leading-relaxed">
                  💡 <strong>Projection Note:</strong> {result.mercatorPerceptionDistortionText}
                </p>
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-sans">
              Method: WGS84 geodesic surface integration via Turf.js · Source: Natural Earth Admin 0 1:110m
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => setComparePanelOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
