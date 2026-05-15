import type { WorkflowRunRow } from "@/lib/litigation/getWorkflowRun";

function scoreColor(v: number): string {
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function MetricBar({
  label,
  value,
  invert,
}: {
  label: string;
  value: number | null;
  invert?: boolean;
}) {
  if (value === null) return null;
  const effective = invert ? 1 - value : value;
  const pct = Math.round(value * 100);
  const color = scoreColor(effective);
  const width = `${Math.round(effective * 100)}%`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label">{label}</span>
        <span
          className="tabular-nums"
          style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color }}
        >
          {pct}%
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
        <div style={{ position: "absolute", inset: 0, width, background: color }} />
      </div>
    </div>
  );
}

export default function DraftEvalPanel({ workflow }: { workflow: WorkflowRunRow }) {
  const hasData =
    workflow.confidence != null ||
    workflow.faithfulness_score != null ||
    workflow.citation_pass_rate != null;

  if (!hasData) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
        No eval data recorded for this workflow run.
      </p>
    );
  }

  const passFail =
    workflow.confidence != null
      ? workflow.confidence >= 0.5
        ? "pass"
        : "fail"
      : null;

  return (
    <div className="space-y-4">
      <MetricBar label="Overall Confidence" value={workflow.confidence} />
      <MetricBar label="Faithfulness" value={workflow.faithfulness_score} />
      <MetricBar label="Citation Pass Rate" value={workflow.citation_pass_rate} />

      {passFail && (
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="label">Verdict</span>
          <span className={`badge ${passFail === "pass" ? "badge-pass" : "badge-fail"}`}>
            {passFail.toUpperCase()}
          </span>
        </div>
      )}

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040" }}>
        Scores are deterministic based on retrieval coverage, citation pass rate, and adversarial
        risk. Not a claim of lawyer-grade validation.
      </p>
    </div>
  );
}
