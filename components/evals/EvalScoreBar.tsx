function scoreColor(v: number, invert = false): string {
  const eff = invert ? 1 - v : v;
  if (eff >= 0.7) return "#34d399";
  if (eff >= 0.4) return "#fbbf24";
  return "#f87171";
}

export default function EvalScoreBar({
  label,
  value,
  invert,
  suffix = "%",
}: {
  label: string;
  value: number | null;
  invert?: boolean;
  suffix?: string;
}) {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  const effective = invert ? 1 - value : value;
  const color = scoreColor(effective);
  const barWidth = `${Math.round(effective * 100)}%`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label">{label}</span>
        <span
          className="tabular-nums"
          style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color }}
        >
          {pct}{suffix}
        </span>
      </div>
      <div
        style={{
          height: "2px",
          background: "rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, width: barWidth, background: color }} />
      </div>
    </div>
  );
}
