/* The navigation:  node nav-order.test.mjs

   The rail was in the order these pages happened to be built in. This holds the order that
   was actually asked for, and the two things that came with it: a Gentlemen Center that has
   to exist for the order to be real, and Account Requests coming off the rail into Settings
   without becoming unreachable or silent. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8933;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'home',
  }, p || {})), patch || null);
  await page.waitForTimeout(700);
}
/* Read the rail off the page rather than off the definition — an icon that is defined but
   never rendered is not in the nav. */
const rail = () => page.evaluate(() =>
  [...document.querySelectorAll('.cc-side nav [data-icon]')].map(e => e.dataset.icon));

const WANT = ['home', 'dashboard', 'forge', 'gentlemen', 'fitness', 'calendar',
              'business', 'learning', 'power', 'voice', 'globe', 'ai', 'settings'];

t('the rail is in the order asked for', async () => {
  await boot();
  eq((await rail()).join(','), WANT.join(','), 'the nav order is wrong');
});

t('every page in the rail can actually be opened', async () => {
  await boot();
  for (const id of WANT) {
    await page.evaluate((x) => window.__nvx.setState({ scene: x }), id);
    await page.waitForTimeout(320);
    const shown = await page.evaluate(() => {
      const el = document.querySelector('[data-screen-label]');
      return { label: el ? el.dataset.screenLabel : null, body: document.body.innerText.length };
    });
    ok(shown.body > 200, id + ' rendered an empty page');
  }
  eq(pageErrors.length, 0, 'opening the pages threw: ' + pageErrors.slice(0, 3).join(' | '));
});

t('the Gentlemen Center is a real page, and an empty one', async () => {
  await boot({ scene: 'gentlemen' });
  const b = await page.evaluate(() => document.body.innerText);
  ok(b.includes('GENTLEMEN CENTER'), 'the page does not name itself');
  ok(/Nothing here yet/.test(b), 'it should be the empty state until it is filled');
  ok(await page.evaluate(() => !!document.querySelector('[data-screen-label="Gentlemen Center"]')),
    'the screen is not labelled, so search and the drawer cannot find it');
  /* The icon has to draw, or the rail shows a blank square where it sits. */
  const svg = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.cc-side nav [data-icon]')].find(e => e.dataset.icon === 'gentlemen');
    return el ? el.innerHTML.length : 0;
  });
  ok(svg > 40, 'the Gentlemen icon did not draw: ' + svg + ' chars');
});

t('Account Requests is off the rail but not out of the app', async () => {
  await boot();
  ok(!(await rail()).includes('requests'), 'Account Requests is still on the main rail');
  await page.evaluate(() => window.__nvx.setState({ scene: 'requests' }));
  await page.waitForTimeout(400);
  ok((await page.evaluate(() => document.body.innerText)).includes('ADMIN · ACCESS CONTROL'),
    'the page itself should still open — it moved, it was not deleted');
});

t('Settings carries the pending count that used to sit on the rail', async () => {
  /* Taking the page off the rail must not take the only sign that somebody is waiting. */
  await boot({ requests: [{ id: 'r1', status: 'pending', name: 'A' }, { id: 'r2', status: 'pending', name: 'B' }] });
  const badge = await page.evaluate(() => {
    const n = [...document.querySelectorAll('.cc-side nav > div')]
      .find(d => (d.querySelector('[data-icon]') || {}).dataset?.icon === 'settings');
    const b = [...n.querySelectorAll('span')].find(e => e.children.length === 0 && /^\d+$/.test(e.textContent.trim()));
    return b ? b.textContent.trim() : null;
  });
  const isOwner = await page.evaluate(() => window.__nvx._isOwner());
  if (isOwner) eq(badge, '2', 'Settings should show how many requests are pending');
  else eq(badge, null, 'only the owner sees a request count');
});

t('the phone bar leads with the same pages the rail does', async () => {
  await boot();
  const ids = await page.evaluate(() => window.__nvx.state && [...document.querySelectorAll('.cc-mobnav [data-icon]')].map(e => e.dataset.icon));
  /* Rendered only under the mobile breakpoint, so this asserts on the list it is built from
     when the bar itself is not on the page. */
  const mob = ids && ids.length ? ids : null;
  const want = ['dashboard', 'forge', 'gentlemen', 'fitness', 'calendar', 'business'];
  if (mob) eq(mob.join(','), want.join(','), 'the phone bar is in the old order');
  else {
    await page.setViewportSize({ width: 390, height: 840 });
    await page.waitForTimeout(600);
    const m2 = await page.evaluate(() => [...document.querySelectorAll('.cc-mobnav [data-icon]')].map(e => e.dataset.icon));
    eq(m2.join(','), want.join(','), 'the phone bar is in the old order');
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
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
