import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, createSessionValue, passwordMatches, recoveryMatches, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const password = typeof data?.password === "string" ? data.password : "";

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Sign-in isn't set up yet: APP_PASSWORD is missing on the server." }, { status: 503 });
  }
  // The backup credential always works, even past the Face-ID gate.
  const viaRecovery = recoveryMatches(password);

  // Otherwise, once a Face ID device is saved, it's the only way in. The
  // password only gets you in before Face ID is set up, or if
  // ALLOW_PASSWORD_LOGIN=true is set on the server.
  if (!viaRecovery && process.env.ALLOW_PASSWORD_LOGIN !== "true" && (await prisma.passkey.count()) > 0) {
    return NextResponse.json({ error: "Face ID is required to sign in." }, { status: 403 });
  }
  if (!viaRecovery && !passwordMatches(password)) {
    // A small fixed delay makes guessing slower without needing a rate-limit store.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions);
  return res;
}
