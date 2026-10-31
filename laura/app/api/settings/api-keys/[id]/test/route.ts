import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { openKey } from "@/lib/api-keys";
import { checkGeminiKey } from "@/lib/gemini";

// Checks one key against Google. "main" is the key set in Vercel.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let apiKey: string | undefined;
  if (id === "main") {
    apiKey = process.env.GEMINI_API_KEY;
  } else {
    const row = await prisma.apiKey.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    try {
      apiKey = openKey(row.apiKey);
    } catch {
      return NextResponse.json({ ok: false, status: "invalid", message: "Couldn't decrypt this key. Remove it and add it again." });
    }
  }
  if (!apiKey) return NextResponse.json({ ok: false, status: "invalid", message: "No key set." });

  try {
    await checkGeminiKey(apiKey);
    return NextResponse.json({ ok: true, status: "ok", message: "Working" });
  } catch (err) {
    const code = (err as { status?: number }).status;
    const text = err instanceof Error ? err.message : String(err);
    if (code === 429 || /RESOURCE_EXHAUSTED|quota/i.test(text)) {
      return NextResponse.json({ ok: false, status: "limited", message: "At its limit. Gemini free limits reset daily." });
    }
    if (code === 400 || code === 401 || code === 403) {
      return NextResponse.json({ ok: false, status: "invalid", message: "Rejected by Google" });
    }
    return NextResponse.json({ ok: false, status: "error", message: "Couldn't reach Google. Try again." });
  }
}
