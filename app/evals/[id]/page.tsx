import type { Metadata } from "next";
import Link from "next/link";
import { getWorkflowRun } from "@/lib/litigation/getWorkflowRun";
import { computeWorkflowEval } from "@/lib/litigation/evals/computeWorkflowEval";
import EvalScoreBar from "@/components/evals/EvalScoreBar";
import CitationQualityPanel from "@/components/evals/CitationQualityPanel";
import RetrievalQualityPanel from "@/components/evals/RetrievalQualityPanel";
import ArtifactQualityPanel from "@/components/evals/ArtifactQualityPanel";
import AgentRuntimePanel from "@/components/evals/AgentRuntimePanel";
import EvalWarningsPanel from "@/components/evals/EvalWarningsPanel";
import { formatPercent, getStatusBadgeClass } from "@/lib/utils/status";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Eval ${id.slice(0, 8)} — LexOrchestrator` };
}

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.2em" }}>
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

export default async function EvalDetailPage({ params }: Props) {
  const { id } = await params;
  const { workflow, events, artifacts, citationReports } = await getWorkflowRun(id);

  return (
    <div className="pt-10 pb-24 appear">

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/evals"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#404040",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-white"
        >
          &larr; Evals
        </Link>
        <div className="flex items-center gap-3">
          {workflow && (
            <>
              <Link
                href={`/draft/${id}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "#404040",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
                className="transition-colors hover:text-white"
              >
                Draft Workspace &rarr;
              </Link>
              <Link
                href={`/workflows/${id}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "#404040",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
                className="transition-colors hover:text-white"
              >
                Inspection &rarr;
              </Link>
            </>
          )}
        </div>
      </div>

      {workflow === null ? (
        <div className="py-24 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#737373" }}>
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Workflow run not found."
              : "Database not configured. Eval data requires Supabase."}
          </p>
          <p className="mt-2" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}>
            Run ID: {id}
          </p>
        </div>
      ) : (
        (() => {
          const fullEval = computeWorkflowEval(workflow, events, artifacts, citationReports);
          const { summary, citationQuality, retrievalQuality, artifactQuality, agentRuntime } = fullEval;

          return (
            <>
              {/* Header */}
              <div className="mb-10">
                <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>
                  Workflow Evaluation
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`badge ${getStatusBadgeClass(summary.passFail)}`}>
                    {summary.passFail.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      fontWeight: 700,
                      color:
                        summary.overallConfidence >= 0.7
                          ? "#34d399"
                          : summary.overallConfidence >= 0.4
                          ? "#fbbf24"
                          : "#f87171",
                    }}
                  >
                    {formatPercent(summary.overallConfidence)} confidence
                  </span>
                  {workflow.motion_type && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#737373" }}>
                      {workflow.motion_type.replace(/_/g, " ")}
                    </span>
                  )}
                  {workflow.jurisdiction && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#737373" }}>
                      {workflow.jurisdiction}
                      {workflow.court ? ` / ${workflow.court}` : ""}
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}>
                  {workflow.id}
                </p>
              </div>

              <div className="space-y-10">

                {/* § 01 Score Summary */}
                <section>
                  <SectionTitle n="01">Score Summary</SectionTitle>
                  <div className="space-y-3">
                    <EvalScoreBar label="Overall Confidence" value={summary.overallConfidence} />
                    <EvalScoreBar label="Faithfulness" value={summary.faithfulnessScore} />
                    <EvalScoreBar label="Citation Pass Rate" value={summary.citationPassRate} />
                    <EvalScoreBar label="Retrieval Coverage" value={summary.retrievalCoverage} />
                    <EvalScoreBar label="Local Rules Completeness" value={summary.localRulesCompleteness} />
                    <EvalScoreBar label="Unsupported Claim Risk" value={summary.unsupportedClaimRisk} invert />
                    <EvalScoreBar label="Adversarial Risk" value={summary.adversarialRisk} invert />
                    <EvalScoreBar label="Judge Brief Coverage" value={summary.judgeBriefCoverage} />
                  </div>
                </section>

                {/* § 02 Warnings */}
                <section>
                  <SectionTitle n="02">Quality Warnings</SectionTitle>
                  <EvalWarningsPanel warnings={summary.warnings} />
                </section>

                {/* § 03 Citation Quality */}
                <section>
                  <SectionTitle n="03">Citation Quality</SectionTitle>
                  <CitationQualityPanel metrics={citationQuality} />
                </section>

                {/* § 04 Retrieval Quality */}
                <section>
                  <SectionTitle n="04">Authority Retrieval</SectionTitle>
                  <RetrievalQualityPanel metrics={retrievalQuality} />
                </section>

                {/* § 05 Artifact Quality */}
                <section>
                  <SectionTitle n="05">Artifact Quality</SectionTitle>
                  <ArtifactQualityPanel metrics={artifactQuality} />
                </section>

                {/* § 06 Agent Runtime */}
                <section>
                  <SectionTitle n="06">Agent Runtime</SectionTitle>
                  <AgentRuntimePanel metrics={agentRuntime} />
                </section>

                {/* Disclaimer */}
                <div
                  className="px-5 py-4"
                  style={{ border: "1px solid rgba(255,255,255,0.04)", background: "#0a0a0a" }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", lineHeight: "1.7" }}>
                    Scores shown here are internal quality signals derived from workflow outputs.
                    They do not constitute legal advice, a compliance certification, or a guarantee of accuracy.
                    Citation pass rate depends on the indexed corpus. Retrieval coverage is estimated from citation count.
                  </p>
                </div>

              </div>
            </>
          );
        })()
      )}

    </div>
  );
}
