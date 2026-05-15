import type { WorkflowRunRow } from "@/lib/litigation/getWorkflowRun";
import { formatDateTime, formatPercent, getStatusBadgeClass } from "@/lib/utils/status";

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

function scoreColor(v: number): string {
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const color = value != null ? scoreColor(value) : "#404040";

  return (
    <div
      className="flex-1 px-5 py-5"
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="label mb-3">{label}</p>
      {value != null ? (
        <div className="flex items-baseline gap-1">
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "26px",
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {formatPercent(value).replace("%", "")}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}>
            %
          </span>
        </div>
      ) : (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", color: "#404040" }}>
          —
        </span>
      )}
    </div>
  );
}

export default function WorkflowSummaryPanel({ workflow }: { workflow: WorkflowRunRow }) {
  return (
    <section>
      <SectionTitle n="01">Workflow Summary</SectionTitle>

      {/* Score grid */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <MetricCell label="Confidence" value={workflow.confidence} />
          <MetricCell label="Faithfulness" value={workflow.faithfulness_score} />
          <MetricCell label="Citation Pass Rate" value={workflow.citation_pass_rate} />
          <div className="flex-1 px-5 py-5">
            <p className="label mb-3">Verdict</p>
            {workflow.confidence != null ? (
              <span
                className={`badge ${workflow.confidence >= 0.5 ? "badge-pass" : "badge-fail"}`}
              >
                {workflow.confidence >= 0.5 ? "PASS" : "FAIL"}
              </span>
            ) : (
              <span className="badge badge-neutral">PENDING</span>
            )}
          </div>
        </div>

        {/* Metadata bar */}
        <div
          className="flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3"
          style={{ background: "#0a0a0a" }}
        >
          <span className="label">Run</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}>
            {workflow.id.slice(0, 16)}…
          </span>

          <span className="label">Status</span>
          <span className={`badge ${getStatusBadgeClass(workflow.status)}`}>
            {(workflow.status || "unknown").toUpperCase()}
          </span>

          <span className="label">Type</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#737373" }}>
            {workflow.workflow_type}
          </span>

          {workflow.motion_type && (
            <>
              <span className="label">Motion</span>
              <span
                style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#737373" }}
              >
                {workflow.motion_type.replace(/_/g, " ")}
              </span>
            </>
          )}

          {workflow.jurisdiction && (
            <>
              <span className="label">Jurisdiction</span>
              <span
                style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#737373" }}
              >
                {workflow.jurisdiction}
                {workflow.court ? ` / ${workflow.court}` : ""}
              </span>
            </>
          )}

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#404040",
              marginLeft: "auto",
            }}
          >
            {formatDateTime(workflow.created_at)}
          </span>
        </div>
      </div>

      {/* Input summary */}
      {workflow.input_summary && (
        <div
          className="mt-4 px-5 py-4"
          style={{ border: "1px solid rgba(255,255,255,0.06)", borderTop: "none" }}
        >
          <p className="label mb-2">Query</p>
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#d4d4d4",
            }}
          >
            {workflow.input_summary}
          </p>
        </div>
      )}
    </section>
  );
}
