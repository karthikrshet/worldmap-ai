"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProjectionControls from "./ProjectionControls";
import ToolsMenu from "./ToolsMenu";
import CountrySearch from "./CountrySearch";
import { useMapStore } from "@/stores/mapStore";
import { Search, Globe, Menu, X } from "lucide-react";

export default function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setCorrectTheMapModalOpen, setComparePanelOpen } = useMapStore();

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
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand + Essential Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          >
            <Globe className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm tracking-tight text-white font-mono">
              WorldMap<span className="text-sky-400 font-semibold ml-0.5">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs text-slate-400 font-medium">
            <Link href="/" className="text-white hover:text-sky-400 transition-colors">
              Explore
            </Link>
            <button
              onClick={() => setComparePanelOpen(true)}
              className="hover:text-white transition-colors"
            >
              Compare
            </button>
            <button
              onClick={() => setCorrectTheMapModalOpen(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Learn</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800/60">
                UN 2026
              </span>
            </button>
          </nav>
        </div>

        {/* Right: Search, Projection, Consolidated Tools, GitHub */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
              /
            </kbd>
          </button>

          {/* Projection Dropdown */}
          <div className="hidden sm:block">
            <ProjectionControls />
          </div>

          {/* Consolidated Tools Menu */}
          <ToolsMenu />

          {/* GitHub Link */}
          <a
            href="https://github.com/karthikrshet/worldmap-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="GitHub Repository"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-slate-950/95 border-b border-slate-800 p-4 space-y-3 backdrop-blur-2xl animate-in slide-in-from-top-2 text-sm">
          <div className="pb-2 border-b border-slate-800">
            <ProjectionControls />
          </div>
          <div className="flex flex-col gap-2 text-slate-300">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Explore Map
            </Link>
            <button
              onClick={() => {
                setComparePanelOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-left py-1.5 hover:text-white"
            >
              Compare Areas
            </button>
            <button
              onClick={() => {
                setCorrectTheMapModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-left py-1.5 hover:text-white flex items-center justify-between"
            >
              <span>UN GA Res A/80/L.104</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                Sep 2026
              </span>
            </button>
            <Link
              href="/methodology"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Methodology
            </Link>
            <Link
              href="/sources"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Data Sources
            </Link>
            <Link
              href="/how-ai-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              How AI Works
            </Link>
          </div>
        </div>
      )}

      {/* Global Search Dialog */}
      {searchOpen && <CountrySearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
