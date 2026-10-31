import { NextResponse } from "next/server";
import { listIssues, snoozeIssues } from "@/lib/api-issues";

// { ids?: number[], hours?: number } -- no ids snoozes everything open; default 6h.
export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const ids = Array.isArray(data?.ids) ? data.ids.map(Number).filter(Number.isInteger) : undefined;
  await snoozeIssues(ids, data?.hours);
  return NextResponse.json(await listIssues());
}
