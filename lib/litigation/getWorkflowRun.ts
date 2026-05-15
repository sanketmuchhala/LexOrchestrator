import {
  getLitigationWorkflowRun,
  getLitigationWorkflowEvents,
  getLitigationWorkflowArtifacts,
  getLitigationWorkflowCitationReports,
  type WorkflowRunRow,
  type WorkflowEventRow,
  type WorkflowArtifactRow,
  type WorkflowCitationReportRow,
} from "@/lib/db/supabaseServer";

export type {
  WorkflowRunRow,
  WorkflowEventRow,
  WorkflowArtifactRow,
  WorkflowCitationReportRow,
};

export interface WorkflowRunDetail {
  workflow: WorkflowRunRow | null;
  events: WorkflowEventRow[];
  artifacts: WorkflowArtifactRow[];
  citationReports: WorkflowCitationReportRow[];
}

export async function getWorkflowRun(id: string): Promise<WorkflowRunDetail> {
  const [workflow, events, artifacts, citationReports] = await Promise.all([
    getLitigationWorkflowRun(id),
    getLitigationWorkflowEvents(id),
    getLitigationWorkflowArtifacts(id),
    getLitigationWorkflowCitationReports(id),
  ]);
  return { workflow, events, artifacts, citationReports };
}
