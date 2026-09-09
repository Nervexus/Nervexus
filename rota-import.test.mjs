/* The rota parser:  node rota-import.test.mjs

   A rota has everybody on it. The job is to find the rows that are yours, and to keep the
   people you overlap with rather than discarding them — that is the difference between a
   calendar entry that says "Work" and one that says who you are on with.

   Pure parser, so it is tested here rather than by clicking: every shape a rota arrives in,
   every way a time range gets written, and the ways a name is spelled on a printed sheet. */
import RI from './rota-import.js';

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

/* A fixed today, so "next Monday" is a fact rather than whatever day the suite happens to
   run on. 2026-09-09 is a Wednesday. */
const TODAY = '2026-09-09';
const P = (text, me = 'Madoxs') => RI.parse(text, { me, todayKey: TODAY });

t('the grid shape: days across the top, a person per row', async () => {
  const r = P(`Name      Mon 14    Tue 15    Wed 16    Thu 17
Madoxs    09:00-17:00  OFF     12:00-20:00  09:00-17:00
Sarah     12:00-20:00  09:00-17:00  OFF     12:00-20:00
Tom       OFF        12:00-20:00  09:00-17:00  OFF`);
  eq(r.shape, 'grid', 'read as the wrong shape');
  eq(r.rows.length, 3, 'Madoxs works three of those four days');
  eq(r.rows[0].date, '2026-09-14', 'the first shift is the Monday');
  eq(r.rows[0].start + '-' + r.rows[0].end, '09:00-17:00', 'the hours are wrong');
  eq(RI.withLabel(r.rows[0]), 'Sarah 12:00-20:00', 'Monday is with Sarah only — Tom is off');
  eq(RI.withLabel(r.rows[1]), 'Tom 09:00-17:00', 'Wednesday: Madoxs is 12-20, Tom 09-17, Sarah off');
  eq(r.rows[2].date, '2026-09-17', 'the last shift is the Thursday');
  eq(RI.withLabel(r.rows[2]), 'Sarah 12:00-20:00', 'Thursday is with Sarah');
});

t('the block shape: a heading per day, people under it', async () => {
  const r = P(`Monday 14 September
Madoxs 09:00-17:00
Sarah 12:00-20:00

Tuesday 15 September
Sarah 09:00-17:00
Madoxs 12:00-20:00
Tom 12:00-20:00`);
  eq(r.shape, 'blocks', 'read as the wrong shape');
  eq(r.rows.length, 2, 'two shifts');
  eq(r.rows[0].date, '2026-09-14', 'Monday');
  eq(RI.withLabel(r.rows[0]), 'Sarah 12:00-20:00', 'Monday is with Sarah');
  /* Sarah's 09-17 and Madoxs's 12-20 share five hours, so she counts; the list is ordered by
     when each person starts. */
  eq(RI.withLabel(r.rows[1]), 'Sarah 09:00-17:00 · Tom 12:00-20:00', 'Tuesday is with both of them');
});

t('the line shape: one shift per line, names on the end', async () => {
  const r = P(`Mon 14 Sept 09:00-17:00 Madoxs, Sarah
Tue 15 Sept 12:00-20:00 Tom
Wed 16 Sept 09:00-17:00 Madoxs and Tom`);
  eq(r.shape, 'lines', 'read as the wrong shape');
  eq(r.rows.length, 2, 'Madoxs is on two of those');
  eq(RI.withLabel(r.rows[0]), 'Sarah 09:00-17:00', 'Monday is with Sarah');
  eq(RI.withLabel(r.rows[1]), 'Tom 09:00-17:00', 'Wednesday is with Tom');
});

t('who you are with is who your hours overlap, not who is on that day', async () => {
  /* The whole point of the field. The closer is not who you worked with. */
  const r = P(`Name    Mon 14
Madoxs  06:00-14:00
Sarah   13:00-21:00
Tom     17:00-01:00`);
  eq(r.rows.length, 1, 'one shift');
  eq(RI.withLabel(r.rows[0]), 'Sarah 13:00-21:00', 'Tom starts three hours after Madoxs goes home');
});

t('a name is matched the way a rota writes one', async () => {
  ok(RI._isMe('Madoxs', 'Madoxs'), 'plain');
  ok(RI._isMe('madoxs h', 'Madoxs'), 'lower case with an initial after');
  ok(RI._isMe('H. Madoxs', 'Madoxs'), 'initial first');
  ok(RI._isMe('Madoxs (Bar)', 'Madoxs'), 'with a station in brackets');
  ok(RI._isMe('Madoxs', 'Madoxs Hart'), 'the account has a surname the rota does not');
  ok(!RI._isMe('Sarah', 'Madoxs'), 'someone else');
  ok(!RI._isMe('Madison', 'Madoxs'), 'a name that merely starts the same is not you');
  ok(!RI._isMe('M', 'Madoxs'), 'a bare initial is not enough to claim a shift');
});

t('the ways a rota writes a time range', async () => {
  const c = (s) => { const t = RI._readTimes(s); return t ? t.start + '-' + t.end : null; };
  eq(c('09:00-17:00'), '09:00-17:00', 'colons');
  eq(c('09.00 – 17.00'), '09:00-17:00', 'dots and an en dash');
  eq(c('9-5'), '09:00-17:00', 'the short form means the working day');
  eq(c('9am-5pm'), '09:00-17:00', 'am/pm');
  eq(c('0900-1700'), '09:00-17:00', 'four digits, no separator');
  eq(c('12-8'), '12:00-20:00', 'a noon start still reads as an afternoon finish');
  eq(c('14-10'), '14:00-22:00', 'an afternoon start finishing at ten at night');
  eq(c('22-6'), '22:00-06:00', 'a night shift stays a night shift — six in the evening is before ten');
  eq(c('20-4'), '20:00-04:00', 'and so does this one');
  eq(c('7:30 to 15:45'), '07:30-15:45', 'the word "to"');
  eq(c('12pm-12am'), '12:00-00:00', 'noon to midnight');
  eq(c('OFF'), null, 'a day off has no hours');
  eq(c('Madoxs'), null, 'a name is not a time');
});

t('an overnight shift keeps its own day', async () => {
  const r = P(`Name    Fri 11
Madoxs  22:00-06:00
Sarah   23:00-07:00
Tom     09:00-17:00`);
  eq(r.rows.length, 1, 'one shift');
  eq(r.rows[0].start + '-' + r.rows[0].end, '22:00-06:00', 'the hours');
  eq(r.rows[0].overnight, true, 'it should be flagged as running past midnight');
  eq(RI.withLabel(r.rows[0]), 'Sarah 23:00-07:00', 'Tom is long gone by ten at night');
});

t('a day off in any of its spellings is not a shift', async () => {
  const r = P(`Name    Mon 14  Tue 15  Wed 16  Thu 17  Fri 18  Sat 19
Madoxs  OFF     -       A/L     REST    X       09:00-17:00`);
  eq(r.rows.length, 1, 'only the Saturday is a shift, got ' + r.rows.map(x => x.date).join(','));
  eq(r.rows[0].date, '2026-09-19', 'the Saturday');
});

t('a bare weekday is the one coming, not the one gone', async () => {
  /* The opposite of the finance importer, on purpose: a rota is next week's work. Today is
     Wednesday 9 September 2026. */
  eq(RI._readDate('Monday', TODAY), '2026-09-14', 'Monday is the one ahead');
  eq(RI._readDate('Wednesday', TODAY), '2026-09-09', 'today counts as the next one');
  eq(RI._readDate('Thu', TODAY), '2026-09-10', 'tomorrow');
});

t('a date is read the way a British rota writes one', async () => {
  eq(RI._readDate('2026-09-14', TODAY), '2026-09-14', 'ISO');
  eq(RI._readDate('14/09', TODAY), '2026-09-14', 'day first, not month first');
  eq(RI._readDate('14/09/26', TODAY), '2026-09-14', 'two-digit year');
  eq(RI._readDate('14 Sept', TODAY), '2026-09-14', 'short month');
  eq(RI._readDate('Sept 14', TODAY), '2026-09-14', 'month first');
  eq(RI._readDate('Mon 14', TODAY), '2026-09-14', 'weekday and day number together');
  eq(RI._readDate('31 Feb', TODAY), null, 'a date that does not exist is not a date');
  eq(RI._readDate('Bar', TODAY), null, 'a word that is not a day');
});

t('a month with no year is the one coming, not the one just gone', async () => {
  eq(RI._readDate('2 Jan', TODAY), '2027-01-02', 'January from September is next year');
  eq(RI._readDate('12 Sept', TODAY), '2026-09-12', 'later this month');
});

t('it says so when your name is not on the rota', async () => {
  const r = P(`Name    Mon 14
Sarah   09:00-17:00
Tom     12:00-20:00`);
  eq(r.rows.length, 0, 'no shifts are yours');
  ok(/none against that name/.test(r.warn), 'it should say the name was not found: ' + r.warn);
  ok(/Sarah/.test(r.warn) && /Tom/.test(r.warn), 'and list who it did find, so the spelling can be fixed');
});

t('it asks for a name rather than guessing', async () => {
  const r = RI.parse('Madoxs 09:00-17:00 Monday', { me: '', todayKey: TODAY });
  eq(r.rows.length, 0, 'nothing should come back without a name to match');
  ok(/name/i.test(r.warn), 'the message should say what is missing: ' + r.warn);
});

t('nothing to read is said plainly, not as a parse failure', async () => {
  ok(/Nothing to read/.test(P('').warn), 'empty paste');
  ok(/Nothing to read/.test(P('   \n\n  ').warn), 'whitespace only');
});

t('text that is not a rota does not become one', async () => {
  const r = P('Just some notes about the week ahead, nothing structured in here at all.');
  eq(r.rows.length, 0, 'prose is not a rota');
  ok(r.warn, 'and it should say so');
});

t('the same shift pasted twice lands once', async () => {
  const r = P(`Mon 14 Sept 09:00-17:00 Madoxs
Mon 14 Sept 09:00-17:00 Madoxs`);
  eq(r.rows.length, 1, 'a duplicate should collapse');
});

t('a split shift on one day is two entries, not one', async () => {
  const r = P(`Mon 14 Sept 08:00-12:00 Madoxs
Mon 14 Sept 17:00-21:00 Madoxs`);
  eq(r.rows.length, 2, 'both halves of a split shift are real shifts');
  eq(r.rows[0].start, '08:00', 'sorted by time within the day');
  eq(r.rows[1].start, '17:00', 'the evening half second');
});

t('a date far outside the window is a misread, not a booking', async () => {
  const r = P(`Name    12/13   Mon 14
Madoxs  09:00-17:00  09:00-17:00`);
  /* 12/13 is not a date — month 13 does not exist — so that column contributes nothing and
     the shift under it is dropped rather than filed against a guess. */
  eq(r.rows.length, 1, 'only the readable column should produce a shift');
  eq(r.rows[0].date, '2026-09-14', 'the Monday');
});

t('tabs, pipes and wide spacing all split a grid', async () => {
  eq(RI._cells('Madoxs\t09:00-17:00\tOFF').join('|'), 'Madoxs|09:00-17:00|OFF', 'tabs');
  eq(RI._cells('| Madoxs | 09:00-17:00 | OFF |').join('~'), 'Madoxs~09:00-17:00~OFF', 'pipes');
  eq(RI._cells('Madoxs    09:00-17:00    OFF').join('|'), 'Madoxs|09:00-17:00|OFF', 'wide spacing');
  eq(RI._cells('Madoxs Hart').join('|'), 'Madoxs Hart', 'a single space is never a separator — names have spaces');
});

t('a tab-separated grid pasted out of a spreadsheet', async () => {
  const r = P('Staff\tMon 14\tTue 15\nMadoxs\t09:00-17:00\t12:00-20:00\nSarah\t09:00-17:00\tOFF');
  eq(r.rows.length, 2, 'two shifts');
  eq(RI.withLabel(r.rows[0]), 'Sarah 09:00-17:00', 'Monday together');
  eq(RI.withLabel(r.rows[1]), '', 'Tuesday on his own');
});

t('everyone on the rota is reported, so a misspelling can be spotted', async () => {
  const r = P(`Name    Mon 14
Madoxs  09:00-17:00
Sarah   12:00-20:00
Tom     09:00-17:00`);
  eq(r.people.sort().join(','), 'Madoxs,Sarah,Tom', 'the full cast should come back');
  eq(r.total, 3, 'three shifts were read in total, one of them yours');
});

t('the engine no-ops on a second execution', async () => {
  /* <helmet> relocation runs every engine twice; the guard is what stops that mattering. */
  const before = RI.parse;
  const src = await import('fs').then(fs => fs.readFileSync('./rota-import.js', 'utf8'));
  const fn = new Function('module', 'window', src);
  const w = { RotaImport: RI };
  fn({ exports: {} }, w);
  eq(w.RotaImport.parse, before, 're-running the file replaced the engine');
});

let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
