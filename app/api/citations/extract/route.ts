import { NextRequest, NextResponse } from "next/server";
import { extractCitationsWithBestAvailableProvider } from "@/lib/citations/citationExtractorAdapter";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length < 5) {
    return NextResponse.json({ error: "Text must be at least 5 characters." }, { status: 400 });
  }
  if (text.length > 50000) {
    return NextResponse.json({ error: "Text must be under 50000 characters." }, { status: 400 });
  }

  const citations = await extractCitationsWithBestAvailableProvider(text);
  return NextResponse.json({ citations });
}
