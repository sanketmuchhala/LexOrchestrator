import type { AgentRuntimeMetrics } from "@/lib/litigation/evals/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.625rem 0.875rem", border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="label mb-1">{label}</p>
      <p
        className="tabular-nums"
        style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-1)" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function AgentRuntimePanel({ metrics }: { metrics: AgentRuntimeMetrics }) {
  const latencySec =
    metrics.totalLatencyMs > 0
      ? `${(metrics.totalLatencyMs / 1000).toFixed(1)} s`
      : "—";

  const tokenStr = metrics.totalTokenCount > 0 ? String(metrics.totalTokenCount) : "—";
  const costStr =
    metrics.totalCostUsd > 0 ? `$${metrics.totalCostUsd.toFixed(4)}` : "—";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Total Events" value={String(metrics.totalEvents)} />
        <Stat label="Agents Completed" value={String(metrics.agentsCompleted)} />
        <Stat label="Agents Failed" value={String(metrics.agentsFailed)} />
        <Stat label="Total Latency" value={latencySec} />
        <Stat label="Tokens Used" value={tokenStr} />
        <Stat label="Estimated Cost" value={costStr} />
      </div>
      <p
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
      >
        Token counts and cost estimates are only available when the LLM client reports them.
        Most local/mock runs show zero values.
      </p>
    </div>
  );
}
