import { NextRequest, NextResponse } from "next/server";
import { getWorkflowArtifacts } from "@/lib/litigation/getWorkflowArtifacts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid workflow run ID." }, { status: 400 });
  }

  try {
    const artifacts = await getWorkflowArtifacts(id);
    return NextResponse.json({ artifacts });
  } catch (err) {
    console.warn(
      "[/api/litigation/workflows/[id]/artifacts] GET failed:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Failed to fetch workflow artifacts." }, { status: 500 });
  }
}
