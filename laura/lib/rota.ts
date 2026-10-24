import { Type } from "@google/genai";
import { prisma } from "@/lib/db";
import { getGeminiClient, MODEL } from "@/lib/gemini";

export type ParsedShift = {
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  location: string | null;
  colleagues: string | null;
  note: string | null;
};

const SHIFT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    shifts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          startAt: { type: Type.STRING, description: "ISO 8601 datetime the shift starts." },
          endAt: { type: Type.STRING, description: "ISO 8601 datetime the shift ends." },
          location: { type: Type.STRING, nullable: true, description: "Workplace, if shown." },
          colleagues: {
            type: Type.STRING,
            nullable: true,
            description: "Comma-separated names of colleagues on this shift, if shown.",
          },
          note: { type: Type.STRING, nullable: true, description: "Anything else worth keeping." },
        },
        required: ["startAt", "endAt"],
      },
    },
  },
  required: ["shifts"],
};

/** Extracts shifts from a photographed/screenshotted rota using Gemini's
 * vision input -- no dedicated OCR service needed, since the existing
 * Gemini key already does this. Returns parsed shifts for the user to
 * review and correct before they're saved (never writes directly). */
export async function parseRotaImage(base64: string, mimeType: string): Promise<ParsedShift[]> {
  const ai = getGeminiClient();
  const now = new Date();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType } },
          {
            text:
              `Today is ${now.toISOString()} (${now.toLocaleDateString(undefined, { weekday: "long" })}). ` +
              "This image is a work rota/schedule. Extract every shift you can find as " +
              "structured data. Resolve day names and partial dates (e.g. 'Mon 14th', " +
              "'Tomorrow') to absolute ISO 8601 datetimes using today's date as the " +
              "reference -- assume the nearest future occurrence for ambiguous dates. " +
              "If a shift's colleagues are listed, include their names. If you can't " +
              "find any shifts, return an empty array rather than guessing.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: SHIFT_SCHEMA,
    },
  });

  try {
    const parsed = JSON.parse(response.text ?? "{}");
    return Array.isArray(parsed.shifts) ? parsed.shifts : [];
  } catch (err) {
    console.error("Failed to parse rota extraction response:", err);
    return [];
  }
}

/** Upcoming shifts, soonest first, within the next `days` days. */
export async function getShifts(days = 14) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return prisma.shift.findMany({
    where: { endAt: { gte: now }, startAt: { lte: until } },
    orderBy: { startAt: "asc" },
  });
}

/** Generates a "when to leave" commute plan for a shift using live web
 * search (Gemini's googleSearch grounding) rather than a dedicated
 * transit API -- less precise than real departure-board data, but works
 * today with only the Gemini key this app already needs. Upgradable to a
 * maps/transit API later without changing the calling code's shape. */
export async function planCommute(shiftId: string): Promise<string> {
  const shift = await prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });
  const profile = await prisma.profile.findUnique({ where: { id: "me" } });

  if (!profile?.homeAddress || !profile?.workAddress) {
    return (
      "I don't have your home and work addresses yet -- add them in the Rota page's " +
      "settings first, then I can work out a route and leave-by time."
    );
  }

  const buffer = profile.arrivalBufferMinutes;
  const ai = getGeminiClient();
  const prompt =
    `I need to be at "${profile.workAddress}" by ${shift.startAt.toISOString()} ` +
    `(arriving with at least ${buffer} minutes to spare), traveling from ` +
    `"${profile.homeAddress}". Search for the best current public transport ` +
    `option (bus/train) or, if none is practical, walking/driving, and tell me: ` +
    `what to take, roughly when it leaves, what time to leave home, and when I'd ` +
    `arrive. Be concise -- a few sentences, not a research report. If you can't ` +
    `find live departure times, say so plainly and give your best estimate based ` +
    `on typical journey length instead of inventing exact times.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const plan = response.text ?? "Couldn't work out a commute plan right now.";
  await prisma.shift.update({ where: { id: shiftId }, data: { commutePlan: plan } });
  return plan;
}

/** Answers "who am I working with on <date>" from the rota. */
export async function whoAmIWorkingWith(date: Date): Promise<string> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const shift = await prisma.shift.findFirst({
    where: { startAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { startAt: "asc" },
  });

  if (!shift) return `No shift on the rota for ${dayStart.toDateString()}.`;
  if (!shift.colleagues) {
    return `There's a shift on ${dayStart.toDateString()} (${shift.startAt.toString()} to ${shift.endAt.toString()}), but no colleagues are listed for it.`;
  }
  return `On ${dayStart.toDateString()}, working with ${shift.colleagues} (${shift.startAt.toString()} to ${shift.endAt.toString()}).`;
}
