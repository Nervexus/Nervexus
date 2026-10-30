import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanItem } from "./clean";

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const item = cleanItem(data);
  if (!item.slot || !item.text) return NextResponse.json({ error: "A slot and some text are required." }, { status: 400 });
  const last = await prisma.routineItem.findFirst({ where: { slot: item.slot }, orderBy: { sort: "desc" } });
  const created = await prisma.routineItem.create({
    data: { slot: item.slot, text: item.text, product: item.product ?? null, link: item.link ?? null, owned: item.owned ?? true, days: item.days ?? null, sort: (last?.sort ?? 0) + 1 },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
