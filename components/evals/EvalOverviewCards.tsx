import type { EvalDashboardStats } from "@/lib/litigation/evals/types";

function scoreColor(v: number | null): string {
  if (v === null) return "#404040";
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}
    >
      <p className="label mb-3">{label}</p>
      <p
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "28px",
          fontWeight: 700,
          color: color ?? "#f4f4f4",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="mt-2"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function EvalOverviewCards({ stats }: { stats: EvalDashboardStats }) {
  const confPct =
    stats.averageConfidence != null ? `${Math.round(stats.averageConfidence * 100)}%` : "—";
  const citPct =
    stats.averageCitationPassRate != null
      ? `${Math.round(stats.averageCitationPassRate * 100)}%`
      : "—";
  const faithPct =
    stats.averageFaithfulnessScore != null
      ? `${Math.round(stats.averageFaithfulnessScore * 100)}%`
      : "—";

  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <StatCard
        label="Total Workflows"
        value={String(stats.totalWorkflows)}
        sub={`${stats.completedWorkflows} completed, ${stats.failedWorkflows} failed`}
      />
      <StatCard
        label="Avg. Confidence"
        value={confPct}
        color={scoreColor(stats.averageConfidence)}
        sub="across completed runs"
      />
      <StatCard
        label="Avg. Citation Pass"
        value={citPct}
        color={scoreColor(stats.averageCitationPassRate)}
        sub="verified citations"
      />
      <StatCard
        label="Avg. Faithfulness"
        value={faithPct}
        color={scoreColor(stats.averageFaithfulnessScore)}
        sub="grounded citations"
      />
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem", background: "#0a0a0a" }}>
        <p className="label mb-3">Verdicts</p>
        <div className="flex gap-3 flex-wrap">
          <span>
            <span className="badge badge-pass">{stats.passCount} PASS</span>
          </span>
          <span>
            <span className="badge badge-warn">{stats.warnCount} WARN</span>
          </span>
          <span>
            <span className="badge badge-fail">{stats.failCount} FAIL</span>
          </span>
        </div>
      </div>
    </div>
  );
}
