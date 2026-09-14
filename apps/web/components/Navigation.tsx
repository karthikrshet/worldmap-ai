"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProjectionControls from "./ProjectionControls";
import CountrySearch from "./CountrySearch";
import { useMapStore } from "@/stores/mapStore";

export default function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { setMapTruthModalOpen } = useMapStore();

  // Keyboard shortcut '/' to trigger search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Clean Identity */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          >
            {/* Stylized Equal-Area Globe Logo */}
            <svg
              className="w-5 h-5 text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <ellipse cx="12" cy="12" rx="10" ry="9" />
              <path d="M2 12h20" />
              <path d="M12 3c3.5 0 6.5 4 6.5 9s-3 9-6.5 9-6.5-4-6.5-9 3-9 6.5-9z" />
            </svg>
            <span className="font-bold text-sm tracking-tight text-white font-mono">
              WorldMap<span className="text-blue-400 font-semibold ml-1">AI</span>
            </span>
          </Link>

          {/* Minimal Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
            <Link
              href="/correct-the-map"
              className="hover:text-emerald-300 transition-colors"
            >
              UN GA Res A/80/L.104
            </Link>
            <Link
              href="/methodology"
              className="hover:text-slate-200 transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/sources"
              className="hover:text-slate-200 transition-colors"
            >
              Sources
            </Link>
            <Link
              href="/how-ai-works"
              className="hover:text-slate-200 transition-colors"
            >
              How AI Works
            </Link>
          </nav>
        </div>

        {/* Right: Projection Controls, Search, GitHub */}
        <div className="flex items-center gap-3">
          {/* Projection Dropdown */}
          <ProjectionControls />

          {/* Search Trigger with '/' badge */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 hover:border-slate-500 transition-colors shadow-sm"
          >
            <span className="text-slate-400">🔍</span>
            <span className="hidden sm:inline">Search world...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
              /
            </kbd>
          </button>

          {/* Map Truth Trigger */}
          <button
            onClick={() => setMapTruthModalOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Inspect projection transparency and dataset parameters"
          >
            <span>●</span>
            <span>Map Truth</span>
          </button>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/karthikrshet/worldmap-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="View source on GitHub"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Global Search Dialog */}
      {searchOpen && <CountrySearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
