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

async function main() {
  console.log("=== Trace Builder Smoke Test ===\n");

  const { buildWorkflowTrace } = await import("../lib/traces/buildWorkflowTrace");

  // ── Step 1: build trace for a non-existent run (degrades gracefully) ─────────

  console.log("--- Step 1: buildWorkflowTrace with non-existent run ID ---");
  try {
    const trace = await buildWorkflowTrace("00000000-0000-0000-0000-000000000000");

    const hasSummary = typeof trace.debugSummary === "object" && trace.debugSummary !== null;
    const hasSnapshot = typeof trace.replaySnapshot === "object" && trace.replaySnapshot !== null;
    const hasEvents = Array.isArray(trace.events);
    const hasGroups = Array.isArray(trace.agentGroups);
    const hasArtifacts = Array.isArray(trace.artifacts);
    const hasCitations = Array.isArray(trace.citationReports);

    if (hasSummary && hasSnapshot && hasEvents && hasGroups && hasArtifacts && hasCitations) {
      pass("buildWorkflowTrace (empty)", `events=${trace.events.length} groups=${trace.agentGroups.length} artifacts=${trace.artifacts.length}`);
    } else {
      fail("buildWorkflowTrace (empty)", `missing fields: summary=${hasSummary} snapshot=${hasSnapshot}`);
    }
  } catch (err) {
    fail("buildWorkflowTrace (empty)", String(err));
  }

  // ── Step 2: assert debug summary shape ────────────────────────────────────────

  console.log("\n--- Step 2: debugSummary field assertions ---");
  try {
    const trace = await buildWorkflowTrace("00000000-0000-0000-0000-000000000000");
    const s = trace.debugSummary;

    const checks: Array<[string, boolean]> = [
      ["totalEvents is number", typeof s.totalEvents === "number"],
      ["agentsSeen is array", Array.isArray(s.agentsSeen)],
      ["agentsCompleted is array", Array.isArray(s.agentsCompleted)],
      ["agentsFailed is array", Array.isArray(s.agentsFailed)],
      ["failedAgentNames is array", Array.isArray(s.failedAgentNames)],
      ["totalLatencyMs is number", typeof s.totalLatencyMs === "number"],
      ["totalTokenCount is number", typeof s.totalTokenCount === "number"],
      ["totalCostUsd is number", typeof s.totalCostUsd === "number"],
      ["artifactCount is number", typeof s.artifactCount === "number"],
      ["citationReportCount is number", typeof s.citationReportCount === "number"],
      ["warningCount is number", typeof s.warningCount === "number"],
      ["errorCount is number", typeof s.errorCount === "number"],
      ["firstError is null or string", s.firstError === null || typeof s.firstError === "string"],
      ["slowestAgent is null or string", s.slowestAgent === null || typeof s.slowestAgent === "string"],
    ];

    const allPass = checks.every(([, ok]) => ok);
    const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (allPass) {
      pass("debugSummary shape", `all ${checks.length} fields present and typed correctly`);
    } else {
      fail("debugSummary shape", `failed: ${failures.join(", ")}`);
    }
  } catch (err) {
    fail("debugSummary shape", String(err));
  }

  // ── Step 3: assert replay snapshot shape ─────────────────────────────────────

  console.log("\n--- Step 3: replaySnapshot field assertions ---");
  try {
    const trace = await buildWorkflowTrace("00000000-0000-0000-0000-000000000000");
    const snap = trace.replaySnapshot;

    const checks: Array<[string, boolean]> = [
      ["workflowRunId is string", typeof snap.workflowRunId === "string"],
      ["status is string", typeof snap.status === "string"],
      ["draftArtifactIds is array", Array.isArray(snap.draftArtifactIds)],
      ["citationReportIds is array", Array.isArray(snap.citationReportIds)],
      ["createdAt is string", typeof snap.createdAt === "string"],
    ];

    const allPass = checks.every(([, ok]) => ok);
    const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (allPass) {
      pass("replaySnapshot shape", `workflowRunId=${snap.workflowRunId.slice(0, 8)} status=${snap.status}`);
    } else {
      fail("replaySnapshot shape", `failed: ${failures.join(", ")}`);
    }
  } catch (err) {
    fail("replaySnapshot shape", String(err));
  }

  // ── Step 4: build trace for actual workflow if DB is available ────────────────

  console.log("\n--- Step 4: buildWorkflowTrace against real DB workflow (if available) ---");
  try {
    const { listLitigationWorkflowRuns } = await import("../lib/db/supabaseServer");
    const runs = await listLitigationWorkflowRuns(1);
    if (runs.length === 0) {
      console.log("  [SKIP] No workflow runs in DB -- skipping real trace build");
      passed++;
    } else {
      const runId = runs[0].id;
      const trace = await buildWorkflowTrace(runId);
      const hasWorkflow = trace.workflow !== null;
      if (hasWorkflow) {
        pass("buildWorkflowTrace (real run)", `runId=${runId.slice(0, 8)} events=${trace.events.length} artifacts=${trace.artifacts.length} citations=${trace.citationReports.length}`);
      } else {
        fail("buildWorkflowTrace (real run)", "workflow returned null for existing run ID");
      }
    }
  } catch (err) {
    fail("buildWorkflowTrace (real run)", String(err));
  }

  // ── Step 5: TraceEvent fields ─────────────────────────────────────────────────

  console.log("\n--- Step 5: TraceEvent field contract (imports only) ---");
  try {
    const { buildWorkflowTrace: bwt } = await import("../lib/traces/buildWorkflowTrace");
    if (typeof bwt === "function") {
      pass("buildWorkflowTrace import", "function exported correctly");
    } else {
      fail("buildWorkflowTrace import", "not a function");
    }
  } catch (err) {
    fail("buildWorkflowTrace import", String(err));
  }

  // ─── Summary ──────────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
