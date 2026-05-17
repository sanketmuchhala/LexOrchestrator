import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let passed = 0;
let failed = 0;

function pass(name: string, summary: string) {
  console.log(`  [PASS] ${name}: ${summary}`);
  passed++;
}

function fail(name: string, reason: string) {
  console.error(`  [FAIL] ${name}: ${reason}`);
  failed++;
}

const MOCK_WORKFLOW = {
  id: "00000000-0000-0000-0000-000000000001",
  workflow_type: "motion_draft",
  status: "completed",
  jurisdiction: "Federal",
  court: "S.D.N.Y.",
  motion_type: "motion_to_dismiss",
  input_summary: "Smoke test workflow",
  final_output: null,
  confidence: 0.72,
  faithfulness_score: 0.68,
  citation_pass_rate: 0.5,
  created_at: new Date(Date.now() - 12000).toISOString(),
  updated_at: new Date(Date.now() - 2000).toISOString(),
};

const MOCK_EVENTS = [
  { id: "e1", workflow_run_id: MOCK_WORKFLOW.id, agent_name: "IntakeAgent",    event_type: "agent_started",   event_status: null,        message: "Starting",   tool_name: null, latency_ms: null,   token_count: null, cost_usd: null, created_at: new Date(Date.now() - 11000).toISOString() },
  { id: "e2", workflow_run_id: MOCK_WORKFLOW.id, agent_name: "IntakeAgent",    event_type: "agent_completed", event_status: null,        message: "Done",       tool_name: null, latency_ms: 850,    token_count: 120,  cost_usd: null, created_at: new Date(Date.now() - 10000).toISOString() },
  { id: "e3", workflow_run_id: MOCK_WORKFLOW.id, agent_name: "RetrievalAgent", event_type: "agent_started",   event_status: null,        message: "Retrieving", tool_name: null, latency_ms: null,   token_count: null, cost_usd: null, created_at: new Date(Date.now() - 10000).toISOString() },
  { id: "e4", workflow_run_id: MOCK_WORKFLOW.id, agent_name: "RetrievalAgent", event_type: "agent_completed", event_status: null,        message: "Found",      tool_name: null, latency_ms: 2100,   token_count: 200,  cost_usd: null, created_at: new Date(Date.now() - 8000).toISOString()  },
  { id: "e5", workflow_run_id: MOCK_WORKFLOW.id, agent_name: "DraftingAgent",  event_type: "agent_completed", event_status: null,        message: "Drafted",    tool_name: null, latency_ms: 4500,   token_count: 800,  cost_usd: null, created_at: new Date(Date.now() - 3000).toISOString()  },
  { id: "e6", workflow_run_id: MOCK_WORKFLOW.id, agent_name: "Orchestrator",   event_type: "run_completed",   event_status: null,        message: "Complete",   tool_name: null, latency_ms: null,   token_count: null, cost_usd: null, created_at: new Date(Date.now() - 2000).toISOString()  },
];

async function main() {
  console.log("=== Observability Smoke Test ===\n");

  const { buildWorkflowPerformance } = await import("../lib/observability/buildWorkflowPerformance");
  const { average, percentile, sumNumbers, formatDurationMs, estimateCostFromTokens } = await import("../lib/observability/metrics");

  // ── Step 1: buildWorkflowPerformance with mock data ───────────────────────────

  console.log("--- Step 1: buildWorkflowPerformance with mock data ---");
  try {
    const perf = buildWorkflowPerformance(MOCK_WORKFLOW as never, MOCK_EVENTS as never);

    const checks: Array<[string, boolean]> = [
      ["durationMs is number", typeof perf.durationMs === "number"],
      ["durationMs > 0", (perf.durationMs ?? 0) > 0],
      ["totalEvents = 6", perf.totalEvents === 6],
      ["agentsCompleted >= 2", perf.agentsCompleted >= 2],
      ["slowestAgent exists", typeof perf.slowestAgent === "string"],
      ["slowestAgent = DraftingAgent", perf.slowestAgent === "DraftingAgent"],
      ["totalTokenCount = 1120", perf.totalTokenCount === 1120],
      ["totalLatencyMs = 7450", perf.totalLatencyMs === 7450],
      ["confidence = 0.72", perf.confidence === 0.72],
      ["costIsEstimated = true", perf.costIsEstimated === true],
      ["agentSummaries.length >= 3", perf.agentSummaries.length >= 3],
    ];

    const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (failures.length === 0) {
      pass("buildWorkflowPerformance", `slowest=${perf.slowestAgent} dur=${perf.durationMs}ms tok=${perf.totalTokenCount}`);
    } else {
      fail("buildWorkflowPerformance", `failed: ${failures.join(", ")}`);
    }
  } catch (err) {
    fail("buildWorkflowPerformance", String(err));
  }

  // ── Step 2: metrics utilities ─────────────────────────────────────────────────

  console.log("\n--- Step 2: metrics utility functions ---");
  try {
    const nums = [10, 20, 30, 40, 50];
    const sorted = [...nums].sort((a, b) => a - b);

    const avgOk = average(nums) === 30;
    const sumOk = sumNumbers(nums) === 150;
    const p50Ok = percentile(sorted, 50) === 30;
    const p95Ok = percentile(sorted, 95) === 50;
    const fmtOk = formatDurationMs(2500) === "2.5s";
    const estOk = (estimateCostFromTokens(1000) ?? 0) > 0;
    const estNullOk = estimateCostFromTokens(null) === null;

    const allOk = avgOk && sumOk && p50Ok && p95Ok && fmtOk && estOk && estNullOk;
    if (allOk) {
      pass("metrics utilities", `avg=${average(nums)} p50=${percentile(sorted, 50)} p95=${percentile(sorted, 95)} fmt=${formatDurationMs(2500)}`);
    } else {
      const issues = [!avgOk && "avg", !sumOk && "sum", !p50Ok && "p50", !p95Ok && "p95", !fmtOk && "fmt", !estOk && "est", !estNullOk && "estNull"].filter(Boolean);
      fail("metrics utilities", `failed: ${issues.join(", ")}`);
    }
  } catch (err) {
    fail("metrics utilities", String(err));
  }

  // ── Step 3: getObservabilityDashboardStats (real DB or graceful empty) ────────

  console.log("\n--- Step 3: getObservabilityDashboardStats (DB or empty) ---");
  try {
    const { getObservabilityDashboardStats } = await import("../lib/observability/getObservabilityDashboardStats");
    const stats = await getObservabilityDashboardStats(10);

    const hasShape =
      typeof stats.totalWorkflows === "number" &&
      typeof stats.completedWorkflows === "number" &&
      typeof stats.failedWorkflows === "number" &&
      Array.isArray(stats.recentWorkflows) &&
      Array.isArray(stats.agentBreakdown);

    if (hasShape) {
      pass("getObservabilityDashboardStats", `total=${stats.totalWorkflows} completed=${stats.completedWorkflows} agents=${stats.agentBreakdown.length}`);
    } else {
      fail("getObservabilityDashboardStats", "missing required fields");
    }
  } catch (err) {
    fail("getObservabilityDashboardStats", String(err));
  }

  // ── Step 4: performance fields with real workflow run if available ─────────────

  console.log("\n--- Step 4: real DB performance summary (if available) ---");
  try {
    const { listLitigationWorkflowRuns, getLitigationWorkflowEventsBatch } = await import("../lib/db/supabaseServer");
    const { buildWorkflowPerformance: bwp } = await import("../lib/observability/buildWorkflowPerformance");
    const runs = await listLitigationWorkflowRuns(1);
    if (runs.length === 0) {
      console.log("  [SKIP] No workflow runs in DB");
      passed++;
    } else {
      const run = runs[0];
      const events = await getLitigationWorkflowEventsBatch([run.id]);
      const perf = bwp(run, events);
      pass("real DB perf summary", `runId=${run.id.slice(0, 8)} events=${perf.totalEvents} dur=${perf.durationMs}ms agents=${perf.agentSummaries.length}`);
    }
  } catch (err) {
    fail("real DB perf summary", String(err));
  }

  // ─── Summary ──────────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
