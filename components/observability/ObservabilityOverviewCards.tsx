import type { ObservabilityDashboardStats } from "@/lib/observability/types";
import { formatDurationMs, formatCost, formatTokens } from "@/lib/observability/metrics";
import MetricCard from "./MetricCard";

interface Props {
  stats: ObservabilityDashboardStats;
}

export default function ObservabilityOverviewCards({ stats }: Props) {
  const anyHasCost = stats.averageCostUsd > 0;
  const anyHasTokens = stats.averageTokenCount > 0;
  const anyHasConfidence = stats.averageConfidence > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "0.75rem",
      }}
    >
      <MetricCard label="Total Runs" value={stats.totalWorkflows} />
      <MetricCard
        label="Completed"
        value={stats.completedWorkflows}
        sub={stats.totalWorkflows > 0 ? `${Math.round((stats.completedWorkflows / stats.totalWorkflows) * 100)}%` : undefined}
      />
      <MetricCard
        label="Failed"
        value={stats.failedWorkflows}
        dim={stats.failedWorkflows === 0}
      />
      <MetricCard
        label="Avg Duration"
        value={formatDurationMs(stats.averageDurationMs || null)}
        sub={`p95: ${formatDurationMs(stats.p95DurationMs || null)}`}
      />
      <MetricCard
        label="Avg Tokens"
        value={anyHasTokens ? formatTokens(stats.averageTokenCount) : "N/A"}
        dim={!anyHasTokens}
      />
      <MetricCard
        label="Avg Cost"
        value={anyHasCost ? formatCost(stats.averageCostUsd, false) : "N/A"}
        sub={anyHasCost ? `p95: ${formatCost(stats.p95CostUsd, false)}` : "not recorded by provider"}
        dim={!anyHasCost}
      />
      <MetricCard
        label="Avg Confidence"
        value={anyHasConfidence ? `${(stats.averageConfidence * 100).toFixed(0)}%` : "N/A"}
        dim={!anyHasConfidence}
      />
      <MetricCard
        label="Avg Citation Pass"
        value={stats.averageCitationPassRate > 0 ? `${(stats.averageCitationPassRate * 100).toFixed(0)}%` : "N/A"}
        dim={stats.averageCitationPassRate === 0}
      />
    </div>
  );
}
