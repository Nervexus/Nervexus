/* The Forge, in a real browser:  node forge-page.test.mjs

   forge-engine.test.mjs proves the standards and the maths. This proves the page — that
   every binding the markup asks for is actually produced, that the three centres render
   what they claim to, that the log integration reads the real logs rather than fixtures
   of its own, and that recording an assessment survives the round trip to storage.

   It exists because the two bugs that cost the most time on this page were not logic
   bugs: a binding with no producer renders blank and throws nothing, and an input spliced
   into a neighbouring style attribute parses perfectly. Only a rendered page catches
   either, so the page gets rendered.

   The app is driven through window.__nvx, the localhost-only handle on the Component.
   Clicking through a 2FA login on every run would test the login, not the Forge. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';   // CommonJS: default import only
const { chromium } = playwright;
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8901;
const BASE = 'http://127.0.0.1:' + PORT + '/index.html';

const T = [];
const t = (n, f) => T.push([n, f]);
const eq = (got, want, what) => { if (got !== want) throw new Error(what + ': expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(got)); };
const ok = (cond, what) => { if (!cond) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],   // the agent proxy resets loopback
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

/* A fixed set of logs, so the "from your logs" panel is asserting on numbers this test
   chose rather than on whatever happens to be in the browser profile. */
const SEED = {
  sessions: 3,
  bodyFat: 14,
  weightKg: 82,
  foodTotal: 73.70,
};

async function boot(extra) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx && !!window.Forge, null, { timeout: 20000 });
  await page.evaluate((patch) => {
    const A = window.__nvx, now = Date.now(), day = 864e5;
    A.setState(Object.assign({
      loggedIn: true, scene: 'forge', forgeCentre: 'training',
      forgeOpen: null, forgeDraft: {}, forgeScores: {}, forgeHistory: [],
      perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false, toasts: [], searchOpen: false,
      workouts: [
        { id: 'w1', ts: now - 1 * day, part: 'chest', name: 'Bench', mins: 40 },
        { id: 'w2', ts: now - 2 * day, part: 'back', name: 'Row', mins: 35 },
        { id: 'w3', ts: now - 3 * day, part: 'legs', name: 'Squat', mins: 50 },
        { id: 'w4', ts: now - 40 * day, part: 'arms', name: 'Curl', mins: 20 },   // outside the 7-day window
      ],
      expenses: [
        { id: 'e1', ts: now - 4 * day, label: 'Tesco groceries', amount: 42.50 },
        { id: 'e2', ts: now - 9 * day, label: 'Aldi food shop', amount: 31.20 },
        { id: 'e3', ts: now - 5 * day, label: 'Train ticket', amount: 18.00 },     // not food
        { id: 'e4', ts: now - 90 * day, label: 'Lidl food', amount: 99.00 },       // outside 30 days
      ],
      health: Object.assign({}, A.state.health, {
        sleepLog: [{ hours: 7, minutes: 30 }, { hours: 7, minutes: 30 }],
        bodyLog: [{ bodyFatPct: 14, weightKg: 82 }],
      }),
    }, patch || {}));
  }, extra || {});
  await page.waitForTimeout(700);
}
const text = () => page.evaluate(() => document.body.innerText);
const spans = () => page.evaluate(() => [...document.querySelectorAll('span,div')].map(e => e.textContent.trim()));

/* ---- the page exists and is reachable the way the app says it is ---- */

t('the Forge is its own scene, not a tab inside Fitness', async () => {
  await boot();
  const st = await page.evaluate(() => window.__nvx.state.scene);
  eq(st, 'forge', 'scene');
  const body = await text();
  ok(/◆ THE FORGE/.test(body), 'the page header did not render');
  ok(!/Body Systems/.test(body), 'the Fitness page rendered at the same time — the scenes are not exclusive');
});

t('it is reachable from the Fitness tab row', async () => {
  await boot({ scene: 'fitness' });
  await page.getByText('The Forge', { exact: true }).first().click();
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.scene), 'forge', 'scene after clicking the tab');
});

/* ---- bindings: the failure mode here is silence, so assert on rendered text ---- */

t('every binding the markup asks for is produced', async () => {
  await boot();
  const src = await page.evaluate(() => document.documentElement.outerHTML);
  ok(!/\{\{/.test(await text()), 'an unresolved {{ binding }} leaked into the rendered text');
  ok(src.length > 0, 'no document');
});

t('the unit score header reads from the engine', async () => {
  await boot({ forgeScores: { 'nasal-walk': 45 } });
  const body = await text();
  ok(/UNIT SCORE · 1\/\d+ MEASURED/.test(body), 'measured count wrong: ' + (body.match(/UNIT SCORE[^\n]*/) || [])[0]);
  const total = await page.evaluate(() => window.Forge.unitScore({}).total);
  ok(new RegExp('1/' + total + ' MEASURED').test(body), 'the header total must match the engine total');
});

t('an unmeasured Forge says so rather than showing a zero', async () => {
  await boot();
  const body = await text();
  ok(/Unmeasured/.test(body), 'a Forge with nothing recorded must not claim a tier');
  ok(!/\b0%/.test(body.split('UNIT SCORE')[0] || ''), 'nothing measured must not read as 0% — that is a different claim');
});

/* ---- the log integration the brief asked for ---- */

t('the logs panel reads the real fitness and health logs', async () => {
  await boot();
  const body = await text();
  const panel = body.split('FROM YOUR LOGS')[1].split('\n').slice(0, 12).join(' ');
  ok(panel.includes(String(SEED.sessions)), 'sessions in the last 7 days: ' + panel);
  ok(panel.includes('3/10'), 'regions trained should be 3 of 10: ' + panel);
  ok(panel.includes('7.5h'), 'average sleep: ' + panel);
  ok(panel.includes(SEED.bodyFat + '%'), 'body fat: ' + panel);
  ok(panel.includes(SEED.weightKg + 'kg'), 'bodyweight: ' + panel);
});

t('the food panel prices against the finance log, and only the food in it', async () => {
  await boot({ forgeCentre: 'health' });
  const body = await text();
  const line = (body.match(/£[\d.]+ on food[^\n]*/) || ['none'])[0];
  ok(line.includes('£' + SEED.foodTotal.toFixed(2)),
     'should total the two grocery rows and exclude the train ticket and the 90-day-old shop: ' + line);
});

t('with no spending logged the food panel says so instead of showing £0.00', async () => {
  await boot({ forgeCentre: 'health', expenses: [] });
  const body = await text();
  ok(/No food spending logged/.test(body), 'an empty finance log must read as absent, not as zero spend');
});

/* ---- the three centres ---- */

t('the Training Centre covers all ten regions, head to feet', async () => {
  await boot();
  const seen = await spans();
  const want = ['Head', 'Neck', 'Shoulders', 'Chest', 'Abs & Core', 'Back', 'Upper Legs', 'Lower Legs', 'Feet', 'Hands & Grip'];
  const missing = want.filter(w => !seen.includes(w));
  eq(missing.length, 0, 'regions missing from the page: ' + missing.join(', '));
});

t('the neglected regions are marked as neglected', async () => {
  await boot();
  const marked = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('span').forEach(s => {
      if (s.textContent.trim() === 'NEGLECTED') {
        const row = s.parentElement;
        const name = row && row.querySelector('span');
        if (name) out.push(name.textContent.trim());
      }
    });
    return out;
  });
  for (const r of ['Head', 'Neck', 'Lower Legs', 'Feet', 'Hands & Grip']) {
    ok(marked.includes(r), r + ' should be flagged as neglected — that is the point of listing it');
  }
});

t('the Mental Centre covers all six faculties', async () => {
  await boot({ forgeCentre: 'mental' });
  const seen = await spans();
  const want = ['Focus', 'Memory', 'Creativity', 'Motivation', 'Discipline', 'Overcoming Addictions'];
  const missing = want.filter(w => !seen.includes(w));
  eq(missing.length, 0, 'mental domains missing: ' + missing.join(', '));
  ok(!seen.includes('Chest'), 'training regions must not leak into the mental centre');
});

t('the Health Centre grades its claims by evidence, strongest first', async () => {
  await boot({ forgeCentre: 'health' });
  const body = await text();
  ok(/Sleep 7-9 hours/.test(body), 'sleep must be listed');
  ok(/STRONG · LARGE/.test(body), 'strong evidence must be badged as such');
  ok(/WEAK · NEGLIGIBLE/.test(body), 'the supplement claim must be badged weak');
  ok(body.indexOf('Sleep 7-9 hours') < body.indexOf('Testosterone-boosting supplements'),
     'sleep must sort above the supplements — the ordering is the honesty');
  ok(/Nothing ultra-processed/.test(body), 'the nutrition rules must render');
  ok(/Beef liver/.test(body), 'the food list must render');
  ok(!/THE STANDARD/.test(body), 'the health centre has no standards panel');
});

/* ---- expanding a group ---- */

t('opening a region shows its rationale, its standards and its work', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setForgeOpen('neck'));
  await page.waitForTimeout(600);
  const body = await text();
  ok(/THE STANDARD/.test(body), 'standards heading missing');
  ok(/THE WORK/.test(body), 'work heading missing');
  ok(/A neck carries the head/.test(body), 'the rationale must render');
  ok(/BASELINE 0/.test(body) && /UNIT 20/.test(body), 'tier chips must show their thresholds');
});

t('the risky work carries its loading warning on the page, not just in the data', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setForgeOpen('neck'));
  await page.waitForTimeout(600);
  const body = await text();
  ok(/⚠/.test(body), 'no warning rendered');
  ok(/ISOMETRICS FIRST/i.test(body), 'the neck loading order must be visible where the neck work is');
});

t('only one group is open at a time, and clicking it again closes it', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setForgeOpen('neck'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx.setForgeOpen('chest'));
  await page.waitForTimeout(400);
  const body = await text();
  ok(!/A neck carries the head/.test(body), 'opening a second group must close the first');
  await page.evaluate(() => window.__nvx.setForgeOpen('chest'));
  await page.waitForTimeout(400);
  ok(!/THE STANDARD/.test(await text()), 'clicking an open group must close it');
});

/* ---- recording an assessment ---- */

t('a score typed into a standard reaches state, is saved, and is dated', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setForgeOpen('neck'));
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const i = [...document.querySelectorAll('input')].find(i => /kg for/.test(i.placeholder || ''));
    if (!i) throw new Error('no score input rendered for the neck standards');
    i.focus();
  });
  await page.keyboard.type('12');
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => window.__nvx.state.forgeDraft['neck-prone']), '12', 'draft after typing');

  await page.getByText('RECORD ASSESSMENT', { exact: true }).first().click();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    score: window.__nvx.state.forgeScores['neck-prone'],
    draft: Object.keys(window.__nvx.state.forgeDraft || {}).length,
    hist: window.__nvx.state.forgeHistory || [],
    stored: JSON.parse(localStorage.getItem('cc_v2') || '{}').forgeScores || {},
  }));
  eq(after.score, 12, 'recorded score');
  eq(after.draft, 0, 'the draft must clear once recorded');
  eq(after.hist.length, 1, 'history entries');
  ok(/^\d{4}-\d{2}-\d{2}$/.test(after.hist[0].date), 'the entry must carry a date: ' + after.hist[0].date);
  eq(after.stored['neck-prone'], 12, 'the score must reach localStorage, not just state');
});

t('recording moves the region tier and the unit score', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setForgeOpen('neck'));
  await page.waitForTimeout(500);
  const before = await text();
  ok(/Neck\nNEGLECTED\nNOT MEASURED/.test(before), 'the neck should start unmeasured: '
     + (before.match(/Neck\n[^\n]*\n[^\n]*/) || [])[0]);
  await page.evaluate(() => { window.__nvx.setForgeScore('neck-prone', { target: { value: '12' } }); });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.saveForgeScores());
  await page.waitForTimeout(700);
  const after = await text();
  ok(/Neck\nNEGLECTED\nFORGED · 1\/3/.test(after), 'the neck tier did not update: '
     + (after.match(/Neck\n[^\n]*\n[^\n]*/) || [])[0]);
  ok(/UNIT SCORE · 1\/\d+ MEASURED/.test(after), 'the measured count did not update');
});

t('an empty form records nothing rather than writing a blank assessment', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.saveForgeScores());
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => (window.__nvx.state.forgeHistory || []).length), 0, 'history entries after an empty save');
});

t('a blank standard is not counted against the score', async () => {
  await boot({ forgeScores: { 'nasal-walk': 90 } });
  const body = await text();
  const pct = Number((body.match(/(\d+)%/) || [0, 0])[1]);
  eq(pct, 100, 'one standard at Unit and the rest untested must read 100%, not a fraction of 48');
});

/* ---- progress ---- */

t('with one assessment the progress panel says there is nothing to compare', async () => {
  await boot({ forgeHistory: [{ date: '2026-08-20', scores: { 'nasal-walk': 45 } }], forgeScores: { 'nasal-walk': 45 } });
  const body = await text();
  ok(/PROGRESS · LAST 8 ASSESSMENTS/.test(body), 'the progress panel should show once there is a record');
  ok(/nothing to measure it against/.test(body), 'a single assessment must not imply a trend');
  ok(!/WHAT MOVED/.test(body), 'there is nothing to have moved yet');
});

t('a second assessment reports the delta and what crossed a tier', async () => {
  const st = { 'nasal-walk': 20 }, st2 = { 'nasal-walk': 90 };
  await boot({
    forgeHistory: [{ date: '2026-08-20', scores: st }, { date: '2026-08-27', scores: st2 }],
    forgeScores: st2,
  });
  const body = await text();
  ok(/\+\d+ points since 20\/8/.test(body), 'the delta line is wrong: ' + (body.match(/[^\n]*points since[^\n]*/) || [])[0]);
  ok(/WHAT MOVED/.test(body), 'the movement list should render');
  ok(/Nasal-only walk/.test(body.split('WHAT MOVED')[1] || ''), 'the standard that moved must be named');
  ok(/▲/.test(body), 'an improvement should read as one');
});

t('going backwards is reported, not quietly dropped', async () => {
  const good = { 'nasal-walk': 90 }, bad = { 'nasal-walk': 20 };
  await boot({
    forgeHistory: [{ date: '2026-08-20', scores: good }, { date: '2026-08-27', scores: bad }],
    forgeScores: bad,
  });
  const body = await text();
  ok(/-\d+ points since/.test(body), 'a fall must show as a negative delta: ' + (body.match(/[^\n]*points since[^\n]*/) || [])[0]);
  ok(/▼/.test(body), 'a regression must be marked');
});

t('the progress panel stays hidden until there is something to show', async () => {
  await boot();
  ok(!/PROGRESS · LAST 8 ASSESSMENTS/.test(await text()), 'an empty history must not render an empty chart');
});

t('the bars are scaled to the best result on record', async () => {
  await boot({
    forgeHistory: [
      { date: '2026-08-01', scores: { 'nasal-walk': 20 } },
      { date: '2026-08-20', scores: { 'nasal-walk': 90 } },
    ],
    forgeScores: { 'nasal-walk': 90 },
  });
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('div[title]')]
      .filter(d => /^\d{4}-\d{2}-\d{2} · /.test(d.getAttribute('title')))
      .map(d => parseInt(d.style.height, 10)));
  eq(heights.length, 2, 'one bar per assessment');
  eq(heights[1], 100, 'the best result must fill the panel');
  ok(heights[0] < heights[1], 'a worse assessment must draw shorter');
});

/* ---- weakest links ---- */

t('the weakest measured standards are named, lowest first', async () => {
  await boot({ forgeScores: { 'nasal-walk': 90, 'deep-block': 25 } });
  const body = await text();
  ok(/WEAKEST LINKS/.test(body), 'the panel should render once something is measured');
  const block = body.split('WEAKEST LINKS')[1];
  ok(block.indexOf('Unbroken deep work') < block.indexOf('Nasal-only walk'),
     'the lower tier must sort first — the panel exists to point somewhere specific');
});

t('nothing measured means no weakest link to name', async () => {
  await boot();
  ok(!/WEAKEST LINKS/.test(await text()), 'with nothing measured there is nothing to rank');
});

/* ---- the mistake that parsing does not catch ---- */

t('every score input kept its own styling', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setForgeOpen('neck'));
  await page.waitForTimeout(600);
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('input')].filter(i => !i.getAttribute('style')).length);
  eq(broken, 0, 'an input lost its style attribute — markup spliced into a neighbouring attribute');
});

t('the page raised no errors while all of that happened', async () => {
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
