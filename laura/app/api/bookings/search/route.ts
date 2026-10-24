import { NextResponse } from "next/server";
import { searchBookingOptions } from "@/lib/booking";

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const query = typeof data?.query === "string" ? data.query.trim() : "";
  if (!query) return NextResponse.json({ error: "A query is required." }, { status: 400 });

  try {
    const result = await searchBookingOptions(query);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("POST /api/bookings/search failed:", err);
    return NextResponse.json({ error: "Couldn't search for booking options." }, { status: 500 });
  }
}
