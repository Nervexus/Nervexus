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
  /* Pacing over density, deliberately: the six occasions are twenty-two cards. */
  const dress = G.cards('dress');
  eq(dress.length, G.DRESS.reduce((a, d) => a + d.lines.length, 0), 'dress should be one card per line');
  ok(dress.length > 20, 'only ' + dress.length + ' dress cards — that is still a reference, not a read');
  eq(G.cards('dining').length, G.DINING.reduce((a, d) => a + d.lines.length, 0), 'dining too');

  const lapel = dress.find(c => /Peak lapel/.test(c.text));
  ok(lapel, 'the lapel rule is missing');
  eq(lapel.title, 'Black Tie / Formal Evening', 'it must carry the occasion it belongs to');
  eq(lapel.note, 'Evening, invitation-led', 'and the note that says when that applies');
});

t('a card knows where it is, in its section and in the deck', async () => {
  for (const key of ['money', 'dress', 'dining']) {
    const c = G.cards(key);
    c.forEach((card, i) => {
      eq(card.n, i + 1, key + ': card ' + i + ' is numbered wrongly in the deck');
      eq(card.of, c.length, key + ': card ' + i + ' has the wrong deck total');
      ok(card.step >= 1 && card.step <= card.steps, key + ': card ' + i + ' has a bad step ' + card.step + '/' + card.steps);
    });
  }
  const dress = G.cards('dress');
  eq(dress[0].step, 1, 'the first card of the first occasion');
  eq(dress[0].steps, 4, 'black tie has four rules');
  eq(dress[4].step, 1, 'the fifth card starts the second occasion');
  eq(dress[4].title, 'Business Formal', 'and that occasion is business formal');
});

t('a card deck for something that is not a page is empty, not broken', async () => {
  eq(G.cards('test').length, 0, 'the daily test is not a card deck');
  eq(G.cards('nonsense').length, 0, 'an unknown key');
  eq(G.cards('').length, 0, 'an empty key');
});

/* ---- the daily set ---------------------------------------------------------------------- */
t('the day deals four questions, one from each category', async () => {
  for (const d of days(30)) {
    const set = G.dailySet(d);
    eq(set.length, 4, d + ' dealt ' + set.length + ' questions');
    eq(new Set(set.map(q => q.cat)).size, 4, d + ' repeated a category');
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
  eq(first.size, 4, 'only ' + first.size + ' categories ever come first');
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

/* ---- the dress code drawings -------------------------------------------------------------
   A rule about a shape needs the shape. These assert the drawings exist for every occasion,
   that they are only where a shape is actually being described, and that they are line work
   in the theme's own colours rather than something with its own palette baked in — the whole
   reason they are drawn and not photographed. */
t('every dress occasion has a drawing, and every one of its cards carries it', async () => {
  for (const d of G.DRESS) ok(G.art(d.key), 'no drawing for ' + d.key);
  const cards = G.cards('dress');
  eq(cards.filter(c => c.art).length, cards.length, 'some dress cards have no drawing');
  for (const c of cards) ok(G.art(c.art), 'card "' + c.text.slice(0, 30) + '" points at a drawing that is not there');
});

t('the drawing on a card is the drawing for that card’s occasion', async () => {
  const cards = G.cards('dress');
  for (const d of G.DRESS) {
    const mine = cards.filter(c => c.title === d.name);
    eq(mine.length, d.lines.length, d.name + ' has the wrong number of cards');
    for (const c of mine) eq(c.art, d.key, d.name + ' card points at ' + c.art);
  }
});

t('nothing else claims a drawing', async () => {
  for (const key of ['dining', 'money', 'history', 'taste', 'conversation', 'foundation']) {
    for (const c of G.cards(key)) eq(c.art, '', key + ' should carry no drawing');
  }
  eq(G.art('before'), '', 'a dining section resolved to a drawing');
  eq(G.art(''), '', 'an empty key resolved to a drawing');
  eq(G.art('nonsense'), '', 'an unknown key resolved to a drawing');
});

t('the drawings take the theme rather than bringing their own', async () => {
  for (const d of G.DRESS) {
    const svg = G.art(d.key);
    ok(/^<svg /.test(svg) && /<\/svg>$/.test(svg), d.key + ' is not a complete svg');
    ok(/stroke="currentColor"/.test(svg), d.key + ' does not draw in the inherited ink');
    /* A literal colour would survive a raiment change and sit there in last month's palette. */
    const literal = svg.match(/(?:fill|stroke)="(#[0-9a-f]{3,8}|rgb[^"]*|[a-z]+)"/gi) || [];
    const bad = literal.filter(m => !/currentColor|none/i.test(m));
    eq(bad.join(' '), '', d.key + ' has a hard-coded colour: ' + bad.join(' '));
    ok(!/<image|xlink:href|data:image/i.test(svg), d.key + ' embeds a bitmap');
  }
});

t('each occasion is drawn differently from the others', async () => {
  const seen = {};
  for (const d of G.DRESS) {
    const svg = G.art(d.key);
    ok(!seen[svg], d.key + ' is the same drawing as ' + seen[svg]);
    seen[svg] = d.key;
  }
  /* The two the rules actually name apart. A peak lapel turns up toward the shoulder and a
     notch cuts a wedge; if those ever became the same path the drawing would stop teaching
     the one thing it is there to teach. */
  const peak = G.art('black-tie'), notch = G.art('business-formal');
  ok(/M63 22 L52 44 L40 36/.test(peak), 'black tie is not drawn with a peak lapel');
  ok(/M63 22 L53 40 L46 37 L49 46/.test(notch), 'business formal is not drawn with a notch lapel');
  ok(!/L40 36/.test(notch), 'business formal picked up the peak');
  /* No jacket is the whole tell for day-to-day, so neither lapel may appear on it. */
  const day = G.art('day-to-day');
  ok(!/M63 22/.test(day), 'day to day was given a lapel');
});


/* The complaint that produced these: four of the six were a jacket seen from the chest up, and
   at the size they are actually read that is the same drawing four times. What separates the
   middle of the range is not the collar, it is the trousers and the shoes — so every drawing is
   a whole outfit, and these hold it that way. */
t('every drawing is a whole outfit, not a torso', async () => {
  for (const d of G.DRESS) {
    const svg = G.art(d.key);
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
    eq(vb, '0 0 140 260', d.key + ' is not drawn on the full-length field');
    /* Something has to be down at the shoe line, or the figure stops at the waist. */
    ok(/2[34]\d(?:\.\d+)?[ ,]/.test(svg.replace(/viewBox="[^"]+"/, '')) || / 240/.test(svg),
       d.key + ' has nothing drawn below the knee');
    ok(/var\(--art-shoe\)|A_SHOE|M41 224|M34 234/.test(svg), d.key + ' has no shoes');
  }
});

t('the middle of the range is told apart by the trousers, not only by the collar', async () => {
  /* A suit wears the jacket's own cloth below the waist; the odd combination does not. This is
     the difference between business smart and smart casual, and it has to be in the drawing. */
  const legs = k => (G.art(k).match(/M44 126 L41 224 L62 224 L67 150 L67 126 Z" fill="([^"]+)"/) || [])[1];
  eq(legs('black-tie'), 'var(--art-cloth)', 'black tie is not drawn as a matching suit');
  eq(legs('business-formal'), 'var(--art-cloth)', 'business formal is not drawn as a matching suit');
  eq(legs('business-smart'), 'var(--art-cloth)', 'business smart is not drawn as a matching suit');
  eq(legs('smart-casual'), 'var(--art-shirt)', 'smart casual is drawn as a matching suit, which is the one thing it is not');
  ok(legs('smart-casual') !== legs('business-smart'),
     'smart casual and business smart wear the same trousers, so nothing tells them apart below the waist');
});

t('no two of the six share a silhouette', async () => {
  /* Stripped of colour tokens, two drawings that differ only in a token would still look alike.
     Compare the geometry itself. */
  const shape = k => G.art(k).replace(/fill="[^"]*"/g, '').replace(/stroke-opacity="[^"]*"/g, '');
  const seen = {};
  for (const d of G.DRESS) {
    const g = shape(d.key);
    ok(!seen[g], d.key + ' has the same geometry as ' + seen[g]);
    seen[g] = d.key;
  }
  /* And the four jackets each carry something the others do not. */
  ok(/M67 31 L55 24/.test(G.art('black-tie')), 'black tie has no bow tie');
  ok(/M66 38 L74 38/.test(G.art('business-formal')), 'business formal has no tie');
  ok((G.art('business-smart').match(/stroke-opacity="0\.26"/g) || []).length >= 8, 'business smart has no pattern');
  ok(/<rect x="45" y="96"/.test(G.art('smart-casual')), 'smart casual has no patch pockets');
  ok(!/<rect x="45" y="96"/.test(G.art('business-smart')), 'business smart picked up the patch pockets');
});

let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
