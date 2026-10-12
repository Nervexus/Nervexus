import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/config/site";

type QuotePayload = {
  name: string;
  phone: string;
  postcode: string;
  jobType: string;
  message?: string;
};

function isValidPayload(data: unknown): data is QuotePayload {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.name === "string" &&
    d.name.trim().length > 0 &&
    typeof d.phone === "string" &&
    d.phone.trim().length > 0 &&
    typeof d.postcode === "string" &&
    d.postcode.trim().length > 0 &&
    typeof d.jobType === "string" &&
    d.jobType.trim().length > 0
  );
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);

  if (!isValidPayload(data)) {
    return NextResponse.json(
      { error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "RESEND_API_KEY is not set — quote request was received but not emailed.",
    );
    return NextResponse.json(
      {
        error:
          "Online quote requests aren't set up to send yet — please call us instead.",
      },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);
  const { name, phone, postcode, jobType, message } = data;

  const { error } = await resend.emails.send({
    from: process.env.QUOTE_FROM_EMAIL ?? "Coastline Roofing <onboarding@resend.dev>",
    to: process.env.QUOTE_TO_EMAIL ?? siteConfig.email,
    subject: `New quote request — ${jobType}`,
    text: [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Postcode: ${postcode}`,
      `Job type: ${jobType}`,
      message?.trim() ? `Message: ${message.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    console.error("Resend failed to send quote request:", error);
    return NextResponse.json(
      { error: "Something went wrong sending your request. Please call us instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
