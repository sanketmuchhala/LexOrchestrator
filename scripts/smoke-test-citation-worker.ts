import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SAMPLE_TEXT =
  "To survive a motion to dismiss, a complaint must allege sufficient facts. " +
  "Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). " +
  "See also Ashcroft v. Iqbal, 556 U.S. 662 (2009). " +
  "The standard was further clarified in General Electric Co. v. Joiner, 522 U.S. 136 (1997).";

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
  console.log("=== Citation Worker Smoke Test ===\n");

  const workerUrl = process.env.CITATION_WORKER_URL;
  const workerConfigured = !!workerUrl;

  console.log(`  CITATION_WORKER_URL: ${workerConfigured ? workerUrl : "(not set)"}`);
  console.log(`  Mode: ${workerConfigured ? "worker + fallback" : "regex fallback only"}\n`);

  const { extractCitationsWithBestAvailableProvider } = await import(
    "../lib/citations/citationExtractorAdapter"
  );

  // ── Step 1: worker health (if configured) ────────────────────────────────

  let workerHealthy = false;

  if (workerConfigured) {
    console.log("--- Step 1: Worker health check ---");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${workerUrl}/health`, { signal: controller.signal });
      clearTimeout(timer);
      const data = (await res.json()) as Record<string, unknown>;
      if (data.status === "ok" && data.extractor === "eyecite") {
        pass("worker /health", `status=${data.status} extractor=${data.extractor}`);
        workerHealthy = true;
      } else {
        fail("worker /health", `unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail("worker /health", `unreachable: ${String(err)}`);
    }
  } else {
    console.log("--- Step 1: Worker health check (skipped -- not configured) ---");
    console.log("  (no CITATION_WORKER_URL set; skipping health check)\n");
  }

  // ── Step 2: adapter extraction ────────────────────────────────────────────

  console.log("\n--- Step 2: Adapter extraction ---");
  try {
    const citations = await extractCitationsWithBestAvailableProvider(SAMPLE_TEXT);
    if (!Array.isArray(citations) || citations.length === 0) {
      fail("adapter extraction", "no citations returned");
    } else {
      const sources = [...new Set(citations.map((c) => c.extractorSource))].join(", ");
      pass(
        "adapter extraction",
        `found=${citations.length} sources=[${sources}]`
      );
      citations.forEach((c) => {
        console.log(
          `    [${c.extractorSource ?? "?"}] "${c.normalizedCitation}" conf=${c.confidence}`
        );
      });
    }
  } catch (err) {
    fail("adapter extraction", String(err));
  }

  // ── Step 3: verify extractor source ──────────────────────────────────────

  console.log("\n--- Step 3: Extractor source verification ---");
  try {
    const citations = await extractCitationsWithBestAvailableProvider(SAMPLE_TEXT);
    const expectedSource = workerHealthy ? "eyecite" : "regex";
    const allMatchExpected = citations.every((c) => c.extractorSource === expectedSource);
    if (allMatchExpected) {
      pass("extractor source", `all citations have extractorSource="${expectedSource}"`);
    } else {
      const sources = citations.map((c) => c.extractorSource);
      fail("extractor source", `expected "${expectedSource}" for all, got: ${JSON.stringify(sources)}`);
    }
  } catch (err) {
    fail("extractor source", String(err));
  }

  // ── Step 4: fallback on empty text ────────────────────────────────────────

  console.log("\n--- Step 4: Empty text returns empty array ---");
  try {
    const empty = await extractCitationsWithBestAvailableProvider("");
    if (Array.isArray(empty) && empty.length === 0) {
      pass("empty text", "returns empty array");
    } else {
      fail("empty text", `expected [] got ${JSON.stringify(empty)}`);
    }
  } catch (err) {
    fail("empty text", String(err));
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (!workerConfigured) {
    console.log(
      "  Note: worker not configured. Set CITATION_WORKER_URL=http://127.0.0.1:8015 to test eyecite path."
    );
  }

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
