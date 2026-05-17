export type ExportFormat = "pdf" | "docx" | "txt";

export interface DraftExportOptions {
  includeMetadata?: boolean;
  includeVerificationSummary?: boolean;
  includeJudgeBrief?: boolean;
  includeLocalRulesReview?: boolean;
  includeAdversarialReview?: boolean;
}

export interface DraftExportInput {
  workflowRunId: string;
  format: ExportFormat;
  options?: DraftExportOptions;
}

export interface DocumentSection {
  heading?: string;
  isMainHeading?: boolean;
  body: string;
}

export interface CitationExportSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
}

export interface DraftExportPayload {
  title: string;
  motionType: string | null;
  jurisdiction: string | null;
  court: string | null;
  workflowRunId: string;
  exportedAt: string;
  version: number;
  verificationStatus: string | null;
  citationSummary: CitationExportSummary | null;
  mainSections: DocumentSection[];
  appendixJudgeBrief: string | null;
  appendixLocalRules: string | null;
  appendixAdversarial: string | null;
}

export interface DraftExportResult {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  format: ExportFormat;
}
