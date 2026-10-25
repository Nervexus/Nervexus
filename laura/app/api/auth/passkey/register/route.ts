import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CHALLENGE_COOKIE, openChallenge, sealChallenge } from "@/lib/session";
import { finishRegistration, registrationOptions } from "@/lib/passkey";

// Adds a passkey for the signed-in user (the proxy already requires a
// session for this path). Two steps: "options" hands the browser a
// challenge, "verify" checks the signed response and saves the key.
export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const jar = await cookies();

  if (data?.step === "options") {
    const options = await registrationOptions(request);
    const res = NextResponse.json(options);
    res.cookies.set(CHALLENGE_COOKIE, sealChallenge(options.challenge), { httpOnly: true, sameSite: "strict", path: "/", maxAge: 300 });
    return res;
  }

  if (data?.step === "verify") {
    const challenge = openChallenge(jar.get(CHALLENGE_COOKIE)?.value);
    if (!challenge) return NextResponse.json({ error: "That took too long -- try again." }, { status: 400 });
    try {
      const label = typeof data.label === "string" ? data.label.slice(0, 60) : null;
      const ok = await finishRegistration(request, data.response, challenge, label);
      const res = NextResponse.json(ok ? { ok: true } : { error: "Couldn't verify that passkey." }, { status: ok ? 200 : 400 });
      res.cookies.set(CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    } catch (err) {
      console.error("Passkey registration failed:", err);
      return NextResponse.json({ error: "Couldn't verify that passkey." }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown step." }, { status: 400 });
}
