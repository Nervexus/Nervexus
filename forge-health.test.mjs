/* The Forge's Health centre:  node forge-health.test.mjs

   The centre was an empty page. It now carries the same ring card the Forge home uses for
   training — three rings against the day's targets, in the raiment's colours — and the
   smallest thing that can feed them, because nothing else left in the app writes a meal or a
   glass of water and rings that can only read zero are decoration.

   The interesting cases are the ones about honesty: the day's figures have to be the day's.
   Meals carried no date at all, so anything calling itself "today" was adding up every meal
   ever eaten, and health.water is a running count that is only rewritten when something is
   logged — on a day nothing has been drunk it still holds yesterday's number. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8927;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(centre, style) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  /* A clean health record every run: these tests are about what the day adds up to, and a
     browser profile carrying the last run's dinner would decide the answer. */
  await page.evaluate((c) => window.__nvx.setState({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'forge', forgeCentre: c,
    health: { ...(window.__nvx.state.health || {}), meals: [], hydrationLog: [], water: 0,
              kcalGoal: 2400, proteinGoal: 180, waterGoal: 8 },
  }), centre);
  if (style) await page.evaluate((st) => {
    window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', st);
  }, style);
  await page.waitForTimeout(1200);
}

const text = () => page.evaluate(() => document.body.innerText);
const rings = () => page.evaluate(() => !!document.querySelector('canvas[data-chart="healthRings"]'));

t('HEALTH is no longer an empty page', async () => {
  await boot('health');
  const b = await text();
  ok(!/Nothing here yet/.test(b), 'the Health centre is still showing the empty state');
  ok(await rings(), 'there is no ring card on the Health centre');
  for (const label of ['FUEL', 'PROTEIN', 'HYDRATION', 'Log Today'])
    ok(b.includes(label), 'the Health centre is missing ' + label);
});

t('the other centres are unchanged', async () => {
  await boot('mental');
  const b = await text();
  /* Mental is its own page now (Brain Rest), so what matters here is only that it is not
     borrowing Health's. */
  ok(!(await rings()), 'the health rings are showing on the Mental centre');
  ok(/Brain Rest/.test(b), 'Mental lost its own page');
  await boot('home');
  ok(!(await rings()), 'the health rings are showing on the Home centre');
  ok(await page.evaluate(() => !!document.querySelector('canvas[data-chart="fitRings"]')),
    'the training rings went missing from the Home centre');
});

t('the rings wear the raiment, like every other chart', async () => {
  const cap = () => page.evaluate(() => {
    const cv = document.querySelector('canvas[data-chart="healthRings"]');
    const d = cv.getContext('2d').getImageData(Math.round(cv.width / 2), 0, 1, cv.height).data;
    for (let i = 0; i < d.length; i += 4)
      if (d[i + 3] > 200) return { r: d[i], g: d[i + 1], b: d[i + 2] };
    return null;
  });
  await boot('health', 'Ultra X');
  const x = await cap();
  ok(x && x.r > x.g + 40 && x.r > x.b + 40, 'Ultra X should lead with red, got ' + JSON.stringify(x));
  await page.evaluate(() => window.__nvx.setPref('ultraStyle', 'Maison Élysée'));
  await page.waitForTimeout(1400);
  const m = await cap();
  ok(m && m.b > m.r + 30, 'Maison should lead with blue, got ' + JSON.stringify(m));
});

t('the figures are what has actually been logged', async () => {
  await boot('health');
  ok((await text()).includes('0 / 2400 kcal'), 'an empty day should read zero');
  await page.evaluate(() => {
    window.__nvx.addMeal({ name: 'Chicken and rice', kcal: 820, protein: 62 });
    window.__nvx.addHydMl(250);
    window.__nvx.addHydMl(250);
  });
  await page.waitForTimeout(900);
  const b = await text();
  ok(b.includes('820 / 2400 kcal'), 'FUEL did not follow the meal: ' + b.match(/FUEL\n[^\n]*/));
  ok(b.includes('62 / 180 g'), 'PROTEIN did not follow the meal');
  ok(b.includes('2 / 8 glasses'), 'HYDRATION did not follow the water');
  ok(b.includes('6 to go'), 'the hint should count what is left, not what is done');
});

t('yesterday does not count toward today', async () => {
  /* The real defect. A meal carried no date at all, so a card labelled FUEL was adding up
     every meal ever eaten; health.water is only rewritten when something is logged, so on a
     day nothing has been drunk it still reads yesterday. */
  await boot('health');
  await page.evaluate(() => {
    const n = window.__nvx;
    const y = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    n.setState({ health: { ...n.state.health,
      meals: [{ id: 'y1', name: 'Yesterday', kcal: 1900, protein: 140, date: y },
              { id: 'old', name: 'No date at all', kcal: 3000, protein: 200 }],
      hydrationLog: [{ id: 'yh', date: y, ml: 2000, time: '09:00' }],
      water: 8 } });
  });
  await page.waitForTimeout(900);
  const b = await text();
  ok(b.includes('0 / 2400 kcal'), 'yesterday’s dinner is counting toward today: ' + (b.match(/FUEL\n[^\n]*/) || ''));
  ok(b.includes('0 / 8 glasses'), 'yesterday’s water is still on today’s ring');
  ok(!b.includes('Yesterday'), 'yesterday’s meal is listed under Log Today');
  ok(!b.includes('No date at all'), 'a meal from before dates were stored is being read as today’s');
});

t('a meal can be taken back, and the right one goes', async () => {
  await boot('health');
  await page.evaluate(() => {
    const n = window.__nvx;
    const y = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    n.setState({ health: { ...n.state.health, meals: [{ id: 'y1', name: 'Yesterday', kcal: 900, protein: 70, date: y }] } });
  });
  await page.evaluate(() => {
    window.__nvx.addMeal({ name: 'Breakfast', kcal: 400, protein: 30 });
    window.__nvx.addMeal({ name: 'Lunch', kcal: 700, protein: 50 });
  });
  await page.waitForTimeout(900);
  ok((await text()).includes('1100 / 2400 kcal'), 'both of today’s meals should be counted');
  /* Removal used to be by index into the rendered list, which is today's — not an index into
     the stored array, which still holds yesterday's. */
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('div,span')]
      .find(e => e.children.length === 0 && e.textContent.trim() === 'Breakfast');
    const line = row.closest('div').parentElement;
    [...line.querySelectorAll('span')].find(e => e.textContent.trim() === '×').click();
  });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => (window.__nvx.state.health.meals || []).map(m => m.name));
  eq(after.join(','), 'Yesterday,Lunch', 'the wrong meal was removed');
  ok((await text()).includes('700 / 2400 kcal'), 'the rings did not follow the removal');
});

t('water can be taken back one glass at a time', async () => {
  await boot('health');
  await page.evaluate(() => { window.__nvx.addHydMl(250); window.__nvx.addHydMl(250); window.__nvx.addHydMl(250); });
  await page.waitForTimeout(800);
  ok((await text()).includes('3 / 8 glasses'), 'three glasses did not register');
  await page.evaluate(() => window.__nvx.undoHydGlass());
  await page.waitForTimeout(800);
  ok((await text()).includes('2 / 8 glasses'), 'undoing a glass did not come off the count');
  const rows = await page.evaluate(() => (window.__nvx.state.health.hydrationLog || []).length);
  eq(rows, 2, 'the count and the log disagree — they are meant to be derived from each other');
  for (let i = 0; i < 4; i++) await page.evaluate(() => window.__nvx.undoHydGlass());
  await page.waitForTimeout(800);
  ok((await text()).includes('0 / 8 glasses'), 'undoing past empty should stop at zero, not go negative');
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
