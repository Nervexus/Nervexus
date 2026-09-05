/* No invented data:  node no-seed-data.test.mjs

   The app used to open with data nobody had entered — five glasses of water, three meals, a
   week of sleep and bodyweight, 82% recovery, 14.2% body fat, a 13-day movement streak and
   80 XP. Every one of those was read by something that then reported it as fact: the health
   score, the fitness briefing, the anatomy model, the coach.

   Two things are checked here, because removing seed data breaks the second one:
     1. A fresh account starts empty.
     2. Every page still renders without NaN, undefined or Infinity leaking into the UI —
        which is what happens when a mean is taken over an empty array, and what the seed
        data was hiding. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8907;

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

async function fresh() {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate(() => window.__nvx.setState({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false, toasts: [] }));
  await page.waitForTimeout(900);
}
const body = () => page.evaluate(() => document.body.innerText);

t('a fresh account has logged nothing', async () => {
  await fresh();
  const s = await page.evaluate(() => {
    const x = window.__nvx.state, H = x.health || {};
    return { workouts: x.workouts.length, income: x.income.length, expenses: x.expenses.length,
             events: x.events.length, notes: x.notes.length, activities: x.activities.filter(a => !a.seeded).length,
             missions: x.missions.length, missionXP: x.missionXP,
             meals: (H.meals || []).length, water: H.water,
             sleepH: (H.sleepH || []).length, weights: (H.weights || []).length,
             recovery: H.recovery, bodyFat: H.bodyFat, muscleMass: H.muscleMass, bmi: H.bmi, waist: H.waist,
             soreness: H.soreness, stress: H.stress, energy: H.energy, mood: H.mood,
             streak: (x.move || {}).streak, longest: (x.move || {}).longest };
  });
  for (const k of ['workouts','income','expenses','events','notes','activities','missions','meals','sleepH','weights'])
    eq(s[k], 0, k + ' starts with entries nobody made');
  for (const k of ['missionXP','water','streak','longest'])
    eq(s[k], 0, k + ' starts at a number nobody earned');
  for (const k of ['recovery','bodyFat','muscleMass','bmi','waist'])
    eq(s[k], null, k + ' starts with a measurement nobody took');
  for (const k of ['soreness','stress','energy','mood'])
    eq(s[k], '', k + ' starts with a self-report nobody made');
});

t('HealthKit no longer carries a way to fabricate a history', async () => {
  /* It generated 78 days of sleep, hydration, energy and body composition for any account
     without one, and refilled the energy log on every later load. Both paths are gone, and
     the generator with them so no option can call it back. */
  await fresh();
  const k = await page.evaluate(() => {
    const H = window.HealthKit;
    return { hasSeed: typeof H.seed === 'function', keys: Object.keys(H) };
  });
  ok(!k.hasSeed, 'HealthKit still exposes a seed()');
  const logs = await page.evaluate(() => {
    const H = window.__nvx.state.health || {};
    return { sleepLog: (H.sleepLog || []).length, hydrationLog: (H.hydrationLog || []).length,
             bodyLog: (H.bodyLog || []).length, energyLog: (H.energyLog || []).length,
             photos: (H.photos || []).length,
             steps: (H.todayExtra || {}).steps, workoutMin: (H.todayExtra || {}).workoutMin };
  });
  for (const key of ['sleepLog','hydrationLog','bodyLog','energyLog','photos'])
    eq(logs[key], 0, key + ' was filled in by something');
  eq(logs.steps, undefined, "today's steps were invented");
  eq(logs.workoutMin, undefined, 'a workout was invented for today');
});

t('reloading does not quietly refill the empty logs', async () => {
  /* The energy log was refilled on every load after the first, so an account could look
     clean once and be full of invented entries the next morning. */
  await fresh();
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx && !!window.HealthKit, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  const n = await page.evaluate(() => {
    const H = window.__nvx.state.health || {};
    return (H.energyLog || []).length + (H.sleepLog || []).length + (H.hydrationLog || []).length;
  });
  eq(n, 0, 'a reload put ' + n + ' entries back');
});

t('the goals survive, because a goal is not a claim', async () => {
  await fresh();
  const g = await page.evaluate(() => {
    const H = window.__nvx.state.health || {};
    return { waterGoal: H.waterGoal, kcalGoal: H.kcalGoal, proteinGoal: H.proteinGoal };
  });
  for (const k of Object.keys(g)) ok(g[k] > 0, k + ' should still have a default');
});

t('an empty account scores nothing rather than scoring zero', async () => {
  /* 0/100 is a judgement on someone who has not logged anything. There is no score to give. */
  await fresh();
  const v = await page.evaluate(() => {
    window.__nvx.setState({ scene: 'health' });
    return null;
  });
  await page.waitForTimeout(800);
  const txt = await body();
  ok(!/\b0\s*\/\s*100\b/.test(txt), 'an untouched account is being scored 0/100');
});

t('no page leaks NaN, undefined or Infinity on an empty account', async () => {
  /* This is the failure mode of removing seed data: a mean over an empty array. */
  await fresh();
  const scenes = ['home','dashboard','health','fitness','forge','calendar','power','business','learning'];
  const leaks = [];
  for (const scene of scenes) {
    await page.evaluate((s) => window.__nvx.setState({ scene: s, perfCheckinOpen: false, whatsNewOpen: false }), scene);
    await page.waitForTimeout(700);
    const txt = await body();
    for (const bad of ['NaN', 'undefined', 'Infinity', '[object Object]']) {
      const n = txt.split(bad).length - 1;      // literal — '[object Object]' is a class to RegExp
      if (n) leaks.push(scene + ': ' + bad + ' ×' + n);
    }
  }
  eq(leaks.join(' | '), '', 'leaked into the page');
});

t('the health sub-pages are clean too', async () => {
  await fresh();
  const leaks = [];
  for (const sub of ['overview','sleep','hydration','body','progress','diet']) {
    await page.evaluate((x) => window.__nvx.setState({ scene: 'health', healthSub: x, perfCheckinOpen: false }), sub);
    await page.waitForTimeout(600);
    const txt = await body();
    for (const bad of ['NaN', 'undefined', 'Infinity']) if (txt.includes(bad)) leaks.push(sub + ': ' + bad);
  }
  eq(leaks.join(' | '), '', 'leaked on a health sub-page');
});

t('nothing threw while rendering any of it', async () => {
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
