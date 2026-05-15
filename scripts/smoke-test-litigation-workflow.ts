import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const { runLitigationWorkflow } = await import("../lib/litigation/runLitigationWorkflow");

  console.log("=== Litigation Workflow Smoke Test ===\n");

  const input = {
    query:
      "Defendant moves to dismiss plaintiff's breach of contract claim for failure to state a claim under Rule 12(b)(6), arguing the complaint does not plead sufficient facts to establish the existence of a valid contract or breach.",
    jurisdiction: "SDNY",
    court: "S.D.N.Y.",
    motionType: "motion_to_dismiss",
    judgeName: "Demo Judge",
    facts:
      "Plaintiff entered into a written services agreement with defendant on January 1, 2023. Defendant failed to deliver the contracted services and did not provide notice of its intent not to perform.",
    desiredOutput: "motion_to_dismiss brief",
  };

  console.log(`Query: ${input.query.slice(0, 100)}...`);
  console.log(`Jurisdiction: ${input.jurisdiction} | Court: ${input.court}`);
  console.log(`Motion type: ${input.motionType}\n`);

  let result;
  try {
    result = await runLitigationWorkflow(input);
  } catch (err) {
    console.error("Workflow failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log("--- Workflow Run ---");
  console.log(`  workflowRunId: ${result.workflowRunId}`);
  console.log(`  status: ${result.status}`);
  console.log("");

  console.log(`--- Artifacts (${result.artifacts.length}) ---`);
  for (const artifact of result.artifacts) {
    console.log(`  [${artifact.artifactType}] ${artifact.title}`);
    console.log(`    Sections: ${artifact.sections.length}`);
    console.log(`    Citations: ${artifact.citations.join(", ") || "none"}`);
  }
  console.log("");

  console.log("--- Citation Summary ---");
  const cs = result.citationSummary;
  console.log(
    `  Total: ${cs.total} | Pass: ${cs.pass} | Warn: ${cs.warn} | Fail: ${cs.fail} | Unknown: ${cs.unknown}`
  );
  console.log("");

  console.log("--- Eval Summary ---");
  const ev = result.evalSummary;
  console.log(`  Faithfulness: ${Math.round(ev.faithfulnessScore * 100)}%`);
  console.log(`  Citation pass rate: ${Math.round(ev.citationPassRate * 100)}%`);
  console.log(`  Retrieval coverage: ${Math.round(ev.retrievalCoverage * 100)}%`);
  console.log(`  Unsupported claim risk: ${Math.round(ev.unsupportedClaimRisk * 100)}%`);
  console.log(`  Overall confidence: ${Math.round(ev.overallConfidence * 100)}%`);
  console.log(`  Pass/Fail: ${ev.passFail.toUpperCase()}`);
  console.log("");

  console.log(`--- Events (${result.events.length}) ---`);
  for (const e of result.events) {
    console.log(`  [${e.eventType}] ${e.agentName}: ${e.message ?? ""}`);
  }
  console.log("");

  console.log("=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
