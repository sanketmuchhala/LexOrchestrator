import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const { findJudge } = await import("../lib/litigation/judges/findJudge");
  const { getJudgeProfile } = await import("../lib/litigation/judges/getJudgeProfile");
  const { runLitigationJudgeBriefAgent } = await import("../lib/litigation/agents/judgeBriefAgent");

  console.log("=== Judge Brief Smoke Test ===\n");

  const DB_AVAILABLE = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!DB_AVAILABLE) {
    console.log("  [INFO] Supabase not configured. Running in degraded mode.\n");
  }

  // ── Step 1: Find demo judge ──────────────────────────────────────────────

  console.log("--- Step 1: Find demo judge ---");
  const lookupResult = await findJudge({
    judgeName: "Rakoff",
    court: "SDNY",
    jurisdiction: "Federal",
  });

  console.log(`  matchStatus: ${lookupResult.matchStatus}`);
  console.log(`  candidates: ${lookupResult.candidates.length}`);
  if (lookupResult.judge) {
    console.log(`  judge: ${lookupResult.judge.full_name} (${lookupResult.judge.court ?? "no court"})`);
  } else {
    console.log(`  judge: not found (expected if demo seed not run)`);
  }
  console.log("");

  // ── Step 2: Load demo judge profile ─────────────────────────────────────

  console.log("--- Step 2: Load demo judge profile ---");
  if (lookupResult.judge) {
    const profile = await getJudgeProfile(lookupResult.judge.id, "motion_to_dismiss");
    if (profile) {
      console.log(`  judgeName: ${profile.judgeName}`);
      console.log(`  court: ${profile.court}`);
      console.log(`  motionType: ${profile.motionType}`);
      console.log(`  sourceOpinionCount: ${profile.sourceOpinionCount}`);
      console.log(`  styleNotes: ${profile.styleNotes?.slice(0, 80) ?? "none"}...`);
      console.log(`  argumentGuidance: ${profile.argumentGuidance?.slice(0, 80) ?? "none"}...`);
    } else {
      console.log("  No profile found (expected if demo seed not run).");
    }
  } else {
    console.log("  Skipped (judge not found).");
  }
  console.log("");

  // ── Step 3: Run judge brief agent ───────────────────────────────────────

  console.log("--- Step 3: Run judge brief agent ---");
  const ctx = {
    workflowRunId: "smoke-test-" + crypto.randomUUID().slice(0, 8),
    input: {
      query: "Motion to dismiss for failure to state a claim",
      jurisdiction: "Federal",
      court: "S.D.N.Y.",
      judgeName: "Rakoff",
      motionType: "motion_to_dismiss",
    },
    retrievedAuthority: [],
    draftArtifacts: [],
    citationReports: [],
    judgeProfile: null,
    metadata: {},
  };

  const result = await runLitigationJudgeBriefAgent(ctx as Parameters<typeof runLitigationJudgeBriefAgent>[0]);
  const brief = result.output as unknown as import("../lib/litigation/types").JudgeBriefResult;

  console.log(`  agentStatus: ${result.status}`);
  console.log(`  matchStatus: ${brief.matchStatus}`);
  console.log(`  profileAvailable: ${brief.profileAvailable}`);
  console.log(`  judgeName: ${brief.judgeName ?? "none"}`);
  console.log(`  sourceOpinionCount: ${brief.sourceOpinionCount}`);
  console.log(`  confidence: ${brief.confidence}`);
  console.log(`  styleNotes: ${brief.styleNotes.length}`);
  console.log(`  argumentGuidance: ${brief.argumentGuidance.length}`);
  console.log(`  motionTypeGuidance: ${brief.motionTypeGuidance.length}`);
  console.log(`  limitations: ${brief.limitations.length}`);
  console.log(`  artifactContent: ${brief.artifactContent.slice(0, 120).replace(/\n/g, " ")}...`);
  console.log("");

  // ── Step 4: Test not_requested path ─────────────────────────────────────

  console.log("--- Step 4: Test not_requested (no judge provided) ---");
  const ctxNoJudge = { ...ctx, input: { ...ctx.input, judgeName: undefined, judgeId: undefined } };
  const noJudgeResult = await runLitigationJudgeBriefAgent(ctxNoJudge as Parameters<typeof runLitigationJudgeBriefAgent>[0]);
  const noJudgeBrief = noJudgeResult.output as unknown as import("../lib/litigation/types").JudgeBriefResult;

  console.log(`  matchStatus: ${noJudgeBrief.matchStatus}`);
  console.log(`  profileAvailable: ${noJudgeBrief.profileAvailable}`);
  console.log(`  artifactContent: ${noJudgeBrief.artifactContent.length} chars (expect 0)`);
  console.log("");

  // ── Step 5: Test not_found path ──────────────────────────────────────────

  console.log("--- Step 5: Test not_found (unknown judge name) ---");
  const ctxUnknown = { ...ctx, input: { ...ctx.input, judgeName: "Judge Does Not Exist 999", judgeId: undefined } };
  const unknownResult = await runLitigationJudgeBriefAgent(ctxUnknown as Parameters<typeof runLitigationJudgeBriefAgent>[0]);
  const unknownBrief = unknownResult.output as unknown as import("../lib/litigation/types").JudgeBriefResult;

  console.log(`  matchStatus: ${unknownBrief.matchStatus}`);
  console.log(`  profileAvailable: ${unknownBrief.profileAvailable}`);
  console.log(`  limitations[0]: ${unknownBrief.limitations[0] ?? "none"}`);
  console.log("");

  console.log("=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
