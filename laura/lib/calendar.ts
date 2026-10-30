import { google } from "googleapis";
import { getGoogleAuth } from "./google";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  allDay: boolean;
};

export async function getCalendarEvents(daysAhead = 7): Promise<CalendarEvent[]> {
  const auth = getGoogleAuth();
  const cal = google.calendar({ version: "v3", auth });
  const now = new Date();
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (res.data.items ?? []).map((e) => ({
    id: e.id ?? "",
    title: e.summary ?? "(no title)",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    location: e.location ?? undefined,
    description: e.description?.slice(0, 500) ?? undefined,
    allDay: !e.start?.dateTime,
  }));
}

export async function createCalendarEvent(opts: {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}): Promise<{ id: string; link: string }> {
  const auth = getGoogleAuth();
  const cal = google.calendar({ version: "v3", auth });
  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: opts.title,
      start: { dateTime: opts.start },
      end: { dateTime: opts.end },
      location: opts.location,
      description: opts.description,
    },
  });
  return { id: res.data.id ?? "", link: res.data.htmlLink ?? "" };
}
