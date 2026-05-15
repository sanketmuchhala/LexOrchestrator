import type { WorkflowRunRow } from "@/lib/litigation/getWorkflowRun";

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#404040",
          letterSpacing: "0.2em",
        }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#737373",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function scoreColor(v: number): string {
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

export default function EvalSummaryPanel({ workflow }: { workflow: WorkflowRunRow }) {
  const hasOutput = !!workflow.final_output;
  const hasScores =
    workflow.confidence != null ||
    workflow.faithfulness_score != null ||
    workflow.citation_pass_rate != null;

  const passFail =
    workflow.confidence != null
      ? workflow.confidence >= 0.5
        ? "pass"
        : "fail"
      : null;

  return (
    <section>
      <SectionTitle n="05">Eval Summary</SectionTitle>

      {hasScores && (
        <div
          className="mb-6 flex flex-wrap gap-8 px-5 py-4"
          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}
        >
          {workflow.confidence != null && (
            <div>
              <p className="label mb-1">Overall Confidence</p>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: scoreColor(workflow.confidence),
                }}
              >
                {Math.round(workflow.confidence * 100)}%
              </span>
            </div>
          )}
          {workflow.faithfulness_score != null && (
            <div>
              <p className="label mb-1">Faithfulness</p>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: scoreColor(workflow.faithfulness_score),
                }}
              >
                {Math.round(workflow.faithfulness_score * 100)}%
              </span>
            </div>
          )}
          {workflow.citation_pass_rate != null && (
            <div>
              <p className="label mb-1">Citation Pass Rate</p>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: scoreColor(workflow.citation_pass_rate),
                }}
              >
                {Math.round(workflow.citation_pass_rate * 100)}%
              </span>
            </div>
          )}
          {passFail && (
            <div>
              <p className="label mb-1">Verdict</p>
              <span className={`badge ${passFail === "pass" ? "badge-pass" : "badge-fail"}`}>
                {passFail.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {hasOutput ? (
        <div>
          <p className="label mb-3">Final Output</p>
          <div
            className="px-5 py-4"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {workflow.final_output!.split(/\n\n+/).map((para, i) => (
              <p
                key={i}
                className={i > 0 ? "mt-4" : ""}
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#a3a3a3",
                }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      ) : (
        !hasScores && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
            No eval data recorded for this workflow run.
          </p>
        )
      )}
    </section>
  );
}
