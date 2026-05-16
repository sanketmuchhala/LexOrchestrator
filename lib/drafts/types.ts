import type { CitationSummary } from "@/lib/litigation/types";
import type { CitationVerificationResult } from "@/lib/citations/types";

export type { CitationSummary };

export interface DraftRevision {
  id: string;
  workflowRunId: string;
  draftArtifactId: string | null;
  version: number;
  content: string;
  editSummary: string | null;
  verificationStatus: string | null;
  citationSummary: CitationSummary;
  createdBy: string;
  createdAt: string;
}

export interface DraftSaveInput {
  workflowRunId: string;
  draftArtifactId: string;
  content: string;
  editSummary?: string;
  currentVersion?: number;
}

export interface DraftSaveResult {
  revision: DraftRevision;
  persisted: boolean;
}

export interface DraftVerificationRunResult {
  citationSummary: CitationSummary;
  reports: CitationVerificationResult[];
  verificationStatus: "pending" | "verified" | "partial" | "failed";
}

export interface EditableDraft {
  workflowRunId: string;
  draftArtifactId: string | null;
  content: string;
  version: number;
  verificationStatus: string | null;
  latestRevision: DraftRevision | null;
}
