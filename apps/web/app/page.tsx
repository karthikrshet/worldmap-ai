"use client";

import Navigation from "@/components/Navigation";
import WorldMap from "@/components/WorldMap";
import CountryPanel from "@/components/CountryPanel";
import CityPanel from "@/components/CityPanel";
import ComparePanel from "@/components/ComparePanel";
import AskTheMap from "@/components/AskTheMap";
import TrueSizeBar from "@/components/TrueSizeBar";
import MeasureBanner from "@/components/MeasureBanner";
import CorrectTheMapModal from "@/components/CorrectTheMapModal";
import MapTruthModal from "@/components/MapTruthModal";
import SourceGraphModal from "@/components/SourceGraphModal";

/**
 * WorldMap AI — Home Page
 *
 * Core rule: The map IS the product. No marketing splash, no generic dashboard.
 * The world immediately opens in the Equal Earth projection (September 2026 UN resolution view).
 */
export default function HomePage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#090d16] flex flex-col select-none">
      {/* Top minimal navigation bar */}
      <Navigation />

      {/* Main Map Viewport — occupies ~90% of screen */}
      <div className="flex-1 relative w-full h-full pt-14">
        <WorldMap />
      </div>

      {/* Interactive Paneling & Comparison Tools */}
      <CountryPanel />
      <CityPanel />
      <ComparePanel />
      <TrueSizeBar />
      <MeasureBanner />

      {/* "Ask the Map" AI Assistant */}
      <AskTheMap />

      {/* Modals */}
      <CorrectTheMapModal />
      <MapTruthModal />
      <SourceGraphModal />
    </main>
  );
}
