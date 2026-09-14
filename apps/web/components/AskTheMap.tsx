"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";
import { queryAI, type AIQueryResponse, type MapAction } from "@/lib/aiEngine";
import { getCountryByIso } from "@/lib/geoData";
import { Sparkles, Send, X, ExternalLink } from "lucide-react";

export default function AskTheMap() {
  const {
    aiAssistantOpen,
    setAiAssistantOpen,
    activeProjection,
    setProjection,
    selectedCountries,
    selectCountry,
    setHighlightedCountries,
    setActiveMode,
    setTrueSizeIso3,
    setDistanceResult,
    setCountryPanelOpen,
  } = useMapStore();

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AIQueryResponse[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIso = selectedCountries[0]?.iso3;
  const selectedName = selectedCountries[0]?.name;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  useEffect(() => {
    if (aiAssistantOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [aiAssistantOpen]);

  const executeMapAction = (action: MapAction) => {
    const { type, payload } = action;
    switch (type) {
      case "navigate":
        if (payload.iso3) {
          const feature = getCountryByIso(payload.iso3);
          if (feature) {
            selectCountry({
              iso3: payload.iso3,
              name: feature.properties.NAME,
              continent: feature.properties.CONTINENT,
            });
          }
        }
        break;
      case "highlight":
        if (payload.iso3List) setHighlightedCountries(payload.iso3List);
        break;
      case "compare":
        if (payload.iso3List && payload.iso3List.length >= 2) {
          const c1 = getCountryByIso(payload.iso3List[0]);
          const c2 = getCountryByIso(payload.iso3List[1]);
          if (c1 && c2) {
            selectCountry({ iso3: payload.iso3List[0], name: c1.properties.NAME, continent: c1.properties.CONTINENT });
            selectCountry({ iso3: payload.iso3List[1], name: c2.properties.NAME, continent: c2.properties.CONTINENT });
            useMapStore.getState().setComparePanelOpen(true);
          }
        }
        break;
      case "switch_projection":
        if (payload.projectionId) setProjection(payload.projectionId as any);
        break;
      case "show_true_size":
        if (payload.iso3) {
          setTrueSizeIso3(payload.iso3);
          setActiveMode("true-size");
        }
        break;
      case "measure":
        if (payload.fromCoords && payload.toCoords) {
          import("@/lib/geoCalculations").then(({ calculateGeodesicDistance }) => {
            const res = calculateGeodesicDistance(
              payload.fromCoords!,
              payload.toCoords!,
              payload.fromName || "Point A",
              payload.toName || "Point B"
            );
            setDistanceResult(res);
          });
        }
        break;
      case "open_panel":
        setCountryPanelOpen(true);
        break;
    }
  };

  const handleSubmit = async (text?: string) => {
    const queryText = (text || inputQuery).trim();
    if (!queryText || loading) return;

    setInputQuery("");
    setLoading(true);

    try {
      const response = await queryAI(queryText, {
        selectedEntity: selectedIso,
        projection: activeProjection,
      });

      setHistory((prev) => [...prev, response]);
      for (const action of response.mapActions) {
        executeMapAction(action);
      }
    } catch (err) {
      console.error("AI query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Exactly 3 contextual suggestions (Section 38 rule)
  const suggestedPrompts = selectedName
    ? [
        `Why does ${selectedName} look this size in Equal Earth?`,
        `Compare ${selectedName} with Greenland`,
        `What countries border ${selectedName}?`,
      ]
    : [
        "How large is India compared to Greenland?",
        "Why does Mercator distort high latitudes?",
        "Distance from Bengaluru to Tokyo",
      ];

  // Collapsed Minimal Floating Pill
  if (!aiAssistantOpen) {
    return (
      <button
        onClick={() => setAiAssistantOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xl backdrop-blur-xl flex items-center gap-2 group"
      >
        <Sparkles className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
        <span>{selectedName ? `Ask about ${selectedName}...` : "Ask the Map..."}</span>
      </button>
    );
  }

  // Expanded Floating Drawer
  return (
    <div className="fixed bottom-3 right-3 sm:right-5 z-50 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[78vh] rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-200 animate-in slide-in-from-bottom-4 duration-150">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-xs text-white">
            {selectedName ? `Ask about ${selectedName}` : "Ask the Map"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-[10px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setAiAssistantOpen(false)}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {history.length === 0 && (
          <div className="py-2 space-y-2.5">
            <p className="text-slate-400 text-xs">
              Deterministic calculations & source-backed geographic answers.
            </p>
            <div className="space-y-1.5">
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(p)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white transition-colors text-xs flex items-center justify-between"
                >
                  <span className="truncate pr-2">{p}</span>
                  <span className="text-slate-500 text-[11px]">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-medium">
                {item.query}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-200 leading-relaxed font-sans">{item.message}</p>

              {item.calculations.length > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                  <div className="text-[9px] uppercase text-emerald-400 font-semibold tracking-wider">
                    Calculated Value
                  </div>
                  {item.calculations.map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-slate-400">{c.title}:</span>
                      <span className="text-white font-bold">{c.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {item.citations.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] text-slate-400">
                  <span className="text-slate-500">Source:</span>
                  {item.citations.map((cite, i) => (
                    <a
                      key={i}
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 underline flex items-center gap-0.5"
                    >
                      <span>{cite.publisher}</span>
                      <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
            <span>Calculating...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={selectedName ? `Ask about ${selectedName}...` : "Ask anything about Earth..."}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
