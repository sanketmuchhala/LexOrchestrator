import { NextResponse } from "next/server";
import { getRecentRuns } from "@/lib/db/supabaseServer";

export async function GET() {
  const runs = await getRecentRuns(20);
  return NextResponse.json(runs);
}
