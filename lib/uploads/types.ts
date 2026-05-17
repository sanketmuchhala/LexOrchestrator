export type CaseFileDocumentRole =
  | "complaint"
  | "deposition"
  | "affidavit"
  | "exhibit"
  | "motion"
  | "case_file"
  | "other";

export interface CaseFileUploadInput {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  documentRole: CaseFileDocumentRole;
  workflowRunId?: string;
  matterId?: string;
}

export type CaseFileExtractionStatus = "extracted" | "error" | "skipped";

export interface ExtractedCaseFile {
  text: string;
  characterCount: number;
  extractionStatus: CaseFileExtractionStatus;
  extractionError?: string;
  truncated: boolean;
}

export interface CaseFileUploadResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  documentRole: CaseFileDocumentRole;
  status: CaseFileExtractionStatus;
  extractedTextPreview: string;
  extractedTextLength: number;
  truncated: boolean;
  persisted: boolean;
}
