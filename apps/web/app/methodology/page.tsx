import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cartographic & Mathematical Methodology | WorldMap AI",
  description:
    "Mathematical principles behind the Equal Earth projection, WGS84 geodesic calculations, distortion analysis, and coastline paradox.",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#090d16] text-slate-200 pt-20 pb-24 px-4 sm:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <Link
            href="/"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to WorldMap AI
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 pt-2">
            <span>●</span>
            <span>Mathematical Cartography & Geodesy</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Methodology & Cartographic Principles
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            WorldMap AI is built on rigorous geometric algorithms and published cartographic standards. This document details our projection mathematics, surface area calculations, distance equations, and scientific limitations.
          </p>
        </div>

        {/* Section 1: Equal Earth Projection */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white font-mono">
              1. The Equal Earth Projection (Šavrič et al., 2018)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Pseudocylindrical Equal-Area
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The Equal Earth projection was created in 2018 to resolve the visual shortcomings of previous equal-area world maps (such as the Gall-Peters projection, which severely shears and squashes equatorial landmasses) and compromise projections (such as Robinson, which sacrifice area preservation).
          </p>

          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-500">// Projection equations (for longitude λ and latitude φ):</div>
            <div>x = (2√3 · λ · cos θ) / (3 · (9 · A₄ · θ⁸ + 7 · A₃ · θ⁶ + 3 · A₂ · θ² + A₁))</div>
            <div>y = A₄ · θ⁹ + A₃ · θ⁷ + A₂ · θ³ + A₁ · θ</div>
            <div className="text-slate-400">where sin θ = (√3 / 2) · sin φ, and A₁ = 1.340264, A₂ = -0.081106, A₃ = 0.000893, A₄ = 0.003796</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-emerald-400 font-mono">What It Strictly Preserves:</span>
              <p className="text-slate-400 leading-relaxed">
                Relative surface area is preserved at an exact 1:1 ratio everywhere. Any square centimeter on the map represents the exact same number of square kilometers on Earth, whether located in the Congo or Greenland.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-amber-400 font-mono">What It Distorts:</span>
              <p className="text-slate-400 leading-relaxed">
                As dictated by Gauss&apos;s Theorema Egregium, a sphere cannot be projected onto a flat plane without distortion. Equal Earth introduces moderate angular shear towards the extreme polar corners, but preserves harmonious continental silhouettes.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Mercator Comparison & Polar Distortion */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white font-mono border-b border-slate-800 pb-3">
            2. The Mercator Distortion Factor
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The traditional Mercator projection (1569) is conformal—preserving local angles and shapes. However, to maintain straight rhumb lines, meridians are projected as parallel vertical lines. As a mathematical consequence, its areal scale factor expands quadratically with latitude:
          </p>

          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-purple-300">
            s_A(φ) = sec²(φ) = 1 / cos²(φ)
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-2">
            <p>
              • At 0° (Equator): Area scale factor = 1.0x (True scale)<br />
              • At 60° (Oslo, Anchorage): Area scale factor = 4.0x (Inflated 400%)<br />
              • At 70° (Greenland, Northern Siberia): Area scale factor = 8.5x (Inflated 850%)<br />
              • At 80° (Svalbard, Ellesmere Island): Area scale factor = 33.2x (Inflated 3,320%)
            </p>
            <p>
              This is why Greenland (2.16M km²) appears as large as Africa (30.37M km²) on Mercator, even though Africa is actually <strong>14.4 times larger</strong>.
            </p>
          </div>
        </section>

        {/* Section 3: Geodesic Surface Area & Turf.js */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white font-mono border-b border-slate-800 pb-3">
            3. Surface Area Calculation & Coastline Paradox
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            All surface area measurements in WorldMap AI are computed via spherical/ellipsoidal polygon surface integration on the WGS84 reference ellipsoid using Turf.js.
          </p>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 space-y-1.5">
            <span className="font-bold font-mono uppercase text-[10px] text-amber-400">
              The Coastline Paradox & Resolution Disclaimer
            </span>
            <p>
              Under Lewis Fry Richardson&apos;s coastline paradox, measured perimeter and border lengths increase as resolution becomes finer. Our rendered geometry uses Natural Earth 1:110m generalized vectors. Therefore, computed areas are geometric polygon representations suitable for educational and relative comparison, but should not be cited as legal treaty measurements.
            </p>
          </div>
        </section>

        {/* Section 4: Geodesic Distance */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white font-mono border-b border-slate-800 pb-3">
            4. Great-Circle Geodesic Distance
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Distances between cities and clicked points are computed using spherical trigonometry (Haversine formulation) along the great-circle geodesic curve:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-sky-300">
            d = 2R · arcsin(√(sin²(Δφ/2) + cos(φ₁) · cos(φ₂) · sin²(Δλ/2)))
          </div>
          <p className="text-xs text-slate-400">
            Where R = 6,371 km (Earth&apos;s volumetric mean radius). Initial bearings are computed as azimuths from true north.
          </p>
        </section>
      </div>
    </main>
  );
}
