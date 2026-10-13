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

const WANT = ['home', 'dashboard', 'forge', 'gentlemen', 'calendar',
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

t('the Gentlemen Center is a real page, and no longer an empty one', async () => {
  /* It shipped as a shell so the rail order was real; gentlemen-page.test.mjs holds what is
     in it now. This only holds that it exists, is reachable, and is not the empty state. */
  await boot({ scene: 'gentlemen' });
  const b = await page.evaluate(() => document.body.innerText);
  ok(b.includes('Gentlemen Center'), 'the page does not name itself');
  ok(b.includes('DAILY TEST'), 'its subpages are not there');
  ok(!/Nothing here yet/.test(b), 'it has content now and should not show the empty state');
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

/* Fitness HQ was one of the six; the page is gone and the Forge replaced it, so that slot
   is the Forge rather than a button that opens nothing. The other five are untouched. */
t('the phone bar keeps its own six', async () => {
  /* The bar is deliberately not the top of the rail: it is the screens used from a phone,
     which is a different question from how the app is arranged. Reordering the sidebar must
     leave it exactly as it was.

     Asserted on the rendered nodes rather than on visible text: under the mobile breakpoint a
     later rule hides both the bar and the More sheet — the ☰ drawer is what a phone actually
     navigates with — so nothing here is on screen to read. What is being held is the list
     each is built from. */
  await page.setViewportSize({ width: 390, height: 840 });
  await boot({ mobMoreOpen: true });
  const m = await page.evaluate(() => ({
    bar: [...document.querySelectorAll('.cc-mobnav [data-icon]')].map(e => e.dataset.icon),
    more: [...document.querySelectorAll('.cc-mobsheet-backdrop [data-icon]')].map(e => e.dataset.icon),
  }));
  eq(m.bar.join(','), 'dashboard,learning,business,globe,forge,calendar', 'the phone bar changed');
  /* Everything not on the bar has to be somewhere, or reordering the rail has stranded it.
     The Forge is not in this list because it is now on the bar itself, in the slot Fitness HQ
     held before that page was removed. */
  for (const id of ['gentlemen', 'power', 'ai', 'settings'])
    ok(m.more.includes(id), id + ' is on neither the bar nor More: ' + m.more.join(' > '));
  ok(m.bar.includes('forge'), 'the Forge is not on the phone bar');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForTimeout(400);
});

t('the drawer lists every page in rail order', async () => {
  /* The ☰ drawer is the nav a phone actually uses, so it is the one that has to carry the
     new order — the six on the bar are a shortcut, not the list. */
  await page.setViewportSize({ width: 390, height: 840 });
  await boot({ mobDrawerOpen: true });
  /* The drawer is its own overlay with no class of its own; ALL PAGES heads it. */
  const ids = await page.evaluate(() => {
    const head = [...document.querySelectorAll('div,span')]
      .find(e => e.children.length === 0 && e.textContent.trim() === 'ALL PAGES');
    if (!head) return null;
    return [...head.parentElement.querySelectorAll('[data-icon]')].map(e => e.dataset.icon);
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForTimeout(400);
  /* Voice is deliberately left out of the drawer, as it was before. */
  ok(ids, 'the drawer did not open');
  eq(ids.join(','), WANT.filter(x => x !== 'voice').join(','), 'the drawer is not in rail order');
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
