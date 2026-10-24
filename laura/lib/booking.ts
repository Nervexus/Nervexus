import { prisma } from "@/lib/db";
import { getGeminiClient, MODEL } from "@/lib/gemini";

/** Looks up live availability/booking info for a restaurant or activity via
 * Gemini's Google Search grounding -- the same mechanism web_search and
 * commute planning use. Laura never completes a booking herself: this is
 * always research to hand back to the user, with a link they click to
 * actually finish it (see the "never auto-pay" rule in lib/brain.ts's
 * system prompt). */
export async function searchBookingOptions(query: string): Promise<string> {
  const ai = getGeminiClient();
  const prompt =
    `Find current booking options for: "${query}". Search for real places/activities ` +
    "matching this, their availability or opening hours, and a direct link to book " +
    "or reserve (their own site, OpenTable, Resy, a ticketing page, etc.) if you can " +
    "find one. Give a short list of the best 2-3 options with name, why it fits, and " +
    "the link. Be upfront if you can't confirm live availability -- never invent a " +
    "specific open table/slot you haven't actually found.";

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk) => chunk.web?.uri)
    .filter((uri): uri is string => Boolean(uri))
    .slice(0, 5);

  const answer = response.text ?? "Couldn't find any booking options right now.";
  return sources?.length ? `${answer}\n\nSources: ${sources.join(", ")}` : answer;
}

/** Upcoming bookings (anything not cancelled), soonest first -- undated
 * ones (still just an "idea") sort last rather than first. */
export async function listBookings() {
  const bookings = await prisma.booking.findMany({ where: { status: { not: "cancelled" } } });
  return bookings.sort((a, b) => {
    if (!a.dateTime && !b.dateTime) return 0;
    if (!a.dateTime) return 1;
    if (!b.dateTime) return -1;
    return a.dateTime.getTime() - b.dateTime.getTime();
  });
}
