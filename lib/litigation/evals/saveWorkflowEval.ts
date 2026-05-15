import { insertDraftArtifactRecord, DB_AVAILABLE } from "@/lib/db/supabaseServer";
import type { WorkflowEvalSummary } from "./types";

function formatEvalContent(summary: WorkflowEvalSummary): string {
  const lines: string[] = [
    "WORKFLOW EVALUATION",
    "[INTERNAL QUALITY SIGNAL] Not a compliance certification or legal advice.",
    "",
    `Run ID: ${summary.workflowRunId}`,
    `Generated: ${summary.generatedAt}`,
    `Verdict: ${summary.passFail.toUpperCase()}`,
    `Overall Confidence: ${Math.round(summary.overallConfidence * 100)}%`,
    "",
    "SCORES",
    `Faithfulness:         ${Math.round(summary.faithfulnessScore * 100)}%`,
    `Citation Pass Rate:   ${Math.round(summary.citationPassRate * 100)}%`,
    `Retrieval Coverage:   ${Math.round(summary.retrievalCoverage * 100)}%`,
    `Local Rules:          ${Math.round(summary.localRulesCompleteness * 100)}%`,
    `Adversarial Risk:     ${Math.round(summary.adversarialRisk * 100)}%`,
    `Unsupported Claim Risk: ${Math.round(summary.unsupportedClaimRisk * 100)}%`,
    `Judge Brief Coverage: ${Math.round(summary.judgeBriefCoverage * 100)}%`,
  ];

  if (summary.warnings.length > 0) {
    lines.push("", "WARNINGS");
    summary.warnings.forEach((w) => lines.push(`- ${w}`));
  }

  lines.push(
    "",
    "LIMITATIONS",
    "- Scores are internal quality signals derived from the workflow outputs.",
    "- Citation pass rate depends on the size and coverage of the indexed corpus.",
    "- Retrieval coverage is estimated from citation count, not ground-truth recall.",
    "- This evaluation does not constitute legal advice or a compliance certification."
  );

  return lines.join("\n");
}

export async function saveWorkflowEval(
  workflowRunId: string,
  summary: WorkflowEvalSummary
): Promise<void> {
  if (!DB_AVAILABLE) return;

  await insertDraftArtifactRecord({
    workflowRunId,
    artifactType: "workflow_eval",
    title: "Workflow Evaluation",
    content: formatEvalContent(summary),
    citations: [],
    createdByAgent: "EvalAgent",
    metadata: { evalSummary: summary },
  });
}
