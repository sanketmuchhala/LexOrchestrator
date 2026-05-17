import {
  listLitigationWorkflowRuns,
  getLitigationWorkflowEventsBatch,
} from "@/lib/db/supabaseServer";
import { buildWorkflowPerformance } from "./buildWorkflowPerformance";
import { average, percentile } from "./metrics";
import type {
  ObservabilityDashboardStats,
  WorkflowPerformanceSummary,
  AgentBreakdownStat,
} from "./types";

function buildAgentBreakdown(workflows: WorkflowPerformanceSummary[]): AgentBreakdownStat[] {
  const map = new Map<string, AgentBreakdownStat>();

  for (const wf of workflows) {
    for (const agent of wf.agentSummaries) {
      const existing = map.get(agent.agentName) ?? {
        agentName: agent.agentName,
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        totalLatencyMs: 0,
        averageLatencyMs: 0,
        totalTokenCount: 0,
        totalCostUsd: 0,
        totalToolCalls: 0,
        totalWarnings: 0,
        totalErrors: 0,
      };
      existing.totalRuns++;
      if (agent.completed) existing.completedRuns++;
      if (agent.failed) existing.failedRuns++;
      existing.totalLatencyMs += agent.totalLatencyMs;
      existing.totalTokenCount += agent.tokenCount;
      existing.totalCostUsd += agent.costUsd;
      existing.totalToolCalls += agent.toolCalls;
      existing.totalWarnings += agent.warnings;
      existing.totalErrors += agent.errors;
      map.set(agent.agentName, existing);
    }
  }

  return Array.from(map.values()).map((stat) => ({
    ...stat,
    averageLatencyMs: stat.totalRuns > 0 ? Math.round(stat.totalLatencyMs / stat.totalRuns) : 0,
  }));
}

const EMPTY_STATS: ObservabilityDashboardStats = {
  totalWorkflows: 0,
  completedWorkflows: 0,
  failedWorkflows: 0,
  averageDurationMs: 0,
  averageCostUsd: 0,
  averageTokenCount: 0,
  averageConfidence: 0,
  averageCitationPassRate: 0,
  p50DurationMs: 0,
  p95DurationMs: 0,
  p50CostUsd: 0,
  p95CostUsd: 0,
  slowestRecentWorkflow: null,
  mostExpensiveRecentWorkflow: null,
  mostFailureProneAgent: null,
  recentWorkflows: [],
  agentBreakdown: [],
};

export async function getObservabilityDashboardStats(
  limit = 50
): Promise<ObservabilityDashboardStats> {
  const runs = await listLitigationWorkflowRuns(limit);
  if (runs.length === 0) return EMPTY_STATS;

  const runIds = runs.map((r) => r.id);
  const allEvents = await getLitigationWorkflowEventsBatch(runIds);

  const eventsByRun = new Map<string, typeof allEvents>();
  for (const ev of allEvents) {
    const existing = eventsByRun.get(ev.workflow_run_id) ?? [];
    existing.push(ev);
    eventsByRun.set(ev.workflow_run_id, existing);
  }

  const performances = runs.map((run) =>
    buildWorkflowPerformance(run, eventsByRun.get(run.id) ?? [])
  );

  const completed = performances.filter((p) => p.status === "completed");
  const failed = performances.filter((p) => p.status === "failed");

  const durations = performances
    .map((p) => p.durationMs)
    .filter((d): d is number => d != null && d > 0)
    .sort((a, b) => a - b);

  const costs = performances
    .map((p) => p.totalCostUsd)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);

  const confidences = performances
    .map((p) => p.confidence)
    .filter((c): c is number => c != null);

  const citationRates = performances
    .map((p) => p.citationPassRate)
    .filter((r): r is number => r != null);

  const tokenCounts = performances
    .map((p) => p.totalTokenCount)
    .filter((t) => t > 0);

  const slowest = performances.reduce<WorkflowPerformanceSummary | null>((prev, p) => {
    if (p.durationMs == null) return prev;
    if (prev === null || (prev.durationMs ?? 0) < p.durationMs) return p;
    return prev;
  }, null);

  const mostExpensive = performances.reduce<WorkflowPerformanceSummary | null>((prev, p) => {
    if (p.totalCostUsd === 0) return prev;
    if (prev === null || prev.totalCostUsd < p.totalCostUsd) return p;
    return prev;
  }, null);

  const agentBreakdown = buildAgentBreakdown(performances);
  const mostFailureProneAgent = agentBreakdown.reduce<AgentBreakdownStat | null>((prev, a) => {
    if (prev === null || a.failedRuns > prev.failedRuns) return a;
    return prev;
  }, null);

  return {
    totalWorkflows: performances.length,
    completedWorkflows: completed.length,
    failedWorkflows: failed.length,
    averageDurationMs: Math.round(average(durations)),
    averageCostUsd: average(costs),
    averageTokenCount: Math.round(average(tokenCounts)),
    averageConfidence: average(confidences),
    averageCitationPassRate: average(citationRates),
    p50DurationMs: percentile(durations, 50),
    p95DurationMs: percentile(durations, 95),
    p50CostUsd: percentile(costs, 50),
    p95CostUsd: percentile(costs, 95),
    slowestRecentWorkflow: slowest,
    mostExpensiveRecentWorkflow: mostExpensive,
    mostFailureProneAgent: (mostFailureProneAgent?.failedRuns ?? 0) > 0 ? mostFailureProneAgent?.agentName ?? null : null,
    recentWorkflows: performances,
    agentBreakdown,
  };
}
