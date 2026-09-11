/* The Gentlemen's Centre page:  node gentlemen-page.test.mjs

   gentlemen-etiquette.test.mjs proves the content and the daily draw. This proves the page:
   that all eight subpages render what they claim to, and that the test behaves like a test —
   one answer a day, no second attempt, and a record that survives a reload. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8935;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  /* A clean record every run: these are tests about what a day's answer does, and a browser
     profile carrying yesterday's would decide the answer. */
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'gentlemen', gentSub: 'test',
    prefs: { ...window.__nvx.state.prefs, gentTest: {} },
  }, p || {})), patch || null);
  await page.waitForTimeout(800);
}
const text = () => page.evaluate(() => document.body.innerText);
const tab = (label) => page.evaluate((want) => {
  const el = [...document.querySelectorAll('span')].find(e => e.children.length === 0 && e.textContent.trim() === want);
  if (!el) throw new Error('no tab reading "' + want + '"');
  (el.classList.contains('sc-interp') ? el.parentElement : el).click();
}, label);

const TABS = ['DAILY TEST', 'MONEY & POWER', 'HISTORY & CULTURE', 'TASTE',
              'CONVERSATION', 'FOUNDATION', 'DRESS CODE', 'DINING'];

t('the page opens on the test, with all eight subpages offered', async () => {
  await boot();
  const b = await text();
  for (const label of TABS) ok(b.includes(label), 'no tab for ' + label);
  ok(/DRAWN FROM/.test(b), 'the test is not the page it opens on');
  ok(!/Nothing here yet/.test(b), 'the empty state is still showing');
});

t('every subpage renders its own content', async () => {
  await boot();
  const want = {
    'MONEY & POWER': 'not just headlines',
    'HISTORY & CULTURE': 'rise and fall of empires',
    'TASTE': 'genuine palate',
    'CONVERSATION': 'Knowing when to say nothing',
    'FOUNDATION': 'rarely try to',
    'DRESS CODE': 'midnight blue',
    'DINING': 'No phones at the table',
  };
  for (const label of Object.keys(want)) {
    await tab(label);
    await page.waitForTimeout(350);
    /* One card at a time, so the phrase may be on any of them — step through the deck. */
    let found = false;
    const n = await page.evaluate(() => window.__nvx._gent().cards(window.__nvx.state.gentSub).length);
    for (let i = 0; i < n && !found; i++) {
      if ((await text()).includes(want[label])) { found = true; break; }
      await page.evaluate(() => window.__nvx.gentStep(1));
      await page.waitForTimeout(220);
    }
    ok(found, label + ' did not render its content — looked for "' + want[label] + '" across ' + n + ' cards');
  }
});

t('a page shows one line at a time, with its heading above it', async () => {
  await boot({ gentSub: 'dress' });
  const b = await text();
  ok(b.includes('Black Tie / Formal Evening'), 'the heading should be on the card');
  ok(b.includes('Tuxedo (dinner jacket), black or midnight blue.'), 'and the first rule');
  ok(!b.includes('Peak lapel'), 'the second rule should be on its own card, not this one');
  ok(b.includes('1 OF 22'), 'twenty-two cards, not six: ' + (b.match(/\d+ OF \d+/) || ''));
  ok(/1 of 4 in this section/.test(b), 'and where you are inside the occasion');
});

t('the heading stays put while the rules advance', async () => {
  /* The reason a rule can be one card at all: "peak lapel or shawl collar" is meaningless
     without the occasion above it. */
  await boot({ gentSub: 'dress' });
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__nvx.gentStep(1));
    await page.waitForTimeout(250);
    ok((await text()).includes('Black Tie / Formal Evening'), 'card ' + (i + 2) + ' lost the occasion');
  }
  ok((await text()).includes('Black patent'), 'the fourth rule should be showing');
  await page.evaluate(() => window.__nvx.gentStep(1));
  await page.waitForTimeout(300);
  ok((await text()).includes('Business Formal'), 'the fifth card should start the next occasion');
});

t('every card in the deck is reached, and it ends', async () => {
  await boot({ gentSub: 'dining' });
  const n = await page.evaluate(() => window.__nvx._gent().cards('dining').length);
  ok(n > 15, 'dining should be per-line now, got ' + n + ' cards');
  await page.evaluate((x) => window.__nvx.gentGoto(x - 1), n);
  await page.waitForTimeout(300);
  const b = await text();
  ok(b.includes(n + ' OF ' + n), 'the counter should reach the end');
  ok(b.includes('DONE'), 'the last card should say DONE rather than offer another');
});

t('the deck stops at both ends rather than wrapping', async () => {
  await boot({ gentSub: 'dining' });
  await page.evaluate(() => window.__nvx.gentStep(-1));
  await page.waitForTimeout(250);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 0, 'going back from the first card should stay put');
  const n = await page.evaluate(() => window.__nvx._gent().cards('dining').length);
  await page.evaluate(() => { for (let i = 0; i < 60; i++) window.__nvx.gentStep(1); });
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), n - 1, 'going past the last card should stay on it');
});

t('switching subpage starts the new one at its first card', async () => {
  await boot({ gentSub: 'dress' });
  await page.evaluate(() => { window.__nvx.gentStep(1); window.__nvx.gentStep(1); });
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 2, 'moved to the third card');
  await tab('DINING');
  await page.waitForTimeout(400);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 0, 'the new page should start at the beginning');
  ok((await text()).includes('Before the Meal'), 'and show its first card');
});

t('the arrow keys move through the cards', async () => {
  /* A carousel you have to reach for the mouse to advance is a carousel you stop reading. */
  await boot({ gentSub: 'dress' });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 2, 'right should move forward');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 1, 'left should move back');
});

/* ---- the daily test, as a deck ----------------------------------------------------------- */
const setOf = () => page.evaluate(() => window.__nvx._gent().dailySet(window.__nvx._fbToday()));

t('the test is four questions, one per card', async () => {
  await boot();
  const set = await setOf();
  eq(set.length, 4, 'four questions');
  const b = await text();
  ok(/QUESTION 1 OF 4/.test(b), 'it should say which question you are on: ' + (b.match(/QUESTION \d OF \d/) || ''));
  ok(b.includes(set[0].q), 'the first question should be showing');
  ok(!b.includes(set[1].q), 'the second should not be on the same screen');
});

t('forward is locked until the question in front of you is answered', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.gentTestNext());
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.gentTestIdx), 0, 'it should not advance past an unanswered question');
  const set = await setOf();
  await page.evaluate((i) => window.__nvx.answerGentTest(i), set[0].correct);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.gentTestNext());
  await page.waitForTimeout(350);
  eq(await page.evaluate(() => window.__nvx.state.gentTestIdx), 1, 'answering should unlock the next');
  ok((await text()).includes(set[1].q), 'and show it');
});

t('the whole set can be answered, and ends on a result', async () => {
  await boot();
  const set = await setOf();
  for (let i = 0; i < set.length; i++) {
    await page.evaluate((x) => window.__nvx.answerGentTest(x), set[i].correct);
    await page.waitForTimeout(220);
    await page.evaluate(() => window.__nvx.gentTestNext());
    await page.waitForTimeout(220);
  }
  const b = await text();
  ok(b.includes('4 / 4'), 'the result should be a score: ' + (b.match(/\d \/ \d/) || ''));
  ok(/All four/.test(b), 'and say something about it');
  const rec = await page.evaluate(() => window.__nvx.state.prefs.gentTest[window.__nvx._fbToday()]);
  eq(rec.right, 4, 'all four recorded as right');
  eq(rec.done, true, 'and the day recorded as finished');
});

t('a wrong answer is marked, explained, and cannot be retaken', async () => {
  await boot();
  const set = await setOf();
  const wrong = [0, 1, 2, 3].find(i => i !== set[0].correct);
  await page.evaluate((i) => window.__nvx.answerGentTest(i), wrong);
  await page.waitForTimeout(400);
  const b = await text();
  ok(/NOT QUITE/.test(b), 'a wrong answer should say so');
  ok(b.includes(set[0].why.slice(0, 40)), 'the reason should be shown');
  const marks = await page.evaluate(() => [...document.querySelectorAll('span')]
    .filter(e => e.children.length === 0 && ['✓', '✕'].includes(e.textContent.trim()))
    .map(e => e.textContent.trim()).join(','));
  ok(marks.includes('✓') && marks.includes('✕'), 'both the right answer and the wrong pick should be marked');
  // A second go at the same question must not overwrite it.
  await page.evaluate((i) => window.__nvx.answerGentTest(i), set[0].correct);
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.prefs.gentTest[window.__nvx._fbToday()].picks[0]), wrong,
    'the second attempt overwrote the first');
});

t('stepping back through the set keeps every answer', async () => {
  await boot();
  const set = await setOf();
  for (let i = 0; i < 2; i++) {
    await page.evaluate((x) => window.__nvx.answerGentTest(x), set[i].correct);
    await page.waitForTimeout(200);
    await page.evaluate(() => window.__nvx.gentTestNext());
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => { window.__nvx.gentTestBack(); window.__nvx.gentTestBack(); });
  await page.waitForTimeout(350);
  eq(await page.evaluate(() => window.__nvx.state.gentTestIdx), 0, 'back should reach the first question');
  const b = await text();
  ok(b.includes(set[0].q), 'the first question again');
  ok(/CORRECT/.test(b), 'with the answer it was given still on it');
});

t('the streak counts days the test was finished, not days it was aced', async () => {
  /* It is there to set you right for the day, and finishing it is what does that. Accuracy
     is its own number beside it. */
  const key = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
  await boot();
  await page.evaluate((k) => {
    const log = {};
    log[k[0]] = { picks: [0, 0, 0, 0], right: 4, of: 4, done: true };
    log[k[1]] = { picks: [0, 0, 0, 0], right: 1, of: 4, done: true };   // finished, mostly wrong
    log[k[2]] = { picks: [0, 0, 0, 0], right: 3, of: 4, done: true };
    log[k[3]] = { picks: [0, null, null, null], right: 0, of: 4, done: false };  // abandoned
    window.__nvx.setState({ prefs: { ...window.__nvx.state.prefs, gentTest: log } });
  }, [key(1), key(2), key(3), key(4)]);
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => window.__nvx._gentStreak()), 3, 'three finished days, then the abandoned one stops it');
  /* Today being unanswered must not break a run that is otherwise intact — the day is not
     over yet. */
  ok(/3d/.test(await text()), 'the streak should show as 3d');
});

t('a record from before the test became a set still counts', async () => {
  const key = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
  await boot();
  await page.evaluate((k) => {
    const log = {};
    log[k[0]] = { pick: 2, correct: true, cat: 'History' };     // the old single-answer shape
    log[k[1]] = { pick: 1, correct: false, cat: 'Events' };
    window.__nvx.setState({ prefs: { ...window.__nvx.state.prefs, gentTest: log } });
  }, [key(1), key(2)]);
  await page.waitForTimeout(400);
  eq(await page.evaluate(() => window.__nvx._gentStreak()), 2, 'both old days were answered, so both count');
});

t('nothing threw through any of it', async () => {
  eq(pageErrors.length, 0, 'page errors: ' + pageErrors.slice(0, 5).join(' | '));
});

/* ---- the layout ---------------------------------------------------------------------------
   The subpage row used to be eight loose chips on a wrapping flex line; on a phone it broke
   into a ragged block whose shape changed with the active tab. These hold the row to one box
   and one line at every width, and hold the cards to one ruled frame. */
t('the subpage row is one ruled box, not eight loose chips', async () => {
  await boot();
  const box = await page.evaluate(() => {
    const r = document.querySelector('.cc-gtabs'); if (!r) throw new Error('no subpage row');
    const cs = getComputedStyle(r);
    const tabs = [...r.querySelectorAll('.cc-gtab')];
    return { n: tabs.length, border: cs.borderTopWidth, radius: cs.borderTopLeftRadius,
             /* every tab but the first carries the dividing line */
             divided: tabs.slice(1).every(e => parseFloat(getComputedStyle(e).borderLeftWidth) > 0),
             firstUndivided: parseFloat(getComputedStyle(tabs[0]).borderLeftWidth) === 0,
             rows: new Set(tabs.map(e => Math.round(e.getBoundingClientRect().top))).size };
  });
  eq(box.n, 8, 'the row does not hold all eight subpages');
  ok(parseFloat(box.border) > 0, 'the row has no box around it');
  ok(parseFloat(box.radius) > 0, 'the box is not rounded');
  ok(box.divided, 'the tabs are not divided by lines');
  ok(box.firstUndivided, 'the first tab carries a line it should not');
  eq(box.rows, 1, 'the row wrapped onto ' + box.rows + ' lines');
});

t('the row and its lines are the raiment’s, not a fixed white', async () => {
  for (const [raiment, sub] of [['Ultra X', 'ultraStyle'], ['Maison Élysée', 'ultraStyle']]) {
    await boot({ prefs: { ...(await page.evaluate(() => window.__nvx.state.prefs)), theme: 'Ultra', ultraStyle: raiment } });
    const c = await page.evaluate(() => {
      const r = document.querySelector('.cc-gtabs');
      const on = [...document.querySelectorAll('.cc-gtab')].find(e => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)');
      return { line: getComputedStyle(r).borderTopColor, on: on ? getComputedStyle(on).backgroundColor : null };
    });
    ok(c.on, 'nothing in the row is marked as the page you are on (' + raiment + ')');
    /* The fixed white the row used to wear. If it comes back the box stops belonging to the
       theme, which is the whole point of the change. */
    ok(!/^rgba?\(255, 255, 255/.test(c.line), raiment + ' draws the box in fixed white: ' + c.line);
  }
});

t('every card is a ruled frame: a header band, a body, and the rule between them', async () => {
  for (const sub of ['test', 'money', 'dress', 'dining']) {
    await boot({ gentSub: sub });
    const f = await page.evaluate(() => {
      const card = document.querySelector('.cc-gcard');
      if (!card) return null;
      const head = card.querySelector('.cc-ghead');
      return { border: parseFloat(getComputedStyle(card).borderTopWidth),
               head: !!head, rule: head ? parseFloat(getComputedStyle(head).borderBottomWidth) : 0,
               body: !!card.querySelector('.cc-gbody, .cc-gstats') };
    });
    ok(f, sub + ' has no card at all');
    ok(f.border > 0, sub + ' card has no box around it');
    ok(f.head, sub + ' card has no header band');
    ok(f.rule > 0, sub + ' card header is not ruled off from the body');
    ok(f.body, sub + ' card has no body');
  }
});

t('standing is one ruled panel of four figures, all of them legible', async () => {
  await boot();
  const st = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.cc-gstat')];
    return cells.map(e => ({ text: e.innerText.replace(/\n/g, ' ').trim(),
      top: parseFloat(getComputedStyle(e).borderTopWidth),
      left: parseFloat(getComputedStyle(e).borderLeftWidth) }));
  });
  eq(st.length, 4, 'standing does not show four figures');
  for (const c of st) ok(/\S/.test(c.text) && c.text.split(' ').length > 1, 'a figure has no value: "' + c.text + '"');
  /* One cross rule rather than four floating boxes: the first two carry no top line and the
     left column carries no left line. */
  eq(st[0].top, 0, 'the top row is ruled off from nothing');
  eq(st[1].top, 0, 'the top row is ruled off from nothing');
  ok(st[2].top > 0 && st[3].top > 0, 'the bottom row is not ruled from the top');
  eq(st[0].left, 0, 'the left column carries a line it should not');
  ok(st[1].left > 0 && st[3].left > 0, 'the two columns are not divided');
});

/* ---- the dress code drawings ------------------------------------------------------------- */
t('every dress code card shows the garment it is a rule about', async () => {
  await boot({ gentSub: 'dress' });
  const n = await page.evaluate(() => window.__nvx._gent().cards('dress').length);
  eq(n, 22, 'dress code is not the deck it was');
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    await page.evaluate(x => window.__nvx.gentGoto(x), i);
    await page.waitForTimeout(90);
    const card = await page.evaluate(() => {
      const svg = document.querySelector('.cc-gart svg');
      const title = document.querySelector('.cc-gbody div[style*="26px"]');
      return { marks: svg ? svg.querySelectorAll('path,rect,circle').length : 0,
               key: document.querySelector('[data-dress-art]')?.getAttribute('data-dress-art') || '',
               title: title ? title.innerText.trim() : '' };
    });
    ok(card.marks > 4, 'card ' + (i + 1) + ' has no drawing on it');
    ok(card.key, 'card ' + (i + 1) + ' does not say which occasion it is drawing');
    seen.add(card.key + '|' + card.title);
  }
  /* Six occasions, each drawn once however many rules it carries. */
  eq(new Set([...seen].map(x => x.split('|')[0])).size, 6, 'the six occasions are not six drawings');
});

t('a subject or a dining rule gets no drawing — those are not shapes', async () => {
  for (const sub of ['dining', 'money', 'history', 'taste', 'conversation', 'foundation']) {
    await boot({ gentSub: sub });
    const art = await page.evaluate(() => !!document.querySelector('.cc-gart'));
    ok(!art, sub + ' put a garment drawing next to a rule that is not about one');
    const solo = await page.evaluate(() => !!document.querySelector('.cc-gdress-solo'));
    ok(solo, sub + ' still reserves the column the drawing would have sat in');
  }
});

t('the drawing changes when the occasion does, not when the rule does', async () => {
  await boot({ gentSub: 'dress' });
  const at = async () => page.evaluate(() => document.querySelector('[data-dress-art]').getAttribute('data-dress-art'));
  eq(await at(), 'black-tie', 'dress code does not open on black tie');
  /* Black tie carries four rules; all four are the same garment. */
  for (let i = 1; i < 4; i++) {
    await page.evaluate(() => window.__nvx.gentStep(1));
    await page.waitForTimeout(90);
    eq(await at(), 'black-tie', 'the drawing changed part-way through black tie');
  }
  await page.evaluate(() => window.__nvx.gentStep(1));
  await page.waitForTimeout(120);
  eq(await at(), 'business-formal', 'the drawing did not move on with the occasion');
});

/* ---- the phone ---------------------------------------------------------------------------- */
t('on a phone the subpage row is still one line, and the page does not scroll sideways', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot({ gentSub: 'dress' });
  const m = await page.evaluate(() => {
    const r = document.querySelector('.cc-gtabs');
    const tabs = [...document.querySelectorAll('.cc-gtab')];
    return { rows: new Set(tabs.map(e => Math.round(e.getBoundingClientRect().top))).size,
             scrolls: r.scrollWidth > r.clientWidth,
             overflowX: getComputedStyle(r).overflowX,
             bodyWide: document.body.scrollWidth > document.body.clientWidth + 1 };
  });
  eq(m.rows, 1, 'the row wrapped onto ' + m.rows + ' lines on a phone');
  ok(m.scrolls && m.overflowX === 'auto', 'the row does not scroll sideways when it overflows');
  ok(!m.bodyWide, 'the page itself scrolls sideways');
  await page.setViewportSize({ width: 1440, height: 1200 });
});

t('on a phone the deck is paced by a bar, not by twenty-two dots on their own line', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot({ gentSub: 'dress' });
  const m = await page.evaluate(() => {
    const nav = document.querySelector('.cc-gnav');
    const kids = [...nav.children].filter(e => getComputedStyle(e).display !== 'none');
    return { dots: getComputedStyle(document.querySelector('.cc-gdots')).display,
             bar: getComputedStyle(document.querySelector('.cc-gprog')).display,
             /* Centres, not tops: the row centres a 4px bar against a 40px button, so their
                tops differ by design and only their middles should agree. */
             rows: new Set(kids.map(e => { const r = e.getBoundingClientRect(); return Math.round(r.top + r.height / 2); })).size,
             navH: Math.round(nav.getBoundingClientRect().height),
             backH: Math.round(kids[0].getBoundingClientRect().height),
             fill: document.querySelector('.cc-gprog > span').style.width };
  });
  eq(m.dots, 'none', 'the dot row is still shown on a phone');
  ok(m.bar !== 'none', 'there is no progress bar on a phone');
  eq(m.rows, 1, 'BACK, the bar and NEXT sit on ' + m.rows + ' lines');
  ok(m.navH <= m.backH + 2, 'the nav is ' + m.navH + 'px tall against a ' + m.backH + 'px button \u2014 something wrapped');
  eq(m.fill, '5%', 'the bar does not report the first of twenty-two');
  /* And it moves. */
  await page.evaluate(() => window.__nvx.gentGoto(21));
  await page.waitForTimeout(150);
  eq(await page.evaluate(() => document.querySelector('.cc-gprog > span').style.width), '100%', 'the bar does not fill by the last card');
  await page.setViewportSize({ width: 1440, height: 1200 });
});

t('on a wide screen the dots come back and the bar goes away', async () => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await boot({ gentSub: 'dress' });
  const m = await page.evaluate(() => ({
    dots: getComputedStyle(document.querySelector('.cc-gdots')).display,
    bar: getComputedStyle(document.querySelector('.cc-gprog')).display,
    n: document.querySelectorAll('.cc-gdots > span').length }));
  ok(m.dots !== 'none', 'the dots are hidden on a wide screen');
  eq(m.bar, 'none', 'the phone bar is showing on a wide screen');
  eq(m.n, 22, 'the dot row does not report all twenty-two cards');
});

let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
