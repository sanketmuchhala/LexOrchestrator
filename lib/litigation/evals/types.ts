export interface WorkflowEvalSummary {
  workflowRunId: string;
  faithfulnessScore: number;
  citationPassRate: number;
  retrievalCoverage: number;
  unsupportedClaimRisk: number;
  localRulesCompleteness: number;
  judgeBriefCoverage: number;
  adversarialRisk: number;
  overallConfidence: number;
  passFail: "pass" | "warn" | "fail";
  warnings: string[];
  generatedAt: string;
}

export interface CitationQualityMetrics {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
  passRate: number;
  failRate: number;
}

export interface RetrievalQualityMetrics {
  totalAuthorities: number;
  authoritiesWithCitation: number;
  jurisdictionsMatched: number;
  courtsMatched: number;
  averageScore: number;
  coverageLabel: "None" | "Partial" | "Good" | "Strong";
}

export interface ArtifactQualityMetrics {
  hasDraft: boolean;
  hasAdversarialReview: boolean;
  hasLocalRulesReview: boolean;
  hasJudgeBrief: boolean;
  draftSectionCoverage: number;
  missingSections: string[];
}

export interface AgentRuntimeMetrics {
  totalEvents: number;
  agentsCompleted: number;
  agentsFailed: number;
  totalLatencyMs: number;
  totalTokenCount: number;
  totalCostUsd: number;
}

export interface FullWorkflowEval {
  summary: WorkflowEvalSummary;
  citationQuality: CitationQualityMetrics;
  retrievalQuality: RetrievalQualityMetrics;
  artifactQuality: ArtifactQualityMetrics;
  agentRuntime: AgentRuntimeMetrics;
}

export interface EvalDashboardStats {
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageConfidence: number | null;
  averageCitationPassRate: number | null;
  averageFaithfulnessScore: number | null;
  passCount: number;
  warnCount: number;
  failCount: number;
  recentEvals: import("@/lib/db/supabaseServer").WorkflowRunRow[];
}
