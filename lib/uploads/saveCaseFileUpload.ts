import { insertCaseFileUploadRecord, insertMatterFile, DB_AVAILABLE } from "@/lib/db/supabaseServer";
import type { CaseFileUploadInput, CaseFileUploadResult, CaseFileExtractionStatus } from "./types";
import type { ExtractedCaseFile } from "./types";

export async function saveCaseFileUpload(
  input: CaseFileUploadInput,
  extracted: ExtractedCaseFile
): Promise<CaseFileUploadResult> {
  const status: CaseFileExtractionStatus = extracted.extractionStatus;
  const preview = extracted.text.slice(0, 400).replace(/\n+/g, " ").trim();

  const id = await insertCaseFileUploadRecord({
    workflowRunId: input.workflowRunId,
    matterId: input.matterId,
    fileName: input.fileName,
    fileType: input.fileType,
    fileSizeBytes: input.fileSizeBytes,
    documentRole: input.documentRole,
    status,
    extractedText: extracted.text || null,
    extractionError: extracted.extractionError ?? null,
    metadata: { truncated: extracted.truncated, characterCount: extracted.characterCount },
  });

  if (input.matterId && status !== "error") {
    await insertMatterFile({
      matterId: input.matterId,
      caseFileUploadId: id,
      title: input.fileName,
      fileRole: input.documentRole,
      extractedTextPreview: preview || undefined,
    });
  }

  return {
    id,
    fileName: input.fileName,
    fileType: input.fileType,
    fileSizeBytes: input.fileSizeBytes,
    documentRole: input.documentRole,
    status,
    extractedTextPreview: preview,
    extractedTextLength: extracted.characterCount,
    truncated: extracted.truncated,
    persisted: DB_AVAILABLE,
  };
}
