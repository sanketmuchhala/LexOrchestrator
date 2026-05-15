import {
  getWorkflowRun,
  type WorkflowRunDetail,
  type WorkflowArtifactRow,
} from "./getWorkflowRun";

const PRIMARY_DRAFT_TYPES = new Set(["outline", "full_draft", "motion_section", "memo"]);

export interface DraftWorkspace extends WorkflowRunDetail {
  primaryDraft: WorkflowArtifactRow | null;
  adversarialReview: WorkflowArtifactRow | null;
  localRulesArtifact: WorkflowArtifactRow | null;
  judgeBriefArtifact: WorkflowArtifactRow | null;
}

export async function getDraftWorkspace(id: string): Promise<DraftWorkspace> {
  const base = await getWorkflowRun(id);

  const primaryDraft =
    base.artifacts.find((a) => PRIMARY_DRAFT_TYPES.has(a.artifact_type)) ?? null;

  const adversarialReview =
    base.artifacts.find((a) => a.artifact_type === "red_team_memo") ?? null;

  const localRulesArtifact =
    base.artifacts.find((a) => a.artifact_type === "local_rules_check") ?? null;

  const judgeBriefArtifact =
    base.artifacts.find((a) => a.artifact_type === "judge_brief") ?? null;

  return { ...base, primaryDraft, adversarialReview, localRulesArtifact, judgeBriefArtifact };
}
