import { NextRequest, NextResponse } from "next/server";
import { runOrchestration } from "@/lib/orchestrator/runOrchestration";

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = body?.query?.trim();
  if (!query || query.length < 5) {
    return NextResponse.json({ error: "Query must be at least 5 characters." }, { status: 400 });
  }
  if (query.length > 1200) {
    return NextResponse.json({ error: "Query must be under 1200 characters." }, { status: 400 });
  }

  try {
    const result = await runOrchestration(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/orchestrate] Pipeline error:", err);
    return NextResponse.json(
      { error: "Orchestration pipeline failed. Check server logs." },
      { status: 500 }
    );
  }
}
