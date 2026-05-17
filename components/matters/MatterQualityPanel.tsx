import type { MatterQualitySignals } from "@/lib/matters/types";

function pct(value: number | null): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(0)}%`;
}

interface Props {
  signals: MatterQualitySignals;
}

export default function MatterQualityPanel({ signals }: Props) {
  if (signals.completedWorkflowCount === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
        No completed workflows yet.
      </p>
    );
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
        {[
          { label: "Latest Confidence", value: pct(signals.latestConfidence) },
          { label: "Citation Pass Rate", value: pct(signals.latestCitationPassRate) },
          { label: "Faithfulness", value: pct(signals.latestFaithfulnessScore) },
          { label: "Completed Runs", value: String(signals.completedWorkflowCount) },
          { label: "Failed Runs", value: String(signals.failedWorkflowCount) },
        ].map(({ label, value }) => (
          <div key={label} style={{ border: "1px solid rgba(255,255,255,0.04)", padding: "0.75rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              {label}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "#f4f4f4" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", marginTop: "0.75rem", lineHeight: 1.5 }}>
        Signals reflect the most recent completed workflow run. Internal quality metrics only.
      </p>
    </div>
  );
}
