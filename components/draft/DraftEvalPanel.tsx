import Link from "next/link";
import type { WorkflowRunRow } from "@/lib/litigation/getWorkflowRun";
import type { FullWorkflowEval } from "@/lib/litigation/evals/types";
import EvalScoreBar from "@/components/evals/EvalScoreBar";

function verdictClass(verdict: string): string {
  if (verdict === "pass") return "badge-pass";
  if (verdict === "warn") return "badge-warn";
  return "badge-fail";
}

interface Props {
  workflow: WorkflowRunRow;
  fullEval?: FullWorkflowEval | null;
}

export default function DraftEvalPanel({ workflow, fullEval }: Props) {
  const hasData =
    workflow.confidence != null ||
    workflow.faithfulness_score != null ||
    workflow.citation_pass_rate != null;

  if (!hasData && !fullEval) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
        No eval data recorded for this workflow run.
      </p>
    );
  }

  const summary = fullEval?.summary;
  const confidence = summary?.overallConfidence ?? workflow.confidence;
  const faithfulness = summary?.faithfulnessScore ?? workflow.faithfulness_score;
  const citationRate = summary?.citationPassRate ?? workflow.citation_pass_rate;
  const verdict = summary?.passFail ?? (confidence != null ? (confidence >= 0.75 ? "pass" : confidence >= 0.55 ? "warn" : "fail") : null);

  return (
    <div className="space-y-3">
      {verdict && (
        <div className="flex items-center justify-between">
          <span className="label">Verdict</span>
          <span className={`badge ${verdictClass(verdict)}`}>{verdict.toUpperCase()}</span>
        </div>
      )}

      <EvalScoreBar label="Overall Confidence" value={confidence} />
      <EvalScoreBar label="Faithfulness" value={faithfulness} />
      <EvalScoreBar label="Citation Pass Rate" value={citationRate} />

      {summary && (
        <>
          <EvalScoreBar label="Retrieval Coverage" value={summary.retrievalCoverage} />
          <EvalScoreBar label="Local Rules" value={summary.localRulesCompleteness} />
          <EvalScoreBar label="Adversarial Risk" value={summary.adversarialRisk} invert />
        </>
      )}

      {summary?.warnings && summary.warnings.length > 0 && (
        <div
          className="pt-2"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
        >
          <p className="label mb-2">Warnings</p>
          {summary.warnings.slice(0, 3).map((w, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "#fbbf24",
                lineHeight: "1.6",
                marginBottom: "0.25rem",
              }}
            >
              {w}
            </p>
          ))}
        </div>
      )}

      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
          Internal quality signal only.
        </p>
        <Link
          href={`/evals/${workflow.id}`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-2)",
            letterSpacing: "0.12em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-black"
        >
          Full Eval &rarr;
        </Link>
      </div>
    </div>
  );
}
