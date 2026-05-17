import type { WorkflowRunRow } from "@/lib/db/supabaseServer";

export interface TraceEvent {
  id: string;
  workflowRunId: string;
  agentName: string;
  eventType: string;
  eventStatus: string | null;
  message: string | null;
  toolName: string | null;
  toolInput: Record<string, unknown> | null;
  toolOutput: Record<string, unknown> | null;
  latencyMs: number | null;
  tokenCount: number | null;
  costUsd: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TraceArtifactLink {
  id: string;
  artifactType: string;
  title: string | null;
  version: number | null;
  verificationStatus: string | null;
  createdByAgent: string | null;
  createdAt: string;
  contentPreview: string;
}

export interface TraceCitationLink {
  id: string;
  citationText: string;
  normalizedCitation: string | null;
  overallStatus: string;
  existenceStatus: string | null;
  propositionStatus: string | null;
  createdAt: string;
}

export interface AgentTraceGroup {
  agentName: string;
  events: TraceEvent[];
  startedAt: string | null;
  completedAt: string | null;
  status: "completed" | "failed" | "started" | "unknown";
  totalLatencyMs: number;
  artifactIds: string[];
  citationReportIds: string[];
}

export interface TraceDebugSummary {
  totalEvents: number;
  agentsSeen: string[];
  agentsCompleted: string[];
  agentsFailed: string[];
  totalLatencyMs: number;
  totalTokenCount: number;
  totalCostUsd: number;
  artifactCount: number;
  citationReportCount: number;
  warningCount: number;
  errorCount: number;
  firstError: string | null;
  slowestAgent: string | null;
  failedAgentNames: string[];
}

export interface TraceReplaySnapshot {
  workflowRunId: string;
  status: string;
  motionType: string | null;
  jurisdiction: string | null;
  court: string | null;
  judgeName: string | null;
  inputSummary: string | null;
  draftArtifactIds: string[];
  citationReportIds: string[];
  createdAt: string;
}

export interface TraceTimeline {
  workflowRunId: string;
  workflow: WorkflowRunRow | null;
  events: TraceEvent[];
  agentGroups: AgentTraceGroup[];
  artifacts: TraceArtifactLink[];
  citationReports: TraceCitationLink[];
  debugSummary: TraceDebugSummary;
  replaySnapshot: TraceReplaySnapshot;
}
