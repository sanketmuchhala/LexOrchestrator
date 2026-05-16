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

const SAMPLE_CONTENT = `PRELIMINARY STATEMENT

Defendant moves this Court to dismiss the complaint pursuant to Rule 12(b)(6).

STATEMENT OF RELEVANT FACTS

Plaintiff entered into a written services agreement with Defendant dated January 1, 2023.
Defendant failed to deliver contracted services. See Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007).

LEGAL STANDARD

To survive a motion to dismiss, a complaint must allege sufficient facts to state a claim plausible on its face.
Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). See also Ashcroft v. Iqbal, 556 U.S. 662 (2009).

ARGUMENT

The complaint fails to plead sufficient facts establishing a breach of contract.

CONCLUSION

For the foregoing reasons, the Court should grant the motion to dismiss.`.trim();

const EDITED_CONTENT = SAMPLE_CONTENT + "\n\nADDITIONAL ARGUMENT\n\nPlaintiff has not identified the specific obligations Defendant allegedly violated.";

async function main() {
  console.log("=== Draft Editor Smoke Test ===\n");

  const { saveDraftRevision } = await import("../lib/drafts/saveDraftRevision");
  const { listDraftRevisions } = await import("../lib/drafts/listDraftRevisions");
  const { verifyDraftRevision } = await import("../lib/drafts/verifyDraftRevision");

  // Use a stable fake artifact ID for ephemeral testing
  const fakeWorkflowRunId = "smoke-test-workflow-" + Date.now();
  const fakeDraftArtifactId = "smoke-test-artifact-" + Date.now();

  // ── Step 1: save first revision ──────────────────────────────────────────

  console.log("--- Step 1: Save draft revision ---");
  try {
    const result = await saveDraftRevision({
      workflowRunId: fakeWorkflowRunId,
      draftArtifactId: fakeDraftArtifactId,
      content: EDITED_CONTENT,
      editSummary: "Added additional argument section",
      currentVersion: 1,
    });

    if (result.revision && result.revision.version >= 2) {
      pass("saveDraftRevision", `version=${result.revision.version} persisted=${result.persisted}`);
    } else if (result.revision && result.revision.version === 1) {
      pass("saveDraftRevision (fallback)", `version=1 persisted=${result.persisted} (ephemeral -- no DB)`);
    } else {
      fail("saveDraftRevision", `unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (err) {
    fail("saveDraftRevision", String(err));
  }

  // ── Step 2: save second revision ─────────────────────────────────────────

  console.log("\n--- Step 2: Save second revision (version increment) ---");
  try {
    const result = await saveDraftRevision({
      workflowRunId: fakeWorkflowRunId,
      draftArtifactId: fakeDraftArtifactId,
      content: EDITED_CONTENT + "\n\nFinal sentence.",
      editSummary: "Added final sentence",
      currentVersion: 2,
    });

    if (result.revision) {
      pass("second revision", `version=${result.revision.version} persisted=${result.persisted}`);
    } else {
      fail("second revision", "no revision returned");
    }
  } catch (err) {
    fail("second revision", String(err));
  }

  // ── Step 3: list revisions ────────────────────────────────────────────────

  console.log("\n--- Step 3: List draft revisions ---");
  try {
    const revisions = await listDraftRevisions(fakeDraftArtifactId);
    // Without DB, returns empty array; with DB, returns saved revisions
    if (Array.isArray(revisions)) {
      pass("listDraftRevisions", `count=${revisions.length} (${revisions.length === 0 ? "no DB -- expected empty" : "DB populated"})`);
    } else {
      fail("listDraftRevisions", "expected array");
    }
  } catch (err) {
    fail("listDraftRevisions", String(err));
  }

  // ── Step 4: verify draft revision ─────────────────────────────────────────

  console.log("\n--- Step 4: Verify draft revision ---");
  try {
    const result = await verifyDraftRevision({
      content: SAMPLE_CONTENT,
      workflowRunId: fakeWorkflowRunId,
      draftArtifactId: fakeDraftArtifactId,
    });

    if (result && typeof result.citationSummary.total === "number") {
      pass(
        "verifyDraftRevision",
        `status=${result.verificationStatus} total=${result.citationSummary.total} pass=${result.citationSummary.pass} warn=${result.citationSummary.warn} fail=${result.citationSummary.fail}`
      );
    } else {
      fail("verifyDraftRevision", "unexpected result shape");
    }
  } catch (err) {
    fail("verifyDraftRevision", String(err));
  }

  // ── Step 5: verify empty text gracefully ──────────────────────────────────

  console.log("\n--- Step 5: Verify text with no citations ---");
  try {
    const result = await verifyDraftRevision({
      content: "The defendant respectfully requests dismissal of the complaint.",
      workflowRunId: fakeWorkflowRunId,
      draftArtifactId: fakeDraftArtifactId,
    });

    if (result && result.citationSummary.total === 0) {
      pass("verify no citations", `status=${result.verificationStatus} total=0`);
    } else {
      fail("verify no citations", `expected total=0, got ${result?.citationSummary.total}`);
    }
  } catch (err) {
    fail("verify no citations", String(err));
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
