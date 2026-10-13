/* The ship log in the Command Center's Work Log:  node work-log.test.mjs

   Every released version is meant to appear there by itself. Three things were wrong:

     1. The Supabase pull replaced activities wholesale with the rows the database holds, and
        the ship entries are derived from the changelog rather than stored — so on any device
        that syncs they vanished a second after the page loaded.
     2. The entries said only "Shipped update v11.281". That is a version number, not a log
        of what changed.
     3. Each carried 23 + (i * 8) % 25 minutes — a made-up figure between 23 and 48 minutes a
        release, sitting in a work log as though someone had timed it. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8923;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null }, p || {})), patch || null);
  await page.waitForTimeout(900);
}
const ship = () => page.evaluate(() => (window.__nvx.state.activities || []).filter(a => a.ship));

t('every release of the last week is in the Work Log', async () => {
  await boot({ scene: 'dashboard', actCat: 'Work', actRange: 'Week' });
  const s = await ship();
  const week = s.filter(a => a.ts >= Date.now() - 7 * 86400000);
  ok(week.length >= 5, 'only ' + week.length + ' releases from the last week are logged');
  const versions = await page.evaluate(() => window.__nvx._changelog()
    .filter(c => window.__nvx._parseChangelogDate(c.date) >= Date.now() - 7 * 86400000)
    .map(c => c.version));
  for (const v of versions.slice(0, 12))
    ok(s.some(a => a.text.startsWith(v + ' ')), v + ' is not in the Work Log');
});

t('an entry says what changed, not just its number', async () => {
  await boot({ scene: 'dashboard' });
  const s = await ship();
  for (const a of s.slice(0, 20)) {
    ok(/^v[\d.]+ — /.test(a.text), 'not in the version-then-what-changed shape: ' + a.text);
    const after = a.text.split(' — ').slice(1).join(' — ');
    ok(after.length > 12, 'nothing said about what changed: ' + a.text);
    ok(after !== 'shipped', 'a release with no notes reached the log: ' + a.text);
  }
});

t('no invented minutes', async () => {
  /* The old entries claimed between 23 and 48 minutes each, from an index, in a work log. */
  await boot({ scene: 'dashboard' });
  const mins = [...new Set((await ship()).map(a => a.min))];
  eq(mins.join(','), '0', 'the ship log is claiming time: ' + mins.join(','));
  const body = await page.evaluate(() => document.body.innerText);
  ok(!/Shipped update v/.test(body), 'the old bare-version wording is still rendering');
});

t('a sync does not wipe them', async () => {
  /* The real defect. _sbPullCore assigns patch.activities = mapped, and the ship entries are
     derived rather than stored, so the pull dropped every one of them. */
  await boot({ scene: 'dashboard' });
  const before = (await ship()).length;
  ok(before > 0, 'nothing to lose');
  const after = await page.evaluate(() => {
    const rows = [{ id: 'a1', text: 'Real entry', cat: 'Work', ts: Date.now(), min: 30 }];
    window.__nvx.setState({ activities: window.__nvx._mergeShipLog(rows) });
    return new Promise(r => setTimeout(() => r({
      ship: (window.__nvx.state.activities || []).filter(a => a.ship).length,
      mine: (window.__nvx.state.activities || []).filter(a => !a.seeded).length }), 400));
  });
  eq(after.ship, before, 'the pull dropped the ship log');
  eq(after.mine, 1, "the merge lost the user's own entry");
});

t('they are never written to the database', async () => {
  /* Derived from the changelog, so storing them would duplicate the source and drift from
     it. _syncActivities skips anything with no id — that is what keeps them out. */
  await boot({ scene: 'dashboard' });
  const withIds = (await ship()).filter(a => a.id).length;
  eq(withIds, 0, withIds + ' ship entries carry an id and would be written to the database');
});

t('they earn no XP and build no work streak', async () => {
  /* A deploy is not the user turning up and doing the work. Shipping used to be 72% of the
     whole score before that was removed; this must not put it back by another door. */
  await boot({ scene: 'dashboard' });
  await page.evaluate(() => window.__nvx.setState({
    workouts: [], income: [], expenses: [], events: [], missionHistory: [],
    loginXPLog: [], checklist: [], savings: [] }));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => ({
    ship: (window.__nvx.state.activities || []).filter(a => a.ship).length,
    xp: window.__nvx.computePower().totalXP,
    streak: window.__nvx._streakFor('Work') }));
  ok(r.ship > 0, 'no ship entries present, so this proves nothing');
  eq(r.xp, 0, 'the ship log is earning XP again');
  eq(r.streak, 0, 'the ship log is building a work streak out of deploys');
});

t('a vlog is a kind of work, and goes in the work log like the rest of it', async () => {
  await boot({ activities: [] });
  const types = await page.evaluate(() => window.__nvx.WORK_TYPES);
  ok(types.includes('Vlog'), 'Vlog is not one of the kinds of work: ' + types.join(', '));
  /* Written through the form a person actually uses, not pushed into state. */
  await page.evaluate(() => { window.__nvx.setState({ whText: 'Episode 12', whType: 'Vlog', whHr: '0', whMin: '40' }); });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__nvx.addWorkHours());
  await page.waitForTimeout(600);
  const row = await page.evaluate(() => (window.__nvx.state.activities || []).find(a => a.text === 'Episode 12'));
  ok(row, 'the vlog did not land in the work log');
  eq(row.cat, 'Work', 'a vlog is filed outside Work');
  eq(row.sub, 'Vlog', 'the vlog lost its kind');
  eq(row.min, 40, 'the minutes did not come through');
  eq(await page.evaluate(() => window.__nvx.state.whText), '', 'the form was not cleared');
});

t('the first vlog of a day carries the bonus and the rest do not', async () => {
  /* A bonus you can take four times before lunch is not a bonus, it is a tap. */
  const xp = () => page.evaluate(() => window.__nvx.computePower().totalXP);
  const put = (rows) => page.evaluate((r) => window.__nvx.setState({ activities: r }), rows);
  const now = Date.now(), yest = now - 86400000;
  await boot({ activities: [] });
  const base = await xp();

  await put([{ id: 'v1', text: 'Episode 1', cat: 'Work', sub: 'Vlog', ts: now, min: 45 }]);
  await page.waitForTimeout(400);
  const one = await xp();
  eq(one - base, await page.evaluate(() => window.__nvx.VLOG_XP()), 'the first vlog of a day is not worth the bonus');

  await put([{ id: 'v1', text: 'Episode 1', cat: 'Work', sub: 'Vlog', ts: now, min: 45 },
             { id: 'v2', text: 'Episode 2', cat: 'Work', sub: 'Vlog', ts: now + 1000, min: 30 }]);
  await page.waitForTimeout(400);
  eq((await xp()) - one, 15, 'the second vlog of the same day took the bonus too');

  await put([{ id: 'v1', text: 'Episode 1', cat: 'Work', sub: 'Vlog', ts: now, min: 45 },
             { id: 'v2', text: 'Episode 2', cat: 'Work', sub: 'Vlog', ts: now + 1000, min: 30 },
             { id: 'v0', text: 'Episode 0', cat: 'Work', sub: 'Vlog', ts: yest, min: 30 }]);
  await page.waitForTimeout(400);
  const three = await xp();
  eq(three - base, (await page.evaluate(() => window.__nvx.VLOG_XP())) * 2 + 15,
     'yesterday should have its own first vlog, worth its own bonus');
});

t('a vlog logged on its own day gets its own bonus', async () => {
  /* The cap is per day, not per account. Three days of one vlog each is three bonuses; one
     day of three vlogs is one. */
  const xp = () => page.evaluate(() => window.__nvx.computePower().totalXP);
  const D = 86400000, now = Date.now();
  await boot({ activities: [] });
  const base = await xp();
  const bonus = await page.evaluate(() => window.__nvx.VLOG_XP());
  await page.evaluate((t) => window.__nvx.setState({ activities: [
    { id: 'd0', text: 'Ep A', cat: 'Work', sub: 'Vlog', ts: t, min: 30 },
    { id: 'd1', text: 'Ep B', cat: 'Work', sub: 'Vlog', ts: t - 86400000, min: 30 },
    { id: 'd2', text: 'Ep C', cat: 'Work', sub: 'Vlog', ts: t - 2 * 86400000, min: 30 }] }), now);
  await page.waitForTimeout(400);
  eq((await xp()) - base, bonus * 3, 'three days of one vlog each should be three bonuses');
});

t('an ordinary work entry is still an ordinary work entry', async () => {
  const xp = () => page.evaluate(() => window.__nvx.computePower().totalXP);
  await boot({ activities: [] });
  const base = await xp();
  await page.evaluate((ts) => window.__nvx.setState({ activities: [
    { id: 'w1', text: 'Invoices', cat: 'Work', sub: 'Admin', ts, min: 40 }] }), Date.now());
  await page.waitForTimeout(400);
  eq((await xp()) - base, 15, 'adding Vlog changed what a normal work entry is worth');
});

t('nothing threw', async () => {
  eq(pageErrors.length, 0, 'page errors: ' + pageErrors.slice(0, 4).join(' | '));
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
