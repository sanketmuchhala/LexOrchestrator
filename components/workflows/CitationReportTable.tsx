import type { WorkflowCitationReportRow } from "@/lib/litigation/getWorkflowCitationReports";

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#404040",
          letterSpacing: "0.2em",
        }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#737373",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function statusBadge(status: string | null, fallback = "unknown"): string {
  const s = (status ?? fallback).toLowerCase();
  if (
    s === "verified" ||
    s === "pass" ||
    s === "supported" ||
    s === "confirmed" ||
    s === "exact_match" ||
    s === "positive" ||
    s === "found"
  )
    return "badge-pass";
  if (
    s === "close_match" ||
    s === "partially_supported" ||
    s === "neutral" ||
    s === "warn"
  )
    return "badge-warn";
  if (
    s === "not_found" ||
    s === "fail" ||
    s === "mismatch" ||
    s === "unsupported" ||
    s === "negative" ||
    s === "error"
  )
    return "badge-fail";
  return "badge-neutral";
}

function MiniStatus({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value || value === "not_checked") return null;
  return (
    <div className="flex items-center gap-2">
      <span className="label">{label}</span>
      <span className={`badge ${statusBadge(value)}`}>{value.replace(/_/g, " ")}</span>
    </div>
  );
}

export default function CitationReportTable({
  reports,
}: {
  reports: WorkflowCitationReportRow[];
}) {
  return (
    <section>
      <SectionTitle n="04">Citation Verification</SectionTitle>

      {reports.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
          No citation verification reports recorded.
        </p>
      ) : (
        <div>
          {reports.map((report, idx) => {
            const isLast = idx === reports.length - 1;
            return (
              <div
                key={report.id}
                style={{
                  padding: "1rem 0",
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "1.5rem",
                  alignItems: "start",
                }}
              >
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#60a5fa",
                      }}
                    >
                      {report.normalized_citation ?? report.citation_text}
                    </span>
                    <span className={`badge ${statusBadge(report.overall_status)}`}>
                      {report.overall_status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <MiniStatus label="Exists" value={report.existence_status} />
                    <MiniStatus label="Quote" value={report.quote_status} />
                    <MiniStatus label="Pin cite" value={report.pin_cite_status} />
                    <MiniStatus label="Proposition" value={report.proposition_status} />
                    <MiniStatus label="Treatment" value={report.treatment_status} />
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "#404040",
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
