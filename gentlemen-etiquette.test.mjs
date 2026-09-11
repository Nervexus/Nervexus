/* The Gentlemen's Centre content:  node gentlemen-etiquette.test.mjs

   The subject matter, the dress code and the dining manners are the owner's own words and are
   held here as data. The interesting part is the daily test: one question a day, drawn across
   all four categories, and the same question all day on every device — a test you can reroll
   by reloading is not a test. */
import fs from 'fs';
const root = {};
new Function('window', fs.readFileSync('./gentlemen-etiquette.js', 'utf8'))(root);
const G = root.GentlemenEtiquette;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };
const days = (n, from = '2026-09-11') => {
  const out = []; const d = new Date(from + 'T12:00:00');
  for (let i = 0; i < n; i++) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
};

t('the five subject areas are all there, in the owner’s words', async () => {
  eq(G.SUBJECTS.map(s => s.key).join(','), 'money,history,taste,conversation,foundation', 'wrong subjects');
  for (const s of G.SUBJECTS) {
    ok(s.name && s.eyebrow, s.key + ' is missing a name or eyebrow');
    ok(s.lines.length >= 3, s.key + ' has only ' + s.lines.length + ' lines');
  }
  const all = G.SUBJECTS.flatMap(s => s.lines).join(' ');
  for (const phrase of ['not just headlines', 'rise and fall of empires', 'genuine palate',
                        'Knowing when to say nothing', 'rarely try to'])
    ok(all.includes(phrase), 'the line about "' + phrase + '" is missing');
});

t('the dress code covers every occasion, black tie to home', async () => {
  eq(G.DRESS.length, 6, 'six occasions were specified');
  eq(G.DRESS.map(d => d.key).join(','), 'black-tie,business-formal,business-smart,smart-casual,day-to-day,home', 'wrong occasions');
  for (const d of G.DRESS) ok(d.lines.length >= 3, d.key + ' has only ' + d.lines.length + ' lines');
  const all = G.DRESS.flatMap(d => d.lines).join(' ');
  for (const phrase of ['midnight blue', 'Peak lapel or shawl collar', 'solid navy or charcoal',
                        'Odd jacket', 'nothing sloppy', 'No graphic tees'])
    ok(all.includes(phrase), 'the dress line about "' + phrase + '" is missing');
});

t('dining covers the meal from sitting down to the last glass', async () => {
  eq(G.DINING.map(d => d.key).join(','), 'before,cutlery,table,conduct,wine', 'wrong dining sections');
  const all = G.DINING.flatMap(d => d.lines).join(' ');
  for (const phrase of ['Napkin on your lap', 'outside in', 'four o’clock', 'broken by hand',
                        'travel together', 'No phones at the table', 'by the stem'])
    ok(all.includes(phrase), 'the dining line about "' + phrase + '" is missing');
});

t('every question has four answers, one right, and a reason', async () => {
  ok(G.QUESTIONS.length >= 30, 'only ' + G.QUESTIONS.length + ' questions');
  for (const q of G.QUESTIONS) {
    eq(q.a.length, 4, 'wrong number of options: ' + q.q);
    ok(G.CATEGORIES.includes(q.cat), 'unknown category ' + q.cat + ' on: ' + q.q);
    ok(q.c >= 0 && q.c < 4, 'the answer index is out of range: ' + q.q);
    ok(q.why && q.why.length > 30, 'no reason given, or too thin a one: ' + q.q);
    eq(new Set(q.a).size, 4, 'two options are identical: ' + q.q);
  }
});

t('all four categories are drawn from', async () => {
  const seen = {};
  G.QUESTIONS.forEach(q => { seen[q.cat] = (seen[q.cat] || 0) + 1; });
  for (const c of G.CATEGORIES) ok(seen[c] >= 5, c + ' has only ' + (seen[c] || 0) + ' questions');
});

t('the same day gives the same question, every time', async () => {
  /* The whole point of seeding by the date: reloading must not deal a new hand. */
  for (const d of days(20)) {
    const a = G.dailyQuestion(d), b = G.dailyQuestion(d);
    eq(a.index, b.index, d + ' gave two different questions');
    eq(a.options.join('|'), b.options.join('|'), d + ' shuffled the options differently');
    eq(a.correct, b.correct, d + ' moved the correct answer');
  }
});

t('consecutive days are not consecutive questions', async () => {
  /* "Not a fixed rotation" — a day-number modulo would walk the list in order. */
  const idx = days(30).map(d => G.dailyQuestion(d).index);
  let inOrder = 0;
  for (let i = 1; i < idx.length; i++) if (idx[i] === (idx[i - 1] + 1) % G.QUESTIONS.length) inOrder++;
  ok(inOrder <= 3, 'the questions are walking the list in order (' + inOrder + ' of ' + (idx.length - 1) + ' steps)');
});

t('a month of days reaches every category', async () => {
  const cats = new Set(days(60).map(d => G.dailyQuestion(d).cat));
  for (const c of G.CATEGORIES) ok(cats.has(c), c + ' never came up in sixty days');
});

t('the right answer is not always the first button', async () => {
  /* It is written first in the source. Without shuffling, the test is answerable without
     reading it. */
  const spread = {};
  days(120).forEach(d => { const q = G.dailyQuestion(d); spread[q.correct] = (spread[q.correct] || 0) + 1; });
  eq(Object.keys(spread).length, 4, 'the answer only ever lands in ' + Object.keys(spread).length + ' positions');
  for (const k of Object.keys(spread)) ok(spread[k] > 8, 'position ' + k + ' only came up ' + spread[k] + ' times in 120 days');
});

t('the shuffled options really are the question’s own', async () => {
  for (const d of days(40)) {
    const q = G.dailyQuestion(d), src = G.QUESTIONS[q.index];
    eq(q.options.slice().sort().join('|'), src.a.slice().sort().join('|'), d + ': the options are not the source options');
    eq(q.options[q.correct], src.a[src.c], d + ': the correct index does not point at the correct answer');
    eq(q.cat, src.cat, d + ': the category does not match');
  }
});

t('a missing or odd date does not throw', async () => {
  for (const d of ['', null, undefined, 'not-a-date', '2026-02-30']) {
    const q = G.dailyQuestion(d);
    ok(q && q.q, 'it should still deal a question for ' + JSON.stringify(d));
  }
});

let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
