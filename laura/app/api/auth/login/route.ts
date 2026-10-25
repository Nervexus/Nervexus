import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionValue, passwordMatches, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const password = typeof data?.password === "string" ? data.password : "";

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Sign-in isn't set up yet: APP_PASSWORD is missing on the server." }, { status: 503 });
  }
  if (!passwordMatches(password)) {
    // A small fixed delay makes guessing slower without needing a rate-limit store.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions);
  return res;
}
