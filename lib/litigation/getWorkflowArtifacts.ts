import { getLitigationWorkflowArtifacts, type WorkflowArtifactRow } from "@/lib/db/supabaseServer";

export type { WorkflowArtifactRow };

export async function getWorkflowArtifacts(workflowRunId: string): Promise<WorkflowArtifactRow[]> {
  return getLitigationWorkflowArtifacts(workflowRunId);
}
