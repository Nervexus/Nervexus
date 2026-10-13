/* A fixed clock for the tick suite.

   The logic under test is full of windows. It will not send at all outside 06:00-23:00
   Europe/London, and it files the logs reminder in a 21:00 slot that is hardcoded to UK time
   whatever timezone the user is in. The suite drives that real logic, so what it reported used
   to depend on what time of day you happened to start it: twelve tests failed in the late
   evening, asserting against a hold the code had correctly applied, and two others quietly
   returned without asserting anything at all during the day. Both are worse than a red test —
   one is a false alarm, the other is a test that has stopped testing while still printing PASS.

   So the clock is pinned. By default to 10:00 Europe/London TODAY, which is the instant the
   suite was written against: the send window is open and the 21:00 slot is shut, so a test
   about anything else is not also holding a logs reminder it never asked for. The two tests
   that are about the 21:00 slot pin themselves to the evening with atLondonTime() and assert
   properly rather than returning early.

   Today, rather than a fixed date in the past, because the windows are London local and
   whether that is GMT or BST depends on the season — a suite pinned to January would never
   exercise the offset it runs under in the summer.

   Escape hatch, for when the clock itself is what you are investigating:
     TICK_CLOCK=real     use the wall clock, the old behaviour
     TICK_CLOCK=21:45    start from that London time instead of 10:00

   A caveat if you do pin past 21:00: five other tests go red, and none of them is a bug. Their
   fixtures leave the daily logs unfilled, which is harmless while the 21:00 slot is shut but
   adds a logs reminder to the bundle once it opens — so "nothing outstanding" has something
   outstanding, and the tests that count what was sent count one more than they expected. Those
   fixtures would need the logs filled in before they could be run in the evening.

   Import this FIRST, before anything that reads the clock. */

const Real = Date;
const REQUESTED = (process.env.TICK_CLOCK || '10:00').trim();
export const pinning = REQUESTED.toLowerCase() !== 'real';

let shift = 0;

const london = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', hour12: false, hour: '2-digit', minute: '2-digit',
  year: 'numeric', month: '2-digit', day: '2-digit',
});
const parts = (ms) => Object.fromEntries(london.formatToParts(new Real(ms)).map(p => [p.type, p.value]));

/* Which UTC instant is a given wall time in London today? Rather than do offset arithmetic
   and risk getting a clock change wrong, ask it the other way round: walk the UTC minutes
   around today and keep the one that formats to what was asked for. Two days of minutes covers
   every UTC instant that can land on today's London date whatever the offset, it cannot be
   wrong about an offset, and it needs no table of when the clocks go forward. */
function londonInstant(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error('a London time must look like "HH:MM", got ' + JSON.stringify(hhmm));
  const hour = +m[1], minute = +m[2];
  if (hour > 23 || minute > 59) throw new Error('not a real time: ' + hhmm);
  const p0 = parts(Real.now());
  const y = +p0.year, mo = +p0.month, d = +p0.day;
  const from = Real.UTC(y, mo - 1, d - 1, 0, 0, 0);
  for (let i = 0; i < 2880; i++) {
    const cand = from + i * 60000;
    const p = parts(cand);
    if (+p.year === y && +p.month === mo && +p.day === d && +p.hour === hour && +p.minute === minute) return cand;
  }
  throw new Error(hhmm + ' does not exist in London today (a clock change?)');
}

/* Subclass rather than replace, because the code under test uses instanceof, Date.prototype,
   Intl formatting of an instance and JSON round-tripping, and all of that has to keep working.
   The shift is read at call time, so re-pinning is a number changing rather than a class
   being swapped underneath anything already holding a reference. */
class Fixed extends Real {
  constructor(...a) { if (a.length === 0) super(Real.now() + shift); else super(...a); }
  static now() { return Real.now() + shift; }
}
Fixed.UTC = Real.UTC; Fixed.parse = Real.parse;

export function pinLondon(hhmm) {
  const was = shift;
  shift = londonInstant(hhmm) - Real.now();
  return was;
}

/* Run one test at a different London time and put the clock back afterwards, including when
   the test throws — a failing test must not leave the clock wrong for every test after it. */
export async function atLondonTime(hhmm, fn) {
  const was = shift;
  try { pinLondon(hhmm); return await fn(); }
  finally { shift = was; }
}

/* Installed either way. Under TICK_CLOCK=real the shift stays zero, so the ambient clock is the
   wall clock as asked — but a test that explicitly names an hour still gets that hour. "Use the
   real clock" is about the default; it is not a refusal to let a test about a 21:00 window
   reach 21:00. */
globalThis.Date = Fixed;

if (pinning) {
  pinLondon(REQUESTED);
  /* Say so, every run. A suite that silently rewrites time and does not mention it is its own
     kind of trap. */
  console.log('clock pinned to ' + REQUESTED + ' Europe/London (' + new Fixed().toISOString() +
              ') — TICK_CLOCK=real for the wall clock\n');
} else {
  console.log('clock NOT pinned: running at the wall clock, which is the thing this module '
            + 'exists to stop doing. Expect red outside 06:00-23:00 London.\n');
}
