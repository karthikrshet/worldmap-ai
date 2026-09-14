"use client";

import { useEffect, useState, useRef } from "react";
import { searchWorld, type SearchResult, type GeoCountryFeature, type GeoCityFeature } from "@/lib/geoData";
import { useMapStore } from "@/stores/mapStore";
import { Search, MapPin, Building2, CornerDownLeft, X } from "lucide-react";

interface CountrySearchProps {
  onClose: () => void;
}

export default function CountrySearch({ onClose }: CountrySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { selectCountry, setSelectedCity } = useMapStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchWorld(query);
        setResults(res);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    if (item.type === "country" && item.iso3) {
      const f = item.feature as GeoCountryFeature;
      selectCountry({
        iso3: item.iso3,
        name: item.title,
        continent: f?.properties.CONTINENT,
        subregion: f?.properties.SUBREGION,
      });

      const url = new URL(window.location.href);
      url.searchParams.set("country", item.iso3);
      window.history.replaceState({}, "", url.toString());
    } else if (item.type === "city" && item.feature) {
      setSelectedCity(item.feature as GeoCityFeature);
    }
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-100"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label="Search countries and cities"
        aria-modal="true"
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150"
      >
        {/* Search Input */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country, capital, or city..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin mr-2" />
          ) : (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/60">
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-6 text-center text-xs text-slate-500">
              No results for &quot;{query}&quot;. Try a country or major world city.
            </div>
          )}

          {query.length < 2 && (
            <div className="p-4 text-xs text-slate-500 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-600 block font-mono">
                Suggested Discoveries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {["India", "Greenland", "Tokyo", "Brazil", "Germany", "London", "South Africa"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((res) => (
            <button
              key={res.id}
              onClick={() => handleSelect(res)}
              className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                {res.type === "country" ? (
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                ) : (
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-sky-400 transition-colors">
                    {res.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {res.subtitle}
                  </div>
                </div>
              </div>
              <CornerDownLeft className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
