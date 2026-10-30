import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function mask(key: string): string {
  if (key.length <= 4) return "••••";
  return "••••" + key.slice(-4);
}

export async function GET() {
  const keys = await prisma.apiKey.findMany({
    orderBy: [{ service: "asc" }, { priority: "asc" }],
  });
  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      service: k.service,
      label: k.label,
      maskedKey: mask(k.apiKey),
      priority: k.priority,
      active: k.active,
      createdAt: k.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const service = typeof data?.service === "string" ? data.service.trim() : "";
  const label = typeof data?.label === "string" ? data.label.trim() : "";
  const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";
  const priority = typeof data?.priority === "number" ? data.priority : 0;

  if (!service) return NextResponse.json({ error: "Service is required." }, { status: 400 });
  if (!label) return NextResponse.json({ error: "Label is required." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "API key is required." }, { status: 400 });

  const key = await prisma.apiKey.create({
    data: { service, label, apiKey, priority },
  });

  return NextResponse.json({
    key: {
      id: key.id,
      service: key.service,
      label: key.label,
      maskedKey: mask(key.apiKey),
      priority: key.priority,
      active: key.active,
      createdAt: key.createdAt.toISOString(),
    },
  });
}
