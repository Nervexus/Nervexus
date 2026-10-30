import { NextResponse } from "next/server";
import { canChangePassword, isPasswordSet, setMainPassword } from "@/lib/auth";

// Signed-in only (the proxy gates everything but the public routes). Tells
// the Settings page whether a password is set, and lets the owner set or
// change it. Changing requires the current password (or the backup).
export async function GET() {
  return NextResponse.json({ isSet: await isPasswordSet() });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const next = typeof data?.next === "string" ? data.next : "";
  const current = typeof data?.current === "string" ? data.current : "";

  if (next.length < 6) {
    return NextResponse.json({ error: "Use at least 6 characters." }, { status: 400 });
  }
  // If a password already exists, the current one (or the backup) is needed.
  if ((await isPasswordSet()) && !(await canChangePassword(current))) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Your current password isn't right." }, { status: 401 });
  }
  await setMainPassword(next);
  return NextResponse.json({ ok: true });
}
