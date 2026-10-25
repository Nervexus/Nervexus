import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  createSessionValue,
  openChallenge,
  sealChallenge,
  sessionCookieOptions,
} from "@/lib/session";
import { authenticationOptions, finishAuthentication } from "@/lib/passkey";

// Signs in with a passkey instead of the password (public path).
export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const jar = await cookies();

  if (data?.step === "options") {
    if ((await prisma.passkey.count()) === 0) {
      return NextResponse.json({ error: "No Face ID set up yet -- sign in with the password, then add it in Settings." }, { status: 404 });
    }
    const options = await authenticationOptions(request);
    const res = NextResponse.json(options);
    res.cookies.set(CHALLENGE_COOKIE, sealChallenge(options.challenge), { httpOnly: true, sameSite: "strict", path: "/", maxAge: 300 });
    return res;
  }

  if (data?.step === "verify") {
    const challenge = openChallenge(jar.get(CHALLENGE_COOKIE)?.value);
    if (!challenge) return NextResponse.json({ error: "That took too long -- try again." }, { status: 400 });
    let ok = false;
    try {
      ok = await finishAuthentication(request, data.response, challenge);
    } catch (err) {
      console.error("Passkey sign-in failed:", err);
    }
    if (!ok) return NextResponse.json({ error: "Face ID didn't match a saved passkey." }, { status: 401 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions);
    return res;
  }

  return NextResponse.json({ error: "Unknown step." }, { status: 400 });
}
