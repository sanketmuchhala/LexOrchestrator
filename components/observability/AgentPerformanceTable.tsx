import type { AgentBreakdownStat } from "@/lib/observability/types";
import { formatDurationMs, formatTokens } from "@/lib/observability/metrics";

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
  agents: AgentBreakdownStat[];
}

export default function AgentPerformanceTable({ agents }: Props) {
  if (agents.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No agent data available.
      </p>
    );
  }

  const sorted = [...agents].sort((a, b) => b.totalLatencyMs - a.totalLatencyMs);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Agent", "Runs", "Completed", "Failed", "Avg Latency", "Total Tokens", "Tool Calls", "Warn / Err"].map((h) => (
              <th key={h} style={headerCell}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((agent) => (
            <tr key={agent.agentName}>
              <td style={{ ...cell, color: "var(--text-1)", fontWeight: 600 }}>{agent.agentName}</td>
              <td style={cell}>{agent.totalRuns}</td>
              <td style={{ ...cell, color: agent.completedRuns === agent.totalRuns ? "#34d399" : "var(--text-2)" }}>
                {agent.completedRuns}
              </td>
              <td style={{ ...cell, color: agent.failedRuns > 0 ? "#f87171" : "var(--text-3)" }}>
                {agent.failedRuns}
              </td>
              <td style={cell}>{formatDurationMs(agent.averageLatencyMs || null)}</td>
              <td style={cell}>{formatTokens(agent.totalTokenCount || null)}</td>
              <td style={cell}>{agent.totalToolCalls > 0 ? agent.totalToolCalls : "—"}</td>
              <td style={{ ...cell, color: (agent.totalWarnings + agent.totalErrors) > 0 ? "#fbbf24" : "var(--text-3)" }}>
                {agent.totalWarnings} / {agent.totalErrors}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
