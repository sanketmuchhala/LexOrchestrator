import { buildDraftExportPayload } from "./buildDraftExportPayload";
import { exportTxt } from "./exportTxt";
import { exportDocx } from "./exportDocx";
import { exportPdf } from "./exportPdf";
import type { DraftExportInput, DraftExportResult, ExportFormat } from "./types";

const MIME_TYPES: Record<ExportFormat, string> = {
  txt: "text/plain; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

const EXTENSIONS: Record<ExportFormat, string> = {
  txt: "txt",
  docx: "docx",
  pdf: "pdf",
};

function sanitizeFileName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function exportDraft(input: DraftExportInput): Promise<DraftExportResult> {
  const { workflowRunId, format, options = {} } = input;

  const payload = await buildDraftExportPayload(workflowRunId);

  let buffer: Buffer;
  try {
    if (format === "txt") {
      buffer = exportTxt(payload, options);
    } else if (format === "docx") {
      buffer = await exportDocx(payload, options);
    } else if (format === "pdf") {
      buffer = await exportPdf(payload, options);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Export failed for format "${format}": ${message}`);
  }

  const slug = sanitizeFileName(payload.title || workflowRunId);
  const fileName = `draft-${slug}-v${payload.version}.${EXTENSIONS[format]}`;

  return {
    fileName,
    mimeType: MIME_TYPES[format],
    buffer,
    format,
  };
}
