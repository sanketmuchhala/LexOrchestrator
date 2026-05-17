export interface AgentPerformanceSummary {
  agentName: string;
  eventCount: number;
  completed: boolean;
  failed: boolean;
  totalLatencyMs: number;
  averageLatencyMs: number;
  tokenCount: number;
  costUsd: number;
  toolCalls: number;
  warnings: number;
  errors: number;
}

export interface WorkflowPerformanceSummary {
  workflowRunId: string;
  status: string;
  motionType: string | null;
  jurisdiction: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  totalEvents: number;
  totalLatencyMs: number;
  totalTokenCount: number;
  totalCostUsd: number;
  costIsEstimated: boolean;
  agentCount: number;
  agentsCompleted: number;
  agentsFailed: number;
  slowestAgent: string | null;
  slowestAgentLatencyMs: number;
  averageEventLatencyMs: number;
  confidence: number | null;
  citationPassRate: number | null;
  faithfulnessScore: number | null;
  agentSummaries: AgentPerformanceSummary[];
}

export interface AgentBreakdownStat {
  agentName: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  totalTokenCount: number;
  totalCostUsd: number;
  totalToolCalls: number;
  totalWarnings: number;
  totalErrors: number;
}

export interface ObservabilityDashboardStats {
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageDurationMs: number;
  averageCostUsd: number;
  averageTokenCount: number;
  averageConfidence: number;
  averageCitationPassRate: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p50CostUsd: number;
  p95CostUsd: number;
  slowestRecentWorkflow: WorkflowPerformanceSummary | null;
  mostExpensiveRecentWorkflow: WorkflowPerformanceSummary | null;
  mostFailureProneAgent: string | null;
  recentWorkflows: WorkflowPerformanceSummary[];
  agentBreakdown: AgentBreakdownStat[];
}
