import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionValue, recoveryMatches, sessionCookieOptions } from "@/lib/session";
import { verifyMainPassword, isPasswordSet } from "@/lib/auth";

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const password = typeof data?.password === "string" ? data.password : "";

  if (!(await isPasswordSet())) {
    return NextResponse.json({ error: "Sign-in isn't set up yet." }, { status: 503 });
  }

  // Face ID or the main password both sign you in. The backup credential
  // is the emergency fallback if the main password is forgotten or leaked.
  const ok = recoveryMatches(password) || (await verifyMainPassword(password));
  if (!ok) {
    // A small fixed delay makes guessing slower without needing a rate-limit store.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions);
  return res;
}
