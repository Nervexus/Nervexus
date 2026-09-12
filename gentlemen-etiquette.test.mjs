/* The Gentlemen's Centre content:  node gentlemen-etiquette.test.mjs

   The subject matter, the dress code and the dining manners are the owner's own words and are
   held here as data. The interesting part is the daily test: one question a day, drawn across
   every category, and the same question all day on every device — a test you can reroll
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


t('dining covers the meal from sitting down to the last glass', async () => {
  eq(G.DINING.map(d => d.key).join(','), 'before,cutlery,table,conduct,wine', 'wrong dining sections');
  const all = G.DINING.flatMap(d => d.lines).join(' ');
  for (const phrase of ['Napkin on your lap', 'outside in', 'four o’clock', 'broken by hand',
                        'travel together', 'No phones at the table', 'by the stem'])
    ok(all.includes(phrase), 'the dining line about "' + phrase + '" is missing');
});

t('every line is its own card, with its heading carried on it', async () => {
  /* One concept per card, and the section's heading rides along rather than being a card of
     its own — "peak lapel or shawl collar" must never be read without "Black Tie" above it. */
  for (const s of G.SUBJECTS) {
    const c = G.cards(s.key);
    eq(c.length, s.lines.length, s.key + ' should be one card per line');
    c.forEach((card, i) => {
      eq(card.text, s.lines[i], s.key + ' card ' + i + ' has the wrong line');
      eq(card.title, s.name, s.key + ' card ' + i + ' lost its heading');
      ok(card.eyebrow, s.key + ' card ' + i + ' lost its eyebrow');
    });
  }
  /* Pacing over density, deliberately: dining's five sections are eighteen cards. */
  const dining = G.cards('dining');
  eq(dining.length, G.DINING.reduce((a, d) => a + d.lines.length, 0), 'dining should be one card per line');
  ok(dining.length > 15, 'only ' + dining.length + ' dining cards — that is still a reference, not a read');

  const napkin = dining.find(c => /Napkin on your lap/.test(c.text));
  ok(napkin, 'the napkin rule is missing');
  eq(napkin.title, 'Before the Meal', 'it must carry the section it belongs to');
});

t('a card knows where it is, in its section and in the deck', async () => {
  for (const key of ['money', 'dining']) {
    const c = G.cards(key);
    c.forEach((card, i) => {
      eq(card.n, i + 1, key + ': card ' + i + ' is numbered wrongly in the deck');
      eq(card.of, c.length, key + ': card ' + i + ' has the wrong deck total');
      ok(card.step >= 1 && card.step <= card.steps, key + ': card ' + i + ' has a bad step ' + card.step + '/' + card.steps);
    });
  }
  const dining = G.cards('dining');
  eq(dining[0].step, 1, 'the first card of the first section');
  eq(dining[0].steps, 3, 'before the meal has three rules');
  eq(dining[3].step, 1, 'the fourth card starts the second section');
  eq(dining[3].title, 'Cutlery', 'and that section is cutlery');
});

t('a card deck for something that is not a page is empty, not broken', async () => {
  eq(G.cards('test').length, 0, 'the daily test is not a card deck');
  eq(G.cards('nonsense').length, 0, 'an unknown key');
  eq(G.cards('').length, 0, 'an empty key');
});

/* ---- the daily set ---------------------------------------------------------------------- */
t('the day deals one question from each category', async () => {
  for (const d of days(30)) {
    const set = G.dailySet(d);
    eq(set.length, G.CATEGORIES.length, d + ' dealt ' + set.length + ' questions');
    eq(new Set(set.map(q => q.cat)).size, G.CATEGORIES.length, d + ' repeated a category');
    for (const q of set) {
      eq(q.options.length, 4, d + ': four options');
      ok(q.correct >= 0 && q.correct < 4, d + ': the answer index is out of range');
      ok(q.why && q.q, d + ': a question is missing its text or its reason');
    }
  }
});

t('the same day deals the same four, every time', async () => {
  for (const d of days(20)) {
    const a = G.dailySet(d), b = G.dailySet(d);
    eq(JSON.stringify(a), JSON.stringify(b), d + ' dealt a different set the second time');
  }
});

t('the order of the categories moves too', async () => {
  /* A test that always opens on Events is a rotation wearing a different hat. */
  const first = new Set(days(40).map(d => G.dailySet(d)[0].cat));
  eq(first.size, G.CATEGORIES.length, 'only ' + first.size + ' categories ever come first');
});

t('the four are not the same four every day', async () => {
  const sigs = days(30).map(d => G.dailySet(d).map(q => q.q).sort().join('|'));
  ok(new Set(sigs).size > 20, 'only ' + new Set(sigs).size + ' distinct sets in thirty days');
});

t('a shuffled option really is its question’s own', async () => {
  for (const d of days(30)) {
    for (const q of G.dailySet(d)) {
      const src = G.QUESTIONS.find(x => x.q === q.q);
      ok(src, d + ': ' + q.q + ' is not in the bank');
      eq(q.options.slice().sort().join('|'), src.a.slice().sort().join('|'), d + ': the options are not the source options');
      eq(q.options[q.correct], src.a[src.c], d + ': the correct index does not point at the correct answer');
    }
  }
});

t('the single-question draw still works, and is the first of the set', async () => {
  for (const d of days(10)) {
    const q = G.dailyQuestion(d);
    eq(JSON.stringify(q), JSON.stringify(G.dailySet(d)[0]), d + ': the single draw drifted from the set');
  }
});

t('every question has four answers, one right, and a reason', async () => {
  ok(G.QUESTIONS.length >= 20, 'only ' + G.QUESTIONS.length + ' questions');
  for (const q of G.QUESTIONS) {
    eq(q.a.length, 4, 'wrong number of options: ' + q.q);
    ok(G.CATEGORIES.includes(q.cat), 'unknown category ' + q.cat + ' on: ' + q.q);
    ok(q.c >= 0 && q.c < 4, 'the answer index is out of range: ' + q.q);
    ok(q.why && q.why.length > 30, 'no reason given, or too thin a one: ' + q.q);
    eq(new Set(q.a).size, 4, 'two options are identical: ' + q.q);
  }
});

t('every category is drawn from', async () => {
  const seen = {};
  G.QUESTIONS.forEach(q => { seen[q.cat] = (seen[q.cat] || 0) + 1; });
  for (const c of G.CATEGORIES) ok(seen[c] >= 5, c + ' has only ' + (seen[c] || 0) + ' questions');
});

t('the right answer is not always the first button', async () => {
  /* It is written first in the source. Without shuffling, the test is answerable without
     reading it. */
  const spread = {};
  days(120).forEach(d => G.dailySet(d).forEach(q => { spread[q.correct] = (spread[q.correct] || 0) + 1; }));
  eq(Object.keys(spread).length, 4, 'the answer only ever lands in ' + Object.keys(spread).length + ' positions');
  for (const k of Object.keys(spread)) ok(spread[k] > 40, 'position ' + k + ' only came up ' + spread[k] + ' times in 480 questions');
});

t('a missing or odd date does not throw', async () => {
  for (const d of ['', null, undefined, 'not-a-date', '2026-02-30']) {
    const q = G.dailyQuestion(d);
    ok(q && q.q, 'it should still deal a question for ' + JSON.stringify(d));
  }
});











/* ---- the slot a supplied photograph drops into --------------------------------------------
   The drawings are a floor. When real images arrive each one gets a path here and takes over
   for that occasion. These hold the slot honest: no path without a file behind it, and no path
   pointing at an occasion that does not exist. */



let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
