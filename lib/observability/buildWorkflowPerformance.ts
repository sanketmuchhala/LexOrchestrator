import type { WorkflowRunRow, WorkflowEventRow } from "@/lib/db/supabaseServer";
import type { WorkflowPerformanceSummary, AgentPerformanceSummary } from "./types";
import { average, safeMs, estimateCostFromTokens } from "./metrics";

const COMPLETED_TYPES = new Set(["agent_completed", "run_completed"]);
const FAILED_TYPES = new Set(["run_failed"]);
const TOOL_TYPES = new Set(["tool_call", "tool_result"]);
const WARNING_STATUSES = new Set(["warn", "warning"]);
const ERROR_STATUSES = new Set(["error", "failed"]);

function groupEventsByAgent(events: WorkflowEventRow[]): Map<string, WorkflowEventRow[]> {
  const map = new Map<string, WorkflowEventRow[]>();
  for (const ev of events) {
    const existing = map.get(ev.agent_name) ?? [];
    existing.push(ev);
    map.set(ev.agent_name, existing);
  }
  return map;
}

function buildAgentSummary(agentName: string, events: WorkflowEventRow[]): AgentPerformanceSummary {
  const completed = events.some((e) => COMPLETED_TYPES.has(e.event_type));
  const failed = events.some((e) => FAILED_TYPES.has(e.event_type));
  const totalLatencyMs = events.reduce((sum, e) => sum + (e.latency_ms ?? 0), 0);
  const latencyValues = events.map((e) => e.latency_ms ?? 0).filter((v) => v > 0);
  const tokenCount = events.reduce((sum, e) => sum + (e.token_count ?? 0), 0);
  const costUsd = events.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0);
  const toolCalls = events.filter((e) => TOOL_TYPES.has(e.event_type)).length;
  const warnings = events.filter((e) => WARNING_STATUSES.has(e.event_status ?? "")).length;
  const errors = events.filter((e) => ERROR_STATUSES.has(e.event_status ?? "") || FAILED_TYPES.has(e.event_type)).length;

  return {
    agentName,
    eventCount: events.length,
    completed,
    failed,
    totalLatencyMs,
    averageLatencyMs: Math.round(average(latencyValues)),
    tokenCount,
    costUsd,
    toolCalls,
    warnings,
    errors,
  };
}

export function buildWorkflowPerformance(
  workflow: WorkflowRunRow,
  events: WorkflowEventRow[]
): WorkflowPerformanceSummary {
  const durationMs = safeMs(workflow.created_at, workflow.updated_at);
  const byAgent = groupEventsByAgent(events);

  const agentSummaries: AgentPerformanceSummary[] = Array.from(byAgent.entries()).map(
    ([name, agentEvents]) => buildAgentSummary(name, agentEvents)
  );

  const agentsCompleted = agentSummaries.filter((a) => a.completed).length;
  const agentsFailed = agentSummaries.filter((a) => a.failed).length;

  const totalLatencyMs = events.reduce((sum, e) => sum + (e.latency_ms ?? 0), 0);
  const latencyValues = events.map((e) => e.latency_ms ?? 0).filter((v) => v > 0);

  const totalTokenCount = events.reduce((sum, e) => sum + (e.token_count ?? 0), 0);
  const recordedCostUsd = events.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0);

  const hasActualCost = events.some((e) => (e.cost_usd ?? 0) > 0);
  const hasTokens = totalTokenCount > 0;
  const estimatedCost = !hasActualCost && hasTokens ? (estimateCostFromTokens(totalTokenCount) ?? 0) : 0;
  const totalCostUsd = hasActualCost ? recordedCostUsd : estimatedCost;
  const costIsEstimated = !hasActualCost && hasTokens;

  const slowest = agentSummaries.reduce<AgentPerformanceSummary | null>((prev, a) => {
    if (prev === null || a.totalLatencyMs > prev.totalLatencyMs) return a;
    return prev;
  }, null);

  return {
    workflowRunId: workflow.id,
    status: workflow.status,
    motionType: workflow.motion_type,
    jurisdiction: workflow.jurisdiction,
    startedAt: workflow.created_at,
    completedAt: workflow.updated_at ?? null,
    durationMs,
    totalEvents: events.length,
    totalLatencyMs,
    totalTokenCount,
    totalCostUsd,
    costIsEstimated,
    agentCount: byAgent.size,
    agentsCompleted,
    agentsFailed,
    slowestAgent: slowest?.agentName ?? null,
    slowestAgentLatencyMs: slowest?.totalLatencyMs ?? 0,
    averageEventLatencyMs: Math.round(average(latencyValues)),
    confidence: workflow.confidence,
    citationPassRate: workflow.citation_pass_rate,
    faithfulnessScore: workflow.faithfulness_score,
    agentSummaries,
  };
}
