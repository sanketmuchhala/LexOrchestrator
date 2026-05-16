import { getDraftRevisionsByArtifactId } from "@/lib/db/supabaseServer";
import type { DraftRevision } from "./types";

export async function listDraftRevisions(draftArtifactId: string): Promise<DraftRevision[]> {
  const rows = await getDraftRevisionsByArtifactId(draftArtifactId);
  return rows.map((row) => {
    const summary = row.citationSummary;
    return {
      id: row.id,
      workflowRunId: row.workflowRunId,
      draftArtifactId: row.draftArtifactId,
      version: row.version,
      content: row.content,
      editSummary: row.editSummary,
      verificationStatus: row.verificationStatus,
      citationSummary: {
        total: (summary.total as number) ?? 0,
        pass: (summary.pass as number) ?? 0,
        warn: (summary.warn as number) ?? 0,
        fail: (summary.fail as number) ?? 0,
        unknown: (summary.unknown as number) ?? 0,
      },
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  });
}
