import { NextRequest, NextResponse } from "next/server";
import { getEditableDraft } from "@/lib/drafts/getEditableDraft";
import { saveDraftRevision } from "@/lib/drafts/saveDraftRevision";
import { listDraftRevisions } from "@/lib/drafts/listDraftRevisions";
import { verifyDraftRevision } from "@/lib/drafts/verifyDraftRevision";

const MAX_CONTENT_LENGTH = 250_000;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id: workflowRunId } = await params;

  try {
    const editable = await getEditableDraft(workflowRunId);
    const revisions = editable.draftArtifactId
      ? await listDraftRevisions(editable.draftArtifactId)
      : [];

    return NextResponse.json({
      workflowRunId,
      draftArtifactId: editable.draftArtifactId,
      content: editable.content,
      version: editable.version,
      verificationStatus: editable.verificationStatus,
      citationSummary: editable.latestRevision?.citationSummary ?? null,
      revisions,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load draft." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id: workflowRunId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content : null;
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Content exceeds the ${MAX_CONTENT_LENGTH.toLocaleString()} character limit.` },
      { status: 400 }
    );
  }

  const editSummary = typeof body.editSummary === "string" ? body.editSummary : undefined;
  const verifyAfterSave = body.verifyAfterSave === true;

  // Load current draft to get artifact ID and version
  let editable;
  try {
    editable = await getEditableDraft(workflowRunId);
  } catch {
    return NextResponse.json({ error: "Failed to load draft metadata." }, { status: 500 });
  }

  if (!editable.draftArtifactId) {
    return NextResponse.json(
      { error: "No primary draft artifact found for this workflow run." },
      { status: 404 }
    );
  }

  let saveResult;
  try {
    saveResult = await saveDraftRevision({
      workflowRunId,
      draftArtifactId: editable.draftArtifactId,
      content,
      editSummary,
      currentVersion: editable.version,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save draft revision." }, { status: 500 });
  }

  if (!verifyAfterSave) {
    return NextResponse.json({ revision: saveResult.revision, persisted: saveResult.persisted });
  }

  let verifyResult;
  try {
    verifyResult = await verifyDraftRevision({
      content,
      workflowRunId,
      draftArtifactId: editable.draftArtifactId,
    });
  } catch {
    return NextResponse.json({
      revision: saveResult.revision,
      persisted: saveResult.persisted,
      verificationError: "Verification ran but encountered an error.",
    });
  }

  return NextResponse.json({
    revision: saveResult.revision,
    persisted: saveResult.persisted,
    citationSummary: verifyResult.citationSummary,
    verificationStatus: verifyResult.verificationStatus,
  });
}
