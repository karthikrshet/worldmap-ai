"use client";

import { useState } from "react";

/**
 * AI Query Bar — bottom-of-screen natural language input.
 *
 * Phase 1: The AI layer is not yet implemented. The bar clearly displays
 * its status. Core map functionality (projection switching, country selection,
 * area calculation, comparison) works fully without AI.
 *
 * Phase 3 will wire this to the structured AI tool layer where:
 * - AI interprets the question
 * - Deterministic tools calculate the answer
 * - AI explains the calculated result
 *
 * NEVER: AI does not calculate geographic values — only explains them.
 */
export default function AIQueryBar() {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 3: route to AI tool layer
    // For now, show a clear status — do not fabricate answers
    alert(
      "AI query layer coming in Phase 3.\n\n" +
      "Core map features (projection switching, country selection, area calculation, comparison) " +
      "are fully functional now — use the map directly.\n\n" +
      "When the AI layer is active, your question will be routed to the deterministic calculation engine " +
      "before any answer is shown. The AI will never invent geographic values."
    );
    setQuery("");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--ai-bar-height)",
        background: "rgba(11, 15, 26, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        zIndex: 30,
      }}
      role="region"
      aria-label="AI geographic query"
    >
      {/* AI indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
        title="AI query layer — coming in Phase 3. Core map works fully without AI."
      >
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--color-text-tertiary)",
          }}
          aria-label="AI offline — core map fully functional"
        />
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-text-tertiary)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          AI
        </span>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}
      >
        <input
          id="ai-query-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask WorldMap AI… (coming in Phase 3 — map tools work now)"
          aria-label="Ask a geographic question"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--color-text-secondary)",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
          }}
        />
        <button
          type="submit"
          id="ai-query-submit"
          aria-label="Submit question"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-tertiary)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>

      {/* Status note */}
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
          flexShrink: 0,
          display: "none",
        }}
        className="md:block"
      >
        Core map active
      </div>
    </div>
  );
}
