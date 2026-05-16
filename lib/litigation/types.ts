import type { LegalOpinionSearchResult } from "@/lib/types";
import type { CitationVerificationResult } from "@/lib/citations/types";

export type WorkflowType = "motion_draft" | "memo" | "brief" | "red_team" | "eval";
export type WorkflowStatus = "queued" | "running" | "completed" | "failed";

// Must match the event_type check constraint in litigation_agent_events (migration 004)
export type AgentEventType =
  | "run_started"
  | "agent_started"
  | "tool_call"
  | "tool_result"
  | "retrieval_result"
  | "citation_validated"
  | "draft_chunk"
  | "agent_completed"
  | "run_completed"
  | "run_failed";

export interface AgentEventRecord {
  agentName: string;
  eventType: AgentEventType;
  eventStatus?: string;
  message?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  latencyMs?: number;
}

export interface LitigationWorkflowInput {
  workflowType?: WorkflowType;
  query: string;
  jurisdiction: string;
  court: string;
  judgeName?: string;
  judgeId?: string;
  motionType?: string;
  uploadedText?: string;
  facts?: string;
  desiredOutput?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export interface DraftSection {
  heading: string;
  content: string;
  citations: string[];
}

export interface DraftArtifactOutput {
  title: string;
  sections: DraftSection[];
  draftText: string;
  citations: string[];
  artifactType: "motion_section" | "memo" | "red_team_memo" | "judge_brief" | "local_rules_check" | "full_draft" | "outline" | "case_file_summary";
}

export interface CitationSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
}

export interface EvalSummary {
  faithfulnessScore: number;
  citationPassRate: number;
  retrievalCoverage: number;
  unsupportedClaimRisk: number;
  overallConfidence: number;
  passFail: "pass" | "fail";
}

export interface LitigationWorkflowResult {
  workflowRunId: string;
  status: WorkflowStatus;
  finalOutput: string;
  artifacts: DraftArtifactOutput[];
  citationSummary: CitationSummary;
  evalSummary: EvalSummary;
  events: AgentEventRecord[];
}

export interface JudgeProfileData {
  judgeId: string;
  judgeName: string;
  court: string | null;
  jurisdiction: string | null;
  styleNotes: string | null;
  argumentGuidance: string | null;
  sourceOpinionCount: number;
  motionType: string | null;
}

export interface AgentContext {
  workflowRunId: string;
  input: LitigationWorkflowInput;
  retrievedAuthority: LegalOpinionSearchResult[];
  draftArtifacts: DraftArtifactOutput[];
  citationReports: CitationVerificationResult[];
  judgeProfile: JudgeProfileData | null;
  metadata: Record<string, unknown>;
}

export interface AgentResult {
  agentName: string;
  status: "success" | "error" | "fallback";
  message: string;
  output: Record<string, unknown>;
  confidence: number;
  events: AgentEventRecord[];
}

// ─── Per-agent typed outputs ──────────────────────────────────────────────────

export interface IntakeAgentOutput {
  motionType: string;
  jurisdiction: string;
  court: string;
  keyFacts: string[];
  legalIssues: string[];
  requestedDraftType: string;
  missingInputs: string[];
}

export interface RetrievalAgentOutput {
  retrievedAuthority: LegalOpinionSearchResult[];
  searchQueries: string[];
  retrievalSummary: string;
}

export type DraftingAgentOutput = DraftArtifactOutput;

export interface CitationAgentOutput {
  citationReports: CitationVerificationResult[];
  citationSummary: CitationSummary;
}

export interface AdversarialAgentOutput {
  strongestWeaknesses: string[];
  unsupportedClaims: string[];
  likelyCounterarguments: string[];
  riskLevel: "low" | "medium" | "high";
  redTeamMemo: string;
}

export interface LocalRulesAgentOutput {
  profileId: string;
  profileLabel: string;
  formattingNotes: string[];
  requiredSections: string[];
  missingSections: string[];
  citationNotes: string[];
  filingNotes: string[];
  warnings: string[];
  revisedDraftText?: string;
  confidence: number;
  limitations: string[];
  artifactContent: string;
  sectionChecks: Array<{
    sectionId: string;
    label: string;
    required: boolean;
    detected: boolean;
  }>;
}

export type JudgeMatchStatus =
  | "exact"
  | "partial"
  | "not_found"
  | "ambiguous"
  | "not_requested";

export interface JudgeBriefResult {
  judgeName: string | null;
  court: string | null;
  jurisdiction: string | null;
  matchStatus: JudgeMatchStatus;
  profileAvailable: boolean;
  sourceOpinionCount: number;
  styleNotes: string[];
  citationPreferences: string[];
  argumentGuidance: string[];
  motionTypeGuidance: string[];
  riskNotes: string[];
  confidence: number;
  limitations: string[];
  artifactContent: string;
}

export type JudgeBriefAgentOutput = JudgeBriefResult;

export type EvalAgentOutput = EvalSummary;
