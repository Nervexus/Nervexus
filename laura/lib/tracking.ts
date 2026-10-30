import { getGeminiClient, MODEL } from "@/lib/gemini";

// Checks a parcel from a tracking link or number. Courier pages are often
// built in the browser, so Gemini reads the link itself (URL context) and
// falls back to a web search for the number. Best-effort: it reports what
// it could see and says so when it couldn't.
export async function checkTracking(input: string, courier?: string | null): Promise<string> {
  const ai = getGeminiClient();
  const isUrl = /^https?:\/\//i.test(input.trim());
  const response = await ai.models.generateContent({
    model: MODEL,
    contents:
      (isUrl ? `Open this parcel tracking page: ${input.trim()}\n` : `Look up this parcel tracking number: ${input.trim()}${courier ? ` (courier: ${courier})` : ""}\n`) +
      "Report only what the tracking information actually shows, as these lines:\n" +
      "STATUS: e.g. 'Out for delivery', 'In transit', 'Delivered'\n" +
      "EXPECTED: delivery date or window, or 'not shown'\n" +
      "LATEST: the most recent scan/update with its time and place\n" +
      "COURIER: the carrier\n" +
      "If you can't see the tracking details (page needs a login, number not found), write STATUS: unknown and say why on LATEST. Never guess.",
    config: { tools: [{ urlContext: {} }, { googleSearch: {} }] },
  });
  return (response.text ?? "").trim() || "STATUS: unknown\nLATEST: couldn't read the tracking page";
}
