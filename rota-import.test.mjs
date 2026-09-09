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

t('the day-off codes a rota actually uses', async () => {
  const r = P(`Name    Mon 14  Tue 15  Wed 16  Thu 17  Fri 18  Sat 19  Sun 20
Madoxs  HOL     D/O     A/L     B/H     TOIL    LIEU    09:00-17:00`);
  eq(r.rows.length, 1, 'only the Sunday has hours on it, got ' + r.rows.map(x => x.date).join(','));
  eq(r.offDays.length, 6, 'the other six should come back as days off, got ' + r.offDays.map(x => x.cell).join(','));
  eq(r.untimed.length, 0, 'a recognised day off is not an untimed shift');
});

t('anything with no hours is a day out, whatever the cell says', async () => {
  /* The rule, and it is not a vocabulary list: a shift code that names a shift without
     saying when it is cannot go in a diary as a time, so it does not go in at all. It comes
     back named instead, so the hours can be added and the rota re-imported. */
  const r = P(`Name    Mon 14  Tue 15  Wed 16  Thu 17
Madoxs  E       LATE    ?       09:00-17:00`);
  eq(r.rows.length, 1, 'only the Thursday is a shift');
  eq(r.untimed.length, 3, 'the three coded days should be handed back as untimed');
  eq(r.untimed.map(x => x.cell).join(','), 'E,LATE,?', 'and named as the rota wrote them');
  eq(r.offDays.length, 0, 'none of those is a day off — they are shifts with no time yet');
});

t('a week that is entirely off says so, rather than failing to parse', async () => {
  const r = P(`Name    Mon 14  Tue 15
Madoxs  HOL     HOL
Sarah   09:00-17:00  09:00-17:00`);
  eq(r.rows.length, 0, 'nothing to add');
  eq(r.offDays.length, 2, 'both days are holiday');
  ok(/day off/.test(r.warn), 'and it should say that rather than "none against that name": ' + r.warn);
});

t('somebody else being on holiday is not your holiday', async () => {
  const r = P(`Name    Mon 14
Madoxs  09:00-17:00
Sarah   HOL`);
  eq(r.offDays.length, 0, 'Sarah\u2019s holiday is not yours');
  eq(r.untimed.length, 0, 'and it is not an untimed shift of yours either');
  eq(r.rows.length, 1, 'your shift is still your shift');
});

t('an empty cell is a day off, not a parse failure', async () => {
  const r = P('Name\tMon 14\tTue 15\nMadoxs\t\t09:00-17:00');
  eq(r.rows.length, 1, 'the Tuesday only');
  eq(r.rows[0].start, '09:00', 'and it is the one with hours');
});

t('a day off in the day-by-day shape is picked up too', async () => {
  const r = P(`Monday 14 September
Madoxs OFF
Sarah 09:00-17:00

Tuesday 15 September
Madoxs 09:00-17:00`);
  eq(r.rows.length, 1, 'one shift');
  eq(r.rows[0].date, '2026-09-15', 'the Tuesday');
  eq(r.offDays.length, 1, 'Monday is a day off');
  eq(r.offDays[0].date, '2026-09-14', 'and it is the Monday');
});

/* ---- the real thing ----------------------------------------------------------------
   Transcribed from the rota this feature was built for: a Google Sheet with the dates down
   column A, the weekday in B, and a person per column with a running hours count between
   each pair. Tab-separated, which is what copying cells out of a sheet gives you. */
const REAL = [
  '\t\tChristine\t\tHarriette\t\tTony\t\tAbbie\t\tMadoxs\t\tChris 2 (Moore)\t\t\tOvertime & Lieu Days',
  '03/09/2026\tThursday\tD/O\t0\tBank Holiday\t9\t8-6\t9\tD/O\t0\t8-6\t9\t8-5\t8\t\t3',
  '04/09/2026\tFriday\tBank Holiday\t9\tD/O\t0\t8-6\t9\t8-6\t9\t8-6\t9\t8-6\t9\t\t4',
  '05/09/2026\tSaturday\t9-5\t7\t9-5\t7\tD/O\t0\t9-5\t7\t9-5\t7\t9-5\t7\t\t5',
  '\t\t\t40\t\t40\t\t40\t\t40\t\t40\t\t40',
  '06/09/2026\tSunday\t10-4\t6\t10-4\t6\tD/O\t0\t10-4\t6\t10-4\t6\t10-4\t6\t\t5',
  '07/09/2026\tMonday\t8-6\t9\t8-5\t8\tBank Holiday\t8\t8-6\t9\t8-6\t9\tBank Holiday\t9\t\t4',
  '08/09/2026\tTuesday\tD/O 9am\t0\t8-6\t9\t8-6\t9\t8-6\t9\tD/O\t0\t8-6\t9\t\t3',
  '09/09/2026\tWednesday\t8-6\t9\tD/O\t0\t9-5\t7\tD/O\t0\t8-6\t9\tD/O\t0\t\t3',
  '10/09/2026\tThursday\t8-6\t9\t8-5\t8\tD/O\t0\tD/O\t0\tD/O\t0\t8-6\t9\t\t3',
  '11/09/2026\tFriday\tD/O\t0\t8-6\t9\t8-6\t9\tBank Holiday\t9\t8-6\t9\tD/O\t0\t\t3',
  '12/09/2026\tSaturday\t9-5\t7\tD/O\t0\t9-5\t7\t9-5\t7\t9-5\t7\t9-5\t7\t\t5',
  '\t\t\t40\t\t40\t\t40\t\t40\t\t40\t\t40',
  '13/09/2026\tSunday\t10-4\t6\t10-4\t6\t10-4\t6\tD/O\t0\t10-4\t6\t10-4\t6\t\t5',
  '14/09/2026\tMonday\tD/O\t0\t8-6\t9\t8-6\t9\t9-5\t7\tD/O\t0\tD/O\t0\t\t3',
  '15/09/2026\tTuesday\t8-6 08:30\t9\t8/6\t9\tD/O\t0\t8-6\t9\tBank Holiday\t9\t8-6\t9\t\t4',
  '16/09/2026\tWednesday\t8-6\t9\tD/O\t0\t8-6\t9\t8-5\t8\t8-6\t9\tD/O\t0\t\t4',
  '19/09/2026\tSaturday\tHOL\t7\t9-5\t7\t9-5\t7\t9-5\t7\t9-5\t7\t9-5\t7\t\t5',
  '\t\t\t40\t\t40\t\t40\t\t40\t\t40\t\t40',
  'October',
  '01/10/2026\tThursday\tD/O\t0\t8-6\t9\t8-6\t9\tD/O\t0\tHOL\t9\t8-6\t9\t\t3',
  '02/10/2026\tFriday\t8-6\t9\tD/O\t0\tD/O\t0\t8-6\t9\tHOL\t9\tD/O\t0\t\t2',
  '03/10/2026\tSaturday\t9-5\t7\t9-5\t7\t9-5\t7\t9-5\t7\tHOL\t7\t9-5\t7\t\t5',
].join('\n');
/* Today is fixed at the Wednesday in the middle of it, as the app would see it. */
const R = (me = 'Mr Madoxs Harvey') => RI.parse(REAL, { me, todayKey: '2026-09-09' });

t('the real rota: dates down the side, a person per column', async () => {
  const r = R();
  eq(r.shape, 'grid-down', 'read as the wrong shape');
  const days = r.rows.map(x => x.date + ' ' + x.start + '-' + x.end);
  eq(days.join('\n'), [
    '2026-09-03 08:00-18:00',
    '2026-09-04 08:00-18:00',
    '2026-09-05 09:00-17:00',
    '2026-09-06 10:00-16:00',
    '2026-09-07 08:00-18:00',
    '2026-09-09 08:00-18:00',
    '2026-09-11 08:00-18:00',
    '2026-09-12 09:00-17:00',
    '2026-09-13 10:00-16:00',
    '2026-09-16 08:00-18:00',
    '2026-09-19 09:00-17:00',
  ].join('\n'), 'the shifts against Madoxs are wrong');
});

t('the real rota: the name on the account is not the name on the sheet', async () => {
  /* The sheet says "Madoxs"; the account says "Mr Madoxs Harvey". */
  eq(R().rows.length, 11, 'the full name should still find the column');
  eq(R('Madoxs').rows.length, 11, 'and so should the bare one');
  /* Christine's column is a different column, not a different reading of the same one:
     she is in on the Thursday he has off, and off on the Friday he is in. */
  const c = R('Christine').rows.map(x => x.date);
  ok(c.includes('2026-09-10'), 'Christine works the Thursday');
  ok(!R().rows.some(x => x.date === '2026-09-10'), 'and Madoxs has it off');
  ok(!c.includes('2026-09-11'), 'Christine has the Friday off');
  ok(R().rows.some(x => x.date === '2026-09-11'), 'and Madoxs works it');
});

t('the real rota: D/O, HOL and Bank Holiday are all days out', async () => {
  const r = R();
  const off = r.offDays.map(x => x.date + ' ' + x.cell);
  ok(off.includes('2026-09-08 D/O'), 'a D/O should be a day off: ' + off.join(', '));
  ok(off.includes('2026-09-10 D/O'), 'and the Thursday');
  ok(off.includes('2026-09-15 Bank Holiday'), 'and the bank holiday');
  ok(off.includes('2026-10-01 HOL'), 'and the annual leave in October');
  eq(r.untimed.length, 0, 'nothing of his is untimed — every cell says either hours or a day out');
  const dates = r.rows.map(x => x.date);
  ok(!dates.includes('2026-09-15'), 'a bank holiday must not become a shift');
  ok(!dates.includes('2026-10-01'), 'and neither must a holiday');
});

t('the real rota: who he is on with, on a real day', async () => {
  const r = R();
  /* Wednesday 9 September: Madoxs 8-6, Christine 8-6, Tony 9-5. Harriette, Abbie and Chris
     are all D/O, and the hours columns are not people. */
  const wed = r.rows.find(x => x.date === '2026-09-09');
  ok(wed, 'the Wednesday is missing');
  eq(RI.withLabel(wed), 'Christine 08:00-18:00 · Tony 09:00-17:00', 'wrong company on the Wednesday');
  const sun = r.rows.find(x => x.date === '2026-09-06');
  eq(RI.withLabel(sun), 'Abbie 10:00-16:00 · Chris 2 (Moore) 10:00-16:00 · Christine 10:00-16:00 · Harriette 10:00-16:00',
    'the Sunday should be everyone but Tony, who is D/O');
});

t('the real rota: the hours columns and the total rows are not people', async () => {
  const r = R();
  ok(r.people.indexOf('40') < 0, 'a weekly total is not a colleague');
  ok(!r.people.some(p => /^\d+$/.test(p)), 'an hours count is not a colleague: ' + r.people.join(','));
  eq(r.people.sort().join(','), 'Abbie,Chris 2 (Moore),Christine,Harriette,Madoxs,Tony',
    'the cast should be the six people and nothing else');
});

t('the real rota: a month divider and a blank week do not derail it', async () => {
  const r = R();
  ok(r.rows.some(x => x.date.startsWith('2026-09')), 'September survived');
  ok(r.offDays.some(x => x.date.startsWith('2026-10')), 'and October was still read');
});

t('the real rota: the heading row has to be in the paste, and it says so', async () => {
  /* A sheet keeps the names frozen at the top, so copying a block of weeks leaves them
     behind — and without them nothing says which column is yours. */
  const noHead = REAL.split('\n').slice(1).join('\n');
  const r = RI.parse(noHead, { me: 'Madoxs', todayKey: '2026-09-09' });
  eq(r.rows.length, 0, 'it must not guess a column');
  ok(/names is not in what you pasted/.test(r.warn), 'the message should say what is missing: ' + r.warn);
  ok(/including that row/.test(r.warn), 'and what to do about it');
});

t('the real rota: a cell with a note but no range is handed back, not guessed at', async () => {
  /* "D/O 9am" is Christine's, and it is neither a clean day off nor a time range. */
  const r = R('Christine');
  const un = r.untimed.map(x => x.cell);
  ok(un.includes('D/O 9am'), 'it should be reported rather than read as either thing: ' + un.join(', '));
  ok(!r.rows.some(x => x.date === '2026-09-08'), 'and nothing should be added for that day');
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
