import Link from "next/link";
import type { WorkflowPerformanceSummary } from "@/lib/observability/types";
import { formatDurationMs, formatCost, formatTokens } from "@/lib/observability/metrics";

function statusBadge(status: string) {
  const cls =
    status === "completed" ? "badge-pass" :
    status === "failed" ? "badge-fail" :
    status === "running" ? "badge-warn" :
    "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status}</span>;
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso.slice(0, 10);
  }
}

const cell: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--text-2)",
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  whiteSpace: "nowrap",
};

const headerCell: React.CSSProperties = {
  ...cell,
  fontSize: "9px",
  color: "var(--text-3)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  borderBottom: "1px solid rgba(0,0,0,0.07)",
};

interface Props {
  workflows: WorkflowPerformanceSummary[];
}

export default function RecentWorkflowPerformanceTable({ workflows }: Props) {
  if (workflows.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No workflow runs available.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Date", "Run ID", "Status", "Motion", "Duration", "Events", "Tokens", "Cost", "Confidence", "Cit. Pass", "Trace"].map((h) => (
              <th key={h} style={headerCell}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf) => (
            <tr key={wf.workflowRunId}>
              <td style={cell}>{shortDate(wf.startedAt)}</td>
              <td style={{ ...cell, color: "#60a5fa" }}>{wf.workflowRunId.slice(0, 8)}</td>
              <td style={{ ...cell, padding: "0.5rem 0.75rem" }}>{statusBadge(wf.status)}</td>
              <td style={{ ...cell, color: "var(--text-1)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {wf.motionType?.replace(/_/g, " ") ?? "—"}
              </td>
              <td style={cell}>{formatDurationMs(wf.durationMs)}</td>
              <td style={cell}>{wf.totalEvents}</td>
              <td style={cell}>{formatTokens(wf.totalTokenCount || null)}</td>
              <td style={{ ...cell, color: wf.costIsEstimated ? "var(--text-3)" : "var(--text-2)" }}>
                {formatCost(wf.totalCostUsd || null, wf.costIsEstimated)}
              </td>
              <td style={cell}>
                {wf.confidence != null ? `${(wf.confidence * 100).toFixed(0)}%` : "—"}
              </td>
              <td style={cell}>
                {wf.citationPassRate != null ? `${(wf.citationPassRate * 100).toFixed(0)}%` : "—"}
              </td>
              <td style={{ ...cell, padding: "0.5rem 0.75rem" }}>
                <Link
                  href={`/traces/${wf.workflowRunId}`}
                  style={{ color: "var(--text-3)", letterSpacing: "0.1em" }}
                  className="transition-colors hover:text-black"
                >
                  &rarr;
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
