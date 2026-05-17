import type { TraceDebugSummary, TraceReplaySnapshot } from "@/lib/traces/types";
import type { WorkflowRunRow } from "@/lib/db/supabaseServer";

function statCell(label: string, value: string | number) {
  return (
    <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: "1.25rem", marginRight: "1.25rem" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "#f4f4f4", fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  let cls = "badge-neutral";
  if (status === "completed") cls = "badge-pass";
  else if (status === "failed") cls = "badge-fail";
  else if (status === "running") cls = "badge-warn";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status}</span>;
}

interface Props {
  workflow: WorkflowRunRow | null;
  summary: TraceDebugSummary;
  snapshot: TraceReplaySnapshot;
}

export default function TraceSummaryPanel({ workflow, summary, snapshot }: Props) {
  const costStr = summary.totalCostUsd > 0
    ? `$${summary.totalCostUsd.toFixed(4)}`
    : "N/A";
  const latencyStr = summary.totalLatencyMs > 0
    ? `${(summary.totalLatencyMs / 1000).toFixed(1)}s`
    : "N/A";
  const tokensStr = summary.totalTokenCount > 0
    ? summary.totalTokenCount.toLocaleString()
    : "N/A";

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373" }}>Status</span>
        {statusBadge(snapshot.status)}
        {workflow?.motion_type && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040" }}>
            {workflow.motion_type.replace(/_/g, " ")}
          </span>
        )}
        {workflow?.jurisdiction && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040" }}>
            {workflow.jurisdiction}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "1.25rem", marginLeft: "0" }}>
        {statCell("Events", summary.totalEvents)}
        {statCell("Agents Seen", summary.agentsSeen.length)}
        {statCell("Completed", summary.agentsCompleted.length)}
        {statCell("Failed", summary.agentsFailed.length)}
        {statCell("Latency", latencyStr)}
        {statCell("Tokens", tokensStr)}
        {statCell("Cost", costStr)}
        {statCell("Artifacts", summary.artifactCount)}
        {statCell("Citations", summary.citationReportCount)}
      </div>

      {summary.firstError && (
        <div style={{ marginTop: "1rem", borderLeft: "2px solid #f87171", paddingLeft: "0.75rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#f87171", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            First Error
          </span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171", marginTop: "0.25rem" }}>
            {summary.firstError}
          </p>
        </div>
      )}

      {summary.slowestAgent && (
        <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040" }}>
          Slowest agent: <span style={{ color: "#737373" }}>{summary.slowestAgent}</span>
        </p>
      )}
    </div>
  );
}
