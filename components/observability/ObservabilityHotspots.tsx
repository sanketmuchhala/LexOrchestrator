import Link from "next/link";
import type { ObservabilityDashboardStats } from "@/lib/observability/types";
import { formatDurationMs, formatCost } from "@/lib/observability/metrics";

interface Props {
  stats: ObservabilityDashboardStats;
}

function HotspotRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "0.625rem 0",
        gap: "1rem",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f4f4f4" }}>
        {href ? (
          <Link href={href} className="transition-colors hover:text-white" style={{ color: "#60a5fa" }}>
            {value}
          </Link>
        ) : value}
      </span>
    </div>
  );
}

export default function ObservabilityHotspots({ stats }: Props) {
  const noneText = "N/A";

  const slowest = stats.slowestRecentWorkflow;
  const mostExpensive = stats.mostExpensiveRecentWorkflow;

  const workflowsMissingMetrics = stats.recentWorkflows.filter(
    (wf) => wf.totalEvents === 0
  ).length;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
      <HotspotRow
        label="Slowest Run"
        value={
          slowest
            ? `${slowest.workflowRunId.slice(0, 8)} — ${formatDurationMs(slowest.durationMs)}`
            : noneText
        }
        href={slowest ? `/traces/${slowest.workflowRunId}` : undefined}
      />
      <HotspotRow
        label="Most Expensive Run"
        value={
          mostExpensive && mostExpensive.totalCostUsd > 0
            ? `${mostExpensive.workflowRunId.slice(0, 8)} — ${formatCost(mostExpensive.totalCostUsd, mostExpensive.costIsEstimated)}`
            : noneText
        }
        href={mostExpensive ? `/traces/${mostExpensive.workflowRunId}` : undefined}
      />
      <HotspotRow
        label="Most Failure-Prone Agent"
        value={stats.mostFailureProneAgent ?? noneText}
      />
      <HotspotRow
        label="Runs Missing Event Data"
        value={workflowsMissingMetrics > 0 ? `${workflowsMissingMetrics} workflow(s)` : "None"}
      />
    </div>
  );
}
