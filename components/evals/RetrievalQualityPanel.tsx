import type { RetrievalQualityMetrics } from "@/lib/litigation/evals/types";

function coverageColor(label: string): string {
  if (label === "Strong") return "#34d399";
  if (label === "Good") return "#34d399";
  if (label === "Partial") return "#fbbf24";
  return "#f87171";
}

export default function RetrievalQualityPanel({ metrics }: { metrics: RetrievalQualityMetrics }) {
  const color = coverageColor(metrics.coverageLabel);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="label">Coverage</span>
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color }}
        >
          {metrics.coverageLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Authorities Retrieved", value: String(metrics.totalAuthorities) },
          { label: "With Citations", value: String(metrics.authoritiesWithCitation) },
          { label: "Jurisdictions Matched", value: String(metrics.jurisdictionsMatched) },
          { label: "Courts Matched", value: String(metrics.courtsMatched) },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ padding: "0.625rem 0.875rem", border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <p className="label mb-1">{label}</p>
            <p
              className="tabular-nums"
              style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--text-1)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <p
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
      >
        Retrieval coverage is estimated from citation count in the draft artifact.
        This is an approximation, not ground-truth retrieval recall.
      </p>
    </div>
  );
}
