import { NextRequest, NextResponse } from "next/server";
import { verifyCitationsInText } from "@/lib/citations/verifyCitationsInText";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length < 10) {
    return NextResponse.json({ error: "Text must be at least 10 characters." }, { status: 400 });
  }
  if (text.length > 50000) {
    return NextResponse.json({ error: "Text must be under 50000 characters." }, { status: 400 });
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
    return NextResponse.json(
      { error: "Text citation verification failed. Check server logs." },
      { status: 500 }
    );
  }
}
