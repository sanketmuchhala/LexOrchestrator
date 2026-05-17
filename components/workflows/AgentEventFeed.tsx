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
          color: "var(--text-3)",
          letterSpacing: "0.2em",
        }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.07)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-2)",
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
  return "var(--text-3)";
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
        <div className="mb-6 flex flex-col items-center gap-3 py-4">
          <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
            <div className="agent-orb" style={{ width: 48, height: 48 }} aria-hidden="true" />
            <div className="agent-orb-ring" style={{ inset: "-12px", animationDelay: "0s" }} aria-hidden="true" />
            <div className="agent-orb-ring" style={{ inset: "-12px", animationDelay: "0.55s" }} aria-hidden="true" />
            <div className="agent-orb-ring" style={{ inset: "-12px", animationDelay: "1.1s" }} aria-hidden="true" />
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Agents thinking...
          </p>
        </div>
      )}

      {events.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
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
                    : "1px solid rgba(0,0,0,0.05)",
                }}
              >
                {/* Agent name */}
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-2)",
                    }}
                  >
                    {ev.agent_name}
                  </p>
                  {ev.latency_ms != null && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-3)",
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
                        color: "var(--text-3)",
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
                        color: "var(--text-3)",
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
                        color: "var(--text-2)",
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
                        color: "var(--text-3)",
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
