import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== MCP Tools Smoke Test ===\n");

  const { searchLegalOpinions } = await import("../lib/retrieval/searchLegalOpinions");
  const { extractCitations } = await import("../lib/citations/extractCitations");
  const { verifyCitation } = await import("../lib/citations/verifyCitation");
  const { getLocalRules } = await import("../lib/litigation/localRules/getLocalRules");

  // ── search_legal_opinions ─────────────────────────────────────────────────

  console.log("--- search_legal_opinions ---");
  try {
    const res = await searchLegalOpinions({
      query: "Daubert expert testimony reliability",
      limit: 3,
    });
    if (res && Array.isArray(res.results)) {
      pass("search_legal_opinions", `source=${res.source} results=${res.results.length}`);
    } else {
      fail("search_legal_opinions", "unexpected response shape");
    }
  } catch (err) {
    fail("search_legal_opinions", String(err));
  }

  // ── extract_citations ─────────────────────────────────────────────────────

  console.log("\n--- extract_citations ---");
  try {
    const text =
      "To survive dismissal, a claim must be plausible. Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007). See also Ashcroft v. Iqbal, 556 U.S. 662 (2009).";
    const citations = extractCitations(text);
    if (Array.isArray(citations)) {
      pass("extract_citations", `found=${citations.length} citations`);
    } else {
      fail("extract_citations", "expected array");
    }
  } catch (err) {
    fail("extract_citations", String(err));
  }

  // ── verify_citation ───────────────────────────────────────────────────────

  console.log("\n--- verify_citation ---");
  try {
    const result = await verifyCitation({ citationText: "509 U.S. 579 (1993)" });
    if (result && result.overallStatus) {
      pass(
        "verify_citation",
        `existence=${result.existenceStatus} overall=${result.overallStatus}`
      );
    } else {
      fail("verify_citation", "unexpected result shape");
    }
  } catch (err) {
    fail("verify_citation", String(err));
  }

  // ── get_local_rules_profile ───────────────────────────────────────────────

  console.log("\n--- get_local_rules_profile ---");
  try {
    const profile = getLocalRules("SDNY", "S.D.N.Y.");
    if (profile && profile.id && Array.isArray(profile.requiredSections)) {
      pass(
        "get_local_rules_profile",
        `id=${profile.id} requiredSections=${profile.requiredSections.length}`
      );
    } else {
      fail("get_local_rules_profile", "unexpected profile shape");
    }
  } catch (err) {
    fail("get_local_rules_profile", String(err));
  }

  // ── run_litigation_workflow (lightweight) ─────────────────────────────────

  console.log("\n--- run_litigation_workflow (deterministic fallback) ---");
  try {
    const { runLitigationWorkflow } = await import("../lib/litigation/runLitigationWorkflow");
    const result = await runLitigationWorkflow({
      query: "Motion to dismiss for failure to state a claim",
      jurisdiction: "Federal",
      court: "Federal Court",
      motionType: "motion_to_dismiss",
    });
    if (result && result.workflowRunId && result.status) {
      pass(
        "run_litigation_workflow",
        `runId=${result.workflowRunId.slice(0, 8)} status=${result.status} confidence=${Math.round((result.evalSummary?.overallConfidence ?? 0) * 100)}%`
      );
    } else {
      fail("run_litigation_workflow", "unexpected result shape");
    }
  } catch (err) {
    fail("run_litigation_workflow", String(err));
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
