import { linkWorkflowRunToMatter } from "@/lib/db/supabaseServer";

export async function linkWorkflowToMatter(workflowRunId: string, matterId: string): Promise<void> {
  await linkWorkflowRunToMatter(workflowRunId, matterId);
}
