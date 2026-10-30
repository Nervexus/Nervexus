// Pure helpers (no database or API clients), so the browser can use them too.

export type BookingLink = { label: string; url: string };

/** The user's timezone. Servers run on UTC, so local wall-clock times
 * (what booking sites expect in a URL) have to be formatted explicitly. */
export const USER_TIMEZONE = process.env.NEXT_PUBLIC_USER_TIMEZONE || process.env.USER_TIMEZONE || "Europe/London";

/** "YYYY-MM-DDTHH:MM" in the user's timezone. */
export function localDateTime(d: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: USER_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** e.g. "Fri 30 Oct, 20:00" in the user's timezone. */
export function friendlyDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: USER_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Ready-to-book links for a place, prefilled with date/time and party size
 * where the site accepts them in the URL. OpenTable's search takes
 * dateTime + covers; Google Maps opens the place's listing, which carries
 * its "Reserve a table" / booking button when the venue has one. The
 * venue's own link (if research found one) always comes first. */
export function readyToBookLinks(b: {
  title: string;
  category: string;
  location: string | null;
  dateTime: Date | null;
  partySize: number | null;
  link: string | null;
}): BookingLink[] {
  const query = [b.title.replace(/^(dinner|lunch|brunch|drinks|breakfast)\s+at\s+/i, ""), b.location]
    .filter(Boolean)
    .join(" ");
  const links: BookingLink[] = [];
  if (b.link) links.push({ label: "Book on their site", url: b.link });

  if (b.category === "restaurant") {
    const ot = new URL("https://www.opentable.com/s");
    ot.searchParams.set("term", query);
    if (b.dateTime) ot.searchParams.set("dateTime", localDateTime(b.dateTime));
    if (b.partySize) ot.searchParams.set("covers", String(b.partySize));
    links.push({ label: "OpenTable", url: ot.toString() });
  }

  const maps = new URL("https://www.google.com/maps/search/");
  maps.searchParams.set("api", "1");
  maps.searchParams.set("query", query);
  links.push({ label: "Google Maps", url: maps.toString() });

  return links;
}
