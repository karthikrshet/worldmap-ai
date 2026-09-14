"use client";

import type { CountryDetail } from "@/lib/api";

interface SourcePanelProps {
  entity: CountryDetail;
  onClose: () => void;
}

/**
 * Source panel — shows full data provenance for a geographic entity.
 * Every fact displayed in WorldMap AI must be traceable back to a source.
 */
export default function SourcePanel({ entity, onClose }: SourcePanelProps) {
  const src = entity.source;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 300,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sources and methodology for ${entity.name}`}
        id="source-panel"
        className="animate-slide-in-up"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, 90vw)",
          maxHeight: "80vh",
          overflowY: "auto",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          boxShadow: "var(--shadow-lg)",
          zIndex: 301,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 18px 14px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text)" }}>
              Sources & Methodology
            </h2>
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>
              {entity.name}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close source panel"
            style={{ background: "transparent", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", padding: "4px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px" }}>

          {/* Geometry source */}
          <Section title="Geometry Source">
            <Row label="Dataset" value={src?.dataset_name ?? "—"} />
            <Row label="Provider" value={src?.dataset_provider ?? "—"} />
            <Row label="Version" value={src?.dataset_version ?? "—"} />
            <Row label="Scale" value={src?.dataset_scale ?? "—"} />
            <Row label="License" value={src?.dataset_license ?? "—"} highlight="success" />
            {src?.dataset_url && (
              <Row
                label="Source URL"
                value={
                  <a
                    href={src.dataset_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-primary)", fontSize: "12px", wordBreak: "break-all" }}
                  >
                    {src.dataset_url}
                  </a>
                }
              />
            )}
            {src?.retrieved_at && (
              <Row
                label="Retrieved"
                value={new Date(src.retrieved_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            )}
          </Section>

          {/* Area calculation methodology */}
          {entity.area && (
            <Section title="Area Calculation">
              <Row label="Type" value={entity.area.label ?? "Geometry-derived area"} />
              <Row label="Method" value={entity.area.method ?? "geodesic-area"} />
              <Row label="Ellipsoid" value={entity.area.ellipsoid ?? "WGS84"} />
              <Row label="Algorithm" value="Karney (2013) via pyproj" />
              <Row label="CRS" value="EPSG:4326" />
              <div style={{
                marginTop: "10px",
                padding: "10px 12px",
                background: "rgba(59,130,246,0.07)",
                borderRadius: "8px",
                border: "1px solid rgba(59,130,246,0.15)",
              }}>
                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  ℹ️ {entity.area.note}
                </div>
              </div>
            </Section>
          )}

          {/* Coordinate reference system */}
          <Section title="Coordinate Reference System">
            <Row label="CRS" value="EPSG:4326 (WGS84)" />
            <Row label="Datum" value="World Geodetic System 1984" />
            <Row label="Geometry type" value={entity.entity_type ?? "country"} />
          </Section>

          {/* Boundary policy */}
          <Section title="Boundary Policy">
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              WorldMap AI visualizes geographic datasets and does not independently
              determine sovereignty or adjudicate territorial disputes. Boundaries shown
              reflect the {src?.dataset_name} dataset ({src?.dataset_version}).
              {entity.boundary_notes && (
                <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "rgba(245,158,11,0.9)" }}>
                  Dataset note: {entity.boundary_notes}
                </div>
              )}
            </div>
          </Section>

          {/* Reference links */}
          <Section title="References">
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              <div>
                <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  Natural Earth
                </a>{" "}— Public domain world map dataset
              </div>
              <div>
                <a href="https://karney.com/jgeod/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  Karney (2013)
                </a>{" "}— Algorithms for geodesics, Journal of Geodesy
              </div>
              <div>
                <a href="https://pyproj4.github.io/pyproj/stable/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  pyproj
                </a>{" "}— Python interface to PROJ coordinate transformation library
              </div>
              <div>
                <a href="https://docs/CALCULATIONS.md" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  CALCULATIONS.md
                </a>{" "}— Full methodology documentation
              </div>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--color-text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: "var(--color-bg)",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: "success" | "warning";
}) {
  const valueColor =
    highlight === "success"
      ? "var(--color-success)"
      : highlight === "warning"
      ? "var(--color-warning)"
      : "var(--color-text-secondary)";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "8px 12px",
        borderBottom: "1px solid var(--color-border-subtle)",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: valueColor, textAlign: "right", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
