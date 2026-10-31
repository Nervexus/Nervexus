import { NextResponse } from "next/server";
import { publicKeyState, testStoredKey } from "@/lib/api-keys";
import { syncApiIssues } from "@/lib/api-issues";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await testStoredKey(id);
  await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  return NextResponse.json({ services: await publicKeyState(), result: { ok: result.ok, message: result.message } });
}
