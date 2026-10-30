import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Settings > For Claude Code: what Laura has passed on for the developer.
export async function GET() {
  const requests = await prisma.devRequest.findMany({ orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 100 });
  return NextResponse.json({ requests });
}
