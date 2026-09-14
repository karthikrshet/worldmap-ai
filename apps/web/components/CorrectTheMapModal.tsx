"use client";

import { useMapStore } from "@/stores/mapStore";

export default function CorrectTheMapModal() {
  const { correctTheMapModalOpen, setCorrectTheMapModalOpen } = useMapStore();

  if (!correctTheMapModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200">
        {/* Close Button */}
        <button
          onClick={() => setCorrectTheMapModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>United Nations General Assembly Resolution A/80/L.104</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          &quot;Correct the Map&quot; — September 4, 2026
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Historical Context, True Scope, and Cartographic Neutrality
        </p>

        <div className="mt-5 space-y-4 text-sm text-slate-300 leading-relaxed">
          {/* Key Facts Box */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <h4 className="font-semibold text-emerald-300 text-xs font-mono uppercase tracking-wide">
              Verified Resolution Facts
            </h4>
            <ul className="text-xs space-y-1.5 text-emerald-100/90 list-disc list-inside">
              <li>
                <strong>Adoption Date:</strong> September 4, 2026 at the 80th session of the UN General Assembly.
              </li>
              <li>
                <strong>Vote Count:</strong> Adopted by 164 in favor, 1 against, with 6 abstentions.
              </li>
              <li>
                <strong>Resolution Theme:</strong> Encouraging the use of equal-area projections (specifically highlighting Equal Earth and similar projections) in educational and general reference materials where relative geographic size matters.
              </li>
            </ul>
          </div>

          {/* Explicit "What It Does Not Do" Mandate */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <h4 className="font-semibold text-amber-300 text-xs font-mono uppercase tracking-wide">
              Critical Fact: What the Resolution Does NOT Do
            </h4>
            <p className="text-xs text-amber-100/90">
              WorldMap AI maintains strict adherence to verified international records:
            </p>
            <ul className="text-xs space-y-1.5 text-amber-100/80 list-disc list-inside">
              <li>
                The UN <strong>did not</strong> publish one single brand-new official replacement world map file.
              </li>
              <li>
                The UN <strong>did not</strong> ban the Mercator projection (which remains mathematically valid for local marine navigation and rhumb-line bearings).
              </li>
              <li>
                The resolution <strong>does not</strong> mandate one single compulsory projection for all purposes. As noted in the UN Geospatial FAQ and stated formally by the Permanent Mission of India to the UN, the UN Secretariat historically prescribes no single projection for all cartography.
              </li>
            </ul>
          </div>

          {/* Equal Earth Projection Origin */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-base">
              The Equal Earth Projection (Created 2018)
            </h4>
            <p className="text-xs text-slate-300">
              The Equal Earth projection itself was not created in 2026. It was developed in 2018 by cartographers Bojan Šavrič, Tom Patterson, and Bernhard Jenny as a visually appealing, mathematically rigorous pseudocylindrical equal-area projection. The September 2026 event represents the international diplomatic recognition of equal-area cartography as vital for fair visual perception of developing regions, particularly Africa, South America, and South Asia.
            </p>
          </div>

          {/* External Citation Links */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4 text-xs font-mono">
            <a
              href="https://www.un.org/osaa/en/news/victory-africa-un-votes-resolution-correct-map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
            >
              UN OSAA Press Release ↗
            </a>
            <a
              href="https://pminewyork.gov.in/IndiaatUNGA?id=NTYzMA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
            >
              Permanent Mission of India Statement ↗
            </a>
            <a
              href="/methodology"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1"
            >
              WorldMap AI Methodology ↗
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setCorrectTheMapModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Explore Equal Earth Map
          </button>
        </div>
      </div>
    </div>
  );
}
