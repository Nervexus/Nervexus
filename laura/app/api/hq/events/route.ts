import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hqAuthorized } from "@/lib/hq";

const TYPES = new Set(["message_sent", "reply_received", "lead_status"]);
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

// The outreach app reports activity here as it happens.
export async function POST(request: Request) {
  if (!hqAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json().catch(() => null);
  if (!data || !TYPES.has(data.type)) return NextResponse.json({ error: "Unknown event type." }, { status: 400 });
  const at = typeof data.at === "string" && !Number.isNaN(Date.parse(data.at)) ? new Date(data.at) : new Date();
  const lead = data.lead ?? {};
  const event = await prisma.outreachEvent.create({
    data: {
      type: data.type,
      leadId: lead.id != null ? String(lead.id).slice(0, 100) : null,
      leadName: str(lead.name, 120),
      company: str(lead.company, 120),
      preview: str(data.preview, 400),
      status: str(data.status, 40),
      at,
    },
  });
  if (data.type !== "message_sent") {
    const who = [event.leadName, event.company].filter(Boolean).join(", ") || "a lead";
    await prisma.activityLog
      .create({
        data: {
          tool: "outreach",
          summary: data.type === "reply_received" ? `Reply from ${who}` : `${who} marked ${event.status ?? "updated"}`,
        },
      })
      .catch(() => {});
  }
  return NextResponse.json({ ok: true, id: event.id });
}
