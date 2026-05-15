// Citation verification types -- Phase 3
// Shared across extraction, verification, and persistence modules.

// ─── Extraction ──────────────────────────────────────────────────────────────

export interface CitationExtractionResult {
  rawText: string;
  normalizedCitation: string;
  startIndex: number;
  endIndex: number;
  surroundingText: string;
  confidence: number;
}

// ─── Verification input/output ───────────────────────────────────────────────

export interface CitationVerificationInput {
  citationText: string;
  proposition?: string;
  quoteText?: string;
  pinCite?: string;
  jurisdiction?: string;
  court?: string;
  workflowRunId?: string;
  draftArtifactId?: string;
}

export type ExistenceStatus = "verified" | "not_found" | "ambiguous" | "unknown";
export type QuoteStatus = "verified" | "failed" | "not_provided" | "unknown";
export type PinCiteStatus = "verified" | "failed" | "not_provided" | "unknown";
export type PropositionStatus = "supported" | "unsupported" | "uncertain" | "not_provided";
export type TreatmentStatus = "positive" | "negative" | "caution" | "unknown";
export type OverallVerificationStatus = "pass" | "warn" | "fail" | "unknown";

export interface VerificationEvidence {
  text: string;
  source: string;
  chunkId?: string;
  score?: number;
}

export interface CitationVerificationResult {
  citationText: string;
  normalizedCitation: string;
  existenceStatus: ExistenceStatus;
  quoteStatus: QuoteStatus;
  pinCiteStatus: PinCiteStatus;
  propositionStatus: PropositionStatus;
  treatmentStatus: TreatmentStatus;
  overallStatus: OverallVerificationStatus;
  matchedOpinionId?: string;
  matchedCaseName?: string;
  matchedCitation?: string;
  confidence: number;
  explanation: string;
  evidence: VerificationEvidence[];
  report: Record<string, unknown>;
}

// ─── Bulk text verification ──────────────────────────────────────────────────

export interface TextVerificationSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
}

export interface TextVerificationResponse {
  citations: CitationVerificationResult[];
  summary: TextVerificationSummary;
}
