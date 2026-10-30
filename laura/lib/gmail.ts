import { google } from "googleapis";
import { getGoogleAuth } from "./google";

export type EmailSummary = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
};

export async function sendEmail(opts: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}): Promise<{ id: string }> {
  const auth = getGoogleAuth();
  const gmail = google.gmail({ version: "v1", auth });
  const lines = [
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : null,
    `Subject: ${opts.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    opts.body,
  ].filter((l): l is string => l !== null);

  const raw = Buffer.from(lines.join("\r\n")).toString("base64url");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  return { id: res.data.id ?? "" };
}

export async function readEmails(opts?: {
  query?: string;
  maxResults?: number;
}): Promise<EmailSummary[]> {
  const auth = getGoogleAuth();
  const gmail = google.gmail({ version: "v1", auth });
  const q = opts?.query || "in:inbox";
  const max = Math.min(opts?.maxResults ?? 10, 20);

  const list = await gmail.users.messages.list({ userId: "me", q, maxResults: max });
  if (!list.data.messages?.length) return [];

  const results: EmailSummary[] = [];
  for (const msg of list.data.messages.slice(0, max)) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const headers = full.data.payload?.headers ?? [];
    const hdr = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
    results.push({
      id: full.data.id ?? "",
      from: hdr("From"),
      subject: hdr("Subject"),
      snippet: full.data.snippet ?? "",
      date: hdr("Date"),
      unread: (full.data.labelIds ?? []).includes("UNREAD"),
    });
  }
  return results;
}

export async function readEmailBody(messageId: string): Promise<string> {
  const auth = getGoogleAuth();
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });

  function extractText(payload: typeof res.data.payload): string {
    if (!payload) return "";
    if (payload.mimeType === "text/plain" && payload.body?.data) {
      return Buffer.from(payload.body.data, "base64url").toString("utf8");
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return Buffer.from(part.body.data, "base64url").toString("utf8");
        }
      }
      for (const part of payload.parts) {
        const nested = extractText(part);
        if (nested) return nested;
      }
    }
    return "";
  }

  const text = extractText(res.data.payload);
  return text.slice(0, 10000) || res.data.snippet || "(no readable body)";
}
