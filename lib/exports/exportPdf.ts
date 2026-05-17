import type { DraftExportPayload, DraftExportOptions } from "./types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function exportPdf(
  payload: DraftExportPayload,
  options: DraftExportOptions = {}
): Promise<Buffer> {
  const {
    includeMetadata = true,
    includeVerificationSummary = true,
    includeJudgeBrief = false,
    includeLocalRulesReview = false,
    includeAdversarialReview = false,
  } = options;

  // Dynamic import to keep pdfkit server-side only
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: payload.title,
        Author: "LexOrchestrator",
        Subject: payload.motionType ?? "Legal Draft",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Cover / title ──────────────────────────────────────────────────────

    doc.fontSize(16).font("Helvetica-Bold").text(payload.title.toUpperCase(), {
      align: "center",
    });
    doc.moveDown(0.5);

    if (includeMetadata) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#555555")
        .moveDown(0.25);

      if (payload.motionType) {
        doc.text(`Motion Type: ${payload.motionType.replace(/_/g, " ")}`);
      }
      if (payload.jurisdiction) doc.text(`Jurisdiction: ${payload.jurisdiction}`);
      if (payload.court) doc.text(`Court: ${payload.court}`);
      doc.text(`Version: v${payload.version}`);
      doc.text(`Exported: ${formatDate(payload.exportedAt)}`);
      doc.text(`Run ID: ${payload.workflowRunId}`);
      doc.fillColor("#000000").moveDown(0.5);

      // Separator
      doc
        .moveTo(72, doc.y)
        .lineTo(doc.page.width - 72, doc.y)
        .strokeColor("#cccccc")
        .stroke()
        .strokeColor("#000000");
      doc.moveDown(0.5);

      // Notice
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .fillColor("#888888")
        .text(
          "NOTICE: This document is a draft generated for review purposes only. " +
          "It does not constitute legal advice and is not court-filing ready.",
          { align: "left" }
        )
        .fillColor("#000000");
      doc.moveDown(1);
    }

    // ── Main content ────────────────────────────────────────────────────────

    for (const section of payload.mainSections) {
      if (section.heading) {
        doc.fontSize(12).font("Helvetica-Bold").moveDown(0.5).text(section.heading).moveDown(0.25);
      }
      if (section.body) {
        doc.fontSize(11).font("Helvetica").text(section.body, { align: "justify" }).moveDown(0.75);
      }
    }

    // ── Citation verification summary ────────────────────────────────────────

    if (includeVerificationSummary && payload.citationSummary) {
      const cs = payload.citationSummary;
      doc.addPage();
      doc
        .moveTo(72, doc.y)
        .lineTo(doc.page.width - 72, doc.y)
        .stroke();
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").text("APPENDIX A -- CITATION VERIFICATION SUMMARY");
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Total: ${cs.total}   Pass: ${cs.pass}   Warn: ${cs.warn}   Fail: ${cs.fail}   Unknown: ${cs.unknown}`);
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .fillColor("#555555")
        .text(
          "Citation verification is limited to locally indexed opinions. " +
          "Citations not in the corpus return not_found."
        )
        .fillColor("#000000");
    }

    // ── Optional appendices ──────────────────────────────────────────────────

    function addAppendix(label: string, content: string) {
      doc.addPage();
      doc
        .moveTo(72, doc.y)
        .lineTo(doc.page.width - 72, doc.y)
        .stroke();
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").text(`APPENDIX -- ${label}`);
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(content, { align: "left" });
    }

    if (includeJudgeBrief && payload.appendixJudgeBrief) {
      addAppendix("JUDGE BRIEF", payload.appendixJudgeBrief);
    }
    if (includeLocalRulesReview && payload.appendixLocalRules) {
      addAppendix("LOCAL RULES REVIEW", payload.appendixLocalRules);
    }
    if (includeAdversarialReview && payload.appendixAdversarial) {
      addAppendix("ADVERSARIAL REVIEW", payload.appendixAdversarial);
    }

    doc.end();
  });
}
