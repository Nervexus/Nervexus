// Pure helpers for reading a transcribed rota grid: find the owner's
// column, turn shorthand like "8-6" into times, skip days off, and work out
// who else is on. Kept free of AI and database code so it's easy to test.

export type RotaGrid = {
  people: string[];
  rows: { date: string; cells: string[] }[];
};

export type GridShift = {
  ymd: string; // YYYY-MM-DD
  start: { h: number; m: number };
  end: { h: number; m: number };
  colleagues: string[];
  note: string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Index of the owner's column: exact name, full name, surname, initials,
 * or a near miss like "Maddox"/"Madox". */
export function findOwnerColumn(people: string[], name: string, fullName: string): number {
  const targets = [name, fullName, ...fullName.split(/\s+/)].map(norm).filter((t) => t.length >= 2);
  const initials = norm(fullName.split(/\s+/).map((w) => w[0]).join(""));
  const scored = people.map((p, i) => {
    const n = norm(p);
    if (!n) return { i, score: 0 };
    if (targets.includes(n) || n === initials) return { i, score: 3 };
    // Partial matches need a few letters, or "D/O" ("do") would match "Madoxs".
    if (n.length >= 4 && targets.some((t) => n.includes(t) || t.includes(n))) return { i, score: 2 };
    // near miss: same first 3 letters as the first name (madoxs / maddox / madox)
    if (n.length >= 4 && n.slice(0, 3) === norm(name).slice(0, 3)) return { i, score: 1 };
    return { i, score: 0 };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (best && best.score > 0) return best.i;
  // A personal rota with a single unnamed column is his.
  return people.length === 1 ? 0 : -1;
}

/** "28/10/2026", "28/10", "28-10-26" -> YYYY-MM-DD (UK day-first). */
export function parseUkDate(raw: string, fallbackYear: number): string | null {
  const m = raw.trim().match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  let y = m[3] ? Number(m[3]) : fallbackYear;
  if (y < 100) y += 2000;
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const OFF = /^(d\s*\/?\s*o|off|hol|holiday|rest|sick|0|-|x)?$/i;

/** "8-6" -> 08:00-18:00, "9.30-5" -> 09:30-17:00, "14:00-22:00" as is.
 * null for days off (D/O, HOL, OFF, 0, blank) or anything unreadable. */
export function parseCell(raw: string): { start: { h: number; m: number }; end: { h: number; m: number }; note: string | null } | null {
  const cell = raw.trim();
  if (OFF.test(cell) || /^d\s*\/\s*o\b/i.test(cell) || /^hol/i.test(cell)) return null;
  const m = cell.match(/(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?\s*[-–—to]+\s*(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let sh = Number(m[1]);
  const sm = Number(m[2] ?? 0);
  let eh = Number(m[4]);
  const em = Number(m[5] ?? 0);
  if (m[3]?.toLowerCase() === "pm" && sh < 12) sh += 12;
  if (m[6]?.toLowerCase() === "pm" && eh < 12) eh += 12;
  // Shorthand: a start of 1-5 is afternoon ("2-10"), and an end at or
  // before the start is later that day ("8-6" ends at 18:00).
  if (!m[3] && sh >= 1 && sh <= 5) sh += 12;
  if (!m[6] && eh <= sh && eh + 12 <= 24 && eh + 12 > sh) eh += 12;
  if (sh > 23 || eh > 24 || sm > 59 || em > 59) return null;
  const rest = cell.slice((m.index ?? 0) + m[0].length).trim();
  return { start: { h: sh, m: sm }, end: { h: eh, m: em }, note: rest || null };
}

const minutes = (t: { h: number; m: number }) => t.h * 60 + t.m;

/** The owner's shifts from a transcribed grid, with overlapping colleagues. */
export function shiftsFromGrid(grid: RotaGrid, name: string, fullName: string, fallbackYear: number): GridShift[] {
  const col = findOwnerColumn(grid.people, name, fullName);
  if (col < 0) return [];
  const out: GridShift[] = [];
  for (const row of grid.rows) {
    const ymd = parseUkDate(row.date, fallbackYear);
    const mine = ymd ? parseCell(row.cells[col] ?? "") : null;
    if (!ymd || !mine) continue;
    const colleagues = grid.people.filter((person, i) => {
      if (i === col || !person.trim()) return false;
      const theirs = parseCell(row.cells[i] ?? "");
      return !!theirs && minutes(theirs.start) < minutes(mine.end) && minutes(mine.start) < minutes(theirs.end);
    });
    out.push({ ymd, start: mine.start, end: mine.end, colleagues, note: mine.note });
  }
  return out;
}
