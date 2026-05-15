import { insertDraftArtifactRecord, DB_AVAILABLE } from "@/lib/db/supabaseServer";
import type { DraftArtifactOutput } from "./types";

export interface SavedArtifact extends DraftArtifactOutput {
  artifactId: string;
  persisted: boolean;
}

export async function saveDraftArtifact(
  workflowRunId: string,
  artifact: DraftArtifactOutput,
  createdByAgent: string
): Promise<SavedArtifact> {
  const citationRows = artifact.citations.map((c) => ({ citation: c }));

  const artifactId = await insertDraftArtifactRecord({
    workflowRunId,
    artifactType: artifact.artifactType,
    title: artifact.title,
    content: artifact.draftText,
    citations: citationRows,
    createdByAgent,
  });

  return { ...artifact, artifactId, persisted: DB_AVAILABLE };
}
