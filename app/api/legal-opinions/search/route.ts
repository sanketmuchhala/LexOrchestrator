import { NextRequest, NextResponse } from "next/server";
import { searchLegalOpinions } from "@/lib/retrieval/searchLegalOpinions";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Query must be at least 3 characters." }, { status: 400 });
  }
  if (query.length > 2000) {
    return NextResponse.json({ error: "Query must be under 2000 characters." }, { status: 400 });
  }

  const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction : undefined;
  const court = typeof body.court === "string" ? body.court : undefined;
  const dateFrom = typeof body.dateFrom === "string" ? body.dateFrom : undefined;
  const dateTo = typeof body.dateTo === "string" ? body.dateTo : undefined;
  const limit = typeof body.limit === "number" ? Math.min(Math.max(body.limit, 1), 50) : 5;

  try {
    const response = await searchLegalOpinions({
      query,
      jurisdiction,
      court,
      dateFrom,
      dateTo,
      limit,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.warn("[/api/legal-opinions/search] Search failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Legal opinion search failed. Check server logs." },
      { status: 500 }
    );
  }
}
