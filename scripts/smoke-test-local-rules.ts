import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEMO_DRAFT_COMPLETE = `
PRELIMINARY STATEMENT

Defendant respectfully moves this Court to dismiss the complaint pursuant to Rule 12(b)(6) of the Federal Rules of Civil Procedure for failure to state a claim upon which relief can be granted.

STATEMENT OF RELEVANT FACTS

Plaintiff entered into a written services agreement with Defendant dated January 1, 2023. Plaintiff alleges that Defendant failed to deliver contracted services. Defendant disputes the characterization of the agreement and denies the alleged failure to perform.

LEGAL STANDARD

To survive a motion to dismiss, a complaint must contain sufficient factual matter to state a claim for relief that is plausible on its face. Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). A claim has facial plausibility when the plaintiff pleads factual content that allows the court to draw the reasonable inference that the defendant is liable. Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

ARGUMENT

The complaint fails to allege sufficient facts to state a plausible claim for breach of contract. Plaintiff has not identified the specific contractual obligations allegedly breached, nor articulated how Defendant's conduct constituted a breach of those obligations.

CONCLUSION

For the foregoing reasons, Defendant respectfully requests that the Court grant this motion to dismiss the complaint in its entirety.
`.trim();

const DEMO_DRAFT_INCOMPLETE = `
PRELIMINARY STATEMENT

Defendant moves to dismiss the complaint for failure to state a claim.

The complaint lacks sufficient factual allegations to support a plausible breach of contract claim.
`.trim();

async function main() {
  const { getLocalRules } = await import("../lib/litigation/localRules/getLocalRules");
  const { checkDraftAgainstRules, getMissingSections } = await import(
    "../lib/litigation/localRules/checkDraftAgainstRules"
  );
  const { runLitigationLocalRulesAgent } = await import(
    "../lib/litigation/agents/localRulesAgent"
  );

  console.log("=== Local Rules Smoke Test ===\n");

  // ── Step 1: Load SDNY rule profile ───────────────────────────────────────

  console.log("--- Step 1: Load SDNY rule profile ---");
  const profile = getLocalRules("Federal", "S.D.N.Y.");
  console.log(`  profileId: ${profile.id}`);
  console.log(`  profileLabel: ${profile.label}`);
  console.log(`  requiredSections: ${profile.requiredSections.join(", ")}`);
  console.log(`  formattingNotes: ${profile.formattingNotes.length}`);
  console.log(`  citationNotes: ${profile.citationNotes.length}`);
  console.log("");

  // ── Step 2: Check complete draft ─────────────────────────────────────────

  console.log("--- Step 2: Check complete draft ---");
  const completeChecks = checkDraftAgainstRules(DEMO_DRAFT_COMPLETE, profile);
  const completeMissing = getMissingSections(completeChecks);
  console.log(`  Sections checked: ${completeChecks.length}`);
  for (const s of completeChecks.filter((c) => c.required)) {
    console.log(`    [${s.detected ? "OK" : "MISSING"}] ${s.label}`);
  }
  console.log(`  Missing sections: ${completeMissing.length === 0 ? "none" : completeMissing.join(", ")}`);
  console.log("");

  // ── Step 3: Check incomplete draft ───────────────────────────────────────

  console.log("--- Step 3: Check incomplete draft ---");
  const incompleteChecks = checkDraftAgainstRules(DEMO_DRAFT_INCOMPLETE, profile);
  const incompleteMissing = getMissingSections(incompleteChecks);
  console.log(`  Missing sections: ${incompleteMissing.join(", ") || "none"}`);
  console.log("");

  // ── Step 4: Run Local Rules Agent (complete draft) ───────────────────────

  console.log("--- Step 4: Run localRulesAgent (complete draft, SDNY) ---");
  const ctx = {
    workflowRunId: "smoke-test-" + crypto.randomUUID().slice(0, 8),
    input: {
      query: "Motion to dismiss breach of contract claim",
      jurisdiction: "Federal",
      court: "S.D.N.Y.",
      motionType: "motion_to_dismiss",
    },
    retrievedAuthority: [],
    draftArtifacts: [],
    citationReports: [],
    judgeProfile: null,
    metadata: {},
  };

  const intake = {
    motionType: "motion_to_dismiss",
    jurisdiction: "Federal",
    court: "S.D.N.Y.",
    keyFacts: [],
    legalIssues: [],
    requestedDraftType: "motion_to_dismiss",
    missingInputs: [],
  };

  const result = await runLitigationLocalRulesAgent(
    ctx as Parameters<typeof runLitigationLocalRulesAgent>[0],
    intake,
    DEMO_DRAFT_COMPLETE
  );

  const output = result.output as unknown as import("../lib/litigation/types").LocalRulesAgentOutput;

  console.log(`  agentStatus: ${result.status}`);
  console.log(`  profileLabel: ${output.profileLabel}`);
  console.log(`  missingSections: ${output.missingSections.length === 0 ? "none" : output.missingSections.join(", ")}`);
  console.log(`  warnings: ${output.warnings.length}`);
  if (output.warnings.length > 0) {
    output.warnings.forEach((w) => console.log(`    - ${w.slice(0, 80)}...`));
  }
  console.log(`  confidence: ${output.confidence}`);
  console.log(`  artifactContent: ${output.artifactContent.split("\n").length} lines`);
  console.log("");

  // ── Step 5: Run with incomplete draft ────────────────────────────────────

  console.log("--- Step 5: Run localRulesAgent (incomplete draft, SDNY) ---");
  const incompleteResult = await runLitigationLocalRulesAgent(
    ctx as Parameters<typeof runLitigationLocalRulesAgent>[0],
    intake,
    DEMO_DRAFT_INCOMPLETE
  );

  const incompleteOutput = incompleteResult.output as unknown as import("../lib/litigation/types").LocalRulesAgentOutput;
  console.log(`  missingSections: ${incompleteOutput.missingSections.join(", ") || "none"}`);
  console.log(`  confidence: ${incompleteOutput.confidence}`);
  console.log("");

  // ── Step 6: Test federal generic profile ─────────────────────────────────

  console.log("--- Step 6: Load federal generic profile ---");
  const genericProfile = getLocalRules("Federal", "U.S. District Court");
  console.log(`  profileId: ${genericProfile.id}`);
  console.log(`  profileLabel: ${genericProfile.label}`);
  console.log("");

  // ── Step 7: Test New York state profile ──────────────────────────────────

  console.log("--- Step 7: Load New York state profile ---");
  const nyProfile = getLocalRules("New York", "Supreme Court, New York County");
  console.log(`  profileId: ${nyProfile.id}`);
  console.log(`  profileLabel: ${nyProfile.label}`);
  console.log("");

  console.log("=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
