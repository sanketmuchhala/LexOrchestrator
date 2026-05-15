import * as dotenv from "dotenv";
import * as path from "path";
import {
  demoCourt,
  demoDesiredOutput,
  demoFacts,
  demoJudgeName,
  demoJurisdiction,
  demoMotionType,
  demoQuery,
  demoUploadedText,
} from "../lib/demo/litigationDemoFixture";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let passed = 0;
let failed = 0;

function pass(name: string, detail: string) {
  passed++;
  console.log(`[PASS] ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  failed++;
  console.error(`[FAIL] ${name}: ${detail}`);
}

function check(name: string, condition: boolean, detail: string) {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

async function main() {
  console.log("=== Demo Path Smoke Test ===\n");

  const { runLitigationWorkflow } = await import("../lib/litigation/runLitigationWorkflow");

  const result = await runLitigationWorkflow({
    workflowType: "motion_draft",
    query: demoQuery,
    jurisdiction: demoJurisdiction,
    court: demoCourt,
    judgeName: demoJudgeName,
    motionType: demoMotionType,
    facts: demoFacts,
    uploadedText: demoUploadedText,
    desiredOutput: demoDesiredOutput,
    metadata: { demo: true, source: "smoke-test-demo-path" },
  });

  check("workflowRunId", Boolean(result.workflowRunId), result.workflowRunId || "missing");
  check("draft output", Boolean(result.finalOutput || result.artifacts?.length), `${result.finalOutput?.length ?? 0} chars`);
  check("citation summary", Boolean(result.citationSummary), JSON.stringify(result.citationSummary ?? null));
  check("eval summary", Boolean(result.evalSummary), JSON.stringify(result.evalSummary ?? null));

  const events = result.events ?? [];
  const localRulesRan = events.some((event) => event.agentName === "LocalRulesAgent" && event.eventType === "agent_completed");
  const judgeBriefRan = events.some((event) => event.agentName === "JudgeBriefAgent" && event.eventType === "agent_completed");

  check("local rules artifact", localRulesRan, "LocalRulesAgent completed");
  check("judge brief availability", judgeBriefRan, "JudgeBriefAgent completed or cleanly reported unavailable");

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Demo path smoke test failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
