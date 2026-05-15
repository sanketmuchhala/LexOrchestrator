import { NextRequest, NextResponse } from "next/server";
import { verifyCitation } from "@/lib/citations/verifyCitation";
import { saveCitationVerificationReport } from "@/lib/citations/saveCitationVerificationReport";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const citationText = typeof body.citationText === "string" ? body.citationText.trim() : "";
  if (!citationText || citationText.length < 3) {
    return NextResponse.json({ error: "citationText must be at least 3 characters." }, { status: 400 });
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
    return NextResponse.json(
      { error: "Citation verification failed. Check server logs." },
      { status: 500 }
    );
  }
}
