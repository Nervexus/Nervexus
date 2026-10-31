import { NextResponse, connection } from "next/server";
import { addKey, catalogue, customServiceId, isKeyService, publicKeyState } from "@/lib/api-keys";
import { syncApiIssues } from "@/lib/api-issues";

async function state() {
  const services = await publicKeyState();
  await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  return services;
}

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ services: await state(), catalogue: catalogue() });
  } catch (err) {
    console.error("Loading API keys failed:", err);
    return NextResponse.json({ error: "Couldn't load API keys." }, { status: 500 });
  }
}

// { service, key, label?, name? } -> saves, tests straight away, returns the new state plus the test result.
// service "custom" with a name adds an API that isn't in the catalogue.
export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  if (data?.service === "custom" && !name) return NextResponse.json({ error: "Give the API a name." }, { status: 400 });
  const service = data?.service === "custom" ? customServiceId(name) : data?.service;
  const key = typeof data?.key === "string" ? data.key.trim() : "";
  if (!isKeyService(service)) return NextResponse.json({ error: "Unknown service." }, { status: 400 });
  if (!key) return NextResponse.json({ error: "Paste the API key." }, { status: 400 });
  try {
    const { result } = await addKey(service, key, typeof data?.label === "string" ? data.label : undefined);
    return NextResponse.json({ services: await state(), catalogue: catalogue(), result: { ok: result.ok, message: result.message } });
  } catch (err) {
    console.error("Adding API key failed:", err);
    return NextResponse.json({ error: "Couldn't save that key." }, { status: 500 });
  }
}
