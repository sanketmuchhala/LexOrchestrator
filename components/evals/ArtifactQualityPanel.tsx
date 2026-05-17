import type { ArtifactQualityMetrics } from "@/lib/litigation/evals/types";
import EvalScoreBar from "./EvalScoreBar";

function CheckRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: present ? "var(--text-2)" : "var(--text-3)",
        }}
      >
        {label}
      </span>
      <span className={`badge ${present ? "badge-pass" : "badge-neutral"}`}>
        {present ? "present" : "absent"}
      </span>
    </div>
  );
}

export default function ArtifactQualityPanel({ metrics }: { metrics: ArtifactQualityMetrics }) {
  return (
    <div className="space-y-4">
      <div style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "0.5rem 0.875rem" }}>
        <CheckRow label="Draft Artifact" present={metrics.hasDraft} />
        <CheckRow label="Adversarial Review" present={metrics.hasAdversarialReview} />
        <CheckRow label="Local Rules Review" present={metrics.hasLocalRulesReview} />
        <CheckRow label="Judge Brief" present={metrics.hasJudgeBrief} />
      </div>

      <EvalScoreBar label="Draft Section Coverage" value={metrics.draftSectionCoverage} />

      {metrics.missingSections.length > 0 && (
        <div>
          <p className="label mb-2">Missing Sections</p>
          <div className="flex flex-wrap gap-2">
            {metrics.missingSections.map((s) => (
              <span key={s} className="badge badge-fail">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
