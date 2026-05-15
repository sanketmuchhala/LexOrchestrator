import { getLitigationWorkflowEvents, type WorkflowEventRow } from "@/lib/db/supabaseServer";

export type { WorkflowEventRow };

export async function getWorkflowEvents(workflowRunId: string): Promise<WorkflowEventRow[]> {
  return getLitigationWorkflowEvents(workflowRunId);
}
