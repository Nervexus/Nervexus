import { NextResponse } from "next/server";
import { researchInstagramAccount } from "@/lib/instagram";

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const handle = typeof data?.handle === "string" ? data.handle.trim() : "";
  if (!handle) return NextResponse.json({ error: "A handle is required." }, { status: 400 });

  try {
    const result = await researchInstagramAccount(handle);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("POST /api/content/research failed:", err);
    return NextResponse.json({ error: "Couldn't research that account." }, { status: 500 });
  }
}
