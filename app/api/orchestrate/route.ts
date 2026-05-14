import { NextRequest, NextResponse } from "next/server";
import { runOrchestrationPipeline } from "@/lib/orchestrator/pipeline";

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = body?.query?.trim();
  if (!query || query.length < 5) {
    return NextResponse.json(
      { error: "Query must be at least 5 characters." },
      { status: 400 }
    );
  }
  if (query.length > 1000) {
    return NextResponse.json(
      { error: "Query must be under 1000 characters." },
      { status: 400 }
    );
  }

  const result = runOrchestrationPipeline(query);
  return NextResponse.json(result);
}
