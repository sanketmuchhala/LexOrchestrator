import { insertLitigationWorkflowRun, DB_AVAILABLE } from "@/lib/db/supabaseServer";
import type { LitigationWorkflowInput, WorkflowType } from "./types";

export interface WorkflowRunRecord {
  id: string;
  persisted: boolean;
}

export async function createWorkflowRun(
  input: LitigationWorkflowInput
): Promise<WorkflowRunRecord> {
  const workflowType: WorkflowType = input.workflowType ?? "motion_draft";

  const id = await insertLitigationWorkflowRun({
    workflowType,
    jurisdiction: input.jurisdiction,
    court: input.court,
    judgeId: input.judgeId,
    motionType: input.motionType,
    inputSummary: input.query.slice(0, 500),
    userId: input.userId,
    organizationId: input.organizationId,
    metadata: input.metadata ?? {},
  });

  return { id, persisted: DB_AVAILABLE };
}
