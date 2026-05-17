import { getMatterById, getMatterWorkflowRuns, getMatterFiles } from "@/lib/db/supabaseServer";
import type { MatterWorkspace, MatterWorkflowSummary, MatterQualitySignals } from "./types";

function buildWorkflowSummary(run: Awaited<ReturnType<typeof getMatterWorkflowRuns>>[number]): MatterWorkflowSummary {
  return {
    ...run,
    draftLink: `/draft/${run.id}`,
    workflowLink: `/workflows/${run.id}`,
    evalLink: `/evals/${run.id}`,
    traceLink: `/traces/${run.id}`,
  };
}

function buildQualitySignals(workflows: MatterWorkflowSummary[]): MatterQualitySignals {
  const completed = workflows.filter((w) => w.status === "completed");
  const latest = completed[0] ?? null;

  return {
    latestConfidence: latest?.confidence ?? null,
    latestCitationPassRate: latest?.citation_pass_rate ?? null,
    latestFaithfulnessScore: latest?.faithfulness_score ?? null,
    completedWorkflowCount: completed.length,
    failedWorkflowCount: workflows.filter((w) => w.status === "failed").length,
  };
}

export async function getMatterWorkspace(matterId: string): Promise<MatterWorkspace | null> {
  const matter = await getMatterById(matterId);
  if (!matter) return null;

  const [rawWorkflows, files] = await Promise.all([
    getMatterWorkflowRuns(matterId),
    getMatterFiles(matterId),
  ]);

  const workflows = rawWorkflows.map(buildWorkflowSummary);
  const qualitySignals = buildQualitySignals(workflows);

  return { matter, workflows, files, qualitySignals };
}
