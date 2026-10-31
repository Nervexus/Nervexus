import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isKeyService, loadKeys, publicKeyState } from "@/lib/api-keys";
import { syncApiIssues } from "@/lib/api-issues";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.apiKey.findUnique({ where: { id } });
  if (!row || !isKeyService(row.service)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const key = (await loadKeys(row.service)).find((k) => k.id === id);
  if (key?.fromEnv) {
    return NextResponse.json({ error: "This is the key set in Vercel. Change it there instead." }, { status: 400 });
  }
  await prisma.apiKey.delete({ where: { id } });
  await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  return NextResponse.json({ services: await publicKeyState() });
}
