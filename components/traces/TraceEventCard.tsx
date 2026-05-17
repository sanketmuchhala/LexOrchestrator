import type { TraceEvent } from "@/lib/traces/types";
import JsonDetails from "./JsonDetails";

function eventTypeBadgeClass(eventType: string): string {
  if (eventType === "agent_completed" || eventType === "run_completed") return "badge-pass";
  if (eventType === "run_failed") return "badge-fail";
  if (eventType === "tool_call" || eventType === "tool_result") return "badge-blue";
  if (eventType === "draft_chunk") return "badge-warn";
  return "badge-neutral";
}

function shortTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch {
    return iso.slice(11, 19);
  }
}

interface Props {
  event: TraceEvent;
  index: number;
}

export default function TraceEventCard({ event, index }: Props) {
  const hasDetails = event.toolInput || event.toolOutput || (event.metadata && Object.keys(event.metadata).length > 0);

  return (
    <div
      style={{
        borderLeft: "1px solid rgba(0,0,0,0.07)",
        paddingLeft: "0.875rem",
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
      }}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: hasDetails ? "0.25rem" : 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", minWidth: "1.5rem" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.08em" }}>
          {shortTime(event.createdAt)}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-1)" }}>
          {event.agentName}
        </span>
        <span className={`badge ${eventTypeBadgeClass(event.eventType)}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>
          {event.eventType}
        </span>
        {event.toolName && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#60a5fa" }}>
            {event.toolName}
          </span>
        )}
        {event.latencyMs != null && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", marginLeft: "auto" }}>
            {event.latencyMs}ms
          </span>
        )}
        {event.tokenCount != null && event.tokenCount > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>
            {event.tokenCount.toLocaleString()} tok
          </span>
        )}
      </div>

      {/* Message */}
      {event.message && (
        <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5, marginTop: "0.25rem" }}>
          {event.message}
        </p>
      )}

      {/* Collapsible details */}
      {hasDetails && (
        <div style={{ marginTop: "0.375rem" }}>
          <JsonDetails label="Tool Input" value={event.toolInput ?? undefined} />
          <JsonDetails label="Tool Output" value={event.toolOutput ?? undefined} />
          <JsonDetails label="Metadata" value={Object.keys(event.metadata).length > 0 ? event.metadata : undefined} />
        </div>
      )}
    </div>
  );
}
