import { listLitigationWorkflowRuns, type WorkflowRunRow } from "@/lib/db/supabaseServer";
import type { EvalDashboardStats } from "./types";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 1000) / 1000;
}

function passFailCategory(run: WorkflowRunRow): "pass" | "warn" | "fail" {
  const c = run.confidence;
  if (c == null) return "fail";
  if (c >= 0.75) return "pass";
  if (c >= 0.55) return "warn";
  return "fail";
}

export async function getEvalDashboardStats(limit = 50): Promise<EvalDashboardStats> {
  const runs = await listLitigationWorkflowRuns(limit);

  const completed = runs.filter((r) => r.status === "completed");
  const failed = runs.filter((r) => r.status === "failed");

  const confidenceScores = completed
    .filter((r) => r.confidence != null)
    .map((r) => r.confidence!);
  const citationRates = completed
    .filter((r) => r.citation_pass_rate != null)
    .map((r) => r.citation_pass_rate!);
  const faithScores = completed
    .filter((r) => r.faithfulness_score != null)
    .map((r) => r.faithfulness_score!);

  const passCount = completed.filter((r) => passFailCategory(r) === "pass").length;
  const warnCount = completed.filter((r) => passFailCategory(r) === "warn").length;
  const failCount = completed.filter((r) => passFailCategory(r) === "fail").length;

  return {
    totalWorkflows: runs.length,
    completedWorkflows: completed.length,
    failedWorkflows: failed.length,
    averageConfidence: avg(confidenceScores),
    averageCitationPassRate: avg(citationRates),
    averageFaithfulnessScore: avg(faithScores),
    passCount,
    warnCount,
    failCount,
    recentEvals: runs.slice(0, 20),
  };
}
