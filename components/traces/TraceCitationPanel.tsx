import type { TraceCitationLink } from "@/lib/traces/types";

function statusBadge(status: string | null) {
  if (!status) return null;
  const cls =
    status === "found" || status === "pass" ? "badge-pass" :
    status === "not_found" || status === "fail" ? "badge-fail" :
    status === "partial" ? "badge-warn" :
    "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status.replace(/_/g, " ")}</span>;
}

interface Props {
  citationReports: TraceCitationLink[];
}

export default function TraceCitationPanel({ citationReports }: Props) {
  if (citationReports.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No citation reports for this workflow run.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {citationReports.map((r) => (
        <div
          key={r.id}
          style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "0.875rem" }}
        >
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#60a5fa" }}>
              {r.id.slice(0, 8)}
            </span>
            {statusBadge(r.overallStatus)}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", marginLeft: "auto" }}>
              existence: {r.existenceStatus ?? "—"} &nbsp; proposition: {r.propositionStatus ?? "—"}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", color: "var(--text-1)", lineHeight: 1.5 }}>
            {r.citationText}
          </p>
          {r.normalizedCitation && r.normalizedCitation !== r.citationText && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginTop: "0.25rem" }}>
              Normalized: {r.normalizedCitation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
