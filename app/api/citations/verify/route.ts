import { NextRequest, NextResponse } from "next/server";
import { verifyCitation } from "@/lib/citations/verifyCitation";
import { saveCitationVerificationReport } from "@/lib/citations/saveCitationVerificationReport";

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

  const citationText = typeof body.citationText === "string" ? body.citationText.trim() : "";
  if (!citationText || citationText.length < 3) {
    return apiError("citationText must be at least 3 characters.", 400, "INVALID_CITATION_TEXT");
  }

  const proposition = typeof body.proposition === "string" ? body.proposition : undefined;
  const quoteText = typeof body.quoteText === "string" ? body.quoteText : undefined;
  const pinCite = typeof body.pinCite === "string" ? body.pinCite : undefined;
  const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction : undefined;
  const court = typeof body.court === "string" ? body.court : undefined;
  const workflowRunId = typeof body.workflowRunId === "string" ? body.workflowRunId : undefined;
  const draftArtifactId = typeof body.draftArtifactId === "string" ? body.draftArtifactId : undefined;

  try {
    const result = await verifyCitation({
      citationText,
      proposition,
      quoteText,
      pinCite,
      jurisdiction,
      court,
      workflowRunId,
      draftArtifactId,
    });

    // Persist if workflowRunId provided
    if (workflowRunId) {
      await saveCitationVerificationReport(result, workflowRunId, draftArtifactId);
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.warn("[/api/citations/verify] Verification failed:", err instanceof Error ? err.message : String(err));
    return apiError("Citation verification failed. Check server logs.", 500, "CITATION_VERIFICATION_FAILED");
  }
}
