/* The log gate:  node log-gate.test.mjs

   Nothing goes into a log without being read back first. Press the save on a filled form and
   the same field the sit opens into takes the screen, shows the record as it will be written,
   and asks. CONFIRM writes it; DECLINE leaves the form exactly as it was.

   The two things worth guarding are the two ways this breaks. It must not write early — a
   gate that asks after the row is already in the log is theatre. And it must not gate the
   writers nobody is standing at: the rota import, a bulk paste, the voice assistant and the
   Brain Rest completion all write logs with no person at a form, and a screen asking a
   question nobody is there to answer would strand every one of them. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8953;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(scene, style) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((sc) => window.__nvx.setState({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, logGate: null, scene: sc || 'calendar',
    events: [], activities: [], workouts: [],
    evTitle: '', evTime: '', evRepeatDays: [], evEndTime: '', evAttendees: '', evEstMins: '',
    mealName: '', mealKcal: '', mealProtein: '',
    health: { ...(window.__nvx.state.health || {}), meals: [] },
  }), scene);
  if (style) await page.evaluate((st) => {
    window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', st);
  }, style);
  await page.waitForTimeout(1100);
}

const gate = () => page.evaluate(() => window.__nvx.state.logGate);
const events = () => page.evaluate(() => window.__nvx.state.events.length);
/* The element that actually carries the handler. Once a sibling is hidden a wrapping div can
   share the same textContent, so matching on text alone hits the wrapper. */
const press = (label) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === l && e.onclick);
  if (!el) return false; el.click(); return true;
}, label);
const pressAdd = () => page.evaluate(() => {
  const el = [...document.querySelectorAll('span')].find(e => /^Add to /.test(e.textContent.trim()) && e.onclick);
  if (!el) return false; el.click(); return true;
});

async function fillEvent(title, time) {
  await page.fill('input[placeholder="Event title"]', title);
  await page.fill('input[placeholder="09:00"]', time || '');
  await page.waitForTimeout(250);
}

t('pressing save opens the gate and writes nothing yet', async () => {
  await boot('calendar');
  await fillEvent('Dinner with Sarah', '19:30');
  eq(await events(), 0, 'the calendar did not start empty');
  ok(await pressAdd(), 'there is no add button on the calendar');
  await page.waitForTimeout(700);
  const g = await gate();
  ok(g, 'pressing save did not open the gate');
  eq(g.kind, 'event', 'the gate opened for the wrong thing');
  eq(await events(), 0, 'the event was written before anyone confirmed it');
});

t('the gate reads the record back as the log will write it', async () => {
  await boot('calendar');
  await fillEvent('Dinner with Sarah', '19:30');
  await pressAdd();
  await page.waitForTimeout(700);
  const g = await gate();
  const by = (k) => (g.lines.find(l => l.k === k) || {}).v;
  eq(by('EVENT'), 'Dinner with Sarah', 'the title on the gate is not the title typed');
  eq(by('TIME'), '19:30', 'the time on the gate is not the time typed');
  eq(by('TYPE'), 'General', 'the type is missing from the record');
  ok(/\d/.test(by('DAY') || ''), 'the day is not named on the gate');
  /* And it is on screen, not merely in state. */
  const shown = await page.evaluate(() => document.body.innerText);
  ok(shown.includes('Dinner with Sarah'), 'the record is in state but not rendered');
  ok(shown.includes('CONFIRM') && shown.includes('DECLINE'), 'the gate is missing a way to answer it');
});

t('DECLINE writes nothing and keeps every value typed', async () => {
  /* The entire point of a decline: a wrong number is corrected, not retyped. */
  await boot('calendar');
  await fillEvent('Dinner with Sarah', '19:30');
  await pressAdd();
  await page.waitForTimeout(700);
  ok(await press('DECLINE'), 'there is no DECLINE on the gate');
  await page.waitForTimeout(600);
  eq(await gate(), null, 'declining left the gate open');
  eq(await events(), 0, 'declining still wrote the event');
  const kept = await page.evaluate(() => ({ t: window.__nvx.state.evTitle, m: window.__nvx.state.evTime }));
  eq(kept.t, 'Dinner with Sarah', 'declining cleared the form');
  eq(kept.m, '19:30', 'declining cleared the time');
});

t('CONFIRM writes exactly one row and clears the form', async () => {
  await boot('calendar');
  await fillEvent('Dinner with Sarah', '19:30');
  await pressAdd();
  await page.waitForTimeout(700);
  ok(await press('CONFIRM'), 'there is no CONFIRM on the gate');
  await page.waitForTimeout(800);
  eq(await gate(), null, 'confirming left the gate open');
  eq(await events(), 1, 'confirming wrote the wrong number of events');
  const ev = await page.evaluate(() => window.__nvx.state.events[0]);
  eq(ev.title, 'Dinner with Sarah', 'the row written is not the row that was shown');
  eq(ev.time, '19:30', 'the time written is not the time that was shown');
  eq(await page.evaluate(() => window.__nvx.state.evTitle), '', 'the form was not cleared after writing');
});

t('confirming twice does not write twice', async () => {
  /* The gate closes on the first press. A second click landing before the re-render must
     find nothing to commit rather than a second copy of the row. */
  await boot('calendar');
  await fillEvent('Double tap', '10:00');
  await pressAdd();
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'CONFIRM' && e.onclick);
    el.click(); el.click();
  });
  await page.waitForTimeout(800);
  eq(await events(), 1, 'a double press wrote the event twice');
});

t('an empty form still asks nothing at all', async () => {
  await boot('calendar');
  ok(await pressAdd(), 'no add button');
  await page.waitForTimeout(600);
  eq(await gate(), null, 'an empty form opened a screen to ask about nothing');
  eq(await events(), 0, 'an empty form wrote something');
});

t('every log the app keeps goes through it', async () => {
  await boot('calendar');
  const want = {
    meal:     { mark: 'HEALTH',   seed: { mealName: 'Porridge and eggs', mealKcal: '620', mealProtein: '38' } },
    workout:  { mark: 'TRAINING', seed: { woEx: 'Squat', woSets: '5', woReps: '5', woWeight: '100', woUnit: 'kg' } },
    activity: { mark: 'WORK',     seed: { actText: 'Wrote the deck', actCat: 'Work', actMin: '90' } },
    income:   { mark: 'FINANCE',  seed: { incLabel: 'Consulting', incAmt: '1200' } },
    expense:  { mark: 'FINANCE',  seed: { expLabel: 'Train fare', expAmt: '18.4' } },
    logall:   { mark: 'DAILY LOG', seed: { logAll: { mealName: 'Chicken and rice', mealKcal: '780' } } },
  };
  for (const [kind, w] of Object.entries(want)) {
    await page.evaluate((s) => window.__nvx.setState({ ...s, logGate: null }), w.seed);
    await page.waitForTimeout(200);
    await page.evaluate((k) => window.__nvx.askLog(k), kind);
    await page.waitForTimeout(300);
    const g = await gate();
    ok(g, kind + ' does not open a gate');
    eq(g.mark, w.mark, kind + ' is filed under the wrong centre');
    ok(g.lines.length > 0, kind + ' shows an empty record');
    ok(g.title.trim().endsWith('?'), kind + ' does not actually ask anything: ' + g.title);
  }
});

t('the money on it is money, not a currency sign', async () => {
  await boot('calendar');
  await page.evaluate(() => window.__nvx.setState({ expLabel: 'Train fare', expAmt: '18.4', logGate: null }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__nvx.askLog('expense'));
  await page.waitForTimeout(300);
  const g = await gate();
  eq((g.lines.find(l => l.k === 'AMOUNT') || {}).v, '£18.40', 'the amount is wrong on the gate');
});

t('the Enter key goes the same way the button does', async () => {
  /* Enter used to carry its own inline copy of the write for work activities, so the key and
     the button reached the log by two different routes and only one of them could be gated. */
  await boot('calendar');
  await fillEvent('Typed and entered', '08:15');
  await page.press('input[placeholder="Event title"]', 'Enter');
  await page.waitForTimeout(700);
  const g = await gate();
  ok(g && g.kind === 'event', 'Enter did not open the gate');
  eq(await events(), 0, 'Enter wrote the event without asking');
});

t('nothing that writes without a person at the form is gated', async () => {
  /* The rota import, a bulk paste, the voice assistant and the Brain Rest completion all
     write logs with nobody standing there. A gate in front of those strands them. */
  await boot('calendar');
  const before = await page.evaluate(() => (window.__nvx.state.health.meals || []).length);
  await page.evaluate(() => window.__nvx.addMeal({ name: 'Imported lunch', kcal: 500, protein: 30 }));
  await page.waitForTimeout(600);
  eq(await gate(), null, 'a programmatic write opened a gate nobody can answer');
  eq(await page.evaluate(() => (window.__nvx.state.health.meals || []).length), before + 1,
     'a programmatic write did not land');
  /* And a finished sit still files its own Focus row without asking. */
  const acts = await page.evaluate(() => window.__nvx.state.activities.length);
  await page.evaluate(() => window.__nvx._brLogCompletion());
  await page.waitForTimeout(600);
  eq(await gate(), null, 'a finished sit asked to be confirmed');
  eq(await page.evaluate(() => window.__nvx.state.activities.length), acts + 1, 'the sit did not file its row');
});

t('it wears the field, and the raiment, like the sit does', async () => {
  await boot('calendar', 'Ultra X');
  await fillEvent('Dinner with Sarah', '19:30');
  await pressAdd();
  await page.waitForTimeout(800);
  const look = await page.evaluate(() => {
    const st = document.querySelector('.rest-stage');
    if (!st) return null;
    const wrap = st.parentElement;
    const conf = [...st.querySelectorAll('span')].find(e => e.textContent.trim() === 'CONFIRM');
    return { abyss: !!wrap.querySelector('.rest-abyss'), grain: !!wrap.querySelector('.rest-grain'),
             thread: !!st.querySelector('.rest-thread'), rows: st.querySelectorAll('.lg-line').length,
             fill: conf ? getComputedStyle(conf).backgroundColor : '',
             serif: /Cormorant/.test(getComputedStyle(st.querySelector('.lg-v')).fontFamily) };
  });
  ok(look, 'the gate is not the abyss stage');
  ok(look.abyss && look.grain && look.thread, 'the gate is missing the field the sit opens into');
  ok(look.rows >= 3, 'the record is not drawn as ruled rows');
  ok(look.serif, 'the values are not the serif the panels use');
  eq(look.fill, 'rgb(91, 26, 26)', 'CONFIRM is not wearing Ultra X');
});

t('nothing on it renders an escape instead of a character', async () => {
  await boot('calendar');
  await page.evaluate(() => window.__nvx.setState({ expLabel: 'Train fare', expAmt: '18.4' }));
  await page.evaluate(() => window.__nvx.askLog('expense'));
  await page.waitForTimeout(600);
  const text = await page.evaluate(() => document.body.innerText);
  const bad = text.match(/\\u[0-9a-fA-F]{4}/g);
  eq(bad ? bad.join(',') : '', '', 'the gate shows a literal escape');
});

t('nothing threw through any of it', async () => {
  eq(pageErrors.join(' | '), '', 'page errors');
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
