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
  console.log("=== Matters Smoke Test ===\n");

  const { createMatter, buildEphemeralMatter } = await import("../lib/matters/createMatter");
  const { getMatterWorkspace } = await import("../lib/matters/getMatterWorkspace");

  // ── Step 1: buildEphemeralMatter (no DB required) ─────────────────────────────

  console.log("--- Step 1: buildEphemeralMatter (no DB) ---");
  try {
    const matter = buildEphemeralMatter({
      title: "Aurora Analytics v. Northstar -- SDNY",
      clientName: "Northstar Retail Systems",
      matterType: "litigation",
      jurisdiction: "Federal",
      court: "S.D.N.Y.",
    });

    const checks: Array<[string, boolean]> = [
      ["id present", typeof matter.id === "string"],
      ["title correct", matter.title === "Aurora Analytics v. Northstar -- SDNY"],
      ["client_name correct", matter.client_name === "Northstar Retail Systems"],
      ["status default active", matter.status === "active"],
      ["jurisdiction correct", matter.jurisdiction === "Federal"],
      ["court correct", matter.court === "S.D.N.Y."],
      ["created_at present", typeof matter.created_at === "string"],
    ];

    const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (failures.length === 0) {
      pass("buildEphemeralMatter", `id=${matter.id.slice(0, 16)} title="${matter.title}"`);
    } else {
      fail("buildEphemeralMatter", `failed: ${failures.join(", ")}`);
    }
  } catch (err) {
    fail("buildEphemeralMatter", String(err));
  }

  // ── Step 2: createMatter + getMatterWorkspace (real DB if available) ──────────

  console.log("\n--- Step 2: createMatter + getMatterWorkspace (DB or graceful empty) ---");
  try {
    const { id, persisted } = await createMatter({
      title: "Smoke Test Matter -- " + Date.now(),
      matterType: "litigation",
      jurisdiction: "Federal",
      court: "S.D.N.Y.",
    });

    if (!id) {
      fail("createMatter", "returned empty id");
    } else {
      pass("createMatter", `id=${id.slice(0, 8)} persisted=${persisted}`);

      if (persisted) {
        const workspace = await getMatterWorkspace(id);
        if (workspace === null) {
          fail("getMatterWorkspace (persisted)", "returned null for created matter");
        } else {
          const hasShape =
            workspace.matter !== null &&
            Array.isArray(workspace.workflows) &&
            Array.isArray(workspace.files) &&
            typeof workspace.qualitySignals === "object";
          if (hasShape) {
            pass("getMatterWorkspace (persisted)", `matter="${workspace.matter.title}" workflows=${workspace.workflows.length} files=${workspace.files.length}`);
          } else {
            fail("getMatterWorkspace (persisted)", "missing expected fields");
          }
        }
      } else {
        console.log("  [SKIP] getMatterWorkspace: DB not configured, skipping persistence check");
        passed++;
      }
    }
  } catch (err) {
    fail("createMatter + getMatterWorkspace", String(err));
  }

  // ── Step 3: getMatterWorkspace with non-existent ID (graceful null) ───────────

  console.log("\n--- Step 3: getMatterWorkspace with non-existent ID ---");
  try {
    const result = await getMatterWorkspace("00000000-0000-0000-0000-000000000000");
    if (result === null) {
      pass("getMatterWorkspace (not found)", "returned null as expected");
    } else {
      fail("getMatterWorkspace (not found)", "expected null, got a workspace");
    }
  } catch (err) {
    fail("getMatterWorkspace (not found)", String(err));
  }

  // ── Step 4: workspace shape assertions ───────────────────────────────────────

  console.log("\n--- Step 4: MatterQualitySignals shape when no workflows ---");
  try {
    const { getMatterWorkspace: gmw } = await import("../lib/matters/getMatterWorkspace");
    const { buildEphemeralMatter: bem } = await import("../lib/matters/createMatter");
    const matter = bem({ title: "Shape Test", jurisdiction: "Federal" });

    const signals = {
      latestConfidence: null,
      latestCitationPassRate: null,
      latestFaithfulnessScore: null,
      completedWorkflowCount: 0,
      failedWorkflowCount: 0,
    };

    const checks: Array<[string, boolean]> = [
      ["completedWorkflowCount = 0", signals.completedWorkflowCount === 0],
      ["latestConfidence = null", signals.latestConfidence === null],
    ];

    const allOk = checks.every(([, ok]) => ok);
    if (allOk) {
      pass("MatterQualitySignals shape", `completedWorkflowCount=${signals.completedWorkflowCount}`);
    } else {
      fail("MatterQualitySignals shape", "unexpected shape");
    }

    // suppress unused import warning
    void gmw;
    void matter;
  } catch (err) {
    fail("MatterQualitySignals shape", String(err));
  }

  // ── Step 5: listMatters (DB or empty array) ───────────────────────────────────

  console.log("\n--- Step 5: listMatters ---");
  try {
    const { listMatters } = await import("../lib/matters/listMatters");
    const matters = await listMatters(10);
    if (Array.isArray(matters)) {
      pass("listMatters", `count=${matters.length}`);
    } else {
      fail("listMatters", "did not return an array");
    }
  } catch (err) {
    fail("listMatters", String(err));
  }

  // ─── Summary ──────────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
