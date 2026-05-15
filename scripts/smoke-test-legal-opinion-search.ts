/**
 * Smoke test for legal opinion search.
 * Run with: npm run smoke:legal-search
 *
 * Degrades gracefully if Supabase is not configured.
 * Does not require production data.
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  // Dynamic import so env vars are loaded first
  const { searchLegalOpinions } = await import("../lib/retrieval/searchLegalOpinions");

  console.log("=== Legal Opinion Search Smoke Test ===\n");

  const testCases = [
    {
      label: "Daubert expert testimony (Federal)",
      input: {
        query: "What are the standards for admitting expert testimony under Daubert?",
        jurisdiction: "Federal",
        limit: 5,
      },
    },
    {
      label: "SDNY court filter",
      input: {
        query: "expert witness reliability gatekeeping",
        court: "SDNY",
        limit: 3,
      },
    },
    {
      label: "Broad query (no filters)",
      input: {
        query: "abuse of discretion standard trial court",
        limit: 3,
      },
    },
  ];

  for (const tc of testCases) {
    console.log(`--- ${tc.label} ---`);
    console.log(`  Query: "${tc.input.query}"`);
    if (tc.input.jurisdiction) console.log(`  Jurisdiction: ${tc.input.jurisdiction}`);
    if (tc.input.court) console.log(`  Court: ${tc.input.court}`);

    const result = await searchLegalOpinions(tc.input);

    console.log(`  Source: ${result.source}`);
    console.log(`  Method: ${result.retrievalMethod}`);
    console.log(`  Fallback: ${result.fallbackUsed}`);
    console.log(`  Candidates: ${result.totalCandidates}`);
    console.log(`  Results: ${result.results.length}`);

    if (result.results.length > 0) {
      for (const r of result.results) {
        console.log(`    [${r.score}] ${r.citation ?? "no citation"} - ${r.caseName}`);
        console.log(`      vec=${r.vectorScore} kw=${r.keywordScore} auth=${r.authorityScore}`);
        console.log(`      "${r.chunkText.slice(0, 80)}..."`);
      }
    } else {
      console.log("    (no results -- this is expected if migration 004/005 have not been applied or no demo data seeded)");
    }
    console.log("");
  }

  console.log("=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
