import {
  getWorkflowRun,
  type WorkflowRunDetail,
  type WorkflowArtifactRow,
} from "./getWorkflowRun";
import { computeWorkflowEval } from "./evals/computeWorkflowEval";
import type { FullWorkflowEval } from "./evals/types";

const PRIMARY_DRAFT_TYPES = new Set(["outline", "full_draft", "motion_section", "memo"]);

function artifactType(row: WorkflowArtifactRow): string {
  return typeof row.metadata?.originalArtifactType === "string"
    ? row.metadata.originalArtifactType
    : row.artifact_type;
}

export interface DraftWorkspace extends WorkflowRunDetail {
  primaryDraft: WorkflowArtifactRow | null;
  adversarialReview: WorkflowArtifactRow | null;
  localRulesArtifact: WorkflowArtifactRow | null;
  judgeBriefArtifact: WorkflowArtifactRow | null;
  fullEval: FullWorkflowEval | null;
}

export async function getDraftWorkspace(id: string): Promise<DraftWorkspace> {
  const base = await getWorkflowRun(id);

  const primaryDraft =
    base.artifacts.find((a) => PRIMARY_DRAFT_TYPES.has(artifactType(a))) ?? null;

  const adversarialReview =
    base.artifacts.find((a) => artifactType(a) === "red_team_memo") ?? null;

  const localRulesArtifact =
    base.artifacts.find((a) => artifactType(a) === "local_rules_check") ?? null;

  const judgeBriefArtifact =
    base.artifacts.find((a) => artifactType(a) === "judge_brief") ?? null;

  const fullEval =
    base.workflow != null
      ? computeWorkflowEval(base.workflow, base.events, base.artifacts, base.citationReports)
      : null;

  return {
    ...base,
    primaryDraft,
    adversarialReview,
    localRulesArtifact,
    judgeBriefArtifact,
    fullEval,
  };
}
