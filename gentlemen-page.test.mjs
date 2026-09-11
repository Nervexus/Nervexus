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

t('a page shows one card at a time, and every card in turn', async () => {
  /* The pages are read a card at a time rather than scrolled, so what is on screen is one
     occasion — and the ones either side of it are not. */
  await boot({ gentSub: 'dress' });
  let b = await text();
  ok(b.includes('Black Tie / Formal Evening'), 'it should open on the first card');
  ok(b.includes('1 OF 6'), 'it should say where you are: ' + (b.match(/\d OF \d/) || ''));
  ok(!b.includes('Home Wear'), 'the last card should not be on screen with the first');

  const seen = ['Black Tie / Formal Evening'];
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.__nvx.gentStep(1));
    await page.waitForTimeout(300);
    const t2 = await text();
    const title = ['Business Formal', 'Business Smart', 'Smart Casual', 'Day-to-Day', 'Home Wear'][i];
    ok(t2.includes(title), 'card ' + (i + 2) + ' should be ' + title);
    seen.push(title);
  }
  eq(seen.length, 6, 'six occasions');
  b = await text();
  ok(b.includes('6 OF 6'), 'the counter should have reached the end');
  ok(b.includes('DONE'), 'the last card should say DONE rather than offer another');
});

t('dining is a deck too, and every stage is in it', async () => {
  await boot({ gentSub: 'dining' });
  const titles = [];
  for (let i = 0; i < 5; i++) {
    titles.push(await page.evaluate(() => window.__nvx._gent().cards('dining')[window.__nvx.state.gentIdx].title));
    await page.evaluate(() => window.__nvx.gentStep(1));
    await page.waitForTimeout(220);
  }
  eq(titles.join(','), 'Before the Meal,Cutlery,At the Table,Conversation & Conduct,Wine & Glasses', 'wrong stages');
});

t('the deck stops at both ends rather than wrapping', async () => {
  await boot({ gentSub: 'dining' });
  await page.evaluate(() => window.__nvx.gentStep(-1));
  await page.waitForTimeout(250);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 0, 'going back from the first card should stay put');
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__nvx.gentStep(1); });
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 4, 'going past the last card should stay on it');
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
  /* Not on the test, which is one question and has nowhere to go. */
  await tab('DAILY TEST');
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => window.__nvx.state.gentIdx), 0, 'the arrows should do nothing on the test');
});

t('the dots say where you are and can be jumped to', async () => {
  await boot({ gentSub: 'dress' });
  await page.evaluate(() => window.__nvx.gentGoto(4));
  await page.waitForTimeout(350);
  const b = await text();
  ok(b.includes('5 OF 6'), 'jumping should land on the fifth card');
  ok(b.includes('Day-to-Day'), 'and show it');
});

t('the test asks one question, with four answers and no hint', async () => {
  await boot();
  const st = await page.evaluate(() => ({
    q: window.__nvx.state && [...document.querySelectorAll('div')].some(d => d.textContent.trim().endsWith('?')),
    opts: window.__nvx._gent().dailyQuestion(window.__nvx._fbToday()).options.length,
    answered: window.__nvx.state.prefs.gentTest,
  }));
  eq(st.opts, 4, 'four options');
  eq(JSON.stringify(st.answered), '{}', 'nothing should be answered on a fresh day');
  const b = await text();
  ok(/OPEN/.test(b), 'today should read as open before it is answered');
  /* Asserted on the explanation rather than on the word CORRECT, which is also the label of
     a stat in the standing panel. */
  const why = await page.evaluate(() => window.__nvx._gent().dailyQuestion(window.__nvx._fbToday()).why);
  ok(!b.includes(why.slice(0, 40)), 'the answer is being explained before it has been given');
});

t('answering marks the right one, the wrong one, and says why', async () => {
  await boot();
  const q = await page.evaluate(() => window.__nvx._gent().dailyQuestion(window.__nvx._fbToday()));
  const wrong = [0, 1, 2, 3].find(i => i !== q.correct);
  await page.evaluate((i) => window.__nvx.answerGentTest(i), wrong);
  await page.waitForTimeout(600);
  const b = await text();
  ok(/NOT QUITE/.test(b), 'a wrong answer should say so');
  ok(b.includes(q.why.slice(0, 40)), 'the reason should be shown: ' + q.why.slice(0, 40));
  ok(/MISS/.test(b), 'today should read as a miss');
  /* The right answer is marked whether or not it was picked — otherwise the test teaches
     nothing on the day you get it wrong. */
  const marks = await page.evaluate(() => [...document.querySelectorAll('span')]
    .filter(e => e.children.length === 0 && (e.textContent.trim() === '✓' || e.textContent.trim() === '✕'))
    .map(e => e.textContent.trim()).join(','));
  ok(marks.includes('✓'), 'the correct answer is not marked');
  ok(marks.includes('✕'), 'the wrong pick is not marked');
});

t('it takes one answer a day and no more', async () => {
  await boot();
  const q = await page.evaluate(() => window.__nvx._gent().dailyQuestion(window.__nvx._fbToday()));
  const wrong = [0, 1, 2, 3].find(i => i !== q.correct);
  await page.evaluate((i) => window.__nvx.answerGentTest(i), wrong);
  await page.waitForTimeout(400);
  // A second go, this time with the right answer, must not overwrite the first.
  await page.evaluate((i) => window.__nvx.answerGentTest(i), q.correct);
  await page.waitForTimeout(400);
  const rec = await page.evaluate(() => window.__nvx.state.prefs.gentTest[window.__nvx._fbToday()]);
  eq(rec.pick, wrong, 'the second attempt overwrote the first');
  eq(rec.correct, false, 'a retry turned a miss into a pass');
});

t('the answer is kept where it syncs, not just in the page', async () => {
  await boot();
  const q = await page.evaluate(() => window.__nvx._gent().dailyQuestion(window.__nvx._fbToday()));
  await page.evaluate((i) => window.__nvx.answerGentTest(i), q.correct);
  await page.waitForTimeout(500);
  const rec = await page.evaluate(() => window.__nvx.state.prefs.gentTest[window.__nvx._fbToday()]);
  eq(rec.correct, true, 'a correct answer should be recorded as one');
  eq(rec.cat, q.cat, 'the category should be recorded with it');
  ok(/PASS/.test(await text()), 'today should read as a pass');
});

t('the streak counts days answered correctly, and stops at a miss', async () => {
  const key = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
  await boot();
  await page.evaluate((k) => {
    const log = {};
    [1, 2, 3].forEach((n, i) => { log[k[i]] = { pick: 0, correct: true, cat: 'History' }; });
    log[k[3]] = { pick: 0, correct: false, cat: 'History' };      // four days ago, a miss
    window.__nvx.setState({ prefs: { ...window.__nvx.state.prefs, gentTest: log } });
  }, [key(1), key(2), key(3), key(4)]);
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => window.__nvx._gentStreak()), 3, 'three days, then the miss stops it');
  /* Today being unanswered must not break a run that is otherwise intact — the day is not
     over yet. */
  ok(/3d/.test(await text()), 'the streak should show as 3d');
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
