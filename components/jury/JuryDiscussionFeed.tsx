"use client";

import { useEffect, useState } from "react";
import type { JurorAction } from "@/lib/jury/types";
import JurorFace, { roleColor } from "./JurorFace";
import { JUROR_ROLES } from "./JurorGrid";

const SENTIMENT_BORDER: Record<string, string> = {
  positive: "#34d399",
  negative: "#f87171",
  neutral:  "#737373",
};

const ACTION_VERB: Record<string, string> = {
  CREATE_POST: "says",
  REPLY:       "replies",
  AMPLIFY:     "agrees",
  CHALLENGE:   "challenges",
};

// ── Deliberating placeholder ────────────────────────────────────────────────

const DELIBERATING_LINES = [
  "Reviewing the facts of the case...",
  "Considering the legal standard presented...",
  "Weighing the plaintiff's arguments...",
  "Examining the defendant's position...",
  "Discussing procedural history...",
  "Consulting prior precedents...",
  "Assessing credibility of evidence...",
  "Deliberating on constitutional implications...",
  "Forming an initial position...",
  "Listening to opposing viewpoints...",
  "Re-evaluating key arguments...",
  "Reaching toward consensus...",
];

function DeliberatingFeed({ numAgents, elapsed }: { numAgents: number; elapsed: number }) {
  // Reveal one placeholder message roughly every 6 seconds
  const revealed = Math.min(Math.floor(elapsed / 6) + 1, DELIBERATING_LINES.length);
  const messages = DELIBERATING_LINES.slice(0, revealed);

  return (
    <div className="space-y-3">
      {messages.map((line, i) => {
        const jurorIdx = (i * 3 + i) % numAgents;
        const role = JUROR_ROLES[jurorIdx % JUROR_ROLES.length];
        const color = roleColor(role);

        return (
          <div
            key={i}
            className="flex items-start gap-3"
            style={{
              animation: "appear 0.4s ease-out both",
              animationDelay: "0ms",
              opacity: i === messages.length - 1 ? 0.55 : 1,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <JurorFace role={role} sentiment={null} size={32} isThinking />
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    fontWeight: 700,
                    color,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {role}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    color: "var(--text-3)",
                  }}
                >
                  deliberating
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "12px",
                  lineHeight: 1.65,
                  color: "var(--text-3)",
                  fontStyle: "italic",
                }}
              >
                {line}
              </p>
            </div>
          </div>
        );
      })}

      {/* Typing indicator for "next" juror */}
      {revealed < DELIBERATING_LINES.length && (
        <div className="flex items-center gap-3">
          <JurorFace
            role={JUROR_ROLES[(revealed * 3 + revealed) % numAgents % JUROR_ROLES.length]}
            size={32}
            isThinking
          />
          <div style={{ display: "flex", gap: 4, alignItems: "center", height: 20 }}>
            {[0, 1, 2].map((d) => (
              <div
                key={d}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--text-3)",
                  animation: "juror-idle 1.1s ease-in-out infinite",
                  animationDelay: `${d * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Completed feed ──────────────────────────────────────────────────────────

function CompletedFeed({ actions }: { actions: JurorAction[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  // Reveal messages progressively after mount
  useEffect(() => {
    if (actions.length === 0) return;
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= actions.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [actions.length]);

  // Group by round
  const byRound = new Map<number, JurorAction[]>();
  for (const a of actions) {
    const bucket = byRound.get(a.round) ?? [];
    bucket.push(a);
    byRound.set(a.round, bucket);
  }
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);

  let globalIdx = 0;

  return (
    <div className="space-y-8">
      {rounds.map((round) => {
        const roundActions = byRound.get(round) ?? [];
        return (
          <div key={round}>
            {/* Round divider */}
            <div
              className="flex items-center gap-3 mb-4"
              style={{ opacity: globalIdx < visibleCount ? 1 : 0, transition: "opacity 0.3s" }}
            >
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  whiteSpace: "nowrap",
                }}
              >
                Round {round}
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>

            <div className="space-y-4">
              {roundActions.map((action) => {
                const idx = globalIdx++;
                const isVisible = idx < visibleCount;
                const color = roleColor(action.agentRole);
                const verb = ACTION_VERB[action.actionType] ?? "says";
                const borderColor = SENTIMENT_BORDER[action.sentiment] ?? "var(--text-3)";

                return (
                  <div
                    key={`${action.agentId}-${action.round}-${idx}`}
                    className="flex items-start gap-3"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(6px)",
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <JurorFace
                        role={action.agentRole}
                        sentiment={action.sentiment}
                        size={38}
                      />
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        flex: 1,
                        borderLeft: `2px solid ${borderColor}50`,
                        paddingLeft: "0.75rem",
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {action.agentRole}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            color: "var(--text-3)",
                          }}
                        >
                          {verb}
                        </span>
                        {action.influenceScore >= 0.7 && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "8px",
                              color: "#fbbf24",
                              border: "1px solid rgba(251,191,36,0.3)",
                              padding: "0 4px",
                            }}
                          >
                            influential
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "8px",
                            color: borderColor,
                            marginLeft: "auto",
                            opacity: 0.7,
                          }}
                        >
                          {action.sentiment}
                        </span>
                      </div>

                      {/* Content */}
                      <p
                        style={{
                          fontFamily: "var(--font-serif), Georgia, serif",
                          fontSize: "13px",
                          lineHeight: 1.7,
                          color: "var(--text-1)",
                        }}
                      >
                        {action.content}
                      </p>

                      {/* Key signals */}
                      {action.keySignals.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {action.keySignals.map((sig, j) => (
                            <span
                              key={j}
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "8px",
                                color: "var(--text-3)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                padding: "1px 5px",
                              }}
                            >
                              {sig}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

interface JuryDiscussionFeedProps {
  status: "running" | "completed" | "failed";
  actions: JurorAction[];
  numAgents: number;
  elapsed: number;
}

export default function JuryDiscussionFeed({
  status,
  actions,
  numAgents,
  elapsed,
}: JuryDiscussionFeedProps) {
  if (status === "running") {
    return <DeliberatingFeed numAgents={numAgents} elapsed={elapsed} />;
  }
  if (status === "completed" && actions.length > 0) {
    return <CompletedFeed actions={actions} />;
  }
  return null;
}
