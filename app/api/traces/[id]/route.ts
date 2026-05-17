import { NextRequest, NextResponse } from "next/server";
import { buildWorkflowTrace } from "@/lib/traces/buildWorkflowTrace";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id: workflowRunId } = await params;

  let trace;
  try {
    trace = await buildWorkflowTrace(workflowRunId);
  } catch {
    return NextResponse.json(
      { error: "Failed to build workflow trace." },
      { status: 500 }
    );
  }

  if (trace.workflow === null && trace.events.length === 0) {
    return NextResponse.json(
      { error: "Workflow run not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(trace, { status: 200 });
}
