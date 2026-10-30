import { google } from "googleapis";

let _oauth2: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getGoogleAuth() {
  if (_oauth2) return _oauth2;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google API credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)");
  }
  _oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  _oauth2.setCredentials({ refresh_token: refreshToken });
  return _oauth2;
}

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}
