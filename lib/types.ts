// Shared TypeScript interfaces for the LexOrchestrator multi-agent pipeline

// ─── Intake Agent ────────────────────────────────────────────────────────────

export interface IntakeResult {
  legalIssue: "contract" | "tort" | "evidence" | "procedure" | "discovery" | "general";
  jurisdiction: string;
  documentType: "motion" | "brief" | "opinion" | "deposition" | "general";
  riskLevel: "low" | "medium" | "high";
  queryClassification: string;
  keyTerms: string[];
  confidence: number;
}

// ─── Retrieval Agent ─────────────────────────────────────────────────────────

export interface RetrievedSource {
  id: string;          // DB uuid or citation_id for in-memory fallback
  citationId: string;  // SAMPLE-001 etc.
  title: string;
  text: string;
  docType: string;
  jurisdiction: string;
  keywords: string[];
  relevanceScore: number;  // = finalScore for backward compat
  reason?: string;
  // Phase 2: hybrid RAG scoring
  keywordScore?: number;
  vectorScore?: number;
  hybridScore?: number;
  rerankScore?: number;
  finalScore?: number;
  rankPosition?: number;
  retrievalMethod?: "hybrid_rag" | "keyword_fallback" | "memory_fallback";
}

export interface RetrievalResult {
  sources: RetrievedSource[];
  retrievalStrategy: string;
  coverageAssessment: string;
  totalSearched: number;
}

// ─── Citation Validator ──────────────────────────────────────────────────────

export interface ValidatedClaim {
  claim: string;
  citationId: string | null;
  supportStatus: "verified" | "partial" | "unsupported";
  supportScore: number;
  explanation: string;
}

export interface CitationValidationResult {
  claims: ValidatedClaim[];
  overallScore: number;
  flags: string[];
  supportedCount: number;
  unsupportedCount: number;
}

// ─── Hallucination Risk Agent ────────────────────────────────────────────────

export interface HallucinationRiskResult {
  riskScore: number;       // 0–1 numeric
  riskLevel: "low" | "medium" | "high";
  factors: string[];
  unsupportedCitationCount: number;
}

// ─── Adversarial Review Agent ─────────────────────────────────────────────────

export interface AdversarialReviewResult {
  weaknesses: string[];
  missingAuthority: string[];
  counterarguments: string[];
  overallRisk: "low" | "medium" | "high";
  summary: string;
}

// ─── Final Synthesis Agent ───────────────────────────────────────────────────

export interface FinalAnswerResult {
  answer: string;
  citations: string[];
  confidenceScore: number;
  riskFlags: string[];
  unresolvedQuestions: string[];
}

// ─── Eval Engine ─────────────────────────────────────────────────────────────

// Phase 2: retrieval quality summary included in eval payload
export interface RetrievalQualityMetrics {
  retrievalMethod: string;
  vectorSearchUsed: boolean;
  fallbackUsed: boolean;
  averageHybridScore: number;
  topSourceScore: number;
  sourceCount: number;
}

export interface EvalReport {
  groundednessScore: number;
  citationAccuracyScore: number;
  hallucinationRisk: "low" | "medium" | "high";  // categorical display
  hallucinationRiskScore: number;                 // numeric 0–1 for DB
  retrievalCoverage: number;
  finalAnswerConfidence: number;
  overallReliability: number;
  passFail: "pass" | "fail";                      // pass if overallReliability >= 0.6
  retrievalQuality?: RetrievalQualityMetrics;     // Phase 2: hybrid RAG metrics
}

// ─── Execution Trace ─────────────────────────────────────────────────────────

export interface ExecutionStep {
  agent: string;
  durationMs: number;
  status: "complete" | "error";
}

// ─── Phase 1 Full Result ─────────────────────────────────────────────────────

export interface Phase1OrchestratorResult {
  runId: string;
  query: string;
  intake: IntakeResult;
  retrievedSources: RetrievedSource[];
  citationValidation: CitationValidationResult;
  hallucinationRisk: HallucinationRiskResult;
  adversarialReview: AdversarialReviewResult;
  finalAnswer: FinalAnswerResult;
  evalReport: EvalReport;
  executionTrace: ExecutionStep[];
  persisted: boolean;
  modelUsed: string;
}

// ─── DB Types ─────────────────────────────────────────────────────────────────

// ── Organizations & Users ──────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  organization_id: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// ── Document Corpus ────────────────────────────────────────────────────────────

export interface DocumentRecord {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  title: string;
  source_type: "primary" | "secondary" | "user_upload" | "sample";
  jurisdiction: string | null;
  practice_area: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  original_filename: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  status: "pending" | "processing" | "indexed" | "error";
  error_message: string | null;
  chunk_count: number;
  authority_level: number;
  citation_prefix: string | null;
  disclaimer: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunkFromDB {
  id: string;
  document_id: string;
  citation_id: string;
  chunk_index: number;
  chunk_text: string;
  chunk_summary: string | null;
  page_number: number | null;
  section_heading: string | null;
  keywords: string[];
  jurisdiction: string | null;
  practice_area: string | null;
  source_type: "primary" | "secondary" | "user_upload" | "sample";
  embedding_model: string | null;
  authority_weight: number;
  created_at: string;
}

// Backward-compat alias used throughout retrieval pipeline
export interface LegalChunkFromDB {
  id: string;
  document_id: string;
  citation_id: string;
  chunk_text: string;
  keywords: string[];
  jurisdiction: string | null;
  practice_area: string | null;
  document_title?: string;
  disclaimer?: string;
  source_type?: string;
  authority_weight?: number;
}

// Phase 2: vector search result with cosine similarity score
export interface LegalChunkWithSimilarity extends LegalChunkFromDB {
  similarity: number;
}

export interface RunSummary {
  id: string;
  query: string;
  status: string;
  model: string | null;
  confidence: number | null;
  hallucination_risk: number | null;
  created_at: string;
}

export interface RunDetail {
  run: RunSummary;
  traces: AgentTraceRecord[];
  retrievalResults: RetrievalResultRecord[];
  citationValidations: CitationValidationRecord[];
  evalReport: EvalReportRecord | null;
}

export interface AgentTraceRecord {
  id: string;
  step_index: number;
  agent_name: string;
  input_summary: string | null;
  output_summary: string | null;
  status: string | null;
  risk_flag: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface RetrievalResultRecord {
  id: string;
  citation_id: string;
  final_score: number;
  reason: string | null;
  created_at: string;
}

export interface CitationValidationRecord {
  id: string;
  claim: string;
  citation_id: string | null;
  support_status: string;
  support_score: number;
  explanation: string | null;
  created_at: string;
}

export interface EvalReportRecord {
  id: string;
  groundedness_score: number;
  citation_accuracy_score: number;
  retrieval_coverage_score: number;
  hallucination_risk_score: number;
  final_reliability_score: number;
  pass_fail_status: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// ─── Litigation Workflow DB Types (Migration 004) ────────────────────────────

export interface LegalOpinion {
  id: string;
  external_id: string | null;
  source: "courtlistener" | "cap" | "demo" | "public" | "manual";
  court: string | null;
  jurisdiction: string | null;
  case_name: string;
  citation: string | null;
  decision_date: string | null;
  judge_name: string | null;
  opinion_url: string | null;
  raw_text: string | null;
  html_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LegalOpinionChunk {
  id: string;
  opinion_id: string;
  chunk_index: number;
  chunk_text: string;
  page_start: number | null;
  page_end: number | null;
  span_start: number | null;
  span_end: number | null;
  citation: string | null;
  court: string | null;
  jurisdiction: string | null;
  decision_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LegalJudge {
  id: string;
  external_id: string | null;
  full_name: string;
  court: string | null;
  jurisdiction: string | null;
  appointment_source: string | null;
  education: string | null;
  prior_roles: string | null;
  biography: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface JudgeProfile {
  id: string;
  judge_id: string;
  profile_version: string;
  motion_type: string | null;
  jurisdiction: string | null;
  grant_rate_summary: Record<string, unknown>;
  citation_preferences: Record<string, unknown>;
  style_notes: string | null;
  argument_guidance: string | null;
  source_opinion_count: number;
  generated_by: string | null;
  generated_at: string;
  metadata: Record<string, unknown>;
}

export interface LitigationWorkflowRun {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  workflow_type: "motion_draft" | "memo" | "brief" | "red_team" | "eval";
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  jurisdiction: string | null;
  court: string | null;
  judge_id: string | null;
  motion_type: string | null;
  input_summary: string | null;
  final_output: string | null;
  confidence: number | null;
  faithfulness_score: number | null;
  citation_pass_rate: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LitigationAgentEvent {
  id: string;
  workflow_run_id: string;
  agent_name: string;
  event_type: string;
  event_status: string | null;
  message: string | null;
  tool_name: string | null;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown>;
  token_count: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface DraftArtifact {
  id: string;
  workflow_run_id: string;
  artifact_type: "motion_section" | "memo" | "red_team_memo" | "judge_brief" | "local_rules_check" | "full_draft" | "outline";
  title: string | null;
  content: string;
  citations: Record<string, unknown>[];
  verification_status: "pending" | "verified" | "partial" | "failed" | null;
  version: number;
  created_by_agent: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface CitationVerificationReport {
  id: string;
  workflow_run_id: string;
  draft_artifact_id: string | null;
  citation_text: string;
  normalized_citation: string | null;
  opinion_id: string | null;
  proposition: string | null;
  quote_text: string | null;
  pin_cite: string | null;
  existence_status: "found" | "not_found" | "error" | null;
  quote_status: "exact_match" | "close_match" | "mismatch" | "not_checked" | null;
  pin_cite_status: "confirmed" | "mismatch" | "not_checked" | null;
  proposition_status: "supported" | "partially_supported" | "unsupported" | "not_checked" | null;
  treatment_status: "positive" | "negative" | "neutral" | "not_checked" | null;
  overall_status: "verified" | "parsed_unverified" | "quote_mismatch" | "pin_mismatch" | "unsupported_proposition" | "not_found" | "error" | "unknown";
  report: Record<string, unknown>;
  created_at: string;
}

// ─── Corpus (in-memory fallback) ─────────────────────────────────────────────

export interface CorpusEntry {
  id: string;
  title: string;
  text: string;
  docType: string;
  jurisdiction: string;
  keywords: string[];
}

// ─── Legal Opinion Search (Phase 2) ──────────────────────────────────────────

export interface LegalOpinionSearchInput {
  query: string;
  jurisdiction?: string;
  court?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  minScore?: number;
}

export interface LegalOpinionSearchResult {
  chunkId: string;
  opinionId: string;
  caseName: string;
  citation: string | null;
  court: string | null;
  jurisdiction: string | null;
  decisionDate: string | null;
  chunkText: string;
  chunkIndex: number;
  pageStart: number | null;
  pageEnd: number | null;
  spanStart: number | null;
  spanEnd: number | null;
  score: number;
  keywordScore: number;
  vectorScore: number;
  authorityScore: number;
  metadata: Record<string, unknown>;
}

export type LegalOpinionSearchSource =
  | "legal_opinions"
  | "legacy_document_chunks"
  | "memory"
  | "empty";

export interface LegalOpinionSearchResponse {
  results: LegalOpinionSearchResult[];
  fallbackUsed: boolean;
  source: LegalOpinionSearchSource;
  retrievalMethod: string;
  totalCandidates: number;
}

