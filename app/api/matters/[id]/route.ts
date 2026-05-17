import { NextRequest, NextResponse } from "next/server";
import { getMatterWorkspace } from "@/lib/matters/getMatterWorkspace";
import { updateMatter } from "@/lib/matters/updateMatter";
import type { UpdateMatterInput } from "@/lib/matters/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  try {
    const workspace = await getMatterWorkspace(id);
    if (!workspace) {
      return NextResponse.json({ error: "Matter not found." }, { status: 404 });
    }
    return NextResponse.json(workspace);
  } catch {
    return NextResponse.json({ error: "Failed to load matter workspace." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validStatuses = new Set(["active", "closed", "on_hold", "archived"]);
  const rawStatus = typeof body.status === "string" ? body.status : undefined;
  if (rawStatus !== undefined && !validStatuses.has(rawStatus)) {
    return NextResponse.json({ error: `status must be one of: ${[...validStatuses].join(", ")}` }, { status: 400 });
  }

  const input: UpdateMatterInput = {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    clientName: typeof body.clientName === "string" ? body.clientName.trim() : undefined,
    matterType: typeof body.matterType === "string" ? body.matterType.trim() : undefined,
    jurisdiction: typeof body.jurisdiction === "string" ? body.jurisdiction.trim() : undefined,
    court: typeof body.court === "string" ? body.court.trim() : undefined,
    status: rawStatus as UpdateMatterInput["status"],
    description: typeof body.description === "string" ? body.description.trim() : undefined,
  };

  try {
    await updateMatter(id, input);
    return NextResponse.json({ id, updated: true });
  } catch {
    return NextResponse.json({ error: "Failed to update matter." }, { status: 500 });
  }
}
