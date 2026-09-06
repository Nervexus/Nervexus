/* Power Level — XP, ranks, the level-up card and the login streak:
     node power-level.test.mjs

   Written because the login streak read 1d for an account that had used the app almost
   every day for a month. The number was right; the recording was not. _checkDailyLogin only
   ran on mount and on login, so a session left open — a pinned tab, the PWA on a phone —
   sailed past midnight and never wrote the new day. The log has 5-17 Aug and then holes.

   So the tests here are about the parts that were quietly wrong rather than the arithmetic:
   that a day still gets recorded without a reload, that the streak is derived from the log
   rather than carried in a counter that a slow Supabase load can reset, and that the effects
   fire on a real gain and stay quiet when history lands late. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8911;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null }, p || {})), patch || null);
  await page.waitForTimeout(800);
}
const text = () => page.evaluate(() => document.body.innerText);
const power = () => page.evaluate(() => {
  const P = window.__nvx.computePower();
  return { totalXP: P.totalXP, level: P.level, rank: P.rank.n, rankDesc: P.rank.d,
           next: P.next ? P.next.n : null, ranks: P.ranks.map(r => [r.n, r.min, r.d]),
           streak: P.streak };
});

/* ---- the rank ladder ---- */

t('the ladder steps every 20 levels the whole way up', async () => {
  await boot();
  const { ranks } = await power();
  /* It used to widen to 100-level bands above 200, so Elite I covered five times the ground
     Specialist I did. Every gap between bands must now be 20, bar the first (1 to 20) and
     the max-rank cap. */
  for (let i = 1; i < ranks.length - 1; i++) {
    const gap = ranks[i + 1][1] - ranks[i][1];
    eq(gap, 20, 'band ' + ranks[i][0] + ' is ' + gap + ' levels wide, not 20');
  }
  eq(ranks[0][1], 1, 'the ladder does not start at level 1');
  eq(ranks[1][1], 20, 'the second band does not start at 20');
});

t('the bands the user named are exactly where they said', async () => {
  await boot();
  const { ranks } = await power();
  const want = [
    ['Specialist I', 100, 'Levels 100–119'], ['Specialist II', 120, 'Levels 120–139'],
    ['Specialist III', 140, 'Levels 140–159'], ['Specialist IV', 160, 'Levels 160–179'],
    ['Specialist V', 180, 'Levels 180–199'], ['Elite I', 200, 'Levels 200–219'],
  ];
  for (const [n, min, d] of want) {
    const got = ranks.find(r => r[0] === n);
    ok(got, 'no band named ' + n);
    eq(got[1], min, n + ' starts at the wrong level');
    eq(got[2], d, n + ' is described wrong');
  }
});

t('every band has a name and no name is used twice', async () => {
  await boot();
  const { ranks } = await power();
  const names = ranks.map(r => r[0]);
  eq(new Set(names).size, names.length, 'a rank name is used for two bands');
  for (const n of names) ok(n && !/undefined|NaN/.test(n), 'a band has no usable name: ' + n);
  ok(ranks.length >= 50, 'the ladder is only ' + ranks.length + ' bands deep');
  eq(ranks[ranks.length - 1][1], 1000, 'the ladder does not top out at level 1000');
});

t('the ladder covers every level with exactly one band', async () => {
  await boot();
  const { ranks } = await power();
  const at = (lvl) => { let r = null; for (const x of ranks) if (lvl >= x[1]) r = x; return r; };
  for (const lvl of [1, 19, 20, 99, 100, 146, 199, 200, 500, 999, 1000, 1400]) {
    ok(at(lvl), 'level ' + lvl + ' falls through the ladder');
  }
  eq(at(146)[0], 'Specialist III', 'level 146 is not Specialist III');
  eq(at(200)[0], 'Elite I', 'level 200 is not Elite I');
  eq(at(1400)[0], ranks[ranks.length - 1][0], 'past the cap should stay at the max rank');
});

t('the rank ladder is scrollable and opens on where you are', async () => {
  await boot({ scene: 'power' });
  await page.waitForTimeout(900);
  const box = await page.evaluate(() => {
    const el = document.querySelector('#rankLadder');
    if (!el) return null;
    const cur = el.querySelector('[data-rank-cur="1"]');
    return { rows: el.children.length, scrollable: el.scrollHeight > el.clientHeight + 10,
             scrolled: el.scrollTop, curTop: cur ? cur.offsetTop : -1 };
  });
  ok(box, 'the rank ladder did not render');
  ok(box.rows >= 50, 'only ' + box.rows + ' rank rows rendered');
  ok(box.scrollable, 'the ladder is not in its own scroll box — it would stretch the panel');
});

/* ---- the login streak ---- */

const DAY = 86400000;
const logFor = (n, gapAfter) => page.evaluate(([count, gap]) => {
  /* count consecutive login days ending today, optionally preceded by a gap. Timestamps sit
     at midday so a 24-hour step cannot land either side of the 06:00 boundary. */
  const out = [];
  const noon = new Date(window.__nvx._loginDayKey() + 'T12:00:00');   // midday of the current login day
  for (let i = 0; i < count; i++) {
    const ts = noon.getTime() - i * 86400000;
    out.push({ id: 'l' + i, xp: 250, ts, date: new Date(ts).toLocaleDateString('en-CA') });
  }
  if (gap) {
    const ts = noon.getTime() - (count + gap) * 86400000;
    out.push({ id: 'old', xp: 250, ts, date: new Date(ts).toLocaleDateString('en-CA') });
  }
  return out;
}, [n, gapAfter || 0]);

t('the streak is counted back through the log', async () => {
  await boot();
  const log = await logFor(12);
  const got = await page.evaluate((l) => window.__nvx._deriveLoginStreak(l), log);
  eq(got.loginStreak, 12, 'twelve consecutive days did not read as a 12-day streak');
});

t('a missed day breaks the streak and older days do not count', async () => {
  await boot();
  const log = await logFor(3, 4);      // 3 days to today, then a 4-day hole, then one more
  const got = await page.evaluate((l) => window.__nvx._deriveLoginStreak(l), log);
  eq(got.loginStreak, 3, 'days on the far side of a break were counted');
});

t('a streak that has not been used yet today still stands', async () => {
  /* The morning after a month of logins, before the day's award lands, the ladder read 0 —
     and stayed at 0 for good if the award never ran. A streak is broken by a day missed,
     not by a day not yet used. */
  await boot();
  const log = await logFor(20);
  const upToYesterday = log.slice(1);
  const got = await page.evaluate((l) => window.__nvx._deriveLoginStreak(l), upToYesterday);
  eq(got.loginStreak, 19, 'a streak with no entry yet today read as ' + got.loginStreak);
});

t('two days without a login does break it', async () => {
  await boot();
  const log = await logFor(20);
  const upToTwoDaysAgo = log.slice(2);
  const got = await page.evaluate((l) => window.__nvx._deriveLoginStreak(l), upToTwoDaysAgo);
  eq(got.loginStreak, 0, 'a whole day missed should end the streak');
});

t('the streak survives a Supabase load that has not landed yet', async () => {
  /* The old counter did newStreak = (lastLoginDate === yesterday) ? streak + 1 : 1, reading
     state that the Supabase load fills in. Any award that ran first reset a month-long
     streak to 1. Deriving from the log makes a blank lastLoginDate irrelevant. */
  await boot();
  const log = await logFor(9);
  const yesterdayOnwards = log.slice(1);          // today not yet awarded
  await page.evaluate((l) => {
    window.__nvx._dailyLoginAwarded = null;
    window.__nvx.setState({ loginXPLog: l, loginStreak: 0, lastLoginDate: '' });
  }, yesterdayOnwards);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx._awardDailyLogin());
  await page.waitForTimeout(700);
  const s = await page.evaluate(() => ({ streak: window.__nvx.state.loginStreak,
    n: (window.__nvx.state.loginXPLog || []).length }));
  eq(s.n, 9, "today's award was not written");
  eq(s.streak, 9, 'a blank lastLoginDate still reset the streak');
});

t('a day is recorded without a reload', async () => {
  /* The gaps in the real log are all days the app was open the whole time. The award now
     has to be reachable from the running session, not only from a fresh mount. */
  await boot();
  ok(await page.evaluate(() => typeof window.__nvx._awardDailyLogin === 'function'),
    'there is no award path separate from the once-per-open routine');
  const wired = await page.evaluate(() => {
    const src = window.__nvx.componentDidMount.toString();
    return { timer: /_dayTimer=setInterval\(\(\)=>\{[^}]*_awardDailyLogin/.test(src.replace(/\s+/g, '')),
             visible: /visibilitychange/.test(src) && /_awardDailyLogin/.test(src) };
  });
  ok(wired.timer, 'the day-rollover timer does not ask for the login award');
  ok(wired.visible, 'coming back to the foreground does not ask for the login award');
});

t('the same day is never awarded twice', async () => {
  await boot();
  await page.evaluate(() => {
    window.__nvx._dailyLoginAwarded = null;
    window.__nvx.setState({ loginXPLog: [], loginStreak: 0, lastLoginDate: '' });
  });
  await page.waitForTimeout(400);
  for (let i = 0; i < 5; i++) await page.evaluate(() => window.__nvx._awardDailyLogin());
  await page.waitForTimeout(700);
  const n = await page.evaluate(() => (window.__nvx.state.loginXPLog || []).length);
  eq(n, 1, 'the day was awarded ' + n + ' times');
});

t('the login day starts at 06:00, not midnight', async () => {
  await boot();
  const k = (y, mo, d, h, mi) => page.evaluate(([a, b, c, e, f]) =>
    window.__nvx._loginDayKey(new Date(a, b, c, e, f).getTime()), [y, mo, d, h, mi]);
  eq(await k(2026, 8, 6, 5, 59), '2026-09-05', 'five to six in the morning started a new day');
  eq(await k(2026, 8, 6, 6, 0), '2026-09-06', 'six o’clock did not start the new day');
  eq(await k(2026, 8, 6, 23, 30), '2026-09-06', 'late evening fell into the wrong day');
  eq(await k(2026, 8, 6, 0, 10), '2026-09-05', 'ten past midnight should still be the night before');
});

t('a late night and the small hours are one login day, not two', async () => {
  /* The point of the 06:00 boundary: finishing at half past midnight is the same session,
     so it must not read as a second day of the streak. */
  await boot();
  const log = await page.evaluate(() => ([
    { id: 'a', xp: 250, ts: new Date(2026, 8, 5, 23, 10).getTime() },
    { id: 'b', xp: 250, ts: new Date(2026, 8, 6, 0, 40).getTime() },
  ]));
  const days = await page.evaluate((l) =>
    l.map(x => window.__nvx._loginDayKey(x.ts)), log);
  eq(days[0], days[1], 'either side of midnight counted as two different days');
});

t('the award is 250 and comes once per login day', async () => {
  await boot();
  eq(await page.evaluate(() => window.__nvx.LOGIN_XP()), 250, 'the daily login is not 250 XP');
  await page.evaluate(() => {
    window.__nvx._dailyLoginAwarded = null;
    window.__nvx.setState({ loginXPLog: [], loginStreak: 0, lastLoginDate: '' });
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx._awardDailyLogin());
  await page.waitForTimeout(600);
  const got = await page.evaluate(() => (window.__nvx.state.loginXPLog || []).map(l => l.xp));
  eq(got.join(','), '250', 'the award was not a single 250');
});

t('an entry logged before the 06:00 rule existed still blocks a second award', async () => {
  /* Old entries carry a plain calendar date beside them, which is a different day from the
     one the rule works in — so the check has to read the timestamp, not that field. */
  await boot();
  const seeded = await page.evaluate(() => {
    const ts = Date.now();
    return [{ id: 'old', xp: 200, ts, date: new Date(ts).toLocaleDateString('en-CA') }];
  });
  await page.evaluate((l) => {
    window.__nvx._dailyLoginAwarded = null;
    window.__nvx.setState({ loginXPLog: l, loginStreak: 1, lastLoginDate: '' });
  }, seeded);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__nvx._awardDailyLogin());
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => (window.__nvx.state.loginXPLog || []).length), 1,
    'today was awarded twice over an entry that was already there');
});

/* ---- the XP effect and the level-up card ---- */

t('a gain floats a chip and it clears itself up', async () => {
  await boot();
  await page.evaluate(() => window.XPFx.clear());
  await page.evaluate(() => window.XPFx.gain(250));
  await page.waitForTimeout(250);
  const shown = await page.evaluate(() => {
    const c = document.querySelector('.xpfx-chip');
    return c ? c.textContent.replace(/\s+/g, ' ').trim() : null;
  });
  eq(shown, '+250 XP', 'the gain chip did not show the amount');
  await page.waitForTimeout(2200);
  const left = await page.evaluate(() => document.querySelectorAll('.xpfx-chip').length);
  eq(left, 0, 'the chip is still on the page after its animation');
});

t('nothing floats for a gain of nothing', async () => {
  await boot();
  await page.evaluate(() => window.XPFx.clear());
  await page.evaluate(() => { window.XPFx.gain(0); window.XPFx.gain(-40); });
  await page.waitForTimeout(200);
  eq(await page.evaluate(() => document.querySelectorAll('.xpfx-chip').length), 0,
    'a chip floated for zero or negative XP');
});

t('chips stack rather than pile up on one spot', async () => {
  await boot();
  await page.evaluate(() => window.XPFx.clear());
  await page.evaluate(() => { for (let i = 0; i < 8; i++) window.XPFx.gain(10 + i); });
  await page.waitForTimeout(250);
  const tops = await page.evaluate(() =>
    [...document.querySelectorAll('.xpfx-chip')].map(c => c.style.bottom));
  ok(tops.length > 0 && tops.length <= 4, 'expected at most 4 chips, got ' + tops.length);
  eq(new Set(tops).size, tops.length, 'two chips landed on the same spot');
});

t('a real gain fires the effect, a late history load does not', async () => {
  await boot();
  await page.evaluate(() => {
    window.__nvx._xpSeen = null; window.__nvx._xpLive = false;
    window.XPFx.clear();
  });
  await page.evaluate(() => { window.__nvx._xpWatch(); window.__nvx._xpLive = true; });

  /* One logged session is a plausible gain. */
  await page.evaluate(() => window.__nvx.mut(s => ({ workouts: [...(s.workouts || []),
    { id: 'x1', ts: Date.now(), part: 'Chest', exercise: 'Bench', weight: 60, sets: 3, reps: 5, min: 20 }] })));
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => document.querySelectorAll('.xpfx-chip').length > 0),
    'a logged session did not raise the XP effect');

  /* A month of history landing at once is not something the user just did. */
  await page.evaluate(() => window.XPFx.clear());
  await page.evaluate(() => {
    const many = [];
    for (let i = 0; i < 60; i++) many.push({ id: 'h' + i, ts: Date.now() - i * 86400000,
      part: 'Chest', exercise: 'Bench', weight: 60, sets: 3, reps: 5, min: 45 });
    window.__nvx.mut(s => ({ workouts: [...(s.workouts || []), ...many] }));
  });
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => document.querySelectorAll('.xpfx-chip').length), 0,
    'a bulk history load was announced as if the user had just earned it');
});

/* Every test here shares one browser profile, and mut() writes through to localStorage, so
   whatever an earlier test logged is still there on the next boot. These two care about the
   exact level, so they clear the XP-bearing logs first and then size the gain to the level
   they actually find themselves on. A fixed 300 minutes passed only while the leftovers
   happened to leave the level cheap. */
const clearXPLogs = () => page.evaluate(() => window.__nvx.setState({
  workouts: [], activities: [], income: [], expenses: [], events: [], missionHistory: [],
  loginXPLog: [], checklist: [], savings: [], levelUp: null }));

t('crossing a level opens the card, and it names the level and rank', async () => {
  await boot();
  await clearXPLogs();
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__nvx._xpSeen = null; window.__nvx._xpLive = false; });
  await page.evaluate(() => { window.__nvx._xpWatch(); window.__nvx._xpLive = true; });
  const p0 = await page.evaluate(() => {
    const P = window.__nvx.computePower();
    return { level: P.level, need: P.xpForNext - P.xpInLevel };
  });
  const before = p0.level;
  ok(p0.need < 2000, 'this level needs ' + p0.need + ' XP, past what one action can plausibly give');

  /* A logged session is worth 30 + its minutes, so this crosses exactly one level. */
  await page.evaluate((min) => window.__nvx.mut(s => ({ workouts: [...(s.workouts || []),
    { id: 'lvl', ts: Date.now(), part: 'Chest', exercise: 'Bench', weight: 60, sets: 3, reps: 5, min }] })),
    Math.max(1, p0.need - 30 + 5));
  await page.waitForTimeout(700);
  const lu = await page.evaluate(() => window.__nvx.state.levelUp);
  ok(lu, 'crossing a level did not open the card');
  eq(lu.from, before, 'the card names the wrong starting level');
  ok(lu.to > lu.from, 'the card did not go up a level');

  const body = await text();
  ok(body.includes('LEVEL UP') || body.includes('RANK UP'), 'the card has no banner');
  ok(body.includes(String(lu.to)), 'the card does not show the new level');
  ok(lu.rank && body.includes(lu.rank), 'the card does not name the rank');

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('span,div')]
      .find(e => e.children.length === 0 && e.textContent.trim() === 'CONTINUE');
    if (!b) throw new Error('no CONTINUE button');
    b.click();
  });
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => window.__nvx.state.levelUp), null, 'the card would not close');
});

t('no card for a gain that stays inside the level', async () => {
  await boot();
  await clearXPLogs();
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__nvx._xpSeen = null; window.__nvx._xpLive = false; });
  await page.evaluate(() => { window.__nvx._xpWatch(); window.__nvx._xpLive = true; });
  const need = await page.evaluate(() => {
    const P = window.__nvx.computePower(); return P.xpForNext - P.xpInLevel;
  });
  ok(need > 15, 'no room left in this level to test a gain that stays inside it');

  /* A calendar event is worth 10 XP — comfortably short of the next level. */
  const lvl = (await power()).level;
  await page.evaluate(() => window.__nvx.mut(s => ({ events: [...(s.events || []),
    { id: 'e1', title: 'x', date: '2026-01-01', time: '09:00', repeat: [], kind: 'general' }] })));
  await page.waitForTimeout(700);
  eq((await power()).level, lvl, 'the setup gain crossed a level after all');
  eq(await page.evaluate(() => window.__nvx.state.levelUp), null,
    'the card opened without a level actually being crossed');
  ok(await page.evaluate(() => document.querySelectorAll('.xpfx-chip').length > 0),
    'a gain inside the level should still float a chip');
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
