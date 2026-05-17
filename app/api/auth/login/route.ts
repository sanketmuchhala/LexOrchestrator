import { NextRequest, NextResponse } from "next/server";

const CREDENTIALS: Record<string, string> = {
  demo:    "lexorchestrator",
  sankii:  "lex@admin2025",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!CREDENTIALS[username] || CREDENTIALS[username] !== password) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user: username });
  res.cookies.set("lex_session", username, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
