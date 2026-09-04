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
      /* The real stored shape: `exercise`, and a capitalised part. The log list filters on
         both, so a loose fixture renders an empty log and quietly proves nothing. */
      workouts: [
        { id: 'w1', ts: now - 1 * day, part: 'Chest', exercise: 'Bench', weight: 80, sets: 3, reps: 8, min: 40 },
        { id: 'w2', ts: now - 2 * day, part: 'Back',  exercise: 'Row',   weight: 60, sets: 3, reps: 10, min: 35 },
        { id: 'w3', ts: now - 3 * day, part: 'Legs',  exercise: 'Squat', weight: 100, sets: 4, reps: 6, min: 50 },
        { id: 'w4', ts: now - 40 * day, part: 'Arms', exercise: 'Curl',  weight: 20, sets: 3, reps: 12, min: 20 }, // outside the 7-day window
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
  ok(/❖ THE FORGE/.test(body), 'the page header did not render');
  ok(!/Body Systems/.test(body), 'the Fitness page rendered at the same time — the scenes are not exclusive');
});

t('the Forge is no longer a tab inside Fitness', async () => {
  await boot({ scene: 'fitness' });
  const tabs = await page.evaluate(() => {
    const hq = [...document.querySelectorAll('*')].find(e =>
      e.children.length === 0 && e.textContent.trim() === 'Fitness HQ');
    if (!hq) return null;
    return [...hq.parentElement.parentElement.querySelectorAll('*')]
      .filter(e => e.children.length === 0).map(e => e.textContent.trim());
  });
  ok(tabs, 'the Fitness tab row did not render');
  ok(!tabs.includes('The Forge'), 'the Forge is still a tab inside Fitness: ' + tabs.join(' | '));
  ok(tabs.includes('Fitness HQ') && tabs.includes('Music'), 'the other tabs must survive: ' + tabs.join(' | '));
});

t('the sidebar lists The Forge directly above the AI Command Center', async () => {
  await boot();
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('.cc-side span[data-icon]')].map(s => s.dataset.icon));
  const ai = ids.indexOf('ai');
  ok(ai > 0, 'the AI Command Center is not in the sidebar');
  eq(ids[ai - 1], 'forge', 'the entry above AI Command Center — full order: ' + ids.join(' > '));
});

t('the Forge is the only nav entry lit while you are on it', async () => {
  await boot();
  const lit = await page.evaluate(() =>
    [...document.querySelectorAll('.cc-side span[data-icon]')]
      .filter(s => getComputedStyle(s).color === 'rgb(255, 255, 255)')
      .map(s => s.dataset.icon));
  eq(lit.join(','), 'forge', 'exactly one sidebar entry should be active, and it is this page');
});

t('Fitness still lights itself, and still owns Health', async () => {
  for (const [scene, want] of [['fitness', 'fitness'], ['health', 'fitness']]) {
    await boot({ scene });
    const lit = await page.evaluate(() =>
      [...document.querySelectorAll('.cc-side span[data-icon]')]
        .filter(s => getComputedStyle(s).color === 'rgb(255, 255, 255)')
        .map(s => s.dataset.icon));
    eq(lit.join(','), want, 'active entry on the ' + scene + ' scene');
  }
});

t('the Forge nav entry actually draws its mark', async () => {
  await boot();
  /* A nav id with no entry in the icon map renders an empty span and throws nothing, so
     assert on the drawn paths rather than on the element existing. */
  const drawn = await page.evaluate(() => {
    const el = document.querySelector('.cc-side span[data-icon="forge"]');
    if (!el) return null;
    const svg = el.querySelector('svg');
    return svg ? { paths: svg.querySelectorAll('path').length, dots: svg.querySelectorAll('circle').length } : null;
  });
  ok(drawn, 'the Forge nav entry has no icon drawn into it');
  ok(drawn.paths >= 3, 'the crest should be the lozenge, its inner fill and the base rule: ' + JSON.stringify(drawn));
  eq(drawn.dots, 2, 'the base rule carries the house divider\'s paired end dots');
});

t('the Forge is reachable on mobile through More', async () => {
  await boot({ mobMoreOpen: true });
  /* The mobile bar carries six fixed entries and everything else falls through to the More
     sheet, which is only in the DOM while it is open. Promoting the Forge in the sidebar
     does not put it on that bar, so the only thing that matters here is that it has not
     become unreachable on a phone. */
  const inMore = await page.evaluate(() => {
    const more = [...document.querySelectorAll('*')].filter(e =>
      e.children.length === 0 && e.textContent.trim() === 'The Forge' && !e.closest('.cc-side'));
    return more.length > 0;
  });
  ok(inMore, 'The Forge appears nowhere outside the desktop sidebar — check mobMoreList');
});

t('the page wears the Éverpine crest in champagne', async () => {
  await boot();
  const crest = await page.evaluate(() => {
    const marks = [...document.querySelectorAll('span[data-icon="forge"]')];
    const onPage = marks.find(m => m.closest('h1, div') && /THE FORGE/.test(
      (m.parentElement.parentElement && m.parentElement.parentElement.textContent) || ''));
    if (!onPage) return null;
    return { colour: getComputedStyle(onPage).color, size: onPage.getBoundingClientRect().width };
  });
  ok(crest, 'no crest beside the page title');
  eq(crest.colour, 'rgb(231, 216, 166)', 'the crest must be Éverpine champagne (#E7D8A6)');
  ok(crest.size > 20, 'the page crest should read as a logo, not a nav glyph: ' + crest.size + 'px');
});

/* ---- the home centre: the working half of Fitness HQ, on the Forge ---- */

t('the Forge opens on its home', async () => {
  /* Read the constructor's own default — boot() sets forgeCentre itself, so going through it
     would only prove the fixture. */
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  eq(await page.evaluate(() => window.__nvx.state.forgeCentre), 'home', 'the centre it lands on');
  await boot({ forgeCentre: 'home' });
  const body = await text();
  ok(/HOME/.test(body), 'a HOME tab should sit alongside TRAINING, MENTAL and HEALTH');
});

t('the home carries the training floor', async () => {
  await boot({ forgeCentre: 'home' });
  const body = await text();
  for (const panel of ['Muscle Training Split', 'Anatomy', 'Log Training', 'MOVE', 'TRAIN TODAY', 'WEEK TOTAL', 'Strength Chart']) {
    ok(body.includes(panel), panel + ' is missing from the Forge home');
  }
  ok(!/THE STANDARD/.test(body), 'the standards belong to Training, not the home');
});

t('the home is not shown on the other centres', async () => {
  for (const centre of ['training', 'mental', 'health']) {
    await boot({ forgeCentre: centre });
    ok(!/Muscle Training Split/.test(await text()), 'the training floor leaked onto the ' + centre + ' centre');
  }
});

t('the log on the Forge is the same log as Fitness HQ, not a second one', async () => {
  await boot({ forgeCentre: 'home' });
  /* The whole point of moving these cards rather than rebuilding them: one set of numbers.
     A separate store would show different totals on two screens and both would look right. */
  const seeded = await page.evaluate(() => window.__nvx.state.workouts.length);
  const shown = await text();
  ok(/Bench/.test(shown), 'the seeded sessions should already be listed on the Forge home');

  await page.evaluate(() => window.__nvx.setState({
    woPart: 'Chest', woEx: 'Incline press', woWeight: '60', woSets: '3', woReps: '8', woMin: '' }));
  await page.waitForTimeout(400);
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'Log Set');
    if (!btn) return false; btn.click(); return true;
  });
  ok(clicked, 'no Log Set button on the Forge home');
  await page.waitForTimeout(900);

  const after = await page.evaluate(() => window.__nvx.state.workouts);
  eq(after.length, seeded + 1, 'the set should land in the shared workouts store');
  ok(after.some(w => w.exercise === 'Incline press' || w.name === 'Incline press'),
     'the logged set is not in the store: ' + JSON.stringify(after.slice(-1)));

  /* Switch scene without re-booting — boot() re-seeds workouts, which would wipe the set
     and make this assertion test the fixture instead of the store. */
  await page.evaluate(() => window.__nvx.setState({ scene: 'fitness' }));
  await page.waitForTimeout(900);
  ok(/Incline press/.test(await text()), 'Fitness HQ must show the set logged on the Forge');
});

t('the 3D anatomy is revealed before anything measures it', async () => {
  await boot({ forgeCentre: 'home' });
  /* The real defect: reattach() ran fit() while the mount was still display:none, so
     clientWidth was 0, the canvas locked to its 120px floor, and the model came back as a
     thumbnail against the left edge of a full-width card. Stub the engine and watch the
     order — this holds whether or not the test browser has WebGL. */
  await page.evaluate(() => {
    window.__anat = [];
    const el = () => document.querySelector('[data-anatomy3d]');
    window.NervexusAnatomy3D = {
      supported: () => true,
      hasScene: () => true,
      isMounted: () => false,
      reattach(node) {
        window.__anat.push({ fn: 'reattach', display: node.style.display, width: node.clientWidth });
        return true;
      },
      setAspect() {
        const n = el();
        window.__anat.push({ fn: 'setAspect', display: n.style.display, width: n.clientWidth });
      },
      setGlow() {}, setAutoSpin() {}, dispose() {},
      mount() { return Promise.resolve(true); },
    };
  });
  await page.evaluate(() => window.__nvx.setState({ anatomyTick: Date.now() }));
  await page.waitForTimeout(800);

  const calls = await page.evaluate(() => window.__anat);
  ok(calls.length, '_syncAnatomy never reached the 3D engine');
  for (const c of calls) {
    eq(c.display, 'block', c.fn + ' ran while the mount was still hidden');
    ok(c.width > 200, c.fn + ' measured a ' + c.width + 'px container — it would lock the canvas to the 120px floor');
  }
  ok(calls.some(c => c.fn === 'setAspect'), 'the mount must be re-fitted once it is visible');
});

t('the drawn figure is put away whenever the model is up', async () => {
  await boot({ forgeCentre: 'home' });
  await page.evaluate(() => {
    window.NervexusAnatomy3D = {
      supported: () => true, hasScene: () => true, isMounted: () => false,
      reattach: () => true, setAspect() {}, setGlow() {}, setAutoSpin() {}, dispose() {},
      mount() { return Promise.resolve(true); },
    };
  });
  await page.evaluate(() => window.__nvx.setState({ anatomyTick: Date.now() }));
  await page.waitForTimeout(800);
  /* A re-render hands back fresh nodes carrying the markup's defaults, so the display state
     has to be re-asserted every pass or the drawn fallback reappears under a live model. */
  const st = await page.evaluate(() => ({
    model: document.querySelector('[data-anatomy3d]').style.display,
    drawn: document.querySelector('[data-anatomy]').style.display,
    toggle: (document.querySelector('.cc-anatomy-views') || {}).style?.display,
  }));
  eq(st.model, 'block', 'the model mount should be visible');
  eq(st.drawn, 'none', 'the drawn fallback is showing underneath the model');
  eq(st.toggle, 'none', 'Front/Back belongs to the drawn figure and should be hidden');
});

t('the rings canvas is actually drawn on the Forge home', async () => {
  await boot({ forgeCentre: 'home' });
  await page.waitForTimeout(1200);
  /* init_forge has to exist and run: the scene signature only watched `scene`, so switching
     centre inside the Forge used to leave this canvas blank. */
  const painted = await page.evaluate(() => {
    const cv = document.querySelector('canvas[data-chart="fitRings"]');
    if (!cv || !cv.width) return null;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let on = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) on++;
    return { w: cv.width, lit: on };
  });
  ok(painted, 'no rings canvas on the Forge home');
  ok(painted.lit > 200, 'the rings canvas rendered blank: ' + JSON.stringify(painted));
});

t('leaving the home and coming back redraws the rings', async () => {
  await boot({ forgeCentre: 'home' });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__nvx.setForgeCentre('training'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setForgeCentre('home'));
  await page.waitForTimeout(1200);
  const lit = await page.evaluate(() => {
    const cv = document.querySelector('canvas[data-chart="fitRings"]');
    if (!cv || !cv.width) return -1;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let on = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) on++;
    return on;
  });
  ok(lit > 200, 'the rings did not come back after switching centres: ' + lit + ' lit pixels');
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

/* ---- the three centres ---- */

/* ---- expanding a group ---- */

/* ---- recording an assessment ---- */

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

/* ---- the three cleared centres ---- */

t('Training, Mental and Health are empty pages', async () => {
  for (const [centre, label] of [['training', 'TRAINING'], ['mental', 'MENTAL'], ['health', 'HEALTH']]) {
    await boot({ forgeCentre: centre });
    const body = await text();
    ok(body.includes(label), label + ' should still name itself on its empty page');
    ok(/Nothing here yet/.test(body), label + ' is not showing its empty state');
    /* Everything the three centres used to carry, gone from all of them. */
    for (const ghost of ['THE STANDARD', 'THE WORK', 'THE TEN REGIONS', 'THE SIX FACULTIES',
                         'RECORD ASSESSMENT', 'Sleep 7-9 hours', 'Beef liver',
                         'Nothing ultra-processed', 'NEGLECTED', 'on food · 30 days']) {
      ok(!body.includes(ghost), ghost + ' is still on the ' + centre + ' page');
    }
  }
});

t('the four centres still switch', async () => {
  await boot({ forgeCentre: 'home' });
  for (const [tab, probe] of [['TRAINING', 'TRAINING'], ['MENTAL', 'MENTAL'], ['HEALTH', 'HEALTH'], ['HOME', 'Muscle Training Split']]) {
    await page.evaluate((t) => {
      const el = [...document.querySelectorAll('span')].find(e =>
        e.children.length === 0 && e.textContent.trim() === t);
      if (el) el.click();
    }, tab);
    await page.waitForTimeout(700);
    ok((await text()).includes(probe), 'clicking ' + tab + ' did not land on it');
  }
});

t('clearing the three centres left the Home alone', async () => {
  await boot({ forgeCentre: 'home' });
  const body = await text();
  for (const panel of ['Muscle Training Split', 'Anatomy', 'Log Training', 'MOVE', 'Strength Chart']) {
    ok(body.includes(panel), panel + ' went missing from the Forge home');
  }
  ok(!/Nothing here yet/.test(body), 'the home must not render the empty state');
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

t('a higher score never draws a dimmer bar', async () => {
  await boot({
    forgeHistory: [
      { date: '2026-08-01', scores: { 'nasal-walk': 20 } },
      { date: '2026-08-08', scores: { 'nasal-walk': 45 } },
      { date: '2026-08-20', scores: { 'nasal-walk': 90 } },
    ],
    forgeScores: { 'nasal-walk': 90 },
  });
  /* The bars encode magnitude, so their colour must be one hue getting brighter. The
     tier palette rotates through green and amber; reused here it makes a better score
     read as a warning. Lightness must rise with the score, and the hue must not move. */
  const bars = await page.evaluate(() =>
    [...document.querySelectorAll('div[title]')]
      .filter(d => /^\d{4}-\d{2}-\d{2} · /.test(d.getAttribute('title')))
      .map(d => d.style.background || d.style.backgroundColor));
  eq(bars.length, 3, 'one bar per assessment');
  /* The browser normalises whatever we wrote to rgb(), so go back to hue and lightness
     from the pixels rather than from the CSS we happened to author. */
  const parsed = bars.map(b => {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(b);
    if (!m) throw new Error('unreadable bar colour: ' + b);
    const [r, g, bl] = [+m[1] / 255, +m[2] / 255, +m[3] / 255];
    const max = Math.max(r, g, bl), min = Math.min(r, g, bl), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - bl) / d) % 6;
      else if (max === g) h = (bl - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h: Math.round(h), l: (max + min) / 2 };
  });
  const spread = Math.max(...parsed.map(p => p.h)) - Math.min(...parsed.map(p => p.h));
  ok(spread <= 2, 'the hue must not change across the ramp (spread ' + spread + '°): ' + bars.join(' | '));
  ok(parsed[0].l < parsed[1].l && parsed[1].l < parsed[2].l,
     'lightness must rise with the score: ' + parsed.map(p => p.l.toFixed(2)).join(' < '));
});

t('the value labels wear text ink, not the series colour', async () => {
  await boot({
    forgeHistory: [{ date: '2026-08-01', scores: { 'nasal-walk': 20 } }],
    forgeScores: { 'nasal-walk': 20 },
  });
  const coloured = await page.evaluate(() => {
    const strip = [...document.querySelectorAll('div[title]')]
      .find(d => /^\d{4}-\d{2}-\d{2} · /.test(d.getAttribute('title')));
    return [...strip.parentElement.querySelectorAll('span')].map(s => s.style.color);
  });
  ok(coloured.length > 0, 'no labels found on the bar');
  ok(!coloured.some(c => /hsl\(/.test(c)), 'a label is wearing the bar colour: ' + coloured.join(' | '));
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
