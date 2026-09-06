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

t('every section not yet filled in is an empty page', async () => {
  await boot({ forgeCentre: 'training' });
  const S = await page.evaluate(() => window.ForgeTraining.SECTIONS.map(x => x.key));
  const filled = await page.evaluate(() =>
    window.ForgeTraining.SECTIONS.filter(x => x.pool).map(x => x.key));
  eq(S.length, 13, 'thirteen sections');
  for (const key of S) {
    await page.evaluate((k) => window.__nvx.setForgeSection(k), key);
    await page.waitForTimeout(400);
    const body = await text();
    if (key === 'full-body') { ok(/THE SESSION/.test(body), 'Full Body should carry its checklist'); continue; }
    if (filled.includes(key)) { ok(/\bADD\b/.test(body), key + ' should carry its exercise pool'); continue; }
    ok(/Nothing here yet/.test(body), key + ' is not showing its empty state');
    for (const ghost of ['THE TOOLS', 'THE STANDARD', 'EASY', 'BRUTAL', 'Rice bucket', 'Dead hang']) {
      ok(!body.includes(ghost), key + ' is still showing ' + ghost);
    }
  }
  const cards = await page.evaluate(() => document.querySelectorAll('.cc-scene .cc-glowcard').length);
  eq(cards, 2, 'a section should be the sidebar and one empty card, got ' + cards);
});

t('every section is listed, marked with the house crest and not a number', async () => {
  await boot({ forgeCentre: 'training' });
  const picker = await page.evaluate(() =>
    [...document.querySelectorAll('.cc-scene [data-icon="forge"]')]
      .map(m => m.parentElement)
      .filter(el => el && el.tagName === 'DIV' && el.textContent.trim())
      .map(el => {
        const svg = el.querySelector('svg');
        return { text: el.textContent.trim(),
                 drawn: !!svg && svg.querySelectorAll('path,circle,rect').length >= 3 };
      }));
  const S = await page.evaluate(() => window.ForgeTraining.SECTIONS.map(x => x.name));
  eq(S.length, 13, 'thirteen sections in the data');
  for (const name of S) {
    const row = picker.find(p => p.text === name);
    ok(row, 'section not in the picker: ' + name);
    ok(row.drawn, name + ' has no crest drawn beside it');
  }
  const body = await text();
  ok(!/^\s*\d+\.\s/m.test(body), 'the sections are numbered somewhere — the crest replaces the number');
});

/* ---- the Full Body checklist ---- */

/* The session starts empty — the exercises are the user's own, not a prescribed list — so
   openFullBody builds one first. openEmptySession leaves it empty for the tests about
   adding, removing and the empty state. */
async function openEmptySession() {
  await boot({ forgeCentre: 'training' });
  await page.evaluate(() => window.__nvx.setState({
    forgeSection: 'full-body',
    forgeFB: { period: '', mode: 'day', on: '', evId: '', days: [], items: [], done: {}, w: {} },
    fbDraft: { part: 'Chest' }, workouts: [], events: [] }));
  await page.waitForTimeout(600);
}
async function openFullBody() {
  await openEmptySession();
  await page.evaluate(() => {
    const mk = (name, part, sets, reps, minutes) => ({
      id: name.toLowerCase().replace(/\W+/g, '-'), name, part, sets, reps,
      minutes: minutes || 0, dist: 0, distUnit: 'm' });
    window.__nvx.setState({ forgeFB: { ...window.__nvx.state.forgeFB, items: [
      mk('Back squat', 'Legs', 3, 5), mk('Deadlift', 'Back', 1, 5), mk('Bench press', 'Chest', 3, 5),
      mk('Pull-ups', 'Back', 3, 8), mk('Dips', 'Chest', 3, 8), mk('Plank', 'Core', 0, 0, 3) ] } });
  });
  await page.waitForTimeout(500);
}
const logged = async () => {
  const m = /(\d+)\s*\/\s*(\d+)\s*LOGGED/.exec(await text());
  if (!m) throw new Error('no LOGGED counter on the page');
  return { done: +m[1], total: +m[2] };
};
const ticks = () => page.evaluate(() =>
  [...document.querySelectorAll('span')].filter(e => e.textContent.trim() === '✓').length);
const tick = (name) => page.evaluate((n) => {
  const row = [...document.querySelectorAll('span')].find(e =>
    e.children.length === 0 && e.textContent.trim() === n);
  if (!row) throw new Error('no row for ' + n);
  row.click();
}, name);

t('Full Body carries the session checklist', async () => {
  await openFullBody();
  const body = await text();
  const L = await page.evaluate(() => window.__nvx.state.forgeFB.items || []);
  ok(/THE SESSION/.test(body), 'the checklist is missing');
  ok(L.length, 'the fixture built no session');
  for (const it of L) ok(body.includes(it.name), 'not listed: ' + it.name);
  const c0 = await logged();
  eq(c0.done, 0, 'the counter should start at zero');
  eq(c0.total, L.length, 'the counter should count the items in the session');
});

t('ticking an item writes it to the main training log', async () => {
  /* The whole point: one record of what you did, in the same place Fitness HQ writes to —
     not a tally that only the Forge knows about. */
  await openFullBody();
  await tick('Back squat');
  await page.waitForTimeout(700);
  const w = await page.evaluate(() => window.__nvx.state.workouts);
  eq(w.length, 1, 'the set did not reach the training log');
  eq(w[0].exercise, 'Back squat', 'wrong exercise logged');
  eq(w[0].part, 'Legs', 'wrong body part');
  eq(w[0].sets, 3, 'sets not carried through');
  eq(w[0].reps, 5, 'reps not carried through');
  eq((await logged()).done, 1, 'the counter did not move');
});

t('the logged set shows up on Fitness HQ', async () => {
  await openFullBody();
  await tick('Deadlift');
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__nvx.setState({ scene: 'fitness', woPart: 'Back' }));
  await page.waitForTimeout(800);
  ok(/Deadlift/.test(await text()), 'Fitness HQ does not show the set logged on the Forge');
});

t('a blank weight does not pick up whatever is in the Fitness HQ form', async () => {
  /* addWorkout falls back to the Fitness HQ fields for anything left undefined, so an
     unfilled weight here would silently log someone else's number. */
  await openFullBody();
  await page.evaluate(() => window.__nvx.setState({ woWeight: '999', woSets: '7', woReps: '77' }));
  await page.waitForTimeout(300);
  await tick('Pull-ups');
  await page.waitForTimeout(700);
  const w = await page.evaluate(() => window.__nvx.state.workouts[0]);
  eq(w.weight, 0, 'it borrowed the weight from the other form');
  eq(w.sets, 3, 'it borrowed the sets from the other form');
  eq(w.reps, 8, 'it borrowed the reps from the other form');
});

t('a weight typed on the checklist is the weight logged', async () => {
  await openFullBody();
  await page.evaluate(() => {
    const i = [...document.querySelectorAll('input')].find(x => x.placeholder === 'kg');
    i.focus();
  });
  await page.keyboard.type('80');
  await page.waitForTimeout(400);
  await tick('Back squat');
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.workouts[0].weight), 80, 'the typed weight was not used');
});

t('ticking does not wipe what is half-typed in the Fitness HQ form', async () => {
  /* addWorkout empties those fields after a log, which is right when the form is the caller
     and wrong when anything else is — it threw away an entry mid-typing. */
  await openFullBody();
  await page.evaluate(() => window.__nvx.setState({
    woEx: 'Incline press', woWeight: '60', woSets: '3', woReps: '8' }));
  await page.waitForTimeout(300);
  await tick('Back squat');
  await page.waitForTimeout(700);
  const form = await page.evaluate(() => {
    const s = window.__nvx.state;
    return { ex: s.woEx, wt: s.woWeight, sets: s.woSets, reps: s.woReps };
  });
  eq(form.ex, 'Incline press', 'the half-typed exercise was wiped');
  eq(form.wt, '60', 'the half-typed weight was wiped');
  eq(form.sets, '3', 'the half-typed sets were wiped');
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 1, 'and it should still have logged');
});

t('the Fitness HQ form still clears itself when it is the one logging', async () => {
  await boot({ scene: 'fitness' });
  await page.evaluate(() => window.__nvx.setState({
    woPart: 'Chest', woEx: 'Incline press', woWeight: '60', woSets: '3', woReps: '8' }));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.addWorkout({}));
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.woEx), '', 'the form kept its contents after logging');
});

t('unticking takes the set back out of the log', async () => {
  await openFullBody();
  await tick('Bench press');
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 1, 'nothing was logged to undo');
  await tick('Bench press');
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 0, 'unticking left the entry behind');
  eq((await logged()).done, 0, 'the counter did not come back down');
});

t('unticking removes only what that tick logged', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setState({
    workouts: [{ id: 'other', ts: Date.now(), part: 'Chest', exercise: 'Something else', weight: 50, sets: 3, reps: 5 }] }));
  await page.waitForTimeout(300);
  await tick('Dips');
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 2, 'the tick did not log');
  await tick('Dips');
  await page.waitForTimeout(700);
  const left = await page.evaluate(() => window.__nvx.state.workouts.map(w => w.exercise));
  eq(left.join(','), 'Something else', 'unticking took out more than it put in: ' + left.join(', '));
});

t('CLEAR empties the session and everything it logged', async () => {
  await openFullBody();
  await tick('Back squat');
  await tick('Plank');
  await page.waitForTimeout(800);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 2, 'both should be logged');
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'CLEAR');
    el.click();
  });
  await page.waitForTimeout(800);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 0, 'CLEAR left entries in the log');
  eq(await ticks(), 0, 'CLEAR left ticks on the checklist');
});

t('yesterday\'s ticks do not carry into today', async () => {
  await boot({ forgeCentre: 'training' });
  await page.evaluate(() => window.__nvx.setState({
    forgeSection: 'full-body',
    forgeFB: { period: '2020-01-01', mode: 'day', on: '', evId: '',
               done: { squat: { ids: ['x'] }, bench: { ids: ['y'] } }, w: {} } }));
  await page.waitForTimeout(700);
  eq((await logged()).done, 0, 'a stale day is still showing its ticks');
  eq(await ticks(), 0, 'yesterday\'s ticks carried over');
});

t('a timed item logs too, not just the rep ones', async () => {
  /* The log refuses an entry with no reps, minutes or distance, and it does it silently —
     the tick would look like it worked and record nothing. */
  await openFullBody();
  await tick('Plank');
  await page.waitForTimeout(700);
  const w = await page.evaluate(() => window.__nvx.state.workouts);
  eq(w.length, 1, 'a timed item was refused by the log');
  ok(w[0].min > 0, 'the plank logged no minutes');
});

t('the session repeats daily or on a set day', async () => {
  await openFullBody();
  const body = await text();
  for (const m of ['DAILY', 'SCHEDULED']) ok(body.includes(m), m + ' option is missing');
  ok(!/ON A DAY/.test(body), 'the old name is still on the page');
  ok(!/WEEKLY/.test(body), 'the weekly setting is still on the page');
  ok(/TODAY/.test(body), 'it should start on the daily setting');
});

t('a session set for a day goes on the calendar', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx.setForgeFBDate('2026-09-20'));
  await page.waitForTimeout(700);
  const ev = await page.evaluate(() => window.__nvx.state.events);
  eq(ev.length, 1, 'no calendar event was created');
  eq(ev[0].date, '2026-09-20', 'the event is on the wrong day');
  ok(/Full Body/.test(ev[0].title), 'the event is not named for the session');
  ok(/On your calendar/.test(await text()), 'the page does not say it is on the calendar');
});

t('the event really shows on the main calendar', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.setForgeFBDate('2026-09-20'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setState({ scene: 'calendar', calSel: '2026-09-20' }));
  await page.waitForTimeout(900);
  ok(/Full Body session/.test(await text()), 'the calendar page does not show the session');
});

t('moving the day moves the event rather than leaving two', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.setForgeFBDate('2026-09-20'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setForgeFBDate('2026-09-27'));
  await page.waitForTimeout(700);
  const ev = await page.evaluate(() => window.__nvx.state.events);
  eq(ev.length, 1, 'changing the day left ' + ev.length + ' events behind');
  eq(ev[0].date, '2026-09-27', 'the event did not move');
});

t('switching back off a set day takes the event with it', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.setForgeFBDate('2026-09-20'));
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => window.__nvx.state.events.length), 1, 'nothing to remove');
  await page.evaluate(() => window.__nvx.setForgeFBMode('day'));
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.events.length), 0, 'the calendar kept a session that is no longer scheduled');
});

t('weights survive the period rolling over', async () => {
  await openFullBody();
  await page.evaluate(() => {
    const i = [...document.querySelectorAll('input')].find(x => x.placeholder === 'kg');
    i.focus();
  });
  await page.keyboard.type('80');
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx.setState({
    forgeFB: { ...window.__nvx.state.forgeFB, period: '2020-01-01' } }));
  await page.waitForTimeout(600);
  const w = await page.evaluate(() => window.__nvx.state.forgeFB.w);
  ok(w && Object.keys(w).length, 'the weights were wiped with the ticks');
});

/* ---- the session is the user's own ---- */

t('the session starts empty, with nothing prescribed', async () => {
  /* A sensible-looking ten was shipped here once. It was still fiction. */
  await openEmptySession();
  const body = await text();
  ok(/Nothing in the session yet/.test(body), 'it should say the session is empty');
  eq(await page.evaluate(() => (window.__nvx.state.forgeFB.items || []).length), 0, 'items are pre-filled');
  const prescribed = await page.evaluate(() => !!window.ForgeTraining.section('full-body').checklist);
  ok(!prescribed, 'the section data still carries a prescribed list');
  for (const ghost of ['Back squat', 'Deadlift', 'Bench press', 'Farmer', 'Plank'])
    ok(!body.includes(ghost), ghost + ' is still being suggested');
});

t('an exercise can be added, and it is yours', async () => {
  await openEmptySession();
  await page.evaluate(() => {
    window.__nvx.setFbDraft('name', 'Zercher squat'); window.__nvx.setFbDraft('part', 'Legs');
    window.__nvx.setFbDraft('sets', '4'); window.__nvx.setFbDraft('reps', '6');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.addForgeFBItem());
  await page.waitForTimeout(600);
  const it = await page.evaluate(() => window.__nvx.state.forgeFB.items[0]);
  ok(it, 'nothing was added');
  eq(it.name, 'Zercher squat', 'wrong name');
  eq(it.part, 'Legs', 'wrong body part');
  const body = await text();
  ok(body.includes('Zercher squat'), 'it is not on the list');
  ok(body.includes('4 × 6'), 'the target was not derived: ' + (body.match(/Zercher[\s\S]{0,40}/) || [])[0]);
});

t('an item with nothing to log is refused rather than ticking into nothing', async () => {
  /* The log silently drops an entry with no reps, minutes or distance, so the tick would
     look like it worked and record nothing. */
  await openEmptySession();
  await page.evaluate(() => {
    window.__nvx.setFbDraft('name', 'Stretching'); window.__nvx.setFbDraft('sets', '3');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.addForgeFBItem());
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => (window.__nvx.state.forgeFB.items || []).length), 0,
     'an unloggable item was added');
  await page.evaluate(() => window.__nvx.setFbDraft('reps', '10'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__nvx.addForgeFBItem());
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => (window.__nvx.state.forgeFB.items || []).length), 1,
     'it should be accepted once it has reps');
});

t('removing an item takes its logged sets with it', async () => {
  /* Otherwise the log keeps sets belonging to an exercise that no longer exists, and no
     tick can ever remove them. */
  await openFullBody();
  await tick('Back squat');
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 1, 'nothing logged to check');
  await page.evaluate(() => {
    const id = window.__nvx.state.forgeFB.items.find(i => i.name === 'Back squat').id;
    window.__nvx.removeForgeFBItem(id);
  });
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.workouts.length), 0, 'the logged set was orphaned');
  /* The toast from the tick still says the name, so check the row itself rather than the
     page text. */
  const row = await page.evaluate(() =>
    [...document.querySelectorAll('span')].some(e => e.children.length === 0 && e.textContent.trim() === 'Back squat'));
  ok(!row, 'the item is still on the list');
  eq(await page.evaluate(() => window.__nvx.state.forgeFB.items.some(i => i.name === 'Back squat')), false,
     'the item is still in the session');
});

t('the list survives the day rolling over', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setState({
    forgeFB: { ...window.__nvx.state.forgeFB, period: '2020-01-01' } }));
  await page.waitForTimeout(600);
  const n = await page.evaluate(() => (window.__nvx.state.forgeFB.items || []).length);
  ok(n > 0, 'the session emptied itself overnight');
});

/* ---- a section's exercise pool ---- */

const addBtns = () => page.evaluate(() =>
  [...document.querySelectorAll('span')]
    .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD').length);

/* A stepper group is a span, not a div, so the row is found by looking for the element that
   holds both the label and a minus button rather than by tag. */
async function installRowFinder() {
  await page.evaluate(() => {
    window.findRow = (card, label) => {
      if (!card) return null;
      return [...card.querySelectorAll('div,span')].find(r => {
        const s = r.querySelector('span');
        if (!s || s.textContent.trim() !== label) return false;
        return !!r.querySelector('input') && [...r.querySelectorAll('span')]
          .some(e => e.children.length === 0 && e.textContent.trim() === '−');
      }) || null;
    };
  });
}

const poolTabs = () => page.evaluate(() => {
  const hint = [...document.querySelectorAll('span')]
    .find(e => e.children.length === 0 && /Adds to your Full Body session/.test(e.textContent));
  if (!hint) return null;
  /* The hint renders inside a span.sc-interp, so its parent is that wrapper span, not the
     row — walk up to the row div the tabs share with it. */
  const row = hint.closest('div');
  if (!row) return null;
  return [...row.querySelectorAll('span')]
    .filter(e => e.children.length === 0)
    .map(e => e.textContent.trim())
    .filter(t => t === 'GYM' || t === 'HOME' || t === 'ALL');
});

async function openChest() {
  await boot({ forgeCentre: 'training' });
  await page.evaluate(() => window.__nvx.setState({
    forgeSection: 'chest', forgePool: 'gym',
    forgeFB: { period: '', mode: 'day', on: '', evId: '', items: [], done: {}, w: {} },
    workouts: [], events: [] }));
  await page.waitForTimeout(700);
  await installRowFinder();
}

t('Chest lists its session, in order, with no split it does not have', async () => {
  await openChest();
  const D = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all);
  eq(await addBtns(), D.length, 'the chest list did not render one block each');
  const body = await text();
  for (const x of D) ok(body.includes(x.name), 'missing from the chest list: ' + x.name);

  /* The order is the training priority, so it has to survive to the page. */
  const shown = await page.evaluate(() => [...document.querySelectorAll('.cc-glowcard')]
    .map(c => (c.querySelector('div') || {}).textContent)
    .map(t => (t || '').trim()).filter(Boolean));
  const idx = D.map(x => shown.findIndex(t => t.startsWith(x.name)));
  for (let i = 1; i < idx.length; i++)
    ok(idx[i] > idx[i - 1], 'the list is out of priority order at ' + D[i].name);

  const tabs = await poolTabs();
  eq(tabs.join(','), '', 'chest is showing a gym/home split it does not have');
  ok(body.includes('TRAINING PRIORITY'), 'the training priority is not on the page');
});

t('a section with two lists still shows its tabs', async () => {
  await openChest();
  await page.evaluate(() => window.__nvx.setForgeSection('shoulders'));
  await page.waitForTimeout(800);
  eq((await poolTabs()).join(','), 'GYM,HOME', 'shoulders lost its gym/home tabs');
  const D = await page.evaluate(() => window.ForgeTraining.section('shoulders').pool);
  eq(await addBtns(), D.gym.length, 'the gym list did not render one block each');
  await page.evaluate(() => window.__nvx.setForgePool('home'));
  await page.waitForTimeout(700);
  eq(await addBtns(), D.home.length, 'the home list did not render one block each');
  ok(!(await text()).includes(D.gym[0].name), 'the gym list is still showing under HOME');
});

t('a range is offered as a range', async () => {
  await openChest();
  const D = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all);
  const body = await text();
  const r = D[0];
  ok(body.includes(r.sets + '–' + r.setsMax + ' SETS'), 'the sets range is not shown');
  ok(body.includes(r.reps + '–' + r.repsMax), 'the reps range is not shown');
  ok(body.includes('PER SIDE'), 'a per-side exercise does not say so');
  /* The block starts at the bottom of the range — the top is something to work up to. */
  eq(await stepVal(r.name, 'REPS'), String(r.reps), 'the block did not start at the low end');
});

t('adding one puts it in the Full Body daily session', async () => {
  await openChest();
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD');
    b[0].click();
  });
  await page.waitForTimeout(700);
  const items = await page.evaluate(() => window.__nvx.state.forgeFB.items);
  eq(items.length, 1, 'nothing was added to the session');
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  eq(items[0].name, src.name, 'the wrong exercise was added');
  eq(items[0].part, 'Chest', 'it did not carry the body part');
  eq(items[0].sets, src.sets, 'sets were not carried across');
  eq(items[0].reps, src.reps, 'reps were not carried across');

  /* And it is really on the Full Body list, not just in state. */
  await page.evaluate(() => window.__nvx.setForgeSection('full-body'));
  await page.waitForTimeout(800);
  ok((await text()).includes(src.name), 'it is not on the Full Body checklist');
});

t('an added exercise reads as added and cannot be added twice', async () => {
  await openChest();
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD');
    b[0].click();
  });
  await page.waitForTimeout(700);
  const added = await page.evaluate(() =>
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADDED').length);
  eq(added, 1, 'the block does not read as added');
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADDED');
    b[0].click();
  });
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => window.__nvx.state.forgeFB.items.length), 1, 'it was added twice');
});

t('an added exercise ticks and logs like any other', async () => {
  /* The point of the join: a pooled exercise is a real session item, not a shortcut that
     bypasses the log. */
  await openChest();
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD');
    b[0].click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setForgeSection('full-body'));
  await page.waitForTimeout(700);
  const name = await page.evaluate(() => window.__nvx.state.forgeFB.items[0].name);
  await tick(name);
  await page.waitForTimeout(800);
  const w = await page.evaluate(() => window.__nvx.state.workouts);
  eq(w.length, 1, 'ticking it logged nothing');
  eq(w[0].part, 'Chest', 'it logged against the wrong body part');
});

/* ---- the weight and reps steppers on a pool block ---- */

/* A stepper belongs to one exercise, so it is addressed by walking up from the exercise's
   name to its card. The name renders inside a span.sc-interp, so the card is found with
   closest() rather than by climbing parents. */
const stepClick = (name, label, sign) => page.evaluate(([n, l, g]) => {
  const title = [...document.querySelectorAll('span')]
    .find(e => e.children.length === 0 && e.textContent.trim() === n);
  if (!title) throw new Error('no block for ' + n);
  const card = title.closest('.cc-glowcard');
  const row = findRow(card, l);
  if (!row) throw new Error('no ' + l + ' row on ' + n);
  const btn = [...row.querySelectorAll('span')]
    .filter(e => e.children.length === 0 && e.textContent.trim() === g)[0];
  if (!btn) throw new Error('no ' + g + ' button on the ' + l + ' row');
  btn.click();
}, [name, label, sign]);

const stepVal = (name, label) => page.evaluate(([n, l]) => {
  const title = [...document.querySelectorAll('span')]
    .find(e => e.children.length === 0 && e.textContent.trim() === n);
  if (!title) throw new Error('no block for ' + n);
  const row = findRow(title.closest('.cc-glowcard'), l);
  if (!row) throw new Error('no ' + l + ' row on ' + n);
  const el = row.querySelector('input');
  return el.value === '' ? '—' : el.value;
}, [name, label]);

/* Typing into the field, the way a user would: set the value and fire the input event the
   framework listens for, then blur so the clamp lands. */
const stepType = (name, label, text) => page.evaluate(([n, l, t]) => {
  const title = [...document.querySelectorAll('span')]
    .find(e => e.children.length === 0 && e.textContent.trim() === n);
  if (!title) throw new Error('no block for ' + n);
  const row = findRow(title.closest('.cc-glowcard'), l);
  if (!row) throw new Error('no ' + l + ' row on ' + n);
  const el = row.querySelector('input');
  el.value = t;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, [name, label, text]);

const MINUS = '−';

t('every pool block carries a weight and a reps stepper', async () => {
  await openChest();
  const n = await addBtns();
  const counts = await page.evaluate(() => {
    const t = (s) => [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === s).length;
    return { w: t('WEIGHT'), r: t('REPS'),
             noLoad: window.ForgeTraining.section('chest').pool.all.filter(x => x.noLoad).length };
  });
  eq(counts.w, n - counts.noLoad, 'the wrong number of blocks carry a weight stepper');
  eq(counts.r, n, 'not every block has a reps stepper');

  /* Reps start on the pool's own figure; weight starts at bodyweight, because the app has
     no business guessing what the user can lift. */
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  eq(await stepVal(src.name, 'REPS'), String(src.reps), 'reps did not start on the pool figure');
  eq(await stepVal(src.name, 'WEIGHT'), '—', 'the app should not guess what someone can lift');
});

t('stepping sets the numbers the exercise is added with', async () => {
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await stepClick(src.name, 'WEIGHT', '+');
  await stepClick(src.name, 'WEIGHT', '+');
  await stepClick(src.name, 'REPS', '+');
  await page.waitForTimeout(600);
  eq(await stepVal(src.name, 'WEIGHT'), '5', 'the weight did not step up in 2.5kg jumps');
  eq(await stepVal(src.name, 'REPS'), String(src.reps + 1), 'the reps did not step up');

  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => window.__nvx.state.forgeFB);
  eq(st.items[0].reps, src.reps + 1, 'the session took the pool reps, not the stepped ones');
  eq(parseFloat(st.w[st.items[0].id]), 5, 'the chosen weight did not reach the session');
});

t('the chosen weight is what gets logged', async () => {
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await stepClick(src.name, 'WEIGHT', '+');
  await stepClick(src.name, 'WEIGHT', '+');
  await stepClick(src.name, 'WEIGHT', '+');
  await stepClick(src.name, 'WEIGHT', '+');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setForgeSection('full-body'));
  await page.waitForTimeout(700);
  await tick(src.name);
  await page.waitForTimeout(800);
  const w = await page.evaluate(() => window.__nvx.state.workouts);
  eq(w.length, 1, 'ticking it logged nothing');
  eq(w[0].weight, 10, 'the training log did not get the weight set on the block');
});

t('weight will not step below bodyweight and reps will not reach zero', async () => {
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await stepClick(src.name, 'WEIGHT', MINUS);
  await stepClick(src.name, 'WEIGHT', MINUS);
  await page.waitForTimeout(500);
  eq(await stepVal(src.name, 'WEIGHT'), '—', 'the weight went negative');
  for (let i = 0; i < src.reps + 3; i++) await stepClick(src.name, 'REPS', MINUS);
  await page.waitForTimeout(500);
  eq(await stepVal(src.name, 'REPS'), '1', 'reps stepped down past one');
});

t('once added the steppers drive the session item itself', async () => {
  /* Two places showing the same exercise must not be able to disagree, so after it is added
     the block edits the session item rather than a private copy. */
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(700);
  await stepClick(src.name, 'REPS', '+');
  await stepClick(src.name, 'WEIGHT', '+');
  await page.waitForTimeout(600);
  const st = await page.evaluate(() => window.__nvx.state.forgeFB);
  eq(st.items[0].reps, src.reps + 1, 'the session item did not follow the stepper');
  eq(parseFloat(st.w[st.items[0].id]), 2.5, 'the session weight did not follow the stepper');
  eq(await stepVal(src.name, 'REPS'), String(src.reps + 1), 'the block is showing a stale figure');

  /* And the Full Body list shows the same numbers. */
  await page.evaluate(() => window.__nvx.setForgeSection('full-body'));
  await page.waitForTimeout(800);
  ok((await text()).includes((src.sets || 1) + ' × ' + (src.reps + 1)),
    'the Full Body checklist is showing different numbers to the block');
});

t('the steppers freeze once the set is in the log', async () => {
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setForgeSection('full-body'));
  await page.waitForTimeout(700);
  await tick(src.name);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__nvx.setForgeSection('chest'));
  await page.waitForTimeout(700);

  ok((await text()).includes('LOGGED'), 'the block does not say the set is logged');
  await stepClick(src.name, 'REPS', '+');
  await stepClick(src.name, 'WEIGHT', '+');
  await page.waitForTimeout(600);
  const st = await page.evaluate(() => window.__nvx.state.forgeFB);
  eq(st.items[0].reps, src.reps, 'a logged set was edited from the block');
  eq(await stepVal(src.name, 'REPS'), String(src.reps), 'the block let a logged set change');
  const w = await page.evaluate(() => window.__nvx.state.workouts);
  eq(w.length, 1, 'the log picked up a second entry');
  eq(w[0].reps, src.reps, 'the logged entry drifted from what was logged');
});

t('you can type the numbers instead of stepping to them', async () => {
  /* Stepping from nothing to 100kg is twenty presses. The field is the point. */
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await stepType(src.name, 'WEIGHT', '100');
  await stepType(src.name, 'REPS', '12');
  await page.waitForTimeout(600);
  eq(await stepVal(src.name, 'WEIGHT'), '100', 'the typed weight did not stick');
  eq(await stepVal(src.name, 'REPS'), '12', 'the typed reps did not stick');

  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => window.__nvx.state.forgeFB);
  eq(st.items[0].reps, 12, 'the session took the pool reps, not the typed ones');
  eq(parseFloat(st.w[st.items[0].id]), 100, 'the typed weight did not reach the session');
});

t('a typed number can be cleared and retyped', async () => {
  /* Clamping on every keystroke put a 1 back the moment the last digit was deleted, so the
     field could never be emptied to type a different number. */
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  const el = (label) => page.evaluate(([n, l]) => {
    const title = [...document.querySelectorAll('span')]
      .find(e => e.children.length === 0 && e.textContent.trim() === n);
    const row = findRow(title.closest('.cc-glowcard'), l);
    const i = row.querySelector('input');
    i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true }));
    return null;
  }, [src.name, label]);
  await el('REPS');
  await page.waitForTimeout(500);
  eq(await page.evaluate(([n, l]) => {
    const title = [...document.querySelectorAll('span')]
      .find(e => e.children.length === 0 && e.textContent.trim() === n);
    return findRow(title.closest('.cc-glowcard'), l).querySelector('input').value;
  }, [src.name, 'REPS']), '', 'the field refilled itself while it was being cleared');

  await stepType(src.name, 'REPS', '9');
  await page.waitForTimeout(500);
  eq(await stepVal(src.name, 'REPS'), '9', 'the retyped number did not take');
});

t('a field left empty settles on something loggable', async () => {
  /* An item with no reps adds to the session and then records nothing when ticked, so the
     value behind an emptied field has to stay loggable even while it shows empty. */
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await stepType(src.name, 'REPS', '');
  await page.waitForTimeout(600);
  eq(await stepVal(src.name, 'REPS'), '—', 'the field would not stay empty to be retyped');
  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(700);
  const items = await page.evaluate(() => window.__nvx.state.forgeFB.items);
  ok(items[0].reps > 0, 'an exercise with nothing to log reached the session');
});

t('typed numbers are held to the same limits as the buttons', async () => {
  await openChest();
  const src = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all[0]);
  await stepType(src.name, 'WEIGHT', '9999');
  await stepType(src.name, 'REPS', '9999');
  await page.waitForTimeout(600);
  eq(await stepVal(src.name, 'WEIGHT'), '500', 'the weight was not capped');
  eq(await stepVal(src.name, 'REPS'), '100', 'the reps were not capped');
  /* And the number the session gets is the capped one, not what was typed. */
  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => window.__nvx.state.forgeFB);
  eq(st.items[0].reps, 100, 'an out-of-range rep count reached the session');
  eq(parseFloat(st.w[st.items[0].id]), 500, 'an out-of-range weight reached the session');
});

t('the add button follows every raiment', async () => {
  /* Asserted on the colour the browser actually paints, not on the CSS being present: the
     token could resolve to nothing and the button would silently fall back to transparent. */
  await openChest();
  const paint = (style) => page.evaluate((st) => {
    window.__nvx.setPref('theme', st === 'base' ? 'Lime' : 'Ultra');
    if (st !== 'base') window.__nvx.setPref('ultraStyle', st);
    return new Promise(r => setTimeout(() => {
      const b = [...document.querySelectorAll('span')]
        .find(e => e.children.length === 0 && e.textContent.trim() === 'ADD');
      if (!b) return r(null);
      /* The label renders inside a span.sc-interp; the styling is on its parent. */
      const cs = getComputedStyle(b.classList.contains('sc-interp') ? b.parentElement : b);
      r({ bg: cs.backgroundColor, ink: cs.color });
    }, 500));
  }, style);

  const seen = {};
  for (const st of ['Ultra X', 'Noir', 'Maison Élysée', 'Maison Éverpine', 'base']) {
    const got = await paint(st);
    ok(got, 'no add button under ' + st);
    ok(/^rgb/.test(got.bg) && !/rgba\(0, 0, 0, 0\)/.test(got.bg),
      st + ' left the add button with no background: ' + got.bg);
    ok(/^rgb/.test(got.ink), st + ' left the add button with no ink');
    seen[st] = got.bg;
  }
  /* The four raiments must not all paint the same button — that would mean the token never
     resolved and everything fell through to one default. */
  const raiments = ['Ultra X', 'Noir', 'Maison Élysée', 'Maison Éverpine'].map(k => seen[k]);
  eq(new Set(raiments).size, 4, 'the raiments paint the add button ' +
    new Set(raiments).size + ' different ways, not 4');
  await page.evaluate(() => window.__nvx.setPref('theme', 'Lime'));
  await page.waitForTimeout(400);
});

t('on a phone the section list does not sit under the exercises', async () => {
  /* The list is sticky so it stays beside the exercises on a wide screen. On a phone the
     grid folds to one column and it is above them — pinned there it stayed put while the
     blocks scrolled over it, and its rows read through the gaps between them. */
  await page.setViewportSize({ width: 390, height: 780 });
  await openChest();
  const overlapAfterScrolling = await page.evaluate(async () => {
    const scroller = document.querySelector('.cc-scene') || document.scrollingElement;
    const hit = () => {
      const nav = document.querySelector('.forge-secnav');
      if (!nav) return 'no section list';
      const n = nav.getBoundingClientRect();
      const cards = [...document.querySelectorAll('.cc-glowcard')].filter(c => c !== nav);
      for (const c of cards) {
        const r = c.getBoundingClientRect();
        if (r.height < 10) continue;
        if (r.top < n.bottom - 2 && r.bottom > n.top + 2) return 'overlap';
      }
      return '';
    };
    for (const y of [0, 300, 700, 1200]) {
      scroller.scrollTop = y;
      await new Promise(r => setTimeout(r, 220));
      const bad = hit();
      if (bad) return bad + ' at scrollTop ' + y;
    }
    return '';
  });
  eq(overlapAfterScrolling, '', 'the section list is under the exercise blocks');
  await page.setViewportSize({ width: 1280, height: 1400 });
});

t('on a wide screen the section list still pins beside the exercises', async () => {
  await openChest();
  const pos = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.forge-secnav')).position);
  eq(pos, 'sticky', 'the section list stopped pinning on desktop too');
});

t('the add button stays on the right whatever the block carries', async () => {
  /* A block with a weight as well as reps used to wrap the button underneath, where it sat
     on the left — so two blocks in the same list disagreed about where their button was. */
  await page.setViewportSize({ width: 390, height: 780 });
  await openChest();
  const rows = await page.evaluate(() => {
    const out = [];
    for (const inner of document.querySelectorAll('span')) {
      if (inner.children.length || inner.textContent.trim() !== 'ADD') continue;
      const btn = inner.classList.contains('sc-interp') ? inner.parentElement : inner;
      const card = btn.closest('.cc-glowcard');
      const name = (card.querySelector('div') || {}).textContent.trim();
      const b = btn.getBoundingClientRect(), c = card.getBoundingClientRect();
      out.push({ name, rightGap: Math.round(c.right - b.right), leftGap: Math.round(b.left - c.left) });
    }
    return out;
  });
  ok(rows.length >= 12, 'only ' + rows.length + ' blocks found');
  for (const r of rows)
    ok(r.rightGap < r.leftGap, r.name + ': the button is on the left, not the right');
  /* And they all agree — a weighted block and a bodyweight one line up. */
  eq(new Set(rows.map(r => r.rightGap)).size, 1,
    'the buttons do not line up with each other');
  await page.setViewportSize({ width: 1280, height: 1400 });
});

t('the blocks and the button are curved', async () => {
  await openChest();
  const r = await page.evaluate(() => {
    const inner = [...document.querySelectorAll('span')]
      .find(e => e.children.length === 0 && e.textContent.trim() === 'ADD');
    const b = inner.classList.contains('sc-interp') ? inner.parentElement : inner;
    const card = b.closest('.cc-glowcard');
    const px = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    return { card: px(card), btn: px(b), input: px(card.querySelector('input')) };
  });
  ok(r.card >= 10, 'the block is not curved: ' + r.card + 'px');
  ok(r.btn >= 10, 'the add button is not curved: ' + r.btn + 'px');
  ok(r.input >= 6, 'the fields are not curved: ' + r.input + 'px');
});

t('an exercise with nothing to load shows reps only', async () => {
  /* A press-up has no weight to dial; a weight stepper on it would sit unset for ever. */
  await openChest();
  const counts = await page.evaluate(() => {
    const t = (s) => [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === s).length;
    const L = window.ForgeTraining.section('chest').pool.all;
    return { w: t('WEIGHT'), r: t('REPS'),
             noLoad: L.filter(x => x.noLoad).length, total: L.length };
  });
  ok(counts.noLoad > 0, 'nothing in the chest list is marked as having no load');
  eq(counts.r, counts.total, 'every block should still have its reps');
  eq(counts.w, counts.total - counts.noLoad, 'a weight stepper appeared on something with nothing to load');
});

t('the shoulders pool renders and adds like chest', async () => {
  await openChest();
  await page.evaluate(() => window.__nvx.setForgeSection('shoulders'));
  await page.waitForTimeout(800);
  const D = await page.evaluate(() => window.ForgeTraining.section('shoulders').pool);
  eq(await addBtns(), D.gym.length, 'the shoulders gym list did not render one block each');
  await page.evaluate(() => {
    [...document.querySelectorAll('span')]
      .filter(e => e.children.length === 0 && e.textContent.trim() === 'ADD')[0].click();
  });
  await page.waitForTimeout(700);
  const items = await page.evaluate(() => window.__nvx.state.forgeFB.items);
  eq(items.length, 1, 'nothing was added to the session');
  eq(items[0].part, 'Shoulders', 'it did not log against Shoulders');
});

t('a home exercise you can load still gets its weight stepper', async () => {
  /* Chest at home is all bodyweight and bands; shoulders has the backpack lifts, which you
     really do load — so the stepper follows the exercise, not the GYM/HOME tab. */
  await openChest();
  await page.evaluate(() => window.__nvx.setForgeSection('shoulders'));
  await page.evaluate(() => window.__nvx.setForgePool('home'));
  await page.waitForTimeout(800);
  const D = await page.evaluate(() => window.ForgeTraining.section('shoulders').pool.home);
  const loaded = D.filter(x => !x.noLoad);
  ok(loaded.length > 0, 'no loadable home exercise to test with');
  const w = await page.evaluate(() => [...document.querySelectorAll('span')]
    .filter(e => e.children.length === 0 && e.textContent.trim() === 'WEIGHT').length);
  eq(w, loaded.length, 'the wrong number of home blocks carry a weight stepper');
  const src = loaded[0];
  eq(await stepVal(src.name, 'WEIGHT'), '—', 'a loadable exercise should start unset');
  await stepClick(src.name, 'WEIGHT', '+');
  await page.waitForTimeout(500);
  eq(await stepVal(src.name, 'WEIGHT'), '2.5', 'a loaded backpack could not be set');
});

t('the pool does not appear on a section that has none', async () => {
  await boot({ forgeCentre: 'training' });
  for (const key of ['neck', 'calves']) {
    await page.evaluate((k) => window.__nvx.setForgeSection(k), key);
    await page.waitForTimeout(500);
    const body = await text();
    ok(/Nothing here yet/.test(body), key + ' should still be empty');
    ok(!/\bADD\b/.test(body) && !/GYM/.test(body), key + ' is showing an exercise pool');
  }
});

/* ---- the week ---- */

t('a scheduled session shows on the week and on the main calendar', async () => {
  /* Both read the same event, so they cannot disagree — it is one session shown twice. */
  await openFullBody();
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(400);
  const day = await page.evaluate(() => window.__nvx.fbWeek()[3].date);
  await page.evaluate((d) => window.__nvx.setForgeFBDate(d), day);
  await page.waitForTimeout(800);

  const marked = await page.evaluate(() => window.__nvx.fbWeek().filter(d => d.scheduled).map(d => d.date));
  eq(marked.join(','), day, 'the week does not mark the scheduled day');
  const ev = await page.evaluate(() => window.__nvx.state.events.map(e => e.title + '|' + e.date));
  eq(ev.join(','), 'Full Body session|' + day, 'the calendar event is wrong');

  await page.evaluate((d) => window.__nvx.setState({ scene: 'calendar', calSel: d }), day);
  await page.waitForTimeout(900);
  ok(/Full Body session/.test(await text()), 'the main calendar does not show it');
});

t('the week can be used to pick the day', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(500);
  const day = await page.evaluate(() => window.__nvx.fbWeek()[5].date);
  await page.evaluate((d) => {
    const cells = [...document.querySelectorAll('div')].filter(e => e.getAttribute('style') && /grid-template-columns:repeat\(7/.test(e.getAttribute('style')));
    return cells.length;
  }, day);
  await page.evaluate((d) => window.__nvx.setForgeFBDate(d), day);
  await page.waitForTimeout(700);
  eq(await page.evaluate(() => window.__nvx.state.forgeFB.on), day, 'picking a day did not set it');
  const sel = await page.evaluate(() => window.__nvx.fbWeek().filter(d => d.selected).length);
  eq(sel, 1, 'exactly one day should read as selected');
});

t('the week marks the days something was actually logged', async () => {
  await openFullBody();
  await tick('Deadlift');
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__nvx.setForgeFBMode('date'));
  await page.waitForTimeout(700);
  const today = await page.evaluate(() => window.__nvx.fbWeek().find(d => d.isToday));
  ok(today.logged > 0, 'today should be marked as logged');
});

t('an old weekly setting is cleaned up rather than stranded', async () => {
  /* Someone who had picked weekly days keeps a repeating session on their calendar, and once
     the setting is gone there is no control left anywhere that could remove it. */
  await openFullBody();
  await page.evaluate(() => {
    window.__nvx.setState({
      events: [{ id: 'old-weekly', title: 'Full Body session', date: '2026-08-31', time: '09:00',
                 repeat: ['MON', 'WED'], kind: 'general' }],
      forgeFB: { ...window.__nvx.state.forgeFB, mode: 'week', days: ['MON', 'WED'], evId: 'old-weekly' } });
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx._fbMigrateWeekly());
  await page.waitForTimeout(700);
  const f = await page.evaluate(() => window.__nvx.state.forgeFB);
  eq(f.mode, 'day', 'the stored weekly setting was not dropped');
  ok(!f.days, 'the picked days were left behind');
  eq(await page.evaluate(() => window.__nvx.state.events.length), 0,
     'the repeating session was left on the calendar with nothing able to remove it');
});

t('a stored weekly setting reads as daily even before the cleanup runs', async () => {
  await openFullBody();
  await page.evaluate(() => window.__nvx.setState({
    forgeFB: { ...window.__nvx.state.forgeFB, mode: 'week' } }));
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => window.__nvx._fb().mode), 'day', 'it did not fall back to daily');
  ok(/TODAY/.test(await text()), 'the page should read as the daily setting');
});

t('the week is not shown on the daily setting', async () => {
  await openFullBody();
  const body = await text();
  ok(!/MON[\s\S]{0,60}SUN/.test(body), 'the week strip is showing on the daily setting');
});

t('the section list is a sidebar beside the section, not above it', async () => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await boot({ forgeCentre: 'training' });
  const box = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.cc-scene [data-icon="forge"]')]
      .map(m => m.parentElement).find(el => el && /Shoulders/.test(el.textContent));
    const h2 = document.querySelector('.cc-scene h2');
    if (!row || !h2) return null;
    const a = row.getBoundingClientRect(), b = h2.getBoundingClientRect();
    return { railRight: a.right, paneLeft: b.left, railTop: a.top, paneTop: b.top };
  });
  ok(box, 'could not find both the rail and the section');
  ok(box.paneLeft >= box.railRight - 2,
     'the section should sit to the right of the rail, not under it: ' + JSON.stringify(box));
});

t('one sidebar row is lit, and it is the section that is open', async () => {
  await boot({ forgeCentre: 'training' });
  await page.evaluate(() => window.__nvx.setForgeSection('calves'));
  await page.waitForTimeout(500);
  const lit = await page.evaluate(() =>
    [...document.querySelectorAll('.cc-scene [data-icon="forge"]')]
      .map(m => m.parentElement)
      /* The page crest is also a forge mark with a background, and it has no label — only
         rows with a name are sidebar rows. */
      .filter(el => el && el.tagName === 'DIV' && el.textContent.trim()
                    && el.style.background && el.style.background !== 'rgba(0, 0, 0, 0)')
      .map(el => el.textContent.trim()));
  eq(lit.length, 1, 'exactly one row should be lit: ' + lit.join(', '));
  eq(lit[0], 'Calves', 'the wrong row is lit');
  eq(await page.evaluate(() => document.querySelector('.cc-scene h2').textContent.trim()), 'Calves',
     'the pane did not follow the sidebar');
});

t('the four centres still switch', async () => {
  await boot({ forgeCentre: 'home' });
  for (const [tab, probe] of [['TRAINING', 'Chest'], ['MENTAL', 'MENTAL'], ['HEALTH', 'HEALTH'], ['HOME', 'Nothing here yet']]) {
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
  await openChest();
  const body = await text();
  const blocks = await addBtns();
  const pool = await page.evaluate(() => window.ForgeTraining.section('chest').pool.all.length);
  eq(blocks, pool, 'the exercise pool rendered ' + blocks + ' blocks for ' + pool + ' exercises');
  /* "Hand Training" legitimately appears twice now — once in the section picker and once as
     the heading — so count the heading element rather than the text. */
  const headings = await page.evaluate(() => document.querySelectorAll('h2').length);
  eq(headings, 1, 'the section heading rendered ' + headings + ' times');
  /* Training opens on Chest now, which has a pool rather than an empty state, so the empty
     state is checked on a section that still has one. */
  await page.evaluate(() => window.__nvx.setForgeSection('neck'));
  await page.waitForTimeout(600);
  const emptyBody = await text();
  eq(emptyBody.split('Nothing here yet').length - 1, 1, 'the empty state rendered more than once');
  for (const once of ['❖ THE FORGE']) {
    const n = (body.match(new RegExp(once.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    eq(n, 1, once + ' appears ' + n + ' times');
  }
  /* One section body, whichever is open — the duplication this catches was a whole block
     copied, so the count is the signal. */
  const bodies = await page.evaluate(() =>
    [...document.querySelectorAll('h2')].length);
  eq(bodies, 1, 'the section body rendered ' + bodies + ' times');
  const picker = await page.evaluate(() => document.querySelectorAll('.cc-scene [data-icon="forge"]').length);
  const want = await page.evaluate(() => window.ForgeTraining.SECTIONS.length);
  ok(picker >= want, 'the picker lists ' + picker + ' entries for ' + want + ' sections');
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
