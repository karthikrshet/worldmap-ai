"use client";

import { useState, useRef, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";
import { queryAI, type AIQueryResponse, type MapAction } from "@/lib/aiEngine";
import { getCountryByIso } from "@/lib/geoData";

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

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  // Focus input when opened
  useEffect(() => {
    if (aiAssistantOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [aiAssistantOpen]);

  // Execute structured map actions returned by AI
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
        if (payload.iso3List) {
          setHighlightedCountries(payload.iso3List);
        }
        break;

      case "compare":
        if (payload.iso3List && payload.iso3List.length >= 2) {
          const c1 = getCountryByIso(payload.iso3List[0]);
          const c2 = getCountryByIso(payload.iso3List[1]);
          if (c1 && c2) {
            selectCountry({
              iso3: payload.iso3List[0],
              name: c1.properties.NAME,
              continent: c1.properties.CONTINENT,
            });
            selectCountry({
              iso3: payload.iso3List[1],
              name: c2.properties.NAME,
              continent: c2.properties.CONTINENT,
            });
            useMapStore.getState().setComparePanelOpen(true);
          }
        }
        break;

      case "switch_projection":
        if (payload.projectionId) {
          setProjection(payload.projectionId as any);
        }
        break;

      case "show_true_size":
        if (payload.iso3) {
          setTrueSizeIso3(payload.iso3);
          setActiveMode("true-size");
        }
        break;

      case "measure":
        if (payload.fromCoords && payload.toCoords) {
          // Trigger distance route
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

  // Submit query
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

      // Execute any map actions returned by AI
      for (const action of response.mapActions) {
        executeMapAction(action);
      }
    } catch (err) {
      console.error("AI query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic suggested prompts
  const suggestedPrompts = selectedName
    ? [
        `How large is ${selectedName}?`,
        `Compare ${selectedName} and Greenland`,
        `What countries border ${selectedName}?`,
        `Why does ${selectedName} look this size in Equal Earth?`,
      ]
    : [
        "How large is India?",
        "Compare Greenland and Africa",
        "Distance from Bengaluru to Tokyo",
        "Show countries larger than France",
        "Why does Greenland look so big in Mercator?",
      ];

  // Collapsed Button
  if (!aiAssistantOpen) {
    return (
      <button
        onClick={() => setAiAssistantOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center gap-2 group hover:border-slate-500"
      >
        <span className="text-blue-400 group-hover:scale-110 transition-transform">✦</span>
        <span>Ask the Map...</span>
        {selectedName && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/80">
            {selectedName}
          </span>
        )}
      </button>
    );
  }

  // Expanded Floating Drawer / Sheet
  return (
    <div className="fixed bottom-3 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[460px] max-h-[82vh] rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-200 animate-in slide-in-from-bottom-6 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">✦</span>
          <span className="font-bold text-xs tracking-wide text-white uppercase font-mono">
            Ask the Map
          </span>
          {selectedName && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              Context: {selectedName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded font-mono"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setAiAssistantOpen(false)}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {history.length === 0 && (
          <div className="py-4 text-center space-y-3">
            <p className="text-slate-400 text-xs">
              Direct natural-language questions to the map. Calculations come from geometric math; facts cite verified sources.
            </p>

            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Suggested Inquiries:
              </span>
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(p)}
                  className="text-left px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center justify-between group"
                >
                  <span>{p}</span>
                  <span className="text-slate-500 group-hover:text-blue-400">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Query History */}
        {history.map((item, idx) => (
          <div key={idx} className="space-y-2.5">
            {/* User Prompt */}
            <div className="flex justify-end">
              <div className="max-w-[85%] px-3.5 py-2 rounded-2xl bg-blue-600 text-white text-xs font-medium shadow-md">
                {item.query}
              </div>
            </div>

            {/* Structured Answer Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-lg space-y-3 font-mono text-xs">
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                {item.message}
              </p>

              {/* Calculations Block */}
              {item.calculations.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Deterministic Geometric Tool Output</span>
                  </div>
                  {item.calculations.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{c.title}</span>
                      <span className="text-white font-bold">{c.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Verified Facts Block */}
              {item.facts.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-1.5">
                    <span>🏛</span>
                    <span>Verified Knowledge Retrieval</span>
                  </div>
                  {item.facts.map((f, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{f.label}</span>
                        <span className="text-white">{f.value}</span>
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Source: {f.publisher} {f.referenceYear ? `(${f.referenceYear})` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {item.warnings.map((w, i) => (
                <div key={i} className="text-[10px] text-amber-300/80 font-sans">
                  ⚠ {w}
                </div>
              ))}

              {/* Citations Footer */}
              {item.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] text-slate-400">
                  <span className="text-slate-500">Sources:</span>
                  {item.citations.map((cite, i) => (
                    <a
                      key={i}
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {cite.publisher} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs p-3">
            <div className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
            <span>Consulting geographic calculation engine...</span>
          </div>
        )}
      </div>

      {/* Input Composer Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
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
            placeholder={
              selectedName
                ? `Ask anything about ${selectedName}...`
                : "Ask about any country, city, projection, or scale..."
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
