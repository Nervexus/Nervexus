import { NextResponse, connection } from "next/server";
import { prisma } from "@/lib/db";
import { KEY_SERVICES, isKeyService, maskStored, maskTail, sealKey } from "@/lib/api-keys";
import { checkGeminiKey, clearGeminiKeyCache } from "@/lib/gemini";

type KeyRow = { id: string; service: string; label: string; apiKey: string; active: boolean; createdAt: Date };

function present(k: KeyRow) {
  return {
    id: k.id,
    service: k.service,
    label: k.label,
    maskedKey: maskStored(k.apiKey),
    active: k.active,
    createdAt: k.createdAt.toISOString(),
  };
}

export async function GET() {
  await connection();
  const keys = await prisma.apiKey.findMany({
    orderBy: [{ service: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({
    services: KEY_SERVICES.map((s) => ({
      id: s.id,
      label: s.label,
      detail: s.detail,
      limits: s.limits,
      how: s.how,
      main: process.env[s.env] ? { maskedKey: maskTail(process.env[s.env]) } : null,
    })),
    keys: keys.map(present),
  });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const service = data?.service;
  const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";
  if (!isKeyService(service)) return NextResponse.json({ error: "Unknown service." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Paste the API key." }, { status: 400 });

  if (service === "gemini") {
    try {
      await checkGeminiKey(apiKey);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 400 || status === 401 || status === 403) {
        return NextResponse.json({ error: "Google rejected that key. Check it was copied in full." }, { status: 400 });
      }
    }
  }

  const existing = await prisma.apiKey.findMany({ where: { service }, select: { priority: true } });
  const priority = existing.reduce((max, k) => Math.max(max, k.priority), 0) + 1;
  const label =
    typeof data?.label === "string" && data.label.trim() ? data.label.trim() : `Backup ${existing.length + 1}`;

  let sealed: string;
  try {
    sealed = sealKey(apiKey);
  } catch {
    return NextResponse.json({ error: "TOKEN_ENCRYPTION_KEY isn't set, so keys can't be stored safely." }, { status: 500 });
  }

  const key = await prisma.apiKey.create({ data: { service, label, apiKey: sealed, priority } });
  clearGeminiKeyCache();
  return NextResponse.json({ key: present(key) });
}

// Saves a new fallback order: { service, ids } with ids in the order to try.
export async function PUT(request: Request) {
  const data = await request.json().catch(() => null);
  const service = data?.service;
  const ids: unknown = data?.ids;
  if (!isKeyService(service) || !Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  await prisma.$transaction(
    ids.map((id, i) => prisma.apiKey.updateMany({ where: { id, service }, data: { priority: i + 1 } }))
  );
  clearGeminiKeyCache();
  return NextResponse.json({ ok: true });
}
