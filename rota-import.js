/* Work rota import — turns a pasted rota into the shifts that are yours.

   A rota is not a calendar. It lists everyone, and only some of the rows are you; the rest
   are the people you are on with, which is worth keeping rather than throwing away. So this
   parses the whole sheet, finds the rows bearing your name, and hands back each of your
   shifts with the overlapping shifts of everyone else on that day attached to it.

   A pure parser in its own file, like finance-import.js: no DOM, no network, no state, and
   tested outside the browser (rota-import.test.mjs). Local only — the calendar's screenshot
   import needs an AI key and fails outright without one, and a rota is the sort of thing you
   paste out of an email at 6am.

   The three shapes real rotas actually come in:

     GRID     the printed/spreadsheet one. Days across the top, a person per row.
                Name     Mon 14   Tue 15   Wed 16
                Madoxs   09-17    OFF      12-20
                Sarah    12-20    09-17    OFF

     BLOCKS   a heading per day, people under it.
                Monday 14 September
                Madoxs 09:00-17:00
                Sarah  12:00-20:00

     LINES    one shift per line, in any order.
                Mon 14 Sept 09:00-17:00 Madoxs, Sarah

   Everything is forward-looking, which is the opposite of the finance importer: a rota is
   next week's, so a bare "Monday" is the Monday coming, not the one just gone. */
(function (root) {
  /* Idempotent — every engine <script> in index.html sits inside <helmet>, which the
     framework relocates into <head> at runtime and so runs a second time. */
  if (root.RotaImport) return;

  var BACK_DAYS = 14;      // a rota pasted mid-week still names days that have been
  var AHEAD_DAYS = 400;    // and rotas are published a long way out in some places

  var MONTHS = {
    jan:0, january:0, feb:1, february:1, mar:2, march:2, apr:3, april:3, may:4,
    jun:5, june:5, jul:6, july:6, aug:7, august:7, sep:8, sept:8, september:8,
    oct:9, october:9, nov:10, november:10, dec:11, december:11
  };
  var DOW = { sun:0, sunday:0, su:0, mon:1, monday:1, mo:1, tue:2, tues:2, tuesday:2, tu:2,
              wed:3, weds:3, wednesday:3, we:3, thu:4, thur:4, thurs:4, thursday:4, th:4,
              fri:5, friday:5, fr:5, sat:6, saturday:6, sa:6 };

  /* The rule about a day with no hours is simple and it is not this list: a cell with no
     readable time range is not a shift, whatever it says. That covers HOL, D/O, a blank, and
     equally the shift codes some rotas use — E, L, N — which name a shift without saying
     when it is. None of them can be put in a diary as a time, so none of them are.

     This vocabulary exists only to tell the two apart when reporting back: a cell that says
     A/L is a day off and that is the end of it, while a cell that says something else with no
     hours is a shift the rota has not given a time for, and is worth naming so the hours can
     be added and the rota re-imported. */
  var OFF = /^(?:off|o|x{1,2}|-{1,3}|–|—|rest|r\/?d|rd|d\/?o|do|day ?off|days? out|hol|hols|holiday|holidays|b\/?h|bank ?hol(?:iday)?|a\/?l|al|ann(?:ual)? ?leave|leave|lieu|toil|sick|s\/?l|sl|unpaid|mat(?:ernity)? ?leave|pat(?:ernity)? ?leave|n\/?a|nil|none|not working|free|unavail(?:able)?)$/i;

  /* Words a rota header uses for the person column, so it is not mistaken for a name. */
  var NAME_HEADER = /^(?:name|names|staff|employee|employees|team|member|colleague|person|who|rota|shift|shifts)$/i;

  function toKey(d) {
    // Local calendar date, never toISOString — that shifts the day for anyone behind UTC.
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fromKey(key) { var p = String(key).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); }
  function addDays(key, n) { var d = fromKey(key); d.setDate(d.getDate() + n); return toKey(d); }

  /* A day/month with no year is the next one that has not happened yet — a rota is next
     week's work, so "14 Sept" typed in December means the coming September, not the one
     nine months gone. A few days of slack so a rota pasted on the Friday still files the
     Monday just past against the week it belongs to. */
  function resolveMonthDay(day, month, todayKey) {
    var t = fromKey(todayKey);
    var d = new Date(t.getFullYear(), month, day, 12, 0, 0);
    if (d.getMonth() !== month) return null;                       // 31 February
    if ((t - d) / 86400000 > BACK_DAYS) d.setFullYear(t.getFullYear() + 1);
    return toKey(d);
  }
  /* The next occurrence of a weekday, counting today as the next one. */
  function resolveDow(w, todayKey) {
    var t = fromKey(todayKey);
    return addDays(todayKey, (w - t.getDay() + 7) % 7);
  }
  /* A bare day number: the next time that date comes round. */
  function resolveDom(day, todayKey) {
    var t = fromKey(todayKey);
    if (day < 1 || day > 31) return null;
    for (var i = 0; i < 3; i++) {
      var d = new Date(t.getFullYear(), t.getMonth() + i, day, 12, 0, 0);
      if (d.getDate() !== day) continue;                            // month is too short
      if ((t - d) / 86400000 <= BACK_DAYS) return toKey(d);
    }
    return null;
  }

  /* Read a date out of a fragment. Returns a key, or null if there is no date in it.
     Order matters: ISO before anything numeric, and a bare weekday last so "Sat 14 Dec"
     is read as the 14th of December rather than as Saturday. */
  /* Clock times come out before a date is looked for. "Mon 14 Sept 09:00-17:00" was reading
     the 09 as a two-digit year and filing the shift in 2009. Only the unambiguous forms are
     stripped — a dotted 14.09.26 is a date, not a time, so dots are left alone. */
  function stripClock(s) {
    return String(s).replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?/ig, ' ')
                    .replace(/\b\d{3,4}\s*-\s*\d{3,4}\b/g, ' ');
  }
  function readDate(frag, todayKey) {
    var s = stripClock(String(frag || '')).trim();
    if (!s) return null;
    var m;
    if ((m = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) {
      var d0 = new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0);
      return (+m[2] >= 1 && +m[2] <= 12 && d0.getDate() === +m[3]) ? toKey(d0) : null;
    }
    if ((m = /(\d{1,2})(?:st|nd|rd|th)?[\s.\-\/]+([a-z]{3,9})\.?(?:[\s.\-\/]+(\d{2,4})(?![\d:]))?/i.exec(s))) {
      var mo = MONTHS[m[2].toLowerCase()];
      if (mo != null) return m[3] ? ymd(fullYear(+m[3]), mo, +m[1]) : resolveMonthDay(+m[1], mo, todayKey);
    }
    if ((m = /([a-z]{3,9})\.?[\s.\-\/]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s.\-\/]+(\d{2,4})(?![\d:]))?/i.exec(s))) {
      var mo2 = MONTHS[m[1].toLowerCase()];
      if (mo2 != null) return m[3] ? ymd(fullYear(+m[3]), mo2, +m[2]) : resolveMonthDay(+m[2], mo2, todayKey);
    }
    // Day/month written with slashes or dots. Day first: this is a UK rota.
    if ((m = /\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b/.exec(s))) {
      var day = +m[1], mon = +m[2];
      if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12)
        return m[3] ? ymd(fullYear(+m[3]), mon - 1, day) : resolveMonthDay(day, mon - 1, todayKey);
    }
    // A weekday, with or without a bare day number beside it: "Mon 14", "Monday", "14".
    if ((m = /\b([a-z]{2,9})\b/i.exec(s))) {
      var w = DOW[m[1].toLowerCase()];
      if (w != null) {
        var dom = /\b(\d{1,2})\b/.exec(s);
        if (dom) {
          var byNum = resolveDom(+dom[1], todayKey);
          if (byNum && fromKey(byNum).getDay() === w) return byNum;   // both agree
          if (byNum) return byNum;                                    // the number is the specific one
        }
        return resolveDow(w, todayKey);
      }
    }
    if (/^\d{1,2}$/.test(s)) return resolveDom(+s, todayKey);
    return null;
  }
  function fullYear(y) { return y < 100 ? 2000 + y : y; }
  function ymd(y, mo, d) {
    var x = new Date(y, mo, d, 12, 0, 0);
    return (mo >= 0 && mo <= 11 && x.getDate() === d) ? toKey(x) : null;
  }

  /* A shift's hours. Handles 09:00-17:00, 9-5, 9am-5pm, 09.00 – 17.00, 0900-1700.
     Returns {start,end,overnight} in 24h, or null. */
  function readTimes(frag) {
    var s = String(frag || '').replace(/[–—]/g, '-').replace(/\bto\b|\btill\b|\buntil\b/gi, '-').trim();
    /* 0900-1700 is tried first. The general pattern would otherwise chew into it from the
       middle — it read "0900-1700" as 00:00 to 17:00. */
    var m2 = /\b(\d{3,4})\s*-\s*(\d{3,4})\b/.exec(s);
    if (m2) {
      var a = pad4(m2[1]), b = pad4(m2[2]);
      if (a && b) return build(a[0], a[1], null, b[0], b[1], null);
    }
    var m = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i.exec(s);
    if (m) return build(+m[1], m[2] ? +m[2] : 0, m[3], +m[4], m[5] ? +m[5] : 0, m[6]);
    return null;
  }
  function pad4(t) {
    t = String(t); if (t.length === 3) t = '0' + t;
    var h = +t.slice(0, 2), mi = +t.slice(2);
    return (h <= 23 && mi <= 59) ? [h, mi] : null;
  }
  function build(h1, m1, ap1, h2, m2, ap2) {
    if (h1 > 24 || h2 > 24 || m1 > 59 || m2 > 59) return null;
    if (ap1) h1 = ampm(h1, ap1);
    if (ap2) h2 = ampm(h2, ap2);
    /* No am/pm on either side is the "9-5" case: a rota writes the short form and means the
       working day. When the end reads as earlier than the start, the question is whether the
       shift finishes that afternoon or runs past midnight — and the answer is whether adding
       twelve hours to the end lands after the start. 9-5 and 12-8 become afternoons; 22-6 and
       20-4 stay overnight, because six in the evening is still before ten at night. */
    if (!ap1 && !ap2 && h2 <= h1 && h2 + 12 <= 23 && h2 + 12 > h1) h2 += 12;
    if (h1 > 23 || h2 > 24) return null;
    var start = hhmm(h1, m1), end = hhmm(h2 === 24 ? 0 : h2, m2);
    var overnight = (h2 * 60 + m2) <= (h1 * 60 + m1);
    return { start: start, end: end, overnight: overnight };
  }
  function ampm(h, ap) {
    ap = ap.toLowerCase();
    if (ap === 'am') return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
  }
  function hhmm(h, m) { return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
  function mins(t) { var p = String(t).split(':'); return (+p[0]) * 60 + (+p[1]); }

  /* Two shifts on the same day are "together" if their hours overlap at all. Same day is not
     enough — the closer on 17:00-01:00 is not who you were with on the 06:00-14:00. */
  function overlaps(a, b) {
    var a1 = mins(a.start), a2 = mins(a.end) + (a.overnight ? 1440 : 0);
    var b1 = mins(b.start), b2 = mins(b.end) + (b.overnight ? 1440 : 0);
    return a1 < b2 && b1 < a2;
  }

  /* Is this row you? Whole-word, case-insensitive, and forgiving of the ways a rota writes a
     person: "Madoxs", "madoxs h", "H. Madoxs", "Madoxs (Bar)". Any word of the name you gave
     that is three letters or more has to appear as a word in the cell. Initials on their own
     are not enough to match on — too many people share one. */
  function tokens(s) {
    return String(s || '').toLowerCase().split(/[^a-z0-9']+/).filter(function (t) { return t.length > 0; });
  }
  function isMe(cell, me) {
    var mine = tokens(me).filter(function (t) { return t.length >= 3; });
    if (!mine.length) return false;
    var have = {}; tokens(cell).forEach(function (t) { have[t] = 1; });
    for (var i = 0; i < mine.length; i++) if (have[mine[i]]) return true;
    return false;
  }
  function tidyName(s) {
    return String(s || '').replace(/\s+/g, ' ').replace(/^[\s,\-–—|]+|[\s,\-–—|:]+$/g, '').trim();
  }

  /* How a grid line splits into cells: two or more spaces, a tab, a pipe, or a comma when
     the line uses them consistently. A single space is never a separator — names have
     spaces in them. */
  function cells(line) {
    if (/\t/.test(line)) return line.split('\t').map(tidyName);
    if (/\|/.test(line)) return line.split('|').map(tidyName).filter(function (c, i, a) { return !(c === '' && (i === 0 || i === a.length - 1)); });
    if (/ {2,}/.test(line)) return line.split(/ {2,}/).map(tidyName);
    if (/,/.test(line)) return line.split(',').map(tidyName);
    return [tidyName(line)];
  }

  /* A header row: two or more of its cells after the first read as dates. */
  /* A header row. The test is not "does it contain a date" — a line of the shift shape
     ("Mon 14 Sept 09:00-17:00 Madoxs, Sarah") contains one too. It is that no cell holds a
     time range and at least one reads as a date: a header names days, never hours. */
  function headerDates(line, todayKey) {
    var c = cells(line);
    if (c.length < 2) return null;
    var out = [], hits = 0;
    for (var i = 0; i < c.length; i++) {
      if (readTimes(c[i])) return null;
      var d = (i === 0 && NAME_HEADER.test(c[i])) ? null : readDate(c[i], todayKey);
      out.push(d);
      if (d) hits++;
    }
    return hits >= 1 ? out : null;
  }

  /* ---- the three shapes ------------------------------------------------ */

  function parseGrid(lines, todayKey) {
    var shifts = [], blanks = [], header = null, used = false;
    for (var i = 0; i < lines.length; i++) {
      var h = headerDates(lines[i], todayKey);
      if (h) {
        header = h;
        /* Some rotas leave the person column unlabelled, so the header starts straight in on
           the days while every row below still leads with a name. Shift the days right by one
           so the columns line up with the cells they belong to. */
        if (header[0]) {
          var nxt = lines[i + 1] ? cells(lines[i + 1]) : null;
          if (nxt && nxt.length > 1 && !readTimes(nxt[0]) && !readDate(nxt[0], todayKey)) header = [null].concat(header);
        }
        continue;
      }
      if (!header) continue;
      var c = cells(lines[i]);
      if (c.length < 2) continue;
      var who = tidyName(c[0]);
      if (!who || NAME_HEADER.test(who)) continue;
      for (var j = 1; j < c.length && j < header.length; j++) {
        var date = header[j];
        if (!date) continue;
        var cell = c[j];
        var t = cell ? readTimes(cell) : null;
        if (t) {
          shifts.push({ who: who, date: date, start: t.start, end: t.end, overnight: t.overnight, raw: lines[i] });
          used = true;
        } else if (cell) {
          blanks.push({ who: who, date: date, cell: cell, off: OFF.test(cell) });
        }
      }
    }
    return used ? { shifts: shifts, blanks: blanks } : null;
  }

  function parseBlocks(lines, todayKey) {
    var shifts = [], blanks = [], day = null, sawHeading = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var t = readTimes(line);
      if (!t) {
        // No hours on the line at all — if it reads as a date, it opens a day. Otherwise it
        // is somebody down for that day with nothing said about when.
        var d = readDate(line, todayKey);
        if (d && !isLongLine(line)) { day = d; sawHeading = true; continue; }
        if (day && !isLongLine(line)) {
          var w = tidyName(line.replace(new RegExp('\\b(?:' + OFF.source.replace(/^\^\(\?:|\)\$$/g, '') + ')\\b', 'i'), ' '));
          blanks.push({ who: w || tidyName(line), date: day, cell: tidyName(line), off: OFF.test(tidyName(line.replace(/^\s*\S+\s*/, ''))) || /\b(?:off|hol|a\/?l|d\/?o|rest|leave|sick)\b/i.test(line) });
        }
        continue;
      }
      if (!day) continue;
      var who = tidyName(line.replace(/(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?\s*(?:-|–|—|to|till|until)\s*\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)|(\b\d{3,4}\s*-\s*\d{3,4}\b)/i, ' '));
      if (!who) continue;
      shifts.push({ who: who, date: day, start: t.start, end: t.end, overnight: t.overnight, raw: line });
    }
    return (sawHeading && shifts.length) ? { shifts: shifts, blanks: blanks } : null;
  }
  // A heading is short. "Monday I am on 9-5 with Sarah in the back" is not a heading.
  function isLongLine(line) { return tokens(line).length > 6; }

  function parseLines(lines, todayKey) {
    var shifts = [], blanks = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var t = readTimes(line);
      var d = readDate(line, todayKey);
      if (!t) {
        // A dated line with no hours: somebody is down for that day, time unknown.
        if (d && !isLongLine(line)) blanks.push({ who: line, date: d, cell: tidyName(line), off: /\b(?:off|hols?|holiday|a\/?l|d\/?o|rest|leave|sick|b\/?h|lieu|toil)\b/i.test(line) });
        continue;
      }
      if (!d) continue;
      /* Strip the date and the hours; whatever is left is who. Several names on one line
         means several people on that shift, so each becomes a row of its own. */
      var rest = line
        .replace(/\d{4}-\d{1,2}-\d{1,2}/, ' ')
        .replace(/(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?\s*(?:-|–|—|to|till|until)\s*\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)|(\b\d{3,4}\s*-\s*\d{3,4}\b)/i, ' ')
        .replace(/\b\d{1,2}(?:st|nd|rd|th)?\b/g, ' ')
        .replace(new RegExp('\\b(?:' + Object.keys(MONTHS).join('|') + '|' + Object.keys(DOW).join('|') + ')\\b\\.?', 'ig'), ' ');
      var names = rest.split(/[,&/|]|\band\b|\bwith\b/i).map(tidyName).filter(function (n) { return n && /[a-z]{2,}/i.test(n); });
      if (!names.length) continue;
      for (var j = 0; j < names.length; j++)
        shifts.push({ who: names[j], date: d, start: t.start, end: t.end, overnight: t.overnight, raw: line });
    }
    return shifts.length ? { shifts: shifts, blanks: blanks } : null;
  }

  /* ---- the whole job --------------------------------------------------- */

  function parse(text, opts) {
    opts = opts || {};
    var todayKey = opts.todayKey || toKey(new Date());
    var me = opts.me || '';
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+$/, ''); })
      .filter(function (l) { return l.trim().length > 0; });

    if (!lines.length) return empty('Nothing to read.');
    if (!tokens(me).filter(function (t) { return t.length >= 3; }).length)
      return empty('Put your name in first — the rota has everyone on it, and that is how it knows which shifts are yours.');

    var shape = 'grid';
    var got = parseGrid(lines, todayKey);
    if (!got) { shape = 'blocks'; got = parseBlocks(lines, todayKey); }
    if (!got) { shape = 'lines'; got = parseLines(lines, todayKey); }
    if (!got) return empty('Could not find any shifts in that. A rota needs a date and a time range — "Mon 14  09:00-17:00" — and a name against each one.');
    var all = got.shifts, blanks = got.blanks || [];

    // Anything wildly outside the window is a misread date, not a shift booked in 2031.
    var lo = addDays(todayKey, -BACK_DAYS), hi = addDays(todayKey, AHEAD_DAYS);
    var outOfRange = 0;
    all = all.filter(function (s) {
      if (s.date >= lo && s.date <= hi) return true;
      outOfRange++; return false;
    });

    var people = [];
    var seen = {};
    all.forEach(function (s) { var k = s.who.toLowerCase(); if (!seen[k]) { seen[k] = 1; people.push(s.who); } });

    /* Your days with no hours on them. A rota says HOL or D/O or leaves the cell empty, and
       there is nothing to put in a diary either way — but the ones that are not a recognised
       day off are worth handing back, because they are shifts the rota has not timed yet. */
    var offDays = [], untimed = [];
    blanks.forEach(function (b) {
      if (!isMe(b.who, me)) return;
      if (b.date < lo || b.date > hi) return;
      (b.off ? offDays : untimed).push({ date: b.date, cell: b.cell });
    });
    offDays = dedupeDays(offDays); untimed = dedupeDays(untimed);

    var mine = all.filter(function (s) { return isMe(s.who, me); });
    var rows = mine.map(function (s) {
      var withWho = all.filter(function (o) {
        return o !== s && o.date === s.date && !isMe(o.who, me) && overlaps(s, o);
      }).map(function (o) { return { name: o.who, start: o.start, end: o.end }; });
      // One person can appear twice on a day (a split shift); list them once.
      var once = [], had = {};
      withWho.forEach(function (w) { var k = w.name.toLowerCase() + w.start; if (!had[k]) { had[k] = 1; once.push(w); } });
      once.sort(function (a, b) { return mins(a.start) - mins(b.start) || a.name.localeCompare(b.name); });
      return {
        date: s.date, start: s.start, end: s.end, overnight: !!s.overnight,
        with: once, raw: s.raw
      };
    });
    // Same shift listed twice (a rota repeated in the paste) collapses to one.
    var out = [], had2 = {};
    rows.forEach(function (r) { var k = r.date + r.start + r.end; if (!had2[k]) { had2[k] = 1; out.push(r); } });
    out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : mins(a.start) - mins(b.start); });

    return {
      rows: out, people: people, shape: shape,
      offDays: offDays, untimed: untimed,
      total: all.length, outOfRange: outOfRange,
      warn: out.length ? '' : ((offDays.length || untimed.length)
        ? 'No shifts with hours against that name — every day it names is ' + (untimed.length ? 'without a time' : 'a day off') + '.'
        : people.length
        ? 'Found ' + all.length + ' shift' + (all.length === 1 ? '' : 's') + ' but none against that name. The rota has: ' + people.slice(0, 8).join(', ') + (people.length > 8 ? '…' : '') + '.'
        : 'Could not find any shifts in that.')
    };
  }
  function empty(warn) { return { rows: [], people: [], shape: null, offDays: [], untimed: [], total: 0, outOfRange: 0, warn: warn }; }
  function dedupeDays(list) {
    var had = {}, out = [];
    list.forEach(function (x) { if (!had[x.date]) { had[x.date] = 1; out.push(x); } });
    out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return out;
  }

  /* How a row reads on the event: "Sarah 12:00-20:00 · Tom 09:00-17:00", or '' if you are on
     your own. The calendar keeps one line of text for who you are with. */
  function withLabel(row) {
    return (row.with || []).map(function (w) { return w.name + ' ' + w.start + '-' + w.end; }).join(' · ');
  }

  root.RotaImport = {
    parse: parse, withLabel: withLabel,
    backDays: BACK_DAYS, aheadDays: AHEAD_DAYS,
    _readDate: readDate, _readTimes: readTimes, _isMe: isMe, _cells: cells, _overlaps: overlaps, _toKey: toKey
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RotaImport;
})(typeof window !== 'undefined' ? window : this);
