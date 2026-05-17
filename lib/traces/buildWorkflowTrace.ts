import {
  getLitigationWorkflowRun,
  getLitigationWorkflowEventsWithDetails,
  getLitigationWorkflowArtifacts,
  getLitigationWorkflowCitationReports,
} from "@/lib/db/supabaseServer";
import type {
  TraceTimeline,
  TraceEvent,
  TraceArtifactLink,
  TraceCitationLink,
  AgentTraceGroup,
  TraceDebugSummary,
  TraceReplaySnapshot,
} from "./types";

const DRAFT_ARTIFACT_TYPES = new Set(["outline", "full_draft", "motion_section", "memo"]);
const WARNING_EVENT_TYPES = new Set(["run_failed"]);

function toTraceEvent(row: Awaited<ReturnType<typeof getLitigationWorkflowEventsWithDetails>>[number]): TraceEvent {
  return {
    id: row.id,
    workflowRunId: row.workflow_run_id,
    agentName: row.agent_name,
    eventType: row.event_type,
    eventStatus: row.event_status,
    message: row.message,
    toolName: row.tool_name,
    toolInput: row.tool_input && Object.keys(row.tool_input).length > 0 ? row.tool_input : null,
    toolOutput: row.tool_output && Object.keys(row.tool_output).length > 0 ? row.tool_output : null,
    latencyMs: row.latency_ms,
    tokenCount: row.token_count,
    costUsd: row.cost_usd,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

function groupByAgent(events: TraceEvent[], artifactsByAgent: Map<string, string[]>, citationsByAgent: Map<string, string[]>): AgentTraceGroup[] {
  const seen = new Map<string, AgentTraceGroup>();
  const order: string[] = [];

  for (const ev of events) {
    if (!seen.has(ev.agentName)) {
      seen.set(ev.agentName, {
        agentName: ev.agentName,
        events: [],
        startedAt: null,
        completedAt: null,
        status: "unknown",
        totalLatencyMs: 0,
        artifactIds: artifactsByAgent.get(ev.agentName) ?? [],
        citationReportIds: citationsByAgent.get(ev.agentName) ?? [],
      });
      order.push(ev.agentName);
    }
    const group = seen.get(ev.agentName)!;
    group.events.push(ev);
    if (ev.latencyMs != null) group.totalLatencyMs += ev.latencyMs;

    if (ev.eventType === "agent_started" || ev.eventType === "run_started") {
      group.startedAt ??= ev.createdAt;
    }
    if (ev.eventType === "agent_completed" || ev.eventType === "run_completed") {
      group.completedAt = ev.createdAt;
      group.status = "completed";
    }
    if (ev.eventType === "run_failed") {
      group.status = "failed";
    }
    if (group.status === "unknown" && ev.eventType === "agent_started") {
      group.status = "started";
    }
  }

  return order.map((name) => seen.get(name)!);
}

function buildDebugSummary(events: TraceEvent[], groups: AgentTraceGroup[], artifactCount: number, citationReportCount: number): TraceDebugSummary {
  const agentsSeen = Array.from(new Set(events.map((e) => e.agentName)));
  const agentsCompleted = groups.filter((g) => g.status === "completed").map((g) => g.agentName);
  const agentsFailed = groups.filter((g) => g.status === "failed").map((g) => g.agentName);

  const totalLatencyMs = events.reduce((sum, e) => sum + (e.latencyMs ?? 0), 0);
  const totalTokenCount = events.reduce((sum, e) => sum + (e.tokenCount ?? 0), 0);
  const totalCostUsd = events.reduce((sum, e) => sum + (e.costUsd ?? 0), 0);

  const errorEvents = events.filter((e) => WARNING_EVENT_TYPES.has(e.eventType) || e.eventStatus === "error");
  const firstError = errorEvents[0]?.message ?? null;

  const slowestGroup = groups.reduce<AgentTraceGroup | null>((prev, g) => {
    if (prev === null) return g;
    return g.totalLatencyMs > prev.totalLatencyMs ? g : prev;
  }, null);

  return {
    totalEvents: events.length,
    agentsSeen,
    agentsCompleted,
    agentsFailed,
    totalLatencyMs,
    totalTokenCount,
    totalCostUsd,
    artifactCount,
    citationReportCount,
    warningCount: events.filter((e) => e.eventStatus === "warn").length,
    errorCount: errorEvents.length,
    firstError,
    slowestAgent: slowestGroup?.agentName ?? null,
    failedAgentNames: agentsFailed,
  };
}

function buildReplaySnapshot(
  workflowRunId: string,
  workflow: Awaited<ReturnType<typeof getLitigationWorkflowRun>>,
  artifacts: Awaited<ReturnType<typeof getLitigationWorkflowArtifacts>>,
  citationReports: Awaited<ReturnType<typeof getLitigationWorkflowCitationReports>>,
): TraceReplaySnapshot {
  const draftArtifactIds = artifacts
    .filter((a) => DRAFT_ARTIFACT_TYPES.has(a.artifact_type))
    .map((a) => a.id);
  const citationReportIds = citationReports.map((r) => r.id);

  const judgeName =
    typeof workflow?.input_summary === "string"
      ? (artifacts.find((a) => a.artifact_type === "judge_brief")?.metadata?.judgeName as string | undefined) ?? null
      : null;

  return {
    workflowRunId,
    status: workflow?.status ?? "unknown",
    motionType: workflow?.motion_type ?? null,
    jurisdiction: workflow?.jurisdiction ?? null,
    court: workflow?.court ?? null,
    judgeName,
    inputSummary: workflow?.input_summary ?? null,
    draftArtifactIds,
    citationReportIds,
    createdAt: workflow?.created_at ?? new Date().toISOString(),
  };
}

export async function buildWorkflowTrace(workflowRunId: string): Promise<TraceTimeline> {
  const [workflow, rawEvents, rawArtifacts, rawCitationReports] = await Promise.all([
    getLitigationWorkflowRun(workflowRunId),
    getLitigationWorkflowEventsWithDetails(workflowRunId),
    getLitigationWorkflowArtifacts(workflowRunId),
    getLitigationWorkflowCitationReports(workflowRunId),
  ]);

  const events = rawEvents.map(toTraceEvent);

  const artifacts: TraceArtifactLink[] = rawArtifacts.map((a) => ({
    id: a.id,
    artifactType: a.artifact_type,
    title: a.title,
    version: a.version ?? null,
    verificationStatus: a.verification_status,
    createdByAgent: a.created_by_agent,
    createdAt: a.created_at,
    contentPreview: a.content.slice(0, 240),
  }));

  const citationReports: TraceCitationLink[] = rawCitationReports.map((r) => ({
    id: r.id,
    citationText: r.citation_text,
    normalizedCitation: r.normalized_citation,
    overallStatus: r.overall_status,
    existenceStatus: r.existence_status,
    propositionStatus: r.proposition_status,
    createdAt: r.created_at,
  }));

  const artifactsByAgent = new Map<string, string[]>();
  for (const a of rawArtifacts) {
    if (!a.created_by_agent) continue;
    const existing = artifactsByAgent.get(a.created_by_agent) ?? [];
    existing.push(a.id);
    artifactsByAgent.set(a.created_by_agent, existing);
  }

  const agentGroups = groupByAgent(events, artifactsByAgent, new Map());
  const debugSummary = buildDebugSummary(events, agentGroups, artifacts.length, citationReports.length);
  const replaySnapshot = buildReplaySnapshot(workflowRunId, workflow, rawArtifacts, rawCitationReports);

  return {
    workflowRunId,
    workflow,
    events,
    agentGroups,
    artifacts,
    citationReports,
    debugSummary,
    replaySnapshot,
  };
}
