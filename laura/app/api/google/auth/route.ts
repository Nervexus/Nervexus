import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set" }, { status: 500 });
  }

  let baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (baseUrl && !baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
  const redirectUri = `${baseUrl?.replace(/\/$/, "")}/api/google/auth`;

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    return NextResponse.redirect(authUrl);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return NextResponse.json({
    message: "Add this as GOOGLE_REFRESH_TOKEN in your Vercel environment variables",
    refresh_token: tokens.refresh_token,
    scopes: tokens.scope,
  });
}
