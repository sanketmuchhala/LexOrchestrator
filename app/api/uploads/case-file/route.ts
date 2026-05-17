import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/uploads/extractTextFromUpload";
import { saveCaseFileUpload } from "@/lib/uploads/saveCaseFileUpload";
import type { CaseFileDocumentRole } from "@/lib/uploads/types";

const VALID_ROLES = new Set<string>([
  "complaint", "deposition", "affidavit", "exhibit", "motion", "case_file", "other",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` },
      { status: 400 }
    );
  }

  const rawRole = (formData.get("documentRole") as string | null) ?? "case_file";
  const documentRole: CaseFileDocumentRole = VALID_ROLES.has(rawRole)
    ? (rawRole as CaseFileDocumentRole)
    : "case_file";

  const workflowRunId = (formData.get("workflowRunId") as string | null) ?? undefined;
  const matterId = (formData.get("matterId") as string | null) ?? undefined;

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file." }, { status: 500 });
  }

  const extracted = await extractTextFromBuffer(buffer, file.name, file.type, file.size);

  if (extracted.extractionStatus === "error") {
    return NextResponse.json({ error: extracted.extractionError }, { status: 400 });
  }

  let result;
  try {
    result = await saveCaseFileUpload(
      {
        fileName: file.name,
        fileType: file.type || "text/plain",
        fileSizeBytes: file.size,
        documentRole,
        workflowRunId,
        matterId,
      },
      extracted
    );
  } catch {
    return NextResponse.json({ error: "Failed to save upload record." }, { status: 500 });
  }

  return NextResponse.json({ upload: result, extractedText: extracted.text });
}
