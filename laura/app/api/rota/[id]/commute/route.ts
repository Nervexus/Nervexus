import { NextResponse } from "next/server";
import { planCommute } from "@/lib/rota";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const plan = await planCommute(id);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("Commute planning error:", err);
    const error = err instanceof Error ? err.message : "Couldn't plan the commute.";
    return NextResponse.json({ error }, { status: 500 });
  }
}
