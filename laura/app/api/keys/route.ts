import { NextResponse, connection } from "next/server";
import { addKey, isKeyService, publicKeyState } from "@/lib/api-keys";
import { syncApiIssues } from "@/lib/api-issues";

async function state() {
  const services = await publicKeyState();
  await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  return services;
}

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ services: await state() });
  } catch (err) {
    console.error("Loading API keys failed:", err);
    return NextResponse.json({ error: "Couldn't load API keys." }, { status: 500 });
  }
}

// { service, key, label? } -> saves, tests straight away, returns the new state plus the test result.
export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const service = data?.service;
  const key = typeof data?.key === "string" ? data.key.trim() : "";
  if (!isKeyService(service)) return NextResponse.json({ error: "Unknown service." }, { status: 400 });
  if (!key) return NextResponse.json({ error: "Paste the API key." }, { status: 400 });
  try {
    const { result } = await addKey(service, key, typeof data?.label === "string" ? data.label : undefined);
    return NextResponse.json({ services: await state(), result: { ok: result.ok, message: result.message } });
  } catch (err) {
    console.error("Adding API key failed:", err);
    return NextResponse.json({ error: "Couldn't save that key." }, { status: 500 });
  }
}
