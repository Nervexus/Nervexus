import { NextResponse } from "next/server";
import { activateKey, publicKeyState } from "@/lib/api-keys";
import { syncApiIssues } from "@/lib/api-issues";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await activateKey(id);
  await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  return NextResponse.json({ services: await publicKeyState() });
}
