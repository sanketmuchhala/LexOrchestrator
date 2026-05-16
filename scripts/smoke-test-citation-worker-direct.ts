/**
 * Direct smoke test for the citation worker running on localhost:8015.
 * Exits 1 if the worker is not running. Useful for verifying the Python worker
 * independently of the TypeScript adapter.
 *
 * Usage:
 *   uvicorn workers.citation.app:app --host 127.0.0.1 --port 8015
 *   npm run smoke:citation-worker-direct
 */

const WORKER_URL = "http://127.0.0.1:8015";

const SAMPLE_TEXT =
  "To survive a motion to dismiss, a complaint must allege sufficient facts. " +
  "Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). " +
  "See also Ashcroft v. Iqbal, 556 U.S. 662 (2009).";

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
  console.log(`=== Citation Worker Direct Test (${WORKER_URL}) ===\n`);

  // ── Health ────────────────────────────────────────────────────────────────

  console.log("--- /health ---");
  let healthOk = false;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${WORKER_URL}/health`, { signal: controller.signal });
    if (!res.ok) {
      fail("health", `HTTP ${res.status}`);
    } else {
      const data = (await res.json()) as Record<string, unknown>;
      if (data.status === "ok" && data.extractor === "eyecite") {
        pass("health", `status=${data.status} extractor=${data.extractor}`);
        healthOk = true;
      } else {
        fail("health", `unexpected: ${JSON.stringify(data)}`);
      }
    }
  } catch {
    console.error(`\nWorker not reachable at ${WORKER_URL}.`);
    console.error("Start it with:");
    console.error("  source workers/citation/.venv/bin/activate");
    console.error("  uvicorn workers.citation.app:app --host 127.0.0.1 --port 8015");
    process.exit(1);
  }

  if (!healthOk) {
    process.exit(1);
  }

  // ── Extraction ────────────────────────────────────────────────────────────

  console.log("\n--- POST /extract ---");
  try {
    const res = await fetch(`${WORKER_URL}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: SAMPLE_TEXT }),
    });
    if (!res.ok) {
      fail("extract", `HTTP ${res.status}`);
    } else {
      const data = (await res.json()) as { citations: Array<Record<string, unknown>> };
      const count = data.citations?.length ?? 0;
      if (count === 0) {
        fail("extract", "no citations returned");
      } else {
        pass("extract", `found=${count} citations`);
        data.citations.forEach((c) => {
          console.log(
            `    [${c.source}] "${c.normalizedCitation}" conf=${c.confidence}`
          );
        });
      }
    }
  } catch (err) {
    fail("extract", String(err));
  }

  // ── Empty text ────────────────────────────────────────────────────────────

  console.log("\n--- POST /extract (empty text) ---");
  try {
    const res = await fetch(`${WORKER_URL}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    const data = (await res.json()) as { citations: unknown[] };
    if (Array.isArray(data.citations) && data.citations.length === 0) {
      pass("empty text", "returns empty citations array");
    } else {
      fail("empty text", `unexpected: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("empty text", String(err));
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Direct test failed:", err);
  process.exit(1);
});
