import { NextResponse } from "next/server";
import { parseRotaImage } from "@/lib/rota";

// Doesn't save anything -- just returns what Gemini extracted from the
// photo, so the Rota page can show it for review/correction before the
// user confirms and POSTs each shift to /api/rota individually.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A photo file is required." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo is too large (max 10MB)." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const shifts = await parseRotaImage(base64, file.type || "image/jpeg");
    return NextResponse.json({ shifts });
  } catch (err) {
    console.error("Rota parse error:", err);
    const error = err instanceof Error ? err.message : "Couldn't read that rota photo.";
    return NextResponse.json({ error }, { status: 500 });
  }
}
