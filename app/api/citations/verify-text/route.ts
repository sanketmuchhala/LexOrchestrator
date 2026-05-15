import { NextRequest, NextResponse } from "next/server";
import { verifyCitationsInText } from "@/lib/citations/verifyCitationsInText";

function apiError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "INVALID_JSON");
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length < 10) {
    return apiError("Text must be at least 10 characters.", 400, "INVALID_TEXT");
  }
  if (text.length > 50000) {
    return apiError("Text must be under 50000 characters.", 400, "TEXT_TOO_LONG");
  }

  const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction : undefined;
  const court = typeof body.court === "string" ? body.court : undefined;
  const workflowRunId = typeof body.workflowRunId === "string" ? body.workflowRunId : undefined;
  const draftArtifactId = typeof body.draftArtifactId === "string" ? body.draftArtifactId : undefined;

  try {
    const response = await verifyCitationsInText({
      text,
      jurisdiction,
      court,
      workflowRunId,
      draftArtifactId,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.warn("[/api/citations/verify-text] Verification failed:", err instanceof Error ? err.message : String(err));
    return apiError("Text citation verification failed. Check server logs.", 500, "TEXT_CITATION_VERIFICATION_FAILED");
  }
}
