import { NextRequest, NextResponse } from "next/server";
import { getWorkflowEvents } from "@/lib/litigation/getWorkflowEvents";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid workflow run ID." }, { status: 400 });
  }

  try {
    const events = await getWorkflowEvents(id);
    return NextResponse.json({ events });
  } catch (err) {
    console.warn(
      "[/api/litigation/workflows/[id]/events] GET failed:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Failed to fetch workflow events." }, { status: 500 });
  }
}
