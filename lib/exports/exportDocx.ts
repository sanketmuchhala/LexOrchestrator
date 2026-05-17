import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
} from "docx";
import type { DraftExportPayload, DraftExportOptions } from "./types";

function metaParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, font: "Times New Roman" }),
      new TextRun({ text: value, size: 20, font: "Times New Roman" }),
    ],
    spacing: { after: 80 },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    style: "Heading1",
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })],
    spacing: { after: 200 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function appendixHeading(label: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `APPENDIX -- ${label}`,
        bold: true,
        size: 24,
        font: "Times New Roman",
        allCaps: true,
      }),
    ],
    spacing: { before: 480, after: 240 },
    border: {
      top: { style: "single" as const, size: 6, space: 4 },
    },
  });
}

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

export async function exportDocx(
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

  const children: Paragraph[] = [];

  // Cover / title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: payload.title,
          bold: true,
          size: 32,
          font: "Times New Roman",
          allCaps: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Metadata block
  if (includeMetadata) {
    if (payload.motionType) {
      children.push(metaParagraph("Motion Type", payload.motionType.replace(/_/g, " ")));
    }
    if (payload.jurisdiction) children.push(metaParagraph("Jurisdiction", payload.jurisdiction));
    if (payload.court) children.push(metaParagraph("Court", payload.court));
    children.push(metaParagraph("Version", `v${payload.version}`));
    children.push(metaParagraph("Exported", formatDate(payload.exportedAt)));
    children.push(metaParagraph("Run ID", payload.workflowRunId));

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              "NOTICE: This document is a draft generated for review purposes only. " +
              "It does not constitute legal advice and is not court-filing ready.",
            italics: true,
            size: 18,
            font: "Times New Roman",
            color: "666666",
          }),
        ],
        spacing: { before: 200, after: 400 },
        border: {
          bottom: { style: "single" as const, size: 6, space: 4 },
        },
      })
    );
  }

  // Main content sections
  for (const section of payload.mainSections) {
    if (section.heading) {
      children.push(sectionHeading(section.heading));
    }
    if (section.body) {
      // Split body on newlines to preserve paragraph structure
      for (const line of section.body.split("\n\n")) {
        if (line.trim()) children.push(bodyParagraph(line.trim()));
      }
    }
  }

  // Citation verification summary
  if (includeVerificationSummary && payload.citationSummary) {
    const cs = payload.citationSummary;
    children.push(appendixHeading("CITATION VERIFICATION SUMMARY"));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Total: ${cs.total}  `, size: 22, font: "Times New Roman" }),
          new TextRun({ text: `Pass: ${cs.pass}  `, size: 22, font: "Times New Roman", color: "16a34a" }),
          new TextRun({ text: `Warn: ${cs.warn}  `, size: 22, font: "Times New Roman", color: "d97706" }),
          new TextRun({ text: `Fail: ${cs.fail}`, size: 22, font: "Times New Roman", color: "dc2626" }),
        ],
        spacing: { after: 160 },
      })
    );
    children.push(
      bodyParagraph(
        "Citation verification is limited to locally indexed opinions. " +
        "Citations not in the corpus return not_found."
      )
    );
  }

  // Optional appendices
  if (includeJudgeBrief && payload.appendixJudgeBrief) {
    children.push(appendixHeading("JUDGE BRIEF"));
    for (const line of payload.appendixJudgeBrief.split("\n\n")) {
      if (line.trim()) children.push(bodyParagraph(line.trim()));
    }
  }
  if (includeLocalRulesReview && payload.appendixLocalRules) {
    children.push(appendixHeading("LOCAL RULES REVIEW"));
    for (const line of payload.appendixLocalRules.split("\n\n")) {
      if (line.trim()) children.push(bodyParagraph(line.trim()));
    }
  }
  if (includeAdversarialReview && payload.appendixAdversarial) {
    children.push(appendixHeading("ADVERSARIAL REVIEW"));
    for (const line of payload.appendixAdversarial.split("\n\n")) {
      if (line.trim()) children.push(bodyParagraph(line.trim()));
    }
  }

  const doc = new Document({
    sections: [{ children }],
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          run: { bold: true, size: 26, font: "Times New Roman", allCaps: true },
        },
      ],
    },
  });

  return Packer.toBuffer(doc);
}
