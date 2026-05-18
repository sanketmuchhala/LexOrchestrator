interface NarrativePanelProps {
  narratives: string[];
  trends: string[];
}

export default function NarrativePanel({ narratives, trends }: NarrativePanelProps) {
  return (
    <div className="space-y-6">
      {narratives.length > 0 && (
        <div>
          <p className="label mb-3">Dominant Narratives</p>
          <div className="space-y-3">
            {narratives.map((n, i) => (
              <div key={i} className="flex items-start gap-3" style={{ borderLeft: "2px solid rgba(255,255,255,0.12)", paddingLeft: "0.875rem" }}>
                <span
                  style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, color: "var(--text-3)", paddingTop: "3px", minWidth: "1.25rem" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", lineHeight: "1.7", color: "var(--text-1)" }}>
                  {n}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {trends.length > 0 && (
        <div>
          <p className="label mb-3">Emerging Trends</p>
          <div className="space-y-2">
            {trends.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", paddingTop: "3px" }}>
                  &rarr;
                </span>
                <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", lineHeight: "1.6", color: "var(--text-2)" }}>
                  {t}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
