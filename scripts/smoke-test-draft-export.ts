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

const SAMPLE_PAYLOAD = {
  title: "Defendant's Motion to Dismiss — S.D.N.Y.",
  motionType: "motion_to_dismiss",
  jurisdiction: "Federal",
  court: "S.D.N.Y.",
  workflowRunId: "smoke-test-export-001",
  exportedAt: new Date().toISOString(),
  version: 2,
  verificationStatus: "partial",
  citationSummary: { total: 2, pass: 1, warn: 1, fail: 0, unknown: 0 },
  mainSections: [
    { heading: "PRELIMINARY STATEMENT", isMainHeading: true, body: "Defendant moves this Court to dismiss the complaint pursuant to Rule 12(b)(6)." },
    { heading: "STATEMENT OF RELEVANT FACTS", isMainHeading: true, body: "Plaintiff entered into a written services agreement with Defendant dated January 1, 2023. See Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)." },
    { heading: "LEGAL STANDARD", isMainHeading: true, body: "To survive a motion to dismiss, a complaint must allege sufficient facts to state a claim plausible on its face. Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007)." },
    { heading: "ARGUMENT", isMainHeading: true, body: "The complaint fails to plead sufficient facts establishing a breach of contract." },
    { heading: "CONCLUSION", isMainHeading: true, body: "For the foregoing reasons, the Court should grant the motion to dismiss." },
  ],
  appendixJudgeBrief: "JUDGE BRIEF -- Demo fixture data only. Not real judicial analysis.",
  appendixLocalRules: "LOCAL RULES REVIEW -- Southern District of New York (SDNY). All required sections detected.",
  appendixAdversarial: "ADVERSARIAL RISK: MEDIUM\n\nThe complaint may survive dismissal if the court finds sufficient facts.",
};

async function main() {
  console.log("=== Draft Export Smoke Test ===\n");

  const { exportTxt } = await import("../lib/exports/exportTxt");
  const { exportDocx } = await import("../lib/exports/exportDocx");
  const { exportPdf } = await import("../lib/exports/exportPdf");
  const { exportDraft } = await import("../lib/exports/exportDraft");

  // ── Step 1: TXT export ────────────────────────────────────────────────────

  console.log("--- Step 1: TXT export ---");
  try {
    const buf = exportTxt(SAMPLE_PAYLOAD, { includeMetadata: true, includeVerificationSummary: true });
    if (Buffer.isBuffer(buf) && buf.length > 100) {
      const text = buf.toString("utf-8");
      const hasTitle = text.includes("MOTION TO DISMISS");
      const hasCitations = text.includes("CITATION VERIFICATION");
      pass("exportTxt", `size=${buf.length} bytes hasTitle=${hasTitle} hasCitationSummary=${hasCitations}`);
    } else {
      fail("exportTxt", `unexpected buffer: size=${buf?.length}`);
    }
  } catch (err) {
    fail("exportTxt", String(err));
  }

  // ── Step 2: DOCX export ───────────────────────────────────────────────────

  console.log("\n--- Step 2: DOCX export ---");
  try {
    const buf = await exportDocx(SAMPLE_PAYLOAD, {
      includeMetadata: true,
      includeVerificationSummary: true,
      includeJudgeBrief: true,
    });
    if (Buffer.isBuffer(buf) && buf.length > 1000) {
      // DOCX is a ZIP file starting with PK
      const isPk = buf[0] === 0x50 && buf[1] === 0x4b;
      pass("exportDocx", `size=${buf.length} bytes isDocx=${isPk}`);
    } else {
      fail("exportDocx", `unexpected buffer: size=${buf?.length}`);
    }
  } catch (err) {
    fail("exportDocx", String(err));
  }

  // ── Step 3: PDF export ────────────────────────────────────────────────────

  console.log("\n--- Step 3: PDF export ---");
  try {
    const buf = await exportPdf(SAMPLE_PAYLOAD, {
      includeMetadata: true,
      includeVerificationSummary: true,
      includeAdversarialReview: true,
    });
    if (Buffer.isBuffer(buf) && buf.length > 1000) {
      // PDF starts with %PDF
      const isPdf = buf.slice(0, 4).toString("ascii") === "%PDF";
      pass("exportPdf", `size=${buf.length} bytes isPdf=${isPdf}`);
    } else {
      fail("exportPdf", `unexpected buffer: size=${buf?.length}`);
    }
  } catch (err) {
    fail("exportPdf", String(err));
  }

  // ── Step 4: exportDraft orchestrator (TXT, checks fileName/mimeType) ──────

  console.log("\n--- Step 4: exportDraft orchestrator (with fallback payload) ---");
  try {
    // Use a known non-existent workflowRunId -- buildDraftExportPayload degrades gracefully
    const result = await exportDraft({
      workflowRunId: "smoke-test-nonexistent",
      format: "txt",
      options: { includeMetadata: true },
    });
    if (result.buffer && result.buffer.length > 0 && result.mimeType === "text/plain; charset=utf-8") {
      pass("exportDraft txt", `fileName=${result.fileName} size=${result.buffer.length}`);
    } else {
      fail("exportDraft txt", `unexpected result: ${JSON.stringify({ fileName: result.fileName, mimeType: result.mimeType, size: result.buffer?.length })}`);
    }
  } catch (err) {
    fail("exportDraft txt", String(err));
  }

  // ── Step 5: fileName and MIME type validation ─────────────────────────────

  console.log("\n--- Step 5: File name and MIME type validation ---");
  try {
    const pdfResult = await exportDraft({
      workflowRunId: "smoke-test-nonexistent",
      format: "pdf",
    });
    const docxResult = await exportDraft({
      workflowRunId: "smoke-test-nonexistent",
      format: "docx",
    });

    const pdfOk = pdfResult.fileName.endsWith(".pdf") && pdfResult.mimeType === "application/pdf";
    const docxOk = docxResult.fileName.endsWith(".docx") && docxResult.mimeType.includes("openxmlformats");

    if (pdfOk && docxOk) {
      pass("file names and MIME types", `pdf=${pdfResult.fileName} docx=${docxResult.fileName}`);
    } else {
      fail("file names and MIME types", `pdfOk=${pdfOk} docxOk=${docxOk}`);
    }
  } catch (err) {
    fail("file names and MIME types", String(err));
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
