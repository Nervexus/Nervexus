import { NextResponse } from "next/server";
import twilio from "twilio";

// Twilio fetches this once the call connects, to find out what to say.
// The message comes back from the query string that placeCall() built
// (twilio's VoiceResponse builder XML-escapes it for us, so there's no
// injection risk even though the text is attacker-shaped input in
// principle -- it only ever originates from this app's own outbound
// call, never from a third party hitting this URL directly).
const MAX_MESSAGE_LENGTH = 500;

function buildTwiml(message: string): string {
  const response = new twilio.twiml.VoiceResponse();
  response.say({ voice: "Polly.Joanna" }, message.slice(0, MAX_MESSAGE_LENGTH));
  return response.toString();
}

function respond(message: string | null) {
  const twiml = buildTwiml(message?.trim() || "Hi, this is Laura. I didn't get a message to read you.");
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return respond(url.searchParams.get("message"));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  return respond(url.searchParams.get("message"));
}
