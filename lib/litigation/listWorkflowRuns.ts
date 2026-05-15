import { listLitigationWorkflowRuns, type WorkflowRunRow } from "@/lib/db/supabaseServer";

export type { WorkflowRunRow };

export async function listWorkflowRuns(limit = 50): Promise<WorkflowRunRow[]> {
  return listLitigationWorkflowRuns(limit);
}
