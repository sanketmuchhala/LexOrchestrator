import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SAMPLE_DRAFT_CONTENT = `
PRELIMINARY STATEMENT

Defendant moves this Court to dismiss the complaint pursuant to Rule 12(b)(6).

STATEMENT OF RELEVANT FACTS

Plaintiff entered into a written services agreement with Defendant dated January 1, 2023. Defendant failed to deliver contracted services.

LEGAL STANDARD

To survive a motion to dismiss, a complaint must allege sufficient facts to state a claim plausible on its face. Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007).

ARGUMENT

The complaint fails to plead sufficient facts establishing a breach of contract. Plaintiff has not identified the specific obligations Defendant allegedly violated.

CONCLUSION

For the foregoing reasons, the Court should grant the motion to dismiss.
`.trim();

async function main() {
  const { computeWorkflowEval } = await import(
    "../lib/litigation/evals/computeWorkflowEval"
  );
  const { getEvalDashboardStats } = await import(
    "../lib/litigation/evals/getEvalDashboardStats"
  );

  console.log("=== Workflow Eval Smoke Test ===\n");

  // ── Step 1: Compute eval from sample data ────────────────────────────────

  console.log("--- Step 1: Compute eval from sample artifacts ---");

  const sampleWorkflow = {
    id: "smoke-test-eval",
    workflow_type: "motion_draft",
    status: "completed",
    jurisdiction: "Federal",
    court: "S.D.N.Y.",
    motion_type: "motion_to_dismiss",
    input_summary: "Smoke test workflow",
    final_output: null,
    confidence: null,
    faithfulness_score: null,
    citation_pass_rate: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleArtifacts = [
    {
      id: "draft-1",
      workflow_run_id: "smoke-test-eval",
      artifact_type: "outline",
      title: "Motion to Dismiss",
      content: SAMPLE_DRAFT_CONTENT,
      citations: [{ citation: "550 U.S. 544 (2007)" }],
      verification_status: null,
      created_by_agent: "DraftingAgent",
      created_at: new Date().toISOString(),
      metadata: {},
    },
    {
      id: "adv-1",
      workflow_run_id: "smoke-test-eval",
      artifact_type: "red_team_memo",
      title: "Adversarial Review",
      content: "ADVERSARIAL RISK: MEDIUM\nRED TEAM MEMO\nThe complaint may survive dismissal if the court finds the facts sufficient.",
      citations: [],
      verification_status: null,
      created_by_agent: "AdversarialAgent",
      created_at: new Date().toISOString(),
      metadata: {},
    },
    {
      id: "lr-1",
      workflow_run_id: "smoke-test-eval",
      artifact_type: "local_rules_check",
      title: "Local Rules Review",
      content: "",
      citations: [],
      verification_status: null,
      created_by_agent: "LocalRulesAgent",
      created_at: new Date().toISOString(),
      metadata: {
        localRules: {
          profileLabel: "Southern District of New York (SDNY)",
          sectionChecks: [
            { sectionId: "preliminary_statement", label: "Preliminary Statement", required: true, detected: true },
            { sectionId: "statement_of_facts",    label: "Statement of Facts",    required: true, detected: true },
            { sectionId: "legal_standard",        label: "Legal Standard",        required: true, detected: true },
            { sectionId: "argument",              label: "Argument",              required: true, detected: true },
            { sectionId: "conclusion",            label: "Conclusion",            required: true, detected: true },
          ],
          missingSections: [],
        },
      },
    },
  ];

  const sampleCitationReports = [
    {
      id: "cr-1",
      workflow_run_id: "smoke-test-eval",
      citation_text: "550 U.S. 544 (2007)",
      normalized_citation: "550 U.S. 544 (2007)",
      overall_status: "warn",
      existence_status: null,
      quote_status: null,
      pin_cite_status: null,
      proposition_status: null,
      treatment_status: null,
      created_at: new Date().toISOString(),
    },
  ];

  const sampleEvents = [
    { id: "e1", workflow_run_id: "smoke-test-eval", agent_name: "IntakeAgent", event_type: "agent_completed", event_status: null, message: null, tool_name: null, latency_ms: 42, token_count: null, cost_usd: null, created_at: new Date().toISOString() },
    { id: "e2", workflow_run_id: "smoke-test-eval", agent_name: "DraftingAgent", event_type: "agent_completed", event_status: null, message: null, tool_name: null, latency_ms: 380, token_count: 512, cost_usd: null, created_at: new Date().toISOString() },
    { id: "e3", workflow_run_id: "smoke-test-eval", agent_name: "EvalAgent", event_type: "agent_completed", event_status: null, message: null, tool_name: null, latency_ms: 15, token_count: null, cost_usd: null, created_at: new Date().toISOString() },
  ];

  type ArtifactRow = (typeof sampleArtifacts)[number];
  type CitationRow = (typeof sampleCitationReports)[number];
  type EventRow = (typeof sampleEvents)[number];

  const result = computeWorkflowEval(
    sampleWorkflow as Parameters<typeof computeWorkflowEval>[0],
    sampleEvents as unknown as EventRow[] & Parameters<typeof computeWorkflowEval>[1],
    sampleArtifacts as unknown as ArtifactRow[] & Parameters<typeof computeWorkflowEval>[2],
    sampleCitationReports as unknown as CitationRow[] & Parameters<typeof computeWorkflowEval>[3]
  );

  const { summary, citationQuality, artifactQuality, agentRuntime } = result;

  console.log(`  overallConfidence: ${summary.overallConfidence} (${Math.round(summary.overallConfidence * 100)}%)`);
  console.log(`  citationPassRate: ${summary.citationPassRate} (${Math.round(summary.citationPassRate * 100)}%)`);
  console.log(`  faithfulnessScore: ${summary.faithfulnessScore}`);
  console.log(`  retrievalCoverage: ${summary.retrievalCoverage}`);
  console.log(`  unsupportedClaimRisk: ${summary.unsupportedClaimRisk}`);
  console.log(`  localRulesCompleteness: ${summary.localRulesCompleteness}`);
  console.log(`  adversarialRisk: ${summary.adversarialRisk}`);
  console.log(`  passFail: ${summary.passFail.toUpperCase()}`);
  console.log(`  warnings: ${summary.warnings.length}`);
  summary.warnings.forEach((w) => console.log(`    - ${w}`));
  console.log("");

  console.log("  Citation Quality:");
  console.log(`    total=${citationQuality.total} pass=${citationQuality.pass} warn=${citationQuality.warn} fail=${citationQuality.fail}`);

  console.log("  Artifact Quality:");
  console.log(`    hasDraft=${artifactQuality.hasDraft} hasAdversarial=${artifactQuality.hasAdversarialReview} hasLocalRules=${artifactQuality.hasLocalRulesReview}`);
  console.log(`    draftSectionCoverage=${artifactQuality.draftSectionCoverage}`);
  console.log(`    missingSections=${artifactQuality.missingSections.length === 0 ? "none" : artifactQuality.missingSections.join(", ")}`);

  console.log("  Agent Runtime:");
  console.log(`    totalEvents=${agentRuntime.totalEvents} agentsCompleted=${agentRuntime.agentsCompleted} totalLatencyMs=${agentRuntime.totalLatencyMs}`);
  console.log("");

  // ── Step 2: Dashboard stats (DB) ─────────────────────────────────────────

  console.log("--- Step 2: Eval dashboard stats ---");
  const stats = await getEvalDashboardStats(20);
  console.log(`  totalWorkflows: ${stats.totalWorkflows}`);
  console.log(`  completedWorkflows: ${stats.completedWorkflows}`);
  console.log(`  averageConfidence: ${stats.averageConfidence != null ? Math.round(stats.averageConfidence * 100) + "%" : "n/a"}`);
  console.log(`  passCount: ${stats.passCount} | warnCount: ${stats.warnCount} | failCount: ${stats.failCount}`);
  console.log("");

  // ── Step 3: Verify complete draft scores higher ───────────────────────────

  console.log("--- Step 3: Incomplete draft scores lower ---");
  const incompleteDraftArtifacts = [
    { ...sampleArtifacts[0], citations: [], content: "PRELIMINARY STATEMENT\n\nDefendant moves to dismiss." },
    sampleArtifacts[1],
    { ...sampleArtifacts[2], metadata: { localRules: { ...(sampleArtifacts[2].metadata.localRules as Record<string, unknown>), missingSections: ["Argument", "Conclusion"], sectionChecks: (sampleArtifacts[2].metadata.localRules as { sectionChecks: { label: string; required: boolean; detected: boolean; sectionId: string }[] }).sectionChecks.map((s) => ({ ...s, detected: ["Preliminary Statement", "Statement of Facts", "Legal Standard"].includes(s.label) })) } } },
  ];

  const incompleteResult = computeWorkflowEval(
    sampleWorkflow as Parameters<typeof computeWorkflowEval>[0],
    sampleEvents as unknown as EventRow[] & Parameters<typeof computeWorkflowEval>[1],
    incompleteDraftArtifacts as unknown as ArtifactRow[] & Parameters<typeof computeWorkflowEval>[2],
    []
  );

  console.log(`  overallConfidence (incomplete): ${incompleteResult.summary.overallConfidence}`);
  console.log(`  passFail: ${incompleteResult.summary.passFail.toUpperCase()}`);
  console.log(`  missingSections: ${incompleteResult.summary.warnings.filter(w => w.includes("missing")).join(" | ") || "none"}`);
  console.log("");

  console.log("=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
