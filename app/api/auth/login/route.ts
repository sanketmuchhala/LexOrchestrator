import { NextRequest, NextResponse } from "next/server";

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "lexorchestrator";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("lex_session", "demo_user", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
