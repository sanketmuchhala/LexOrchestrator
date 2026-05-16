import {
  updateDraftArtifactContent,
  insertDraftRevisionRecord,
  getDraftRevisionsByArtifactId,
  DB_AVAILABLE,
} from "@/lib/db/supabaseServer";
import type { DraftSaveInput, DraftSaveResult, DraftRevision } from "./types";

function emptyRevision(input: DraftSaveInput, version: number): DraftRevision {
  return {
    id: crypto.randomUUID(),
    workflowRunId: input.workflowRunId,
    draftArtifactId: input.draftArtifactId,
    version,
    content: input.content,
    editSummary: input.editSummary ?? null,
    verificationStatus: "pending",
    citationSummary: { total: 0, pass: 0, warn: 0, fail: 0, unknown: 0 },
    createdBy: "user",
    createdAt: new Date().toISOString(),
  };
}

export async function saveDraftRevision(input: DraftSaveInput): Promise<DraftSaveResult> {
  // Determine next version
  let nextVersion = (input.currentVersion ?? 1) + 1;

  if (DB_AVAILABLE) {
    // Get latest version from DB to avoid conflicts
    const existing = await getDraftRevisionsByArtifactId(input.draftArtifactId, 1);
    if (existing.length > 0) {
      nextVersion = Math.max(nextVersion, existing[0].version + 1);
    }
  }

  if (!DB_AVAILABLE) {
    return {
      revision: emptyRevision(input, nextVersion),
      persisted: false,
    };
  }

  // Update the canonical artifact to reflect latest content
  await updateDraftArtifactContent(input.draftArtifactId, input.content, nextVersion);

  // Persist revision history
  const revisionId = await insertDraftRevisionRecord({
    workflowRunId: input.workflowRunId,
    draftArtifactId: input.draftArtifactId,
    version: nextVersion,
    content: input.content,
    editSummary: input.editSummary,
    verificationStatus: "pending",
    citationSummary: {},
    createdBy: "user",
  });

  const revision: DraftRevision = {
    id: revisionId,
    workflowRunId: input.workflowRunId,
    draftArtifactId: input.draftArtifactId,
    version: nextVersion,
    content: input.content,
    editSummary: input.editSummary ?? null,
    verificationStatus: "pending",
    citationSummary: { total: 0, pass: 0, warn: 0, fail: 0, unknown: 0 },
    createdBy: "user",
    createdAt: new Date().toISOString(),
  };

  return { revision, persisted: true };
}
