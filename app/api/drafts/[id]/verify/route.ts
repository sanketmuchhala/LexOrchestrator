import { NextRequest, NextResponse } from "next/server";
import { getEditableDraft } from "@/lib/drafts/getEditableDraft";
import { verifyDraftRevision } from "@/lib/drafts/verifyDraftRevision";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id: workflowRunId } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // body is optional for this endpoint
  }

  let content: string;
  let draftArtifactId: string;

  if (typeof body.content === "string" && body.content.trim().length > 0) {
    content = body.content;
    const editable = await getEditableDraft(workflowRunId).catch(() => null);
    if (!editable?.draftArtifactId) {
      return NextResponse.json(
        { error: "No primary draft artifact found for this workflow run." },
        { status: 404 }
      );
    }
    draftArtifactId = editable.draftArtifactId;
  } else {
    let editable;
    try {
      editable = await getEditableDraft(workflowRunId);
    } catch {
      return NextResponse.json({ error: "Failed to load draft." }, { status: 500 });
    }
    if (!editable.draftArtifactId || !editable.content) {
      return NextResponse.json(
        { error: "No draft content available to verify." },
        { status: 404 }
      );
    }
    content = editable.content;
    draftArtifactId = editable.draftArtifactId;
  }

  try {
    const result = await verifyDraftRevision({ content, workflowRunId, draftArtifactId });
    return NextResponse.json({
      citationSummary: result.citationSummary,
      verificationStatus: result.verificationStatus,
      reportCount: result.reports.length,
    });
  } catch {
    return NextResponse.json({ error: "Citation verification failed." }, { status: 500 });
  }
}
