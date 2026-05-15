import {
  getLitigationWorkflowCitationReports,
  type WorkflowCitationReportRow,
} from "@/lib/db/supabaseServer";

export type { WorkflowCitationReportRow };

export async function getWorkflowCitationReports(
  workflowRunId: string
): Promise<WorkflowCitationReportRow[]> {
  return getLitigationWorkflowCitationReports(workflowRunId);
}
