/**
 * Smoke test for citation extraction and verification.
 * Run with: npm run smoke:citations
 *
 * Degrades gracefully if Supabase is not configured.
 * Uses demo data seeded from Phase 1 when available.
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const { extractCitations } = await import("../lib/citations/extractCitations");
  const { verifyCitation } = await import("../lib/citations/verifyCitation");
  const { verifyCitationsInText } = await import("../lib/citations/verifyCitationsInText");

  console.log("=== Citation Verification Smoke Test ===\n");

  // ── Test 1: extraction ──────────────────────────────────────────────────

  const sampleText = `The Supreme Court established the modern framework for expert testimony 
admissibility in Daubert v. Merrell Dow Pharmaceuticals, Inc., 509 U.S. 579 (1993). 
This standard was extended to all expert testimony in Kumho Tire Co. v. Carmichael, 
526 U.S. 137 (1999), and the abuse-of-discretion standard for appellate review was 
confirmed in General Electric Co. v. Joiner, 522 U.S. 136 (1997). Courts applying 
the Federal Rules must act as gatekeepers. See also Anderson v. Liberty Lobby, Inc., 
477 U.S. 317 (1986).`;

  console.log("--- Test 1: Citation Extraction ---");
  console.log(`  Input: ${sampleText.length} chars of legal text`);

  const extracted = extractCitations(sampleText);
  console.log(`  Found: ${extracted.length} citations`);

  for (const cite of extracted) {
    console.log(`    "${cite.rawText}" (normalized: "${cite.normalizedCitation}", confidence: ${cite.confidence})`);
    console.log(`      position: ${cite.startIndex}-${cite.endIndex}`);
  }
  console.log("");

  // ── Test 2: single citation verification ────────────────────────────────

  console.log("--- Test 2: Single Citation Verification ---");

  const singleResult = await verifyCitation({
    citationText: "509 U.S. 579 (1993)",
    proposition: "The trial court must act as a gatekeeper for expert testimony admissibility.",
    jurisdiction: "Federal",
  });

  console.log(`  Citation: ${singleResult.citationText}`);
  console.log(`  Existence: ${singleResult.existenceStatus}`);
  console.log(`  Quote: ${singleResult.quoteStatus}`);
  console.log(`  Proposition: ${singleResult.propositionStatus}`);
  console.log(`  Treatment: ${singleResult.treatmentStatus}`);
  console.log(`  Overall: ${singleResult.overallStatus}`);
  console.log(`  Confidence: ${singleResult.confidence}`);
  console.log(`  Explanation: ${singleResult.explanation}`);
  if (singleResult.matchedCaseName) {
    console.log(`  Matched: ${singleResult.matchedCaseName} (${singleResult.matchedCitation})`);
  }
  console.log(`  Evidence: ${singleResult.evidence.length} items`);
  console.log("");

  // ── Test 3: unknown citation ────────────────────────────────────────────

  console.log("--- Test 3: Unknown Citation ---");

  const unknownResult = await verifyCitation({
    citationText: "999 U.S. 123 (2099)",
    proposition: "This case established important precedent.",
  });

  console.log(`  Citation: ${unknownResult.citationText}`);
  console.log(`  Existence: ${unknownResult.existenceStatus}`);
  console.log(`  Overall: ${unknownResult.overallStatus}`);
  console.log(`  Explanation: ${unknownResult.explanation}`);
  console.log("");

  // ── Test 4: bulk text verification ──────────────────────────────────────

  console.log("--- Test 4: Bulk Text Verification ---");

  const textResult = await verifyCitationsInText({
    text: sampleText,
    jurisdiction: "Federal",
  });

  console.log(`  Citations found: ${textResult.summary.total}`);
  console.log(`  Pass: ${textResult.summary.pass}`);
  console.log(`  Warn: ${textResult.summary.warn}`);
  console.log(`  Fail: ${textResult.summary.fail}`);
  console.log(`  Unknown: ${textResult.summary.unknown}`);

  for (const cite of textResult.citations) {
    console.log(`    [${cite.overallStatus}] ${cite.normalizedCitation} -> ${cite.existenceStatus} (${cite.matchedCaseName ?? "no match"})`);
  }
  console.log("");

  console.log("=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
