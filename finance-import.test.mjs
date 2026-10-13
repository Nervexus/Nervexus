/* Standalone test suite for finance-import.js. No framework, no install:
     node finance-import.test.mjs
   Exits non-zero on failure.

   Dates are the whole point of this feature, so `today` is injected rather than read from the
   clock — otherwise the suite would pass in August and fail in September. */
import fs from 'fs';
const root = {};
new Function('window', fs.readFileSync(new URL('./finance-import.js', import.meta.url), 'utf8'))(root);
const FI = root.FinanceImport;

const TODAY = '2026-08-28';                 // a Friday
const CATS = ['Food', 'Transport', 'Housing', 'Bills', 'Subscriptions', 'Shopping', 'Health', 'Entertainment', 'Other'];
const parse = (text, opts) => FI.parse(text, { today: TODAY, categories: CATS, ...(opts || {}) });
const one = (text, opts) => { const r = parse(text, opts); if (r.length !== 1) throw new Error('expected 1 row, got ' + r.length + ': ' + JSON.stringify(r)); return r[0]; };

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' got ' + JSON.stringify(a) + ' want ' + JSON.stringify(b)); };

// ---- amounts ----
t('reads a plain "name amount" line', () => {
  const r = one('Tesco 42.50');
  eq([r.label, r.amount, r.type], ['Tesco', 42.5, 'expense']);
});
t('currency marks are stripped', () => {
  eq(one('Coffee £3.20').amount, 3.2);
  eq(one('Coffee $3.20').amount, 3.2);
  eq(one('Coffee €3.20').amount, 3.2);
});
t('thousands separators are read', () => { eq(one('Rent 1,250').amount, 1250); });
t('takes the LAST number, so a quantity does not become the amount', () => {
  const r = one('2 coffees 6.40');
  eq(r.amount, 6.4, '"2 coffees 6.40"');
});
t('lines with no amount are skipped, not guessed', () => { eq(parse('just a note\n---\n').length, 0); });
t('a zero or negative amount is skipped', () => { eq(parse('Refund 0\nThing 0.00').length, 0); });

// ---- income vs expense ----
t('defaults to expense', () => { eq(one('Amazon 24.99').type, 'expense'); });
t('income keywords flip the type', () => {
  for (const s of ['Salary 2400', 'Invoice paid 800', 'Freelance work 350', 'Dividend 42', 'Refund 19.99'])
    eq(one(s).type, 'income', JSON.stringify(s));
});
t('a leading + or - overrides the keywords', () => {
  eq(one('+2400 salary').type, 'income');
  eq(one('-950 salary sacrifice').type, 'expense', 'explicit minus must win over the word salary');
});
t('a minus sign is not mistaken for a bullet', () => {
  const r = parse('- Tesco 42.50\n- Coffee 3.20');
  eq(r.length, 2);
  eq([r[0].label, r[1].label], ['Tesco', 'Coffee'], 'bullets should not eat the label');
});

// ---- dates: the reason this feature exists ----
t('no date on the line takes the batch default', () => {
  const r = one('Tesco 42.50', { defaultDate: '2026-08-20' });
  eq([r.date, r.dated], ['2026-08-20', false]);
});
t('"today" and "yesterday"', () => {
  eq(one('today Tesco 12').date, TODAY);
  eq(one('yesterday petrol 60').date, '2026-08-27');
});
t('"N days ago"', () => {
  eq(one('3 days ago Amazon 24.99').date, '2026-08-25');
  eq(one('1 day ago milk 2').date, '2026-08-27');
});
t('"12 Aug" and "Aug 12"', () => {
  eq(one('12 Aug Rent 950').date, '2026-08-12');
  eq(one('Aug 12 Rent 950').date, '2026-08-12');
  eq(one('12th August Rent 950').date, '2026-08-12');
});
t('a month/day with no year resolves backwards, never into the future', () => {
  // A date this year but still ahead of today must go back a year, not forward. 30 Aug is two
  // days after "today", so it resolves to last August — and is then clamped into the window,
  // which is the correct combination of the two rules rather than a future date sneaking in.
  const r = one('30 Aug Gift 40');
  if (r.date > TODAY) throw new Error('resolved forwards into the future: ' + r.date);
  eq(r.date, '2026-07-30', 'last-August resolution, then clamped to the window edge');
  if (!/older than 30 days/.test(r.note)) throw new Error('clamp was silent');
  // And one comfortably inside the window is left exactly where it was written.
  eq(one('5 Aug Gift 40').date, '2026-08-05');
  if (one('5 Aug Gift 40').note) throw new Error('an in-window date should not be flagged');
});
t('slash dates are day-first', () => {
  eq(one('12/08 Rent 950').date, '2026-08-12');
  eq(one('12/08/2026 Rent 950').date, '2026-08-12');
});
t('a bare weekday means the most recent one past', () => {
  eq(one('Mon coffee 3').date, '2026-08-24', 'Monday before Fri 28 Aug');
  eq(one('Fri coffee 3').date, '2026-08-21', 'today is Friday, so the last Friday is a week back');
});
t('a date on the line beats the batch default', () => {
  eq(one('yesterday petrol 60', { defaultDate: '2026-08-01' }).date, '2026-08-27');
});
t('anything older than 30 days is clamped, and says so', () => {
  const r = one('1 Jan Rent 950');
  eq(r.date, '2026-07-30', 'clamped to the 30-day window');
  if (!/older than 30 days/.test(r.note)) throw new Error('no explanation: ' + JSON.stringify(r.note));
});
t('the window is exactly 30 days and its edge is inclusive', () => {
  eq(FI.days(TODAY).length, 30);
  eq(FI.days(TODAY)[0], TODAY);
  eq(FI.days(TODAY)[29], '2026-07-30');
  eq(one('29 days ago thing 5').date, '2026-07-30', 'the oldest day must survive unclamped');
  if (one('29 days ago thing 5').note) throw new Error('the edge day should not be flagged');
});
t('a future date is pulled back to today', () => {
  const r = one('12/08 Rent 950', { defaultDate: '2026-08-28' });
  if (r.date > TODAY) throw new Error('future date survived: ' + r.date);
});

// ---- dates as an existing log actually writes them ----
t('ISO dates, the format an export uses', () => {
  eq(one('2026-08-12 Tesco 42.50').date, '2026-08-12');
  eq(one('2026-08-12,Tesco,42.50').date, '2026-08-12');
  eq(one('2026-08-12 Tesco 42.50').label, 'Tesco', 'the date must not survive in the label');
});
t('dash-separated day-first dates', () => {
  eq(one('12-08-2026 Tesco 42.50').date, '2026-08-12');
  eq(one('12-08 Tesco 42.50').date, '2026-08-12');
});
t('a date at the END of the line is found too', () => {
  eq(one('Tesco 42.50 12/08').date, '2026-08-12');
  eq(one('Tesco 42.50 yesterday').date, '2026-08-27');
  eq(one('Tesco 42.50 12 Aug').date, '2026-08-12');
  eq(one('Tesco 42.50 12/08').amount, 42.5, 'the amount must survive a trailing date');
  eq(one('Tesco 42.50 12/08').label, 'Tesco');
});
// The reason '.' is not a date separator: it is a decimal point far more often.
t('a decimal amount is never mistaken for a date', () => {
  const r = one('42.50 Tesco');
  eq([r.label, r.amount], ['Tesco', 42.5], '"42.50 Tesco" was being dropped entirely');
  eq(one('Lunch 12.08').amount, 12.08, '12.08 is twelve pounds eight, not 12 August');
  eq(one('Lunch 12.08').dated, false);
});
t('an impossible day or month is not a date', () => {
  eq(one('Thing 45/99 20').amount, 20);
  if (one('Thing 45/99 20').dated) throw new Error('45/99 was accepted as a date');
});

// ---- categories ----
t('a category the user actually has, named in the line, wins', () => {
  eq(one('Cinema tickets Entertainment 24').cat, 'Entertainment');
});
t('guesses from the merchant when no category is named', () => {
  eq(one('Tesco 42.50').cat, 'Food');
  eq(one('Shell petrol 60').cat, 'Transport');
  eq(one('Rent 950').cat, 'Housing');
  eq(one('Netflix 12.99').cat, 'Subscriptions');
  eq(one('Boots prescription 9.90').cat, 'Health');
});
t('income gets income categories, not expense ones', () => {
  eq(one('Salary 2400').cat, 'Salary');
  eq(one('Freelance invoice 800').cat, 'Freelance');
  eq(one('Dividend 42').cat, 'Investment');
});
t('an unknown expense falls back to Other, not to a wrong guess', () => {
  eq(one('Blorpco 15').cat, 'Other');
});
t('a removed category is never suggested', () => {
  const r = one('Cinema 24', { categories: ['Food', 'Other'] });
  if (r.cat === 'Entertainment') throw new Error('suggested a category the user has deleted');
});

// ---- labels ----
t('the amount and currency are not left in the label', () => {
  for (const s of ['Tesco £42.50', '£42.50 Tesco', 'Tesco 42.50'])
    eq(one(s).label, 'Tesco', JSON.stringify(s));
});
t('the date is not left in the label', () => {
  eq(one('12 Aug Rent 950').label, 'Rent');
  eq(one('yesterday petrol 60').label, 'Petrol');
});
t('a line that is only a date and an amount still gets a usable label', () => {
  eq(one('yesterday 42.50').label, 'Expense');
  eq(one('+2400').label, 'Income');
});

// ---- a real paste ----
t('a full week pasted in one go', () => {
  const rows = parse([
    'Mon  Tesco 42.50',
    'Tue  Shell petrol 60',
    '  ',
    'Wed  Netflix 12.99',
    'Thu  Boots 9.90',
    'yesterday  lunch 8.40',
    '+2400 Salary',
    '25/08 Rent 950'
  ].join('\n'), { defaultDate: TODAY });
  eq(rows.length, 7, 'blank line should be skipped');
  eq(rows.filter(r => r.type === 'income').length, 1);
  eq(rows.map(r => r.cat), ['Food', 'Transport', 'Subscriptions', 'Health', 'Food', 'Salary', 'Housing']);
  if (rows.some(r => !/^\d{4}-\d{2}-\d{2}$/.test(r.date))) throw new Error('a row came back without a valid date');
  if (rows.some(r => r.date > TODAY)) throw new Error('a row is in the future');
});

let pass = 0, fail = 0;
for (const [n, f] of T) { try { await f(); console.log('  PASS  ' + n); pass++; } catch (e) { console.log('  FAIL  ' + n + ' :: ' + e.message); fail++; } }
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
