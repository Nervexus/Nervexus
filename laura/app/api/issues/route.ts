import { NextResponse, connection } from "next/server";
import { listIssues, syncApiIssues } from "@/lib/api-issues";

export async function GET() {
  await connection();
  try {
    await syncApiIssues();
    return NextResponse.json(await listIssues());
  } catch (err) {
    console.error("Loading API issues failed:", err);
    return NextResponse.json({ open: [], history: [], error: "Couldn't load API issues." }, { status: 500 });
  }
}
