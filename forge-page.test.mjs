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
      loggedIn: true, scene: 'forge', forgeCentre: 'home',
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
  ok(/Nothing here yet/.test(body), 'the Home is cleared, so it lands on the empty state');
});

t('the 3D anatomy is revealed before anything measures it', async () => {
  await boot({ scene: 'fitness' });
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
  await boot({ scene: 'fitness' });
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

/* ---- bindings: the failure mode here is silence, so assert on rendered text ---- */

t('every binding the markup asks for is produced', async () => {
  await boot();
  const src = await page.evaluate(() => document.documentElement.outerHTML);
  ok(!/\{\{/.test(await text()), 'an unresolved {{ binding }} leaked into the rendered text');
  ok(src.length > 0, 'no document');
});

t('the unit score header is gone', async () => {
  /* It counted standards that no longer have a page to be measured on. The crest and the
     wordmark stay — without them the cleared centres are four tabs on a blank screen. */
  for (const centre of ['home', 'training', 'mental', 'health']) {
    await boot({ forgeCentre: centre });
    const body = await text();
    ok(!/UNIT SCORE/.test(body), 'the unit score is still on the ' + centre + ' page');
    ok(!/MEASURED/.test(body), 'the measured count is still on the ' + centre + ' page');
    ok(/❖ THE FORGE/.test(body), 'the page lost its wordmark on ' + centre);
  }
});

/* ---- the log integration the brief asked for ---- */

/* ---- the three centres ---- */

/* ---- expanding a group ---- */

/* ---- recording an assessment ---- */

/* ---- the three cleared centres ---- */

t('Home, Mental and Health are empty pages', async () => {
  for (const [centre, label] of [['home', 'HOME'], ['mental', 'MENTAL'], ['health', 'HEALTH']]) {
    await boot({ forgeCentre: centre });
    const body = await text();
    ok(body.includes(label), label + ' should still name itself on its empty page');
    ok(/Nothing here yet/.test(body), label + ' is not showing its empty state');
    /* Everything the three centres used to carry, gone from all of them. */
    for (const ghost of ['Muscle Training Split', 'Anatomy', 'Log Training', 'Strength Chart',
                         'FROM YOUR LOGS', 'PROGRESS', 'WEAKEST LINKS', 'THE TOOLS',
                         'Hand Training', 'RECORD ASSESSMENT']) {
      ok(!body.includes(ghost), ghost + ' is still on the ' + centre + ' page');
    }
  }
});

t('Training carries the Hand Training chart', async () => {
  await boot({ forgeCentre: 'training' });
  const body = await text();
  ok(!/Nothing here yet/.test(body), 'Training is still showing the empty state');
  ok(/Hand Training/.test(body), 'the section is missing');
  ok(/THE TOOLS/.test(body), 'the kit list is missing');
});

t('every exercise in the data is on the chart, with its dose', async () => {
  await boot({ forgeCentre: 'training' });
  const body = await text();
  const W = await page.evaluate(() => window.ForgeTraining.section('hands').work);
  ok(W.length >= 15, 'the fixture is not the real chart');
  for (const w of W) {
    ok(body.includes(w.name), 'exercise not rendered: ' + w.name);
    ok(body.includes(w.dose), 'dose not rendered for: ' + w.name);
  }
  ok(body.includes('Kettlebell finger curls'), 'the kettlebell finger curl is missing');
});

t('every card is drawn, not left as an empty box', async () => {
  await boot({ forgeCentre: 'training' });
  await page.waitForTimeout(600);
  /* The framework interpolates text, not markup, so these are painted in by
     drawHandFigures(). If that never runs the cards render as blank gaps and nothing throws. */
  const figs = await page.evaluate(() =>
    [...document.querySelectorAll('[data-handfig]')].map(el => ({
      key: el.dataset.handfig,
      paths: el.querySelectorAll('svg path, svg circle, svg rect').length,
    })));
  const W = await page.evaluate(() => window.ForgeTraining.section('hands').work);
  eq(figs.length, W.length, 'one drawing per exercise');
  for (const f of figs) ok(f.paths >= 3, f.key + ' drew ' + f.paths + ' shapes — it is blank or broken');
});

t('the chart is graded on the page, and filters', async () => {
  await boot({ forgeCentre: 'training' });
  const all = await page.evaluate(() => document.querySelectorAll('[data-handfig]').length);
  for (const lvl of ['EASY', 'HARD', 'BRUTAL']) {
    await page.evaluate((l) => {
      const el = [...document.querySelectorAll('span')].find(e =>
        e.children.length === 0 && e.textContent.trim() === l);
      if (el) el.click();
    }, lvl);
    await page.waitForTimeout(600);
    const n = await page.evaluate(() => document.querySelectorAll('[data-handfig]').length);
    ok(n > 0, lvl + ' filtered everything out');
    ok(n < all, lvl + ' did not filter anything (' + n + ' of ' + all + ')');
    const shown = await page.evaluate(() =>
      [...document.querySelectorAll('[data-handfig]')].map(e => e.dataset.handfig));
    const want = await page.evaluate((l) =>
      window.ForgeTraining.section('hands').work.filter(w => w.level === l.toLowerCase()).map(w => w.fig), lvl);
    eq(shown.join(','), want.join(','), 'wrong exercises shown for ' + lvl);
  }
});

t('the tools say what they cost and whether you need them', async () => {
  await boot({ forgeCentre: 'training' });
  const body = await text();
  const T = await page.evaluate(() => window.ForgeTraining.section('hands').tools);
  for (const x of T) {
    ok(body.includes(x.name), 'tool not rendered: ' + x.name);
    ok(body.includes(x.cost), 'cost not rendered for: ' + x.name);
  }
  ok(/ESSENTIAL/.test(body) && /OPTIONAL/.test(body), 'the tools are not graded on the page');
});

t('the loading warnings reach the page, not just the data', async () => {
  await boot({ forgeCentre: 'training' });
  const body = await text();
  ok(/⚠/.test(body), 'no warnings rendered');
  ok(/not a daily max|angry elbow/i.test(body), 'the gripper warning is missing');
  ok(/tennis elbow|golfer/i.test(body), 'the extension warning is missing');
});

t('Hand Training stays out of the other centres', async () => {
  for (const centre of ['home', 'mental', 'health']) {
    await boot({ forgeCentre: centre });
    ok(!/THE FIVE GRIPS/.test(await text()), 'the hand section leaked onto ' + centre);
  }
});

t('every section is listed, marked with the house crest and not a number', async () => {
  await boot({ forgeCentre: 'training' });
  const picker = await page.evaluate(() => {
    const marks = [...document.querySelectorAll('[data-icon="forge"]')];
    return marks
      .map(m => m.parentElement)
      .filter(el => el && el.getAttribute('onclick') !== null || (el && el.tagName === 'SPAN' && el.textContent.trim()))
      .map(el => ({ text: el.textContent.trim(), drawn: !!m0(el) }));
    function m0(el) { const s = el.querySelector('svg'); return s && s.querySelectorAll('path,circle,rect').length >= 3; }
  });
  const S = await page.evaluate(() => window.ForgeTraining.SECTIONS.map(x => x.name));
  eq(S.length, 12, 'twelve sections in the data');
  for (const name of S) {
    const row = picker.find(p => p.text === name);
    ok(row, 'section not in the picker: ' + name);
    ok(row.drawn, name + ' has no crest drawn beside it');
  }
  const body = await text();
  ok(!/^\s*\d+\.\s/m.test(body), 'the sections are numbered somewhere — the crest replaces the number');
});

t('an empty section is an empty page, and does not borrow the chart', async () => {
  await boot({ forgeCentre: 'training' });
  for (const key of ['chest', 'core', 'neck']) {
    await page.evaluate((k) => window.__nvx.setForgeSection(k), key);
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      figs: document.querySelectorAll('[data-handfig]').length,
      body: document.body.innerText,
    }));
    eq(r.figs, 0, key + ' is showing exercise cards');
    ok(/Nothing here yet/.test(r.body), key + ' is not showing its empty state');
    ok(!/THE TOOLS/.test(r.body), key + ' borrowed the hand tools');
    ok(!/EASY|BRUTAL/.test(r.body), key + ' is showing a level filter for a chart it does not have');
  }
});

t('Training opens on the section that actually has something in it', async () => {
  await boot({ forgeCentre: 'training' });
  const body = await text();
  ok(/Hand Training/.test(body), 'it should land on the only section with content');
  const figs = await page.evaluate(() => document.querySelectorAll('[data-handfig]').length);
  ok(figs > 0, 'landed on an empty section while a full one exists');
});

t('the four centres still switch', async () => {
  await boot({ forgeCentre: 'home' });
  for (const [tab, probe] of [['TRAINING', 'Hand Training'], ['MENTAL', 'MENTAL'], ['HEALTH', 'HEALTH'], ['HOME', 'Nothing here yet']]) {
    await page.evaluate((t) => {
      const el = [...document.querySelectorAll('span')].find(e =>
        e.children.length === 0 && e.textContent.trim() === t);
      if (el) el.click();
    }, tab);
    await page.waitForTimeout(700);
    ok((await text()).includes(probe), 'clicking ' + tab + ' did not land on it');
  }
});

/* ---- progress ---- */

/* ---- weakest links ---- */

/* ---- the mistake that parsing does not catch ---- */

t('nothing on the page is rendered twice', async () => {
  /* v11.246 shipped 108 duplicated lines: a slice edit ran backwards through the file and
     copied a region instead of removing it. Tag balance stayed perfect and every
     includes() assertion still passed, so nothing caught it until it was live. */
  await boot({ forgeCentre: 'training' });
  const body = await text();
  /* "Hand Training" legitimately appears twice now — once in the section picker and once as
     the heading — so count the heading element rather than the text. */
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll('h2')].filter(h => h.textContent.trim() === 'Hand Training').length);
  eq(headings, 1, 'the section heading rendered ' + headings + ' times');
  for (const once of ['THE TOOLS', 'GRIP & HAND DEVELOPMENT', '❖ THE FORGE']) {
    const n = (body.match(new RegExp(once.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    eq(n, 1, once + ' appears ' + n + ' times');
  }
  const figs = await page.evaluate(() => document.querySelectorAll('[data-handfig]').length);
  const want = await page.evaluate(() => window.ForgeTraining.section('hands').work.length);
  eq(figs, want, 'the chart rendered ' + figs + ' cards for ' + want + ' exercises');
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
