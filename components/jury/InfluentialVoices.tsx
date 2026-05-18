import type { JurorAction } from "@/lib/jury/types";

interface InfluentialVoicesProps {
  actions: JurorAction[];
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "#34d399",
  negative: "#f87171",
  neutral:  "#737373",
};

export default function InfluentialVoices({ actions }: InfluentialVoicesProps) {
  const influential = actions
    .filter((a) => a.influenceScore >= 0.7)
    .sort((a, b) => b.influenceScore - a.influenceScore)
    .slice(0, 6);

  if (influential.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No high-influence voices recorded.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {influential.map((a, i) => {
        const sentimentColor = SENTIMENT_COLOR[a.sentiment] ?? "var(--text-3)";
        const scorePct = Math.round(a.influenceScore * 100);

        return (
          <div
            key={i}
            style={{
              borderLeft: `2px solid ${sentimentColor}`,
              paddingLeft: "1rem",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
            }}
          >
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <span
                style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700,
                  color: sentimentColor, border: `1px solid ${sentimentColor}40`,
                  background: `${sentimentColor}10`, padding: "1px 6px",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}
              >
                {a.agentRole}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>
                Round {a.round} · {a.actionType.replace(/_/g, " ")}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, color: sentimentColor, marginLeft: "auto" }}>
                {scorePct}% influence
              </span>
            </div>

            {/* Influence bar */}
            <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", marginBottom: "0.625rem" }}>
              <div style={{ width: `${scorePct}%`, height: "100%", background: sentimentColor, transition: "width 0.5s ease" }} />
            </div>

            <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", lineHeight: "1.65", color: "var(--text-1)" }}>
              {a.content}
            </p>

            {a.keySignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {a.keySignals.map((sig, j) => (
                  <span key={j} className="badge badge-neutral" style={{ fontSize: "8px" }}>
                    {sig}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
