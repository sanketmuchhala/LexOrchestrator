import { getLitigationWorkflowArtifacts, getDraftRevisionsByArtifactId } from "@/lib/db/supabaseServer";
import type { EditableDraft, DraftRevision } from "./types";

const PRIMARY_DRAFT_TYPES = new Set(["outline", "full_draft", "motion_section", "memo"]);

function rowToRevision(row: {
  id: string;
  workflowRunId: string;
  draftArtifactId: string | null;
  version: number;
  content: string;
  editSummary: string | null;
  verificationStatus: string | null;
  citationSummary: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}): DraftRevision {
  const summary = row.citationSummary;
  return {
    ...row,
    citationSummary: {
      total: (summary.total as number) ?? 0,
      pass: (summary.pass as number) ?? 0,
      warn: (summary.warn as number) ?? 0,
      fail: (summary.fail as number) ?? 0,
      unknown: (summary.unknown as number) ?? 0,
    },
  };
}

export async function getEditableDraft(workflowRunId: string): Promise<EditableDraft> {
  const artifacts = await getLitigationWorkflowArtifacts(workflowRunId);
  const primaryArtifact = artifacts.find((a) => PRIMARY_DRAFT_TYPES.has(a.artifact_type)) ?? null;

  if (!primaryArtifact) {
    return {
      workflowRunId,
      draftArtifactId: null,
      content: "",
      version: 1,
      verificationStatus: null,
      latestRevision: null,
    };
  }

  // Check for manual revisions (newest first, limit 1)
  const revisions = await getDraftRevisionsByArtifactId(primaryArtifact.id, 1);
  const latestRevision = revisions.length > 0 ? rowToRevision(revisions[0]) : null;

  return {
    workflowRunId,
    draftArtifactId: primaryArtifact.id,
    content: latestRevision?.content ?? primaryArtifact.content,
    version: latestRevision?.version ?? primaryArtifact.version ?? 1,
    verificationStatus: latestRevision?.verificationStatus ?? primaryArtifact.verification_status,
    latestRevision,
  };
}
