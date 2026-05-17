import type { MatterRow } from "@/lib/matters/types";

function statusBadge(status: string) {
  const cls =
    status === "active" ? "badge-pass" :
    status === "closed" ? "badge-neutral" :
    status === "on_hold" ? "badge-warn" :
    "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status.replace(/_/g, " ")}</span>;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase", minWidth: "110px", paddingTop: "0.1rem" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "14px", color: "#f4f4f4", lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  );
}

interface Props {
  matter: MatterRow;
}

export default function MatterSummaryPanel({ matter }: Props) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(1rem, 2vw, 1.25rem)", fontWeight: 500, color: "#f4f4f4" }}>
          {matter.title}
        </h2>
        {statusBadge(matter.status)}
      </div>

      <Row label="Client" value={matter.client_name} />
      <Row label="Type" value={matter.matter_type?.replace(/_/g, " ")} />
      <Row label="Jurisdiction" value={matter.jurisdiction} />
      <Row label="Court" value={matter.court} />
      {matter.description && (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
            Description
          </p>
          <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "14px", color: "#737373", lineHeight: 1.7 }}>
            {matter.description}
          </p>
        </div>
      )}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", marginTop: "0.75rem" }}>
        {matter.id}
      </p>
    </div>
  );
}
