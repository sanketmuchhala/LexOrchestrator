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
  // "primary" = US Constitution and other authoritative sources (retrieval priority boost)
  // "sample" = sample educational corpus
  source_type?: string;
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
  score: number;
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

// ─── Corpus (in-memory fallback) ─────────────────────────────────────────────

export interface CorpusEntry {
  id: string;
  title: string;
  text: string;
  docType: string;
  jurisdiction: string;
  keywords: string[];
}
