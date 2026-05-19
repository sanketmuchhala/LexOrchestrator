"use client";

import { useEffect, useState } from "react";
import type { JurorAction } from "@/lib/jury/types";
import JurorFace, { roleColor } from "./JurorFace";

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

// ── Single message card ─────────────────────────────────────────────────────

function MessageCard({ action, visible }: { action: JurorAction; visible: boolean }) {
  const color = roleColor(action.agentRole);
  const verb = ACTION_VERB[action.actionType] ?? "says";
  const borderColor = SENTIMENT_BORDER[action.sentiment] ?? "#737373";

  return (
    <div
      className="flex items-start gap-3"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <JurorFace role={action.agentRole} sentiment={action.sentiment} size={38} />
      </div>

      {/* Bubble */}
      <div style={{ flex: 1, borderLeft: `2px solid ${borderColor}45`, paddingLeft: "0.75rem" }}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {action.agentRole}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>
            {verb}
          </span>
          {action.influenceScore >= 0.7 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", padding: "0 4px" }}>
              influential
            </span>
          )}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: borderColor, marginLeft: "auto", opacity: 0.8 }}>
            {action.sentiment}
          </span>
        </div>

        <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", lineHeight: 1.7, color: "var(--text-1)" }}>
          {action.content}
        </p>

        {action.keySignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {action.keySignals.map((sig, j) => (
              <span key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-3)", border: "1px solid rgba(255,255,255,0.07)", padding: "1px 5px" }}>
                {sig}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator({ numAgents }: { numAgents: number }) {
  const [jurorIdx, setJurorIdx] = useState(0);
  const JUROR_ROLES = ["Citizen", "Expert", "Skeptic", "Policymaker", "Activist", "Journalist", "Researcher", "Analyst", "Observer", "Enthusiast"];
  const role = JUROR_ROLES[jurorIdx % JUROR_ROLES.length];

  useEffect(() => {
    const t = setInterval(() => setJurorIdx((p) => (p + 1) % numAgents), 2200);
    return () => clearInterval(t);
  }, [numAgents]);

  return (
    <div className="flex items-center gap-3" style={{ opacity: 0.7 }}>
      <JurorFace role={role} size={32} isThinking />
      <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 18 }}>
        {[0, 1, 2].map((d) => (
          <div key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-3)", animation: "juror-idle 1.1s ease-in-out infinite", animationDelay: `${d * 0.2}s` }} />
        ))}
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.1em" }}>
        {role} is thinking...
      </span>
    </div>
  );
}

// ── Feed grouped by round ───────────────────────────────────────────────────

interface JuryDiscussionFeedProps {
  status: "running" | "completed" | "failed";
  actions: JurorAction[];
  numAgents: number;
}

export default function JuryDiscussionFeed({ status, actions, numAgents }: JuryDiscussionFeedProps) {
  // Reveal cards progressively on initial render so they don't all flash at once
  const [visibleCount, setVisibleCount] = useState(actions.length > 0 ? 0 : 0);

  useEffect(() => {
    if (actions.length === 0) return;
    if (visibleCount >= actions.length) return;
    const t = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= actions.length) { clearInterval(t); return prev; }
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.length]);

  // Sync when new actions arrive from polling
  useEffect(() => {
    setVisibleCount((prev) => (actions.length > prev ? actions.length : prev));
  }, [actions.length]);

  if (actions.length === 0 && status === "running") {
    return (
      <div className="space-y-3 py-4">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em" }}>
          Waiting for first juror to speak...
        </p>
        <TypingIndicator numAgents={numAgents} />
      </div>
    );
  }

  if (actions.length === 0) return null;

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
            <div className="flex items-center gap-3 mb-4">
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.2em", whiteSpace: "nowrap" }}>
                Round {round}
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>

            <div className="space-y-5">
              {roundActions.map((action) => {
                const idx = globalIdx++;
                return (
                  <MessageCard
                    key={`${action.agentId}-${action.round}-${idx}`}
                    action={action}
                    visible={idx < visibleCount}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Show typing indicator at the bottom while still running */}
      {status === "running" && <TypingIndicator numAgents={numAgents} />}
    </div>
  );
}
