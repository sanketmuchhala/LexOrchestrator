import { NextRequest, NextResponse } from "next/server";
import { getRunById } from "@/lib/db/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid run ID." }, { status: 400 });
  }

  const run = await getRunById(id);
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  return NextResponse.json(run);
}
