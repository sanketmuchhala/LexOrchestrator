"use client";

import type { JurorAction } from "@/lib/jury/types";

const ROLES = [
  "Citizen", "Policymaker", "Expert", "Skeptic",
  "Activist", "Journalist", "Researcher", "Analyst",
  "Observer", "Enthusiast", "Citizen", "Expert",
];

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "#34d399",
  negative: "#f87171",
  neutral:  "#404040",
};

const SENTIMENT_BG: Record<string, string> = {
  positive: "rgba(52,211,153,0.12)",
  negative: "rgba(248,113,113,0.12)",
  neutral:  "rgba(64,64,64,0.15)",
};

interface JurorGridProps {
  numAgents: number;
  mode: "deliberating" | "verdict";
  sentimentDistribution?: { positive: number; negative: number; neutral: number };
  sampleActions?: JurorAction[];
}

function assignSentiments(
  numAgents: number,
  dist: { positive: number; negative: number; neutral: number },
  actions: JurorAction[]
): Array<"positive" | "negative" | "neutral"> {
  // Try to assign per-agent sentiment from sampleActions (last action per agent wins)
  const byAgent = new Map<number, "positive" | "negative" | "neutral">();
  for (const a of actions) {
    byAgent.set(a.agentId, a.sentiment);
  }

  const result: Array<"positive" | "negative" | "neutral"> = [];
  const pool: Array<"positive" | "negative" | "neutral"> = [
    ...Array(dist.positive).fill("positive"),
    ...Array(dist.negative).fill("negative"),
    ...Array(dist.neutral).fill("neutral"),
  ];

  for (let i = 0; i < numAgents; i++) {
    const fromAction = byAgent.get(i);
    if (fromAction) {
      result.push(fromAction);
    } else {
      result.push(pool.shift() ?? "neutral");
    }
  }
  return result;
}

export default function JurorGrid({ numAgents, mode, sentimentDistribution, sampleActions = [] }: JurorGridProps) {
  const count = Math.max(1, Math.min(20, numAgents));
  const sentiments =
    mode === "verdict" && sentimentDistribution
      ? assignSentiments(count, sentimentDistribution, sampleActions)
      : null;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${count <= 6 ? count : 4}, 1fr)`,
          gap: "1rem",
          justifyItems: "center",
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const sentiment = sentiments?.[i] ?? null;
          const role = ROLES[i % ROLES.length];
          const isVerdict = mode === "verdict" && sentiment !== null;
          const color = sentiment ? SENTIMENT_COLOR[sentiment] : "#6366f1";
          const bg = sentiment ? SENTIMENT_BG[sentiment] : "rgba(99,102,241,0.1)";
          const delay = `${i * 80}ms`;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={isVerdict ? "juror-verdict" : "juror-deliberating"}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: `1.5px solid ${color}60`,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animationDelay: isVerdict ? delay : `${i * 200}ms`,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    color,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Pulse ring while deliberating */}
                {!isVerdict && (
                  <div
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: "50%",
                      border: "1px solid rgba(99,102,241,0.2)",
                      animation: `juror-idle 2.2s ease-in-out infinite`,
                      animationDelay: `${i * 180}ms`,
                    }}
                  />
                )}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "8px",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                  maxWidth: 56,
                }}
              >
                {role}
              </p>
            </div>
          );
        })}
      </div>

      {mode === "deliberating" && (
        <p
          className="mt-6 text-center"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.16em", textTransform: "uppercase" }}
        >
          Deliberating...
        </p>
      )}
    </div>
  );
}
