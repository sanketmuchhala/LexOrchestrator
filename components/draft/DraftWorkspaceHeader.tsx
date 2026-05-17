import type { WorkflowRunRow } from "@/lib/litigation/getWorkflowRun";
import { formatPercent, getStatusBadgeClass } from "@/lib/utils/status";

function scoreColor(v: number): string {
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function Metric({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
      <span className="label">{label}</span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          fontWeight: 700,
          color: scoreColor(value),
        }}
      >
        {formatPercent(value)}
      </span>
    </span>
  );
}

export default function DraftWorkspaceHeader({
  workflow,
  judgeName,
}: {
  workflow: WorkflowRunRow;
  judgeName?: string;
}) {
  const passFail =
    workflow.confidence != null
      ? workflow.confidence >= 0.5
        ? "pass"
        : "fail"
      : null;

  return (
    <div
      style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: "1rem", marginBottom: "1.5rem" }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">

        <span className={`badge ${getStatusBadgeClass(workflow.status)}`}>
          {(workflow.status || "unknown").toUpperCase()}
        </span>

        {passFail && (
          <span className={`badge ${passFail === "pass" ? "badge-pass" : "badge-fail"}`}>
            {passFail.toUpperCase()}
          </span>
        )}

        {workflow.motion_type && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span className="label">Motion</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
              {workflow.motion_type.replace(/_/g, " ")}
            </span>
          </span>
        )}

        {workflow.jurisdiction && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span className="label">Jurisdiction</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
              {workflow.jurisdiction}
              {workflow.court ? ` / ${workflow.court}` : ""}
            </span>
          </span>
        )}

        {judgeName && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span className="label">Judge</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
              {judgeName}
            </span>
          </span>
        )}

        <Metric label="Confidence" value={workflow.confidence} />
        <Metric label="Faithfulness" value={workflow.faithfulness_score} />
        <Metric label="Citations" value={workflow.citation_pass_rate} />

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-3)",
            marginLeft: "auto",
          }}
        >
          {workflow.id.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
