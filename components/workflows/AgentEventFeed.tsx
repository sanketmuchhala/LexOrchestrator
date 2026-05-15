"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkflowEventRow } from "@/lib/litigation/getWorkflowEvents";

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#404040",
          letterSpacing: "0.2em",
        }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#737373",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function eventTypeColor(eventType: string): string {
  if (eventType === "agent_completed" || eventType === "run_completed") return "#34d399";
  if (eventType === "run_failed") return "#f87171";
  if (eventType === "tool_call" || eventType === "tool_result") return "#60a5fa";
  if (eventType === "draft_chunk") return "#fbbf24";
  return "#404040";
}

function eventTypeBadge(eventType: string): string {
  if (eventType === "agent_completed" || eventType === "run_completed") return "badge-pass";
  if (eventType === "run_failed") return "badge-fail";
  if (eventType === "tool_call" || eventType === "tool_result") return "badge-blue";
  if (eventType === "draft_chunk") return "badge-warn";
  return "badge-neutral";
}

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

interface AgentEventFeedProps {
  workflowRunId: string;
  initialEvents: WorkflowEventRow[];
  initialStatus: string;
}

export default function AgentEventFeed({
  workflowRunId,
  initialEvents,
  initialStatus,
}: AgentEventFeedProps) {
  const [events, setEvents] = useState<WorkflowEventRow[]>(initialEvents);
  const [status, setStatus] = useState(initialStatus);
  const [polling, setPolling] = useState(false);

  const isLive = !TERMINAL_STATUSES.has(status);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/litigation/workflows/${workflowRunId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        events?: WorkflowEventRow[];
        workflow?: { status: string };
      };
      if (Array.isArray(data.events)) setEvents(data.events);
      if (data.workflow?.status) setStatus(data.workflow.status);
    } catch {
      // silent — next poll will retry
    }
  }, [workflowRunId]);

  useEffect(() => {
    if (!isLive) return;
    setPolling(true);
    const interval = setInterval(poll, 2500);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [isLive, poll]);

  return (
    <section>
      <SectionTitle n="02">
        {isLive && polling ? "Agent Feed — Live" : "Agent Feed"}
      </SectionTitle>

      {isLive && polling && (
        <div
          className="mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373" }}
        >
          <span className="pulse-dot" />
          Polling every 2.5 s
        </div>
      )}

      {events.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
          No agent events recorded.
        </p>
      ) : (
        <div>
          {events.map((ev, idx) => {
            const isLast = idx === events.length - 1;
            const lineColor = eventTypeColor(ev.event_type);

            return (
              <div
                key={ev.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "9rem 10rem 1fr",
                  gap: "1rem",
                  padding: "0.75rem 0 0.75rem 1.25rem",
                  borderLeft: `2px solid ${lineColor}`,
                  borderBottom: isLast
                    ? "none"
                    : "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {/* Agent name */}
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#737373",
                    }}
                  >
                    {ev.agent_name}
                  </p>
                  {ev.latency_ms != null && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "#404040",
                        marginTop: "2px",
                      }}
                    >
                      {ev.latency_ms} ms
                    </p>
                  )}
                </div>

                {/* Event type + tool */}
                <div>
                  <span className={`badge ${eventTypeBadge(ev.event_type)}`}>
                    {ev.event_type.replace(/_/g, " ")}
                  </span>
                  {ev.tool_name && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "#404040",
                        marginTop: "4px",
                      }}
                    >
                      {ev.tool_name}
                    </p>
                  )}
                  {ev.token_count != null && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "#404040",
                        marginTop: "2px",
                      }}
                    >
                      {ev.token_count} tok
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  {ev.message ? (
                    <p
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "13px",
                        lineHeight: "1.6",
                        color: "#a3a3a3",
                      }}
                    >
                      {ev.message}
                    </p>
                  ) : null}
                  {ev.event_status && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "#404040",
                        marginTop: "2px",
                      }}
                    >
                      {ev.event_status}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
