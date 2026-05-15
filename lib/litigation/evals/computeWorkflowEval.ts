import type {
  WorkflowRunRow,
  WorkflowEventRow,
  WorkflowArtifactRow,
  WorkflowCitationReportRow,
} from "@/lib/db/supabaseServer";
import type { LocalRulesAgentOutput } from "@/lib/litigation/types";
import type { JudgeBriefResult } from "@/lib/litigation/types";
import type {
  WorkflowEvalSummary,
  CitationQualityMetrics,
  RetrievalQualityMetrics,
  ArtifactQualityMetrics,
  AgentRuntimeMetrics,
  FullWorkflowEval,
} from "./types";

const PRIMARY_ARTIFACT_TYPES = new Set([
  "outline",
  "full_draft",
  "motion_section",
  "memo",
]);

const CITATION_FAIL_STATUSES = new Set([
  "not_found",
  "error",
  "quote_mismatch",
  "pin_mismatch",
  "unsupported_proposition",
  "fail",
]);

const CITATION_PASS_STATUSES = new Set(["pass", "verified"]);

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function artifactType(row: WorkflowArtifactRow): string {
  return typeof row.metadata?.originalArtifactType === "string"
    ? row.metadata.originalArtifactType
    : row.artifact_type;
}

function computeCitationQuality(
  reports: WorkflowCitationReportRow[],
  workflowPassRate: number | null
): { metrics: CitationQualityMetrics; passRate: number } {
  const total = reports.length;

  if (total === 0) {
    const pr = workflowPassRate ?? 0;
    return {
      metrics: { total: 0, pass: 0, warn: 0, fail: 0, unknown: 0, passRate: pr, failRate: 0 },
      passRate: pr,
    };
  }

  const pass = reports.filter((r) => CITATION_PASS_STATUSES.has(r.overall_status)).length;
  const fail = reports.filter((r) => CITATION_FAIL_STATUSES.has(r.overall_status)).length;
  const warn = reports.filter(
    (r) => !CITATION_PASS_STATUSES.has(r.overall_status) && !CITATION_FAIL_STATUSES.has(r.overall_status)
  ).length;
  const unknown = Math.max(0, total - pass - fail - warn);
  const passRate = round3(pass / total);
  const failRate = round3(fail / total);

  return {
    metrics: { total, pass, warn, fail, unknown, passRate, failRate },
    passRate: workflowPassRate ?? passRate,
  };
}

function computeArtifactQuality(
  artifacts: WorkflowArtifactRow[]
): ArtifactQualityMetrics {
  const draftArt = artifacts.find((a) => PRIMARY_ARTIFACT_TYPES.has(artifactType(a))) ?? null;
  const advArt = artifacts.find((a) => artifactType(a) === "red_team_memo") ?? null;
  const lrArt = artifacts.find((a) => artifactType(a) === "local_rules_check") ?? null;
  const jbArt = artifacts.find((a) => artifactType(a) === "judge_brief") ?? null;

  let draftSectionCoverage = 0.5;
  let missingSections: string[] = [];

  if (lrArt?.metadata && typeof lrArt.metadata.localRules === "object" && lrArt.metadata.localRules) {
    const lr = lrArt.metadata.localRules as LocalRulesAgentOutput;
    const checks = lr.sectionChecks ?? [];
    const required = checks.filter((c) => c.required);
    const detected = required.filter((c) => c.detected);
    draftSectionCoverage = required.length > 0 ? round3(detected.length / required.length) : 0.5;
    missingSections = lr.missingSections ?? [];
  } else if (draftArt) {
    draftSectionCoverage = 0.5;
  }

  return {
    hasDraft: !!draftArt,
    hasAdversarialReview: !!advArt,
    hasLocalRulesReview: !!lrArt,
    hasJudgeBrief: !!jbArt,
    draftSectionCoverage,
    missingSections,
  };
}

function computeAgentRuntime(events: WorkflowEventRow[]): AgentRuntimeMetrics {
  return {
    totalEvents: events.length,
    agentsCompleted: events.filter((e) => e.event_type === "agent_completed").length,
    agentsFailed: events.filter((e) => e.event_type === "run_failed").length,
    totalLatencyMs: events.reduce((sum, e) => sum + (e.latency_ms ?? 0), 0),
    totalTokenCount: events.reduce((sum, e) => sum + (e.token_count ?? 0), 0),
    totalCostUsd: round3(events.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0)),
  };
}

function computeRetrievalQuality(
  artifacts: WorkflowArtifactRow[],
  workflow: WorkflowRunRow
): { metrics: RetrievalQualityMetrics; coverage: number } {
  const draftArt = artifacts.find((a) => PRIMARY_ARTIFACT_TYPES.has(artifactType(a)));
  const citationRows = Array.isArray(draftArt?.citations) ? draftArt!.citations : [];
  const total = citationRows.length;
  const withCitation = citationRows.filter((c) => typeof c.citation === "string" && c.citation).length;

  let coverageLabel: RetrievalQualityMetrics["coverageLabel"] = "None";
  let coverage = 0;

  if (total >= 5) { coverageLabel = "Strong"; coverage = 0.9; }
  else if (total >= 3) { coverageLabel = "Good"; coverage = 0.7; }
  else if (total >= 1) { coverageLabel = "Partial"; coverage = 0.4; }

  return {
    metrics: {
      totalAuthorities: total,
      authoritiesWithCitation: withCitation,
      jurisdictionsMatched: workflow.jurisdiction ? 1 : 0,
      courtsMatched: workflow.court ? 1 : 0,
      averageScore: coverage,
      coverageLabel,
    },
    coverage: round3(coverage),
  };
}

function judgeBriefCoverageScore(artifacts: WorkflowArtifactRow[]): number {
  const jbArt = artifacts.find((a) => artifactType(a) === "judge_brief");
  if (!jbArt?.metadata?.judgeBrief) return 0;
  const jb = jbArt.metadata.judgeBrief as JudgeBriefResult;
  if (jb.profileAvailable) return 1.0;
  if (jb.matchStatus !== "not_requested" && jb.matchStatus !== "not_found") return 0.5;
  return 0;
}

function adversarialRiskScore(artifacts: WorkflowArtifactRow[]): number {
  const advArt = artifacts.find((a) => artifactType(a) === "red_team_memo");
  if (!advArt) return 0.5;
  const c = advArt.content;
  if (c.includes("ADVERSARIAL RISK: HIGH") || c.includes("HIGH RISK")) return 0.8;
  if (c.includes("ADVERSARIAL RISK: LOW") || c.includes("LOW RISK")) return 0.2;
  return 0.5;
}

export function computeWorkflowEval(
  workflow: WorkflowRunRow,
  events: WorkflowEventRow[],
  artifacts: WorkflowArtifactRow[],
  citationReports: WorkflowCitationReportRow[]
): FullWorkflowEval {
  const { metrics: citationQuality, passRate: citationPassRate } = computeCitationQuality(
    citationReports,
    workflow.citation_pass_rate
  );

  const { metrics: retrievalQuality, coverage: retrievalCoverage } = computeRetrievalQuality(
    artifacts,
    workflow
  );

  const artifactQuality = computeArtifactQuality(artifacts);
  const agentRuntime = computeAgentRuntime(events);

  const faithfulnessScore = round3(
    workflow.faithfulness_score ??
      (citationReports.length > 0
        ? Math.min(
            1,
            (citationQuality.pass + citationQuality.warn * 0.5) / citationReports.length
          )
        : retrievalCoverage * 0.6)
  );

  const localRulesCompleteness = round3(artifactQuality.draftSectionCoverage);
  const judgeScore = round3(judgeBriefCoverageScore(artifacts));
  const adversarialRisk = round3(adversarialRiskScore(artifacts));
  const adversarialSafetyScore = round3(1 - adversarialRisk);

  const unsupportedClaimRisk = round3(
    Math.min(
      1,
      citationQuality.failRate * 0.6 + adversarialRisk * 0.4
    )
  );

  const overallConfidence = round3(
    Math.min(
      1,
      Math.max(
        0,
        citationPassRate * 0.35 +
          faithfulnessScore * 0.25 +
          retrievalCoverage * 0.15 +
          localRulesCompleteness * 0.1 +
          adversarialSafetyScore * 0.1 +
          judgeScore * 0.05
      )
    )
  );

  let passFail: WorkflowEvalSummary["passFail"];
  if (overallConfidence >= 0.75 && citationQuality.fail === 0) {
    passFail = "pass";
  } else if (overallConfidence >= 0.55) {
    passFail = "warn";
  } else {
    passFail = "fail";
  }

  const warnings: string[] = [];
  if (citationQuality.fail > 0) {
    warnings.push(`${citationQuality.fail} citation(s) failed verification.`);
  }
  if (artifactQuality.missingSections.length > 0) {
    warnings.push(
      `Draft missing ${artifactQuality.missingSections.length} required section(s): ${artifactQuality.missingSections.join(", ")}.`
    );
  }
  if (!artifactQuality.hasDraft) {
    warnings.push("No draft artifact found for this workflow run.");
  }
  if (retrievalCoverage === 0) {
    warnings.push("No authority was retrieved. Draft may lack verified legal citations.");
  }
  if (overallConfidence < 0.5) {
    warnings.push(
      "Overall confidence is below 50%. Review the draft and citation verification results before use."
    );
  }

  const summary: WorkflowEvalSummary = {
    workflowRunId: workflow.id,
    faithfulnessScore,
    citationPassRate: round3(citationPassRate),
    retrievalCoverage,
    unsupportedClaimRisk,
    localRulesCompleteness,
    judgeBriefCoverage: judgeScore,
    adversarialRisk,
    overallConfidence,
    passFail,
    warnings,
    generatedAt: new Date().toISOString(),
  };

  return { summary, citationQuality, retrievalQuality, artifactQuality, agentRuntime };
}
