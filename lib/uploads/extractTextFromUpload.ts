import type { ExtractedCaseFile } from "./types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_EXTRACTED_CHARS = 100_000;

const SUPPORTED_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/octet-stream", // some browsers report .txt as this
]);

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[ \t]+\n/g, "\n")       // trailing whitespace on lines
    .replace(/\n{4,}/g, "\n\n\n")    // collapse 4+ blank lines to 3
    .trim();
}

function isTextType(mimeType: string, fileName: string): boolean {
  if (SUPPORTED_TYPES.has(mimeType)) return true;
  // Also accept by extension for browsers that report generic types
  const lower = fileName.toLowerCase();
  return lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".markdown");
}

export async function extractTextFromUpload(
  file: File
): Promise<ExtractedCaseFile> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      text: "",
      characterCount: 0,
      extractionStatus: "error",
      extractionError: `File exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB). Upload a smaller file or paste the text directly into the facts field.`,
      truncated: false,
    };
  }

  if (!isTextType(file.type, file.name)) {
    return {
      text: "",
      characterCount: 0,
      extractionStatus: "skipped",
      extractionError:
        "Unsupported file type for Phase 13. Supported formats: .txt, .md. PDF and DOCX support is planned for a future phase.",
      truncated: false,
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const normalized = normalizeText(raw);

    const truncated = normalized.length > MAX_EXTRACTED_CHARS;
    const text = truncated ? normalized.slice(0, MAX_EXTRACTED_CHARS) : normalized;

    return {
      text,
      characterCount: text.length,
      extractionStatus: "extracted",
      truncated,
    };
  } catch (err) {
    return {
      text: "",
      characterCount: 0,
      extractionStatus: "error",
      extractionError: `Text extraction failed: ${err instanceof Error ? err.message : "unknown error"}`,
      truncated: false,
    };
  }
}

export async function extractTextFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<ExtractedCaseFile> {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      text: "",
      characterCount: 0,
      extractionStatus: "error",
      extractionError: `File exceeds the 5 MB limit (${(fileSize / 1024 / 1024).toFixed(1)} MB).`,
      truncated: false,
    };
  }

  if (!isTextType(mimeType, fileName)) {
    return {
      text: "",
      characterCount: 0,
      extractionStatus: "skipped",
      extractionError:
        "Unsupported file type for Phase 13. Supported formats: .txt, .md. PDF and DOCX support is planned for a future phase.",
      truncated: false,
    };
  }

  try {
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const normalized = normalizeText(raw);
    const truncated = normalized.length > MAX_EXTRACTED_CHARS;
    const text = truncated ? normalized.slice(0, MAX_EXTRACTED_CHARS) : normalized;

    return {
      text,
      characterCount: text.length,
      extractionStatus: "extracted",
      truncated,
    };
  } catch (err) {
    return {
      text: "",
      characterCount: 0,
      extractionStatus: "error",
      extractionError: `Text extraction failed: ${err instanceof Error ? err.message : "unknown error"}`,
      truncated: false,
    };
  }
}
