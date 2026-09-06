/* The theme surviving an update:  node theme-persist.test.mjs

   Taking an update changed the theme by itself. Two separate causes, both of which only bite
   on a reload — which is exactly what an update does:

     1. The Ultra access check runs on the first render after a reload. Until Supabase answers
        with the profile, _isOwner() falls back to comparing account.email against
        currentEmail, which need not match. A not-yet-known state read as "access removed",
        and the response to that was to overwrite prefs.theme and persist it.
     2. Prefs are pushed to Supabase on a 300ms debounce and the server copy wins on the way
        back in. A reload fired before that landed dropped the write and then read the stale
        server copy back.

   Both are about a destructive write on incomplete information, so both are tested by
   putting the app in the incomplete state on purpose. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8919;

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

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null }, p || {})), patch || null);
  await page.waitForTimeout(700);
}
const theme = () => page.evaluate(() => ({
  theme: window.__nvx.state.prefs.theme, style: window.__nvx.state.prefs.ultraStyle }));

t('the theme survives the window before the profile has loaded', async () => {
  /* Exactly the state a reload leaves: Ultra chosen, signed in, profile not back yet, and
     the two emails not agreeing. */
  await boot();
  await page.evaluate(() => {
    window.__nvx.setPref('theme', 'Ultra');
    window.__nvx.setPref('ultraStyle', 'Noir');
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx.setState({
    profile: null, currentEmail: 'someone@example.com',
    account: { ...(window.__nvx.state.account || {}), email: 'owner@example.com' },
    users: [] }));
  await page.waitForTimeout(900);
  /* Self-check: this state really is the one that used to trigger the revoke. Without it the
     test could pass because the scenario stopped being dangerous rather than because the
     guard works. */
  eq(await page.evaluate(() => window.__nvx._hasUltraAccess()), false,
    'this state no longer reads as access-missing, so nothing is being exercised');
  const got = await theme();
  eq(got.theme, 'Ultra', 'the theme was thrown away before we knew anything');
  eq(got.style, 'Noir', 'the raiment was thrown away too');
});

t('access that is really gone is still revoked', async () => {
  /* The check has to keep working — this is the state it exists for: profile loaded, not the
     owner, ultra_access false. */
  await boot();
  await page.evaluate(() => window.__nvx.setPref('theme', 'Ultra'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx.setState({
    profile: { id: 'u1', email: 'member@example.com', role: 'member', ultra_access: false },
    currentEmail: 'member@example.com', users: [] }));
  await page.waitForTimeout(1200);
  eq((await theme()).theme, 'Lime', 'a member with no Ultra access kept the Ultra theme');
});

t('the owner keeps Ultra even with the ultra_access column false', async () => {
  /* The real account: role owner, ultra_access false. Owner wins. */
  await boot();
  await page.evaluate(() => window.__nvx.setPref('theme', 'Ultra'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx.setState({
    profile: { id: 'u0', email: 'owner@example.com', role: 'owner', ultra_access: false },
    currentEmail: 'owner@example.com', users: [] }));
  await page.waitForTimeout(1200);
  eq((await theme()).theme, 'Ultra', 'the owner lost the Ultra theme');
});

t('a hard reload waits for the prefs write before it goes', async () => {
  /* The write used to be left in a 300ms debounce that the reload never waited for. */
  await boot();
  const order = await page.evaluate(async () => {
    const seen = [];
    window.SB = window.SB || {};
    const realUpdate = window.SB.update;
    window.SB.update = (table, id, patch) => {
      if (patch && patch.prefs) seen.push('prefs:' + patch.prefs.ultraStyle);
      return Promise.resolve({ data: null, error: null });
    };
    window.SB.ready = () => true;
    window.__nvx.setState({ authUserId: 'u1' });
    let navigated = false;
    const realNav = window.__nvx._navigate;
    window.__nvx._navigate = () => { navigated = true; seen.push('reload'); };
    window.__nvx.setPref('ultraStyle', 'Maison Éverpine');
    await window.__nvx._hardReload();
    window.__nvx._navigate = realNav;
    if (realUpdate) window.SB.update = realUpdate;
    return { seen, navigated };
  });
  ok(order.navigated, 'the hard reload never navigated');
  const i = order.seen.indexOf('prefs:Maison Éverpine');
  ok(i >= 0, 'the prefs were never written before the reload: ' + order.seen.join(','));
  ok(i < order.seen.indexOf('reload'), 'the reload went before the prefs write landed');
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
