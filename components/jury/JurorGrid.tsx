"use client";

import type { JurorAction } from "@/lib/jury/types";
import JurorFace, { roleColor } from "./JurorFace";

export const JUROR_ROLES = [
  "Citizen", "Policymaker", "Expert", "Skeptic",
  "Activist", "Journalist", "Researcher", "Analyst",
  "Observer", "Enthusiast", "Citizen", "Expert",
  "Skeptic", "Journalist", "Researcher", "Activist",
  "Analyst", "Expert", "Citizen", "Policymaker",
];

const SENTIMENT_BORDER: Record<string, string> = {
  positive: "rgba(52,211,153,0.5)",
  negative: "rgba(248,113,113,0.5)",
  neutral:  "rgba(115,115,115,0.3)",
};

interface JurorGridProps {
  numAgents: number;
  mode: "deliberating" | "verdict";
  sentimentDistribution?: { positive: number; negative: number; neutral: number };
  sampleActions?: JurorAction[];
  speakingIndex?: number | null;
}

function assignSentiments(
  numAgents: number,
  dist: { positive: number; negative: number; neutral: number },
  actions: JurorAction[]
): Array<"positive" | "negative" | "neutral"> {
  const byAgent = new Map<number, "positive" | "negative" | "neutral">();
  for (const a of actions) {
    byAgent.set(a.agentId, a.sentiment);
  }
  const pool: Array<"positive" | "negative" | "neutral"> = [
    ...Array(dist.positive).fill("positive"),
    ...Array(dist.negative).fill("negative"),
    ...Array(dist.neutral).fill("neutral"),
  ];
  return Array.from({ length: numAgents }, (_, i) => byAgent.get(i) ?? pool.shift() ?? "neutral");
}

export default function JurorGrid({
  numAgents,
  mode,
  sentimentDistribution,
  sampleActions = [],
  speakingIndex = null,
}: JurorGridProps) {
  const count = Math.max(1, Math.min(20, numAgents));
  const sentiments =
    mode === "verdict" && sentimentDistribution
      ? assignSentiments(count, sentimentDistribution, sampleActions)
      : null;

  const cols = count <= 4 ? count : count <= 8 ? 4 : 6;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "1.25rem 1rem",
          justifyItems: "center",
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const sentiment = sentiments?.[i] ?? null;
          const role = JUROR_ROLES[i % JUROR_ROLES.length];
          const isVerdict = mode === "verdict" && sentiment !== null;
          const isSpeaking = speakingIndex === i;
          const color = roleColor(role);
          const delay = `${i * 80}ms`;

          return (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ gap: "6px", position: "relative" }}
            >
              {/* Speaking indicator */}
              {isSpeaking && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 3,
                    alignItems: "flex-end",
                    height: 8,
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 3,
                        background: color,
                        borderRadius: 2,
                        animation: "speak-bar 0.9s ease-in-out infinite",
                        animationDelay: `${d * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Face */}
              <div
                className={isVerdict ? "juror-verdict" : "juror-deliberating"}
                style={{
                  animationDelay: isVerdict ? delay : `${i * 190}ms`,
                  borderRadius: "50%",
                  border: isVerdict && sentiment
                    ? `2px solid ${SENTIMENT_BORDER[sentiment]}`
                    : isSpeaking
                    ? `2px solid ${color}80`
                    : "2px solid transparent",
                  boxShadow: isSpeaking ? `0 0 12px ${color}40` : undefined,
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                <JurorFace
                  role={role}
                  sentiment={isVerdict ? sentiment : null}
                  size={48}
                  isThinking={!isVerdict && !isSpeaking}
                />
              </div>

              {/* Number */}
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  fontWeight: 700,
                  color: isVerdict && sentiment
                    ? sentiment === "positive" ? "#34d399"
                    : sentiment === "negative" ? "#f87171"
                    : "var(--text-3)"
                    : isSpeaking ? color : "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                }}
              >
                {role.slice(0, 3).toUpperCase()}
              </p>
            </div>
          );
        })}
      </div>

      {mode === "deliberating" && (
        <p
          className="mt-5 text-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-3)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Deliberating...
        </p>
      )}
    </div>
  );
}
