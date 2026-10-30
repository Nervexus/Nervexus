import { findOwnerColumn, parseUkDate, shiftsFromGrid, type RotaGrid } from "@/lib/rota-grid";
import { fileKind, imageMime, tableFromFile } from "@/lib/files";
import { localTime } from "@/lib/routine";
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

// Whose shifts to pull out of a team rota photo.
const ROTA_NAME = process.env.ROTA_NAME?.trim() || "Madoxs";
const ROTA_FULL_NAME = process.env.ROTA_FULL_NAME?.trim() || "Madoxs Harvey";

const GRID_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    people: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Every person's name, in column order (left to right). For a personal rota with no names, a single empty string.",
    },
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "The row's date exactly as written, e.g. '28/10/2026'." },
          cells: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Each person's cell for this date, same order as people, copied exactly (e.g. '8-6', 'D/O', 'HOL', ''). ",
          },
        },
        required: ["date", "cells"],
      },
    },
    location: { type: Type.STRING, nullable: true, description: "Workplace name if shown." },
  },
  required: ["people", "rows"],
};

/** Reads a photographed rota in two steps. Gemini only transcribes the
 * grid (names, dates, each cell's text) -- the part vision is good at --
 * and plain code (lib/rota-grid.ts) finds the owner's column, turns
 * shorthand like "8-6" into times, skips D/O and HOL, and works out who
 * else is on. Only shifts still to come are returned, for review before
 * saving (never writes directly). */
export async function parseRotaImage(base64: string, mimeType: string): Promise<ParsedShift[]> {
  const grid = await transcribeRota(base64, mimeType);
  return grid ? gridToShifts(grid) : [];
}

/** Any rota file: a photo or PDF (read by Gemini), or an Excel/CSV sheet
 * (read directly -- no AI needed, so it's exact). */
export async function parseRotaFile(buf: Buffer, mime: string | null, name: string | null): Promise<ParsedShift[]> {
  const kind = fileKind(mime, name);
  if (kind === "image") return parseRotaImage(buf.toString("base64"), imageMime(mime, name));
  if (kind === "pdf") return parseRotaImage(buf.toString("base64"), "application/pdf");
  if (kind === "xlsx" || kind === "csv") {
    const grid = tableToGrid(await tableFromFile(buf, kind));
    return grid ? gridToShifts(grid) : [];
  }
  throw new Error("I can read rotas as a photo, PDF, Excel (.xlsx) or CSV file.");
}

/** A spreadsheet's rows as a rota grid: the header row is the one with his
 * name in it; every later row with a date in it is a day. */
export function tableToGrid(rows: string[][]): RotaGrid | null {
  const year = new Date().getUTCFullYear();
  const dateCol = (r: string[]) => r.findIndex((c) => !!parseUkDate(c, year) && /\d{1,2}[/.-]\d{1,2}/.test(c));
  const headerIdx = rows.findIndex(
    (r) => dateCol(r) < 0 && r.filter((c) => c).length >= 2 && findOwnerColumn(r, ROTA_NAME, ROTA_FULL_NAME) >= 0
  );
  if (headerIdx >= 0) {
    const people = rows[headerIdx];
    const days = rows
      .slice(headerIdx + 1)
      .filter((r) => dateCol(r) >= 0)
      .map((r) => ({ date: r[dateCol(r)], cells: people.map((_, i) => r[i] ?? "") }));
    return days.length ? { people, rows: days } : null;
  }
  // A personal rota with no names: each row has a date and a time like 8-6.
  const days = rows
    .filter((r) => dateCol(r) >= 0)
    .map((r) => ({ date: r[dateCol(r)], cells: [r.find((c) => /\d\s*[-–]\s*\d/.test(c) && !/\d{1,2}[/.]\d{1,2}[/.]/.test(c)) ?? ""] }));
  return days.length ? { people: [""], rows: days } : null;
}

function gridToShifts(grid: RotaGrid & { location?: string | null }): ParsedShift[] {
  const now = Date.now();
  const year = new Date().getUTCFullYear();
  return shiftsFromGrid(grid, ROTA_NAME, ROTA_FULL_NAME, year)
    .map((s) => ({
      startAt: localTime(s.ymd, s.start.h, s.start.m).toISOString(),
      endAt: localTime(s.ymd, s.end.h, s.end.m).toISOString(),
      location: grid.location ?? null,
      colleagues: s.colleagues.length ? s.colleagues.join(", ") : null,
      note: s.note,
    }))
    .filter((s) => new Date(s.endAt).getTime() > now);
}

/** Saves parsed shifts, skipping any already on the rota at the same start time. */
export async function saveShifts(shifts: ParsedShift[], source: string): Promise<ParsedShift[]> {
  const added: ParsedShift[] = [];
  for (const s of shifts) {
    const startAt = new Date(s.startAt);
    const endAt = new Date(s.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) continue;
    if (await prisma.shift.findFirst({ where: { startAt } })) continue;
    await prisma.shift.create({ data: { startAt, endAt, location: s.location, colleagues: s.colleagues, note: s.note, source } });
    added.push(s);
  }
  return added;
}

/** Step one: the grid exactly as written, or null if unreadable. */
export async function transcribeRota(base64: string, mimeType: string): Promise<(RotaGrid & { location?: string | null }) | null> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType } },
          {
            text:
              "This is a photo of a work rota. Transcribe it exactly -- do not interpret it. " +
              "List every person's name across the top in column order. Then for every row " +
              "that has a date, give the date as written and each person's cell text in the " +
              "same order. Columns that only hold numbers (paid hours, totals) are not people: " +
              "leave them out of both the names and the cells. Skip total/blank rows. Copy " +
              "cells character for character ('8-6', '9-5', 'D/O', 'HOL', 'D/O 9.45AM'); use " +
              "an empty string for a blank cell. Be careful to keep each cell in the right " +
              "row and column.",
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: GRID_SCHEMA },
  });

  try {
    const grid = JSON.parse(response.text ?? "{}");
    return Array.isArray(grid.people) && Array.isArray(grid.rows) ? grid : null;
  } catch (err) {
    console.error("Failed to parse rota transcription:", err);
    return null;
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
