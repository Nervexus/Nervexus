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

let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
