// Shared TypeScript interfaces for the LexOrchestrator multi-agent pipeline

export interface IntakeResult {
  legalIssue: "contract" | "tort" | "evidence" | "procedure" | "discovery" | "general";
  jurisdiction: string;
  documentType: "motion" | "brief" | "opinion" | "deposition" | "general";
  riskLevel: "low" | "medium" | "high";
  queryClassification: string;
  keyTerms: string[];
  confidence: number;
}

export interface RetrievedSource {
  id: string;
  title: string;
  text: string;
  docType: string;
  jurisdiction: string;
  keywords: string[];
  relevanceScore: number;
}

export interface RetrievalResult {
  sources: RetrievedSource[];
  retrievalStrategy: string;
  coverageAssessment: string;
  totalSearched: number;
}

export interface ValidatedClaim {
  claim: string;
  supportingCitationId: string | null;
  supportStrength: "strong" | "weak" | "unsupported";
  flag: string | null;
}

export interface CitationValidationResult {
  claims: ValidatedClaim[];
  overallScore: number;
  flags: string[];
  supportedCount: number;
  unsupportedCount: number;
}

export interface AdversarialReviewResult {
  weaknesses: string[];
  missingAuthority: string[];
  counterarguments: string[];
  overallRisk: "low" | "medium" | "high";
  summary: string;
}

export interface FinalAnswerResult {
  answer: string;
  citations: string[];
  confidenceScore: number;
  riskFlags: string[];
  unresolvedQuestions: string[];
}

export interface EvalReport {
  groundednessScore: number;
  citationAccuracyScore: number;
  hallucinationRisk: "low" | "medium" | "high";
  retrievalCoverage: number;
  finalAnswerConfidence: number;
  overallReliability: number;
}

export interface ExecutionStep {
  agent: string;
  durationMs: number;
  status: "complete" | "error";
}

export interface OrchestratorResult {
  query: string;
  intake: IntakeResult;
  retrievedSources: RetrievedSource[];
  citationValidation: CitationValidationResult;
  adversarialReview: AdversarialReviewResult;
  finalAnswer: FinalAnswerResult;
  evalReport: EvalReport;
  executionTrace: ExecutionStep[];
}

export interface CorpusEntry {
  id: string;
  title: string;
  text: string;
  docType: string;
  jurisdiction: string;
  keywords: string[];
}
