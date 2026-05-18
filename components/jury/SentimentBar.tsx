interface SentimentBarProps {
  positive: number;
  negative: number;
  neutral: number;
}

export default function SentimentBar({ positive, negative, neutral }: SentimentBarProps) {
  const total = positive + negative + neutral || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  const segments = [
    { label: "Favor",   count: positive, pct: pct(positive), color: "#34d399", bg: "rgba(52,211,153,0.15)"  },
    { label: "Neutral", count: neutral,  pct: pct(neutral),  color: "#737373", bg: "rgba(115,115,115,0.12)" },
    { label: "Oppose",  count: negative, pct: pct(negative), color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  ];

  return (
    <div>
      {/* Bar */}
      <div className="flex h-3 overflow-hidden" style={{ borderRadius: 0, gap: "1px" }}>
        {segments.map(({ label, pct: p, color }) =>
          p > 0 ? (
            <div
              key={label}
              style={{ width: `${p}%`, background: color, transition: "width 0.6s ease", minWidth: "2px" }}
            />
          ) : null
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-start gap-6">
        {segments.map(({ label, count, pct: p, color, bg }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              style={{
                width: 28, height: 28, border: `1.5px solid ${color}`,
                background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color }}>
                {count}
              </span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {label}
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>
                {p}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
