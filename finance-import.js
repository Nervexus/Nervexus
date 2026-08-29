/* Finance bulk import — turns pasted lines into reviewable income/expense rows.

   Deliberately a pure parser in its own file: no DOM, no network, no state. That makes it
   testable outside the browser (finance-import.test.mjs) rather than being another few hundred
   lines buried in index.html that can only be checked by clicking.

   Local only, on purpose. The workout importer originally leaned on an AI provider and failed
   outright when the key hit a quota; this one never calls anything, so it works with no key
   connected — which is the state the app is actually in.

   The whole point of the feature is backdating: you sit down on Sunday and enter the week. So a
   date written in the line wins, a batch default fills the rest, and anything older than the
   window is clamped rather than silently accepted. */
(function (root) {
  /* Idempotent — every engine <script> in index.html lives inside <helmet>, which the framework
     relocates into <head> at runtime, running it a second time. Harmless for a stateless parser,
     but the guard costs one line and a second parse of this file buys nothing. */
  if (root.FinanceImport) return;

  var WINDOW_DAYS = 30;

  /* Short and full forms both spelled out rather than prefix-matched: matching the first three
     letters would read "12 Marathon" as 12 March. */
  var MONTHS = {
    jan:0, january:0, feb:1, february:1, mar:2, march:2, apr:3, april:3, may:4,
    jun:5, june:5, jul:6, july:6, aug:7, august:7, sep:8, sept:8, september:8,
    oct:9, october:9, nov:10, november:10, dec:11, december:11
  };
  var DOW = { sun:0, sunday:0, mon:1, monday:1, tue:2, tues:2, tuesday:2, wed:3, weds:3, wednesday:3,
              thu:4, thur:4, thurs:4, thursday:4, fri:5, friday:5, sat:6, saturday:6 };

  /* Words that make a line income. Everything else is an expense: most lines people paste are
     money going out, and guessing "expense" wrong is easier to spot in review than the reverse. */
  var INCOME_RE = /\b(?:income|salary|salaries|wage|wages|paid|payment in|invoice|invoiced|freelance|refund|refunded|rebate|dividend|dividends|bonus|commission|sold|sale|cashback|interest|payout)\b/i;

  /* Category guesses, tried in order. Only used when the line names no known category itself. */
  var CATEGORY_HINTS = [
    ['Food',          /\b(?:tesco|sainsbury|asda|aldi|lidl|morrison|waitrose|co.?op|grocer|groceries|food|lunch|dinner|breakfast|coffee|costa|starbucks|pret|greggs|mcdonald|takeaway|deliveroo|uber ?eats|just ?eat|restaurant|cafe|pub|drinks)\b/i],
    ['Transport',     /\b(?:petrol|diesel|fuel|shell|bp\b|esso|train|rail|bus|tube|oyster|uber|bolt|taxi|cab|parking|toll|mot\b|car ?insurance|road ?tax|congestion)\b/i],
    ['Housing',       /\b(?:rent|mortgage|landlord|deposit|service ?charge|ground ?rent|council ?tax)\b/i],
    ['Bills',         /\b(?:electric|electricity|gas|water|energy|octopus|british ?gas|edf|eon|broadband|internet|wifi|phone|mobile|o2\b|vodafone|ee\b|three|sky\b|virgin|bill|bills)\b/i],
    ['Subscriptions', /\b(?:subscription|netflix|spotify|disney|prime|amazon ?prime|icloud|dropbox|adobe|gym ?member|membership|patreon|youtube ?premium|apple ?one)\b/i],
    ['Shopping',      /\b(?:amazon|ebay|argos|ikea|clothes|clothing|shoes|asos|zara|h&m|next\b|primark|shopping|gift|gifts)\b/i],
    ['Health',        /\b(?:pharmacy|boots|chemist|dentist|dental|doctor|gp\b|optician|glasses|prescription|physio|therapy|supplement|protein|vitamins?)\b/i],
    ['Entertainment', /\b(?:cinema|film|movie|concert|gig|theatre|game|games|steam|playstation|xbox|nintendo|book|books|night ?out|holiday|hotel|flight|flights)\b/i]
  ];
  var INCOME_CATEGORY_HINTS = [
    ['Salary',     /\b(?:salary|wage|wages|payslip|paye|monthly pay)\b/i],
    ['Freelance',  /\b(?:freelance|contract|invoice|invoiced|client|gig work)\b/i],
    ['Business',   /\b(?:business|sales|sold|revenue|takings)\b/i],
    ['Investment', /\b(?:dividend|dividends|interest|shares|stocks|crypto|isa\b)\b/i],
    ['Gift',       /\b(?:gift|birthday|present|christmas)\b/i]
  ];

  function toKey(d) {
    // Local calendar date, never toISOString — that shifts the day for anyone behind UTC and
    // would file an evening entry against tomorrow.
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fromKey(key) { var p = String(key).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); }
  function shift(base, days) { var d = fromKey(base); d.setDate(d.getDate() - days); return toKey(d); }

  /* Try to read a date out of one end of the line and hand back the rest of it.

     Anchored deliberately: a date leads the line or trails it, and nothing in between is
     treated as one — otherwise every stray number in a description becomes a candidate.

     '.' is NOT a separator here even though "12.08.2026" is a real convention, because in a
     money log a dot is a decimal point far more often than a date separator: it was reading
     "42.50 Tesco" as day 42 of month 50, producing an invalid date, eating the amount and
     dropping the row entirely. '/' and '-' cover how people actually type dates in a log. */
  function dateAt(text, todayKey, atEnd) {
    var today = fromKey(todayKey);
    // Each entry: [regex without anchors, resolver]. `\s*` padding is added per anchor below.
    var pats = [
      [/(today)/i,                                    function () { return todayKey; }],
      [/(yesterday|yday)/i,                           function () { return shift(todayKey, 1); }],
      [/(\d{1,2})\s*(?:days?|d)\s*ago/i,              function (m) { return shift(todayKey, +m[1]); }],
      // ISO first — an export writes 2026-08-12, and it must not be read as day 20.
      [/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,        function (m) { return ymd(+m[1], +m[2], +m[3]); }],
      [/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})/i,   function (m) { var mo = MONTHS[m[2].toLowerCase()]; return mo == null ? null : resolveMonthDay(+m[1], mo, today); }],
      [/([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?/i,   function (m) { var mo = MONTHS[m[1].toLowerCase()]; return mo == null ? null : resolveMonthDay(+m[2], mo, today); }],
      [/(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{2,4}))?/,  function (m) {
        var day = +m[1], mon = +m[2];
        if (day < 1 || day > 31 || mon < 1 || mon > 12) return null;   // "45/99" is not a date
        if (m[3]) return ymd(+m[3] < 100 ? 2000 + +m[3] : +m[3], mon, day);
        var d = new Date(today.getFullYear(), mon - 1, day, 12, 0, 0);
        if (d.getTime() > today.getTime()) d.setFullYear(today.getFullYear() - 1);
        return toKey(d);
      }],
      [/([a-z]{3,9})/i, function (m) {
        var w = DOW[m[1].toLowerCase()];
        if (w == null) return null;
        var back = (today.getDay() - w + 7) % 7;
        return shift(todayKey, back === 0 ? 7 : back);
      }]
    ];
    for (var i = 0; i < pats.length; i++) {
      var re = atEnd ? new RegExp('[\\s,:-]+(?:' + pats[i][0].source + ')\\s*$', pats[i][0].flags)
                     : new RegExp('^\\s*(?:' + pats[i][0].source + ')\\b[\\s,:-]*', pats[i][0].flags);
      var m = re.exec(text);
      if (!m) continue;
      var key = pats[i][1](m);
      if (!key) continue;                              // matched the shape but not a real date
      var rest = atEnd ? text.slice(0, m.index) : text.slice(m[0].length);
      return { date: key, rest: rest };
    }
    return null;
  }

  /* A date leads the line or trails it. Leading is tried first because that is how a log is
     usually written; trailing catches the exports and notes that put it last. */
  function extractDate(line, todayKey) {
    return dateAt(line, todayKey, false) || dateAt(line, todayKey, true) || { date: null, rest: line };
  }

  function ymd(y, mo, d) {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return toKey(new Date(y, mo - 1, d, 12, 0, 0));
  }

  /* A month/day with no year is the most recent one that has already happened — "12 Aug" typed
     in January means last August, not a date eleven months in the future. */
  function resolveMonthDay(day, month, today) {
    var d = new Date(today.getFullYear(), month, day, 12, 0, 0);
    if (d.getTime() > today.getTime()) d.setFullYear(today.getFullYear() - 1);
    return toKey(d);
  }

  function pickCategory(text, isIncome, categories) {
    // A category the user actually has, named in the line, always wins over a guess.
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      if (new RegExp('\\b' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text)) return c;
    }
    /* A guess is only allowed to name a category that still exists. Suggesting "Entertainment"
       to someone who deleted it puts a row in the review table they cannot accept as-is. */
    var have = {}; categories.forEach(function (c) { have[c.toLowerCase()] = c; });
    var hints = isIncome ? INCOME_CATEGORY_HINTS : CATEGORY_HINTS;
    for (var j = 0; j < hints.length; j++) {
      if (hints[j][1].test(text) && have[hints[j][0].toLowerCase()]) return have[hints[j][0].toLowerCase()];
    }
    return isIncome ? 'Salary' : (have['other'] || categories[0] || 'Other');
  }

  function cleanLabel(s, amountText) {
    var out = String(s || '');
    if (amountText) out = out.replace(amountText, ' ');
    return out
      .replace(/[£$€]/g, ' ')
      .replace(/^[\s,:;\-–—+]+|[\s,:;\-–—+]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /* text -> rows. `opts.today` is the reference day (a YYYY-MM-DD key, injectable for tests),
     `opts.defaultDate` the batch day chosen in the UI, `opts.categories` the user's real expense
     categories. Every row comes back with a reason when something about it needs a human look. */
  function parse(text, opts) {
    opts = opts || {};
    var todayKey = opts.today || toKey(new Date());
    var defaultDate = opts.defaultDate || todayKey;
    var categories = (opts.categories && opts.categories.length ? opts.categories : []).concat(
      ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']);
    var earliest = shift(todayKey, WINDOW_DAYS - 1);
    var rows = [];

    String(text || '').split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line || /^[-=_*#]+$/.test(line)) return;

      var sign = /^\s*([+-])\s*(?=[£$€]?\d)/.exec(line);   // only a sign attached to a number
      var forcedIncome = sign && sign[1] === '+';
      var forcedExpense = sign && sign[1] === '-';
      if (sign) line = line.slice(sign[0].length);

      var dt = extractDate(line, todayKey);
      line = dt.rest;

      // Last number in the line with an optional currency mark. Last, not first, so "2 coffees
      // 6.40" reads 6.40 rather than 2.
      /* One alternative, not two. The earlier pair had `\d{1,3}(?:,\d{3})*` first, which matched
         "240" out of "2400" and left "0" as a second match — and since the LAST match wins, a
         £2400 salary parsed as £0 and was dropped as a zero amount. Silent data loss on exactly
         the largest rows. `\d+` first covers both grouped and ungrouped numbers. */
      var amounts = line.match(/[£$€]?\s?\d+(?:,\d{3})*(?:\.\d{1,2})?/g);
      if (!amounts || !amounts.length) return;
      var amountText = amounts[amounts.length - 1];
      var amount = parseFloat(amountText.replace(/[£$€,\s]/g, ''));
      if (!(amount > 0)) return;

      var isIncome = forcedIncome || (!forcedExpense && INCOME_RE.test(line));
      var label = cleanLabel(line, amountText);
      if (!label) label = isIncome ? 'Income' : 'Expense';

      var date = dt.date || defaultDate;
      var note = '';
      if (dt.date && dt.date < earliest) { date = earliest; note = 'older than 30 days — moved to ' + earliest; }
      if (date > todayKey) { date = todayKey; note = 'future date — moved to today'; }

      rows.push({
        type: isIncome ? 'income' : 'expense',
        label: label.charAt(0).toUpperCase() + label.slice(1),
        amount: Math.round(amount * 100) / 100,
        cat: pickCategory(line, isIncome, categories),
        date: date,
        dated: !!dt.date,           // false means it took the batch default
        note: note
      });
    });
    return rows;
  }

  /* The last 30 days as pickable options, newest first — the batch-day selector in the UI and
     the bound on what parse() will accept, from one definition. */
  function days(todayKey) {
    var today = todayKey || toKey(new Date()), out = [];
    for (var i = 0; i < WINDOW_DAYS; i++) out.push(shift(today, i));
    return out;
  }

  root.FinanceImport = { parse: parse, days: days, windowDays: WINDOW_DAYS, _toKey: toKey, _shift: shift };

}(typeof window !== 'undefined' ? window : globalThis));
