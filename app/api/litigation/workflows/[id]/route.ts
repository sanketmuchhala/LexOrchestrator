import { NextRequest, NextResponse } from "next/server";
import { getWorkflowRun } from "@/lib/litigation/getWorkflowRun";

function apiError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return apiError("Invalid workflow run ID.", 400, "INVALID_WORKFLOW_ID");
  }

  try {
    const detail = await getWorkflowRun(id);
    if (!detail.workflow) {
      return apiError("Workflow run not found.", 404, "WORKFLOW_NOT_FOUND");
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.warn(
      "[/api/litigation/workflows/[id]] GET failed:",
      err instanceof Error ? err.message : String(err)
    );
    return apiError("Failed to fetch workflow run.", 500, "WORKFLOW_FETCH_FAILED");
  }
}
