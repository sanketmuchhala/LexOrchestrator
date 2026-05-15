import { listLitigationWorkflowRuns, type WorkflowRunRow } from "@/lib/db/supabaseServer";

export type { WorkflowRunRow };

export async function listWorkflowEvals(limit = 50): Promise<WorkflowRunRow[]> {
  return listLitigationWorkflowRuns(limit);
}
