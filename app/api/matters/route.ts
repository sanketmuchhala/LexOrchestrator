import { NextRequest, NextResponse } from "next/server";
import { listMatters } from "@/lib/matters/listMatters";
import { createMatter } from "@/lib/matters/createMatter";
import type { CreateMatterInput } from "@/lib/matters/types";

export async function GET(): Promise<NextResponse> {
  try {
    const matters = await listMatters(50);
    return NextResponse.json({ matters });
  } catch {
    return NextResponse.json({ error: "Failed to load matters." }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length < 2) {
    return NextResponse.json({ error: "title is required (minimum 2 characters)." }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title must be under 200 characters." }, { status: 400 });
  }

  const input: CreateMatterInput = {
    title,
    clientName: typeof body.clientName === "string" ? body.clientName.trim() : undefined,
    matterType: typeof body.matterType === "string" ? body.matterType.trim() : undefined,
    jurisdiction: typeof body.jurisdiction === "string" ? body.jurisdiction.trim() : undefined,
    court: typeof body.court === "string" ? body.court.trim() : undefined,
    judgeName: typeof body.judgeName === "string" ? body.judgeName.trim() : undefined,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    userId: typeof body.userId === "string" ? body.userId : undefined,
    organizationId: typeof body.organizationId === "string" ? body.organizationId : undefined,
  };

  try {
    const { id, persisted } = await createMatter(input);
    return NextResponse.json({ id, persisted, title: input.title }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create matter." }, { status: 500 });
  }
}
