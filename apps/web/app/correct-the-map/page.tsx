import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Correct the Map — UN Resolution A/80/L.104 | WorldMap AI",
  description:
    "Accurate explanation of the UN General Assembly's September 2026 resolution encouraging equal-area map projections. What it says, and what it does not say.",
};

/**
 * UN Resolution A/80/L.104 educational page.
 *
 * All facts on this page are verified from official sources.
 * No fabricated statistics. No exaggerations.
 *
 * Sources:
 * - United Nations: https://www.un.org/osaa/en/news/victory-africa-un-votes-resolution-correct-map
 * - India's statement: https://pminewyork.gov.in/IndiaatUNGA?id=NTYzMA
 */
export default function CorrectTheMapPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", paddingTop: "var(--nav-height)" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "var(--color-text-tertiary)", textDecoration: "none" }}>
            ← WorldMap AI
          </Link>
        </nav>

        {/* Hero */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", fontWeight: 600 }}>
            Educational · UN General Assembly
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em", margin: "0 0 14px", lineHeight: 1.15 }}>
            Correct the Map
          </h1>
          <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            In September 2026, the United Nations General Assembly adopted a resolution
            encouraging the use of equal-area map projections in appropriate contexts.
            Here is what it says — and what it does not say.
          </p>
        </div>

        {/* Resolution facts */}
        <Section title="The Resolution">
          <FactGrid items={[
            { label: "Resolution", value: "A/80/L.104" },
            { label: "Body", value: "UN General Assembly" },
            { label: "Date", value: "September 4, 2026" },
            { label: "Vote in favour", value: "164" },
            { label: "Against", value: "1" },
            { label: "Abstentions", value: "6" },
          ]} />

          <div style={{ marginTop: "16px", fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
            <p>
              The resolution promotes the use of equal-area projections — including Equal Earth —
              in contexts where accurate representation of relative area matters, such as educational
              and thematic world maps.
            </p>
          </div>

          <SourceRef href="https://www.un.org/osaa/en/news/victory-africa-un-votes-resolution-correct-map">
            United Nations Office of the Special Adviser on Africa — official news release
          </SourceRef>
        </Section>

        {/* What it does and does not say */}
        <Section title="What the Resolution Says">
          <CheckList
            checks={[
              "Encourages the use of equal-area projections when accurate representation of relative size matters",
              "Recognises that maps can influence perceptions of the relative size of continents and countries",
              "Promotes educational awareness of map projection properties",
              "Acknowledges Equal Earth and other equal-area projections as appropriate tools for thematic world maps",
            ]}
            type="yes"
          />
        </Section>

        <Section title="What the Resolution Does NOT Say">
          <CheckList
            checks={[
              "It does not ban or prohibit the Mercator projection",
              "It does not create one universally mandatory world map projection",
              "It does not mandate Equal Earth specifically — it promotes equal-area projections generally",
              "It does not declare any single map to be the 'correct' world map",
              "It does not replace existing navigation, technical, or web mapping standards",
            ]}
            type="no"
          />
          <div style={{ marginTop: "16px", padding: "14px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", fontSize: "13px", color: "rgba(245,158,11,0.9)", lineHeight: 1.7 }}>
            <strong>India's statement:</strong> India explicitly stated during the session that the resolution
            should not be interpreted as endorsing one specific projection over others.
            <SourceRef href="https://pminewyork.gov.in/IndiaatUNGA?id=NTYzMA" style={{ marginTop: "8px", display: "block" }}>
              Permanent Mission of India to the UN, New York
            </SourceRef>
          </div>
        </Section>

        {/* Why projections matter */}
        <Section title="Why Map Projections Matter">
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 16px" }}>
            The Earth is a three-dimensional ellipsoid. Representing it on a flat surface
            always introduces distortion. No flat map can simultaneously preserve area, shape,
            distance, and direction — this is a mathematical impossibility (the Gauss–Egregium theorem).
          </p>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 16px" }}>
            Different projections preserve different properties:
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {[
              { name: "Mercator", property: "Preserves local angles (conformal)", use: "Navigation, web mapping", distortion: "Severe area distortion at high latitudes" },
              { name: "Equal Earth", property: "Preserves area (equal-area)", use: "Thematic world maps, area comparison", distortion: "Shape distortion at high latitudes" },
              { name: "Robinson", property: "Compromise (neither conformal nor equal-area)", use: "General reference maps", distortion: "Moderate distortion in all properties" },
            ].map((proj) => (
              <div key={proj.name} style={{ background: "var(--color-bg-elevated)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>{proj.name}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>✓ {proj.property}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Use: {proj.use}</div>
                <div style={{ fontSize: "12px", color: "var(--color-warning)" }}>⚠ {proj.distortion}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Greenland vs Africa */}
        <Section title="Greenland vs Africa — A Concrete Example">
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 16px" }}>
            On the Mercator projection, Greenland appears almost as large as Africa. This is the most
            commonly cited example of how projection choice affects perception. To understand the
            actual size difference, use the WorldMap AI area comparison tool:
          </p>
          <Link
            href="/?compare=GRL,AFR"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "8px",
              background: "var(--color-primary)",
              color: "white",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Compare Greenland and Africa on the map →
          </Link>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "12px", lineHeight: 1.6 }}>
            The comparison uses geodesic area calculations from authoritative geometry.
            No value is hardcoded. The ratio you see is computed from actual polygon data.
          </p>
        </Section>

        {/* All projections have tradeoffs */}
        <div style={{
          marginTop: "32px",
          padding: "20px",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          fontSize: "14px",
          color: "var(--color-text-secondary)",
          lineHeight: 1.8,
          textAlign: "center",
        }}>
          <div style={{ fontSize: "22px", marginBottom: "10px" }}>🗺️</div>
          <strong style={{ color: "var(--color-text)" }}>Every flat map involves tradeoffs.</strong>
          <br />
          The right projection depends on the purpose. Equal-area projections are more appropriate
          when comparing relative size. Conformal projections are more appropriate for navigation.
          No single projection is universally correct.
        </div>
      </div>
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em", margin: "0 0 16px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function FactGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
      {items.map((item) => (
        <div key={item.label} style={{ background: "var(--color-bg-elevated)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{item.label}</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function CheckList({ checks, type }: { checks: string[]; type: "yes" | "no" }) {
  const icon = type === "yes" ? "✓" : "✗";
  const color = type === "yes" ? "var(--color-success)" : "var(--color-error)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {checks.map((check) => (
        <div key={check} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ color, fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>{icon}</span>
          <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{check}</span>
        </div>
      ))}
    </div>
  );
}

function SourceRef({ href, children, style }: { href: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--color-text-tertiary)", ...style }}>
      Source:{" "}
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
        {children}
      </a>
    </div>
  );
}
