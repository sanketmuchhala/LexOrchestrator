import type {
  AgentContext,
  AgentResult,
  EvalAgentOutput,
  RetrievalAgentOutput,
  CitationAgentOutput,
  AdversarialAgentOutput,
  LocalRulesAgentOutput,
  JudgeBriefResult,
} from "../types";
import { makeEvent } from "../logAgentEvent";
import { computeWorkflowEval } from "../evals/computeWorkflowEval";
import { saveWorkflowEval } from "../evals/saveWorkflowEval";
import type {
  WorkflowArtifactRow,
  WorkflowCitationReportRow,
  WorkflowRunRow,
} from "@/lib/db/supabaseServer";

function buildSyntheticWorkflowRow(
  workflowRunId: string,
  citationPassRate: number,
  faithfulnessScore: number,
  confidence: number,
  retrieval: RetrievalAgentOutput
): WorkflowRunRow {
  return {
    id: workflowRunId,
    workflow_type: "motion_draft",
    status: "running",
    jurisdiction: null,
    court: null,
    motion_type: null,
    input_summary: null,
    final_output: null,
    confidence,
    faithfulness_score: faithfulnessScore,
    citation_pass_rate: citationPassRate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // synthetic citations list from retrieval for coverage computation
    _citations: retrieval.retrievedAuthority
      .filter((a) => a.citation)
      .map((a) => ({ citation: a.citation! })),
  } as unknown as WorkflowRunRow;
}

function buildSyntheticArtifacts(
  adversarial: AdversarialAgentOutput,
  localRules: LocalRulesAgentOutput,
  judgeBrief: JudgeBriefResult | null,
  citationsFromRetrieval: Array<{ citation: string }>
): WorkflowArtifactRow[] {
  const arts: WorkflowArtifactRow[] = [];

  // Synthetic draft with citation list for coverage computation
  arts.push({
    id: "synthetic-draft",
    workflow_run_id: "",
    artifact_type: "outline",
    title: null,
    content: "",
    citations: citationsFromRetrieval,
    verification_status: null,
    created_by_agent: null,
    created_at: new Date().toISOString(),
    metadata: {},
  });

  // Red team memo for adversarial risk detection
  const riskLabel = adversarial.riskLevel.toUpperCase();
  arts.push({
    id: "synthetic-adversarial",
    workflow_run_id: "",
    artifact_type: "red_team_memo",
    title: null,
    content: `ADVERSARIAL RISK: ${riskLabel}\n${adversarial.redTeamMemo}`,
    citations: [],
    verification_status: null,
    created_by_agent: null,
    created_at: new Date().toISOString(),
    metadata: {},
  });

  // Local rules artifact with structured metadata
  arts.push({
    id: "synthetic-local-rules",
    workflow_run_id: "",
    artifact_type: "local_rules_check",
    title: null,
    content: localRules.artifactContent,
    citations: [],
    verification_status: null,
    created_by_agent: null,
    created_at: new Date().toISOString(),
    metadata: { localRules },
  });

  // Judge brief artifact if present
  if (judgeBrief && judgeBrief.matchStatus !== "not_requested") {
    arts.push({
      id: "synthetic-judge-brief",
      workflow_run_id: "",
      artifact_type: "judge_brief",
      title: null,
      content: judgeBrief.artifactContent,
      citations: [],
      verification_status: null,
      created_by_agent: null,
      created_at: new Date().toISOString(),
      metadata: { judgeBrief },
    });
  }

  return arts;
}

export async function runLitigationEvalAgent(
  ctx: AgentContext,
  retrieval: RetrievalAgentOutput,
  citationOutput: CitationAgentOutput,
  adversarial: AdversarialAgentOutput,
  localRules?: LocalRulesAgentOutput,
  judgeBrief?: JudgeBriefResult | null
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("EvalAgent", "agent_started", "Scoring workflow quality")];

  const { citationSummary } = citationOutput;

  const citationPassRate =
    citationSummary.total > 0 ? citationSummary.pass / citationSummary.total : 0;

  const retrievalCoverage = Math.min(1, retrieval.retrievedAuthority.length / 5);

  const faithfulnessScore =
    citationSummary.total > 0
      ? Math.min(1, (citationSummary.pass + citationSummary.warn * 0.5) / citationSummary.total)
      : retrievalCoverage * 0.6;

  const round3 = (n: number) => Math.round(n * 1000) / 1000;

  // Build synthetic data structures for computeWorkflowEval
  const citationsFromRetrieval = retrieval.retrievedAuthority
    .filter((a) => a.citation)
    .map((a) => ({ citation: a.citation! }));

  const syntheticWorkflow = buildSyntheticWorkflowRow(
    ctx.workflowRunId,
    round3(citationPassRate),
    round3(faithfulnessScore),
    0,
    retrieval
  );

  const syntheticArtifacts = buildSyntheticArtifacts(
    adversarial,
    localRules ?? {
      profileId: "federal_generic",
      profileLabel: "Federal Court (Generic)",
      formattingNotes: [],
      requiredSections: [],
      missingSections: [],
      citationNotes: [],
      filingNotes: [],
      warnings: [],
      confidence: 0.5,
      limitations: [],
      artifactContent: "",
      sectionChecks: [],
    },
    judgeBrief ?? null,
    citationsFromRetrieval
  );

  const syntheticReports: WorkflowCitationReportRow[] = ctx.citationReports.map((r) => ({
    id: r.citationText,
    workflow_run_id: ctx.workflowRunId,
    citation_text: r.citationText,
    normalized_citation: r.normalizedCitation,
    overall_status: r.overallStatus,
    existence_status: null,
    quote_status: null,
    pin_cite_status: null,
    proposition_status: null,
    treatment_status: null,
    created_at: new Date().toISOString(),
  }));

  const fullEval = computeWorkflowEval(
    syntheticWorkflow,
    [],
    syntheticArtifacts,
    syntheticReports
  );

  const { summary } = fullEval;

  const output: EvalAgentOutput = {
    faithfulnessScore: round3(faithfulnessScore),
    citationPassRate: round3(citationPassRate),
    retrievalCoverage: round3(retrievalCoverage),
    unsupportedClaimRisk: summary.unsupportedClaimRisk,
    overallConfidence: summary.overallConfidence,
    passFail: summary.passFail === "pass" ? "pass" : "fail",
  };

  // Persist eval artifact (no-op if migration 006 not applied)
  await saveWorkflowEval(ctx.workflowRunId, summary);

  const latencyMs = Math.round(performance.now() - start);
  events.push(
    makeEvent(
      "EvalAgent",
      "agent_completed",
      `Confidence: ${Math.round(summary.overallConfidence * 100)}% | ${summary.passFail.toUpperCase()}`,
      { latencyMs }
    )
  );

  return {
    agentName: "EvalAgent",
    status: "success",
    message: `Eval: ${summary.passFail.toUpperCase()} | Confidence: ${Math.round(summary.overallConfidence * 100)}% | Citations: ${Math.round(citationPassRate * 100)}%`,
    output: output as unknown as Record<string, unknown>,
    confidence: summary.overallConfidence,
    events,
  };
}
