import type { AgentTraceGroup } from "@/lib/traces/types";

function statusBadge(status: AgentTraceGroup["status"]) {
  const map: Record<AgentTraceGroup["status"], string> = {
    completed: "badge-pass",
    failed: "badge-fail",
    started: "badge-warn",
    unknown: "badge-neutral",
  };
  return (
    <span className={`badge ${map[status]}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>
      {status}
    </span>
  );
}

interface Props {
  agentGroups: AgentTraceGroup[];
}

export default function AgentBreakdownPanel({ agentGroups }: Props) {
  if (agentGroups.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No agent groups recorded.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {agentGroups.map((group) => (
        <div
          key={group.agentName}
          style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "1rem" }}
        >
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-1)", fontWeight: 700 }}>
              {group.agentName}
            </span>
            {statusBadge(group.status)}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", marginLeft: "auto" }}>
              {group.events.length} events
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            {group.totalLatencyMs > 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)" }}>
                <span style={{ color: "var(--text-3)" }}>latency </span>
                {(group.totalLatencyMs / 1000).toFixed(2)}s
              </span>
            )}
            {group.artifactIds.length > 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)" }}>
                <span style={{ color: "var(--text-3)" }}>artifacts </span>
                {group.artifactIds.length}
              </span>
            )}
            {group.startedAt && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>
                started {new Date(group.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            )}
            {group.completedAt && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>
                completed {new Date(group.completedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            )}
          </div>

          {group.artifactIds.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              {group.artifactIds.map((id) => (
                <span
                  key={id}
                  style={{
                    display: "inline-block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    color: "#60a5fa",
                    marginRight: "0.5rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  {id.slice(0, 8)}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
