"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";
import { getCountryByIso } from "@/lib/geoData";
import { compareCountryAreas } from "@/lib/geoCalculations";
import { Scale, X, ArrowRightLeft } from "lucide-react";

export default function ComparePanel() {
  const { selectedCountries, comparePanelOpen, setComparePanelOpen } = useMapStore();

  const [isoA, setIsoA] = useState("IND");
  const [isoB, setIsoB] = useState("GRL");
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    if (selectedCountries[0]?.iso3) setIsoA(selectedCountries[0].iso3);
    if (selectedCountries[1]?.iso3) setIsoB(selectedCountries[1].iso3);
  }, [selectedCountries]);

  const handleCompare = () => {
    if (!isoA || !isoB) return;
    const fA = getCountryByIso(isoA);
    const fB = getCountryByIso(isoB);

    if (!fA || !fB) return;

    const comp = compareCountryAreas(fA, fB);
    setResult(comp);
  };

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
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-200 animate-in zoom-in-95 duration-150 font-sans"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold uppercase tracking-wider font-mono">
              <Scale className="w-3.5 h-3.5" />
              <span>True Relative Scale</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Area Comparison
            </h2>
          </div>

          <button
            onClick={() => setComparePanelOpen(false)}
            className="w-7 h-7 rounded-lg bg-slate-800/70 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 my-3.5">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono text-slate-400">Country A (ISO3)</label>
            <input
              type="text"
              value={isoA}
              onChange={(e) => setIsoA(e.target.value.toUpperCase())}
              placeholder="e.g. IND"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono text-slate-400">Country B (ISO3)</label>
            <input
              type="text"
              value={isoB}
              onChange={(e) => setIsoB(e.target.value.toUpperCase())}
              placeholder="e.g. GRL"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <div className="text-xs font-semibold text-sky-400 truncate">
                  {result.countryA.name}
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {result.countryA.areaKm2.toLocaleString()} km²
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <div className="text-xs font-semibold text-emerald-400 truncate">
                  {result.countryB.name}
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {result.countryB.areaKm2.toLocaleString()} km²
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-sky-300 font-semibold">True Relative Scale Ratio:</span>
                <span className="text-white font-bold font-mono px-2 py-0.5 rounded bg-sky-900/50 border border-sky-700">
                  {result.ratio} : 1
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {result.comparisonText}
              </p>
              {result.mercatorPerceptionDistortionText && (
                <p className="text-amber-200/90 pt-1 border-t border-sky-900/40 leading-relaxed">
                  💡 <strong>Projection Note:</strong> {result.mercatorPerceptionDistortionText}
                </p>
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Method: WGS84 geodesic surface integration via Turf.js · Source: Natural Earth Admin 0 1:110m
            </div>
          </div>
        )}
      </div>
    </>
  );
}
