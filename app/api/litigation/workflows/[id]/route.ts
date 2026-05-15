import { NextRequest, NextResponse } from "next/server";
import { getWorkflowRun } from "@/lib/litigation/getWorkflowRun";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid workflow run ID." }, { status: 400 });
  }

  try {
    const detail = await getWorkflowRun(id);
    if (!detail.workflow) {
      return NextResponse.json({ error: "Workflow run not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.warn(
      "[/api/litigation/workflows/[id]] GET failed:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Failed to fetch workflow run." }, { status: 500 });
  }
}
