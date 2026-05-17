import type { WorkflowCitationReportRow } from "@/lib/litigation/getWorkflowCitationReports";
import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

function overallBadgeClass(status: string): string {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "pass" || s === "verified") return "badge-pass";
  if (
    s === "warn" ||
    s === "parsed unverified" ||
    s === "close match" ||
    s === "partially supported"
  )
    return "badge-warn";
  if (
    s === "fail" ||
    s === "not found" ||
    s === "error" ||
    s === "quote mismatch" ||
    s === "pin mismatch" ||
    s === "unsupported proposition"
  )
    return "badge-fail";
  return "badge-neutral";
}

function subStatusClass(status: string | null): string {
  if (!status || status === "not_checked") return "badge-neutral";
  const s = status.toLowerCase();
  if (s === "found" || s === "exact_match" || s === "confirmed" || s === "supported" || s === "positive")
    return "badge-pass";
  if (s === "close_match" || s === "partially_supported" || s === "neutral") return "badge-warn";
  if (s === "not_found" || s === "mismatch" || s === "unsupported" || s === "negative" || s === "error")
    return "badge-fail";
  return "badge-neutral";
}

function SubStatus({ label, value }: { label: string; value: string | null }) {
  if (!value || value === "not_checked") return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="label" style={{ fontSize: "9px" }}>
        {label}
      </span>
      <span className={`badge ${subStatusClass(value)}`} style={{ fontSize: "9px", padding: "1px 4px" }}>
        {value.replace(/_/g, " ")}
      </span>
    </div>
  );
}

function CitationCard({ report }: { report: WorkflowCitationReportRow }) {
  const badgeClass = overallBadgeClass(report.overall_status);

  return (
    <div
      style={{
        padding: "0.75rem",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            color: "#60a5fa",
            flexShrink: 0,
            lineHeight: 1.4,
          }}
        >
          {report.normalized_citation ?? report.citation_text}
        </span>
        <span className={`badge ${badgeClass}`} style={{ flexShrink: 0 }}>
          {report.overall_status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-1">
        <SubStatus label="Exists" value={report.existence_status} />
        <SubStatus label="Quote" value={report.quote_status} />
        <SubStatus label="Pin" value={report.pin_cite_status} />
        <SubStatus label="Prop" value={report.proposition_status} />
        <SubStatus label="Treat" value={report.treatment_status} />
      </div>
    </div>
  );
}

function DraftCitationCard({ citation }: { citation: string }) {
  return (
    <div
      style={{
        padding: "0.625rem 0.75rem",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#60a5fa",
        }}
      >
        {citation}
      </span>
      <span className="badge badge-neutral" style={{ flexShrink: 0 }}>
        not verified
      </span>
    </div>
  );
}

export default function VerificationInspector({
  reports,
  artifact,
}: {
  reports: WorkflowCitationReportRow[];
  artifact: WorkflowArtifactRow | null;
}) {
  const draftCitations: string[] = Array.isArray(artifact?.citations)
    ? (artifact!.citations as Record<string, unknown>[])
        .map((c) => (typeof c.citation === "string" ? c.citation : ""))
        .filter(Boolean)
    : [];

  const hasReports = reports.length > 0;
  const hasDraftCitations = draftCitations.length > 0;
  const isEmpty = !hasReports && !hasDraftCitations;

  return (
    <div>
      {/* Summary strip */}
      {hasReports && (
        <div
          className="mb-3 flex flex-wrap gap-3 px-3 py-2"
          style={{ background: "var(--s1)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)" }}>
            {reports.length} citation{reports.length !== 1 ? "s" : ""} checked
          </span>
          {(() => {
            const pass = reports.filter((r) => r.overall_status === "pass" || r.overall_status === "verified").length;
            const fail = reports.filter((r) => ["not_found", "error", "quote_mismatch", "pin_mismatch", "unsupported_proposition"].includes(r.overall_status)).length;
            const warn = reports.length - pass - fail;
            return (
              <>
                {pass > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#34d399" }}>{pass} pass</span>}
                {warn > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#fbbf24" }}>{warn} warn</span>}
                {fail > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#f87171" }}>{fail} fail</span>}
              </>
            );
          })()}
        </div>
      )}

      {/* Verified reports */}
      {hasReports && (
        <div>
          {reports.map((r) => (
            <CitationCard key={r.id} report={r} />
          ))}
        </div>
      )}

      {/* Unverified draft citations */}
      {!hasReports && hasDraftCitations && (
        <div>
          <p
            className="px-3 py-2"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
          >
            Citations found in draft — not verified against indexed opinions.
          </p>
          {draftCitations.map((c, i) => (
            <DraftCitationCard key={i} citation={c} />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="py-8 text-center">
          <p
            style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}
          >
            No citations detected in this draft.
          </p>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
          >
            Citation verification runs when the draft contains recognizable legal citations.
          </p>
        </div>
      )}
    </div>
  );
}
