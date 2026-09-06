/* The Learning Centre stats bar, and where the learning streak lives:
     node learning-stats.test.mjs

   The bar carried six figures on every one of nine subjects, in both raiments — XP today and
   a 7d/30d test count that nobody read, and a streak sitting on one subject's hub rather
   than beside the other streak on Power Level. Removing a cell from eighteen copies of the
   same markup is exactly the kind of edit that misses one, so this counts them. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8915;

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

const SUBJECTS = ['Maths', 'English', 'Science', 'Grammar', 'History', 'Speaking',
                  'Human Physiology', 'Money', 'Gentleman’s Etiquette'];

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null }, p || {})), patch || null);
  await page.waitForTimeout(800);
}
const text = () => page.evaluate(() => document.body.innerText);

t('no subject hub still shows XP today or the 7d/30d count', async () => {
  await boot({ scene: 'learning' });
  const missed = [];
  for (const raiment of ['Ultra X', 'Noir']) {
    await page.evaluate((r) => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', r); }, raiment);
    for (const s of SUBJECTS) {
      await page.evaluate((x) => window.__nvx.setState({ learningTab: x, mtMode: 'hub' }), s);
      await page.waitForTimeout(420);
      const body = await text();
      for (const gone of ['XP TODAY', '7D / 30D TESTS'])
        if (body.includes(gone)) missed.push(raiment + '/' + s + ': ' + gone);
    }
  }
  eq(missed.join(' | '), '', 'still on a subject hub');
});

t('the base raiment hubs are clear too', async () => {
  await boot({ scene: 'learning' });
  await page.evaluate(() => window.__nvx.setPref('theme', 'Lime'));
  const missed = [];
  for (const s of SUBJECTS) {
    await page.evaluate((x) => window.__nvx.setState({ learningTab: x, mtMode: 'hub' }), s);
    await page.waitForTimeout(420);
    const body = await text();
    for (const gone of ['XP TODAY', '7D / 30D TESTS'])
      if (body.includes(gone)) missed.push(s + ': ' + gone);
  }
  eq(missed.join(' | '), '', 'still on a subject hub in the base raiment');
});

t('the bar keeps the three figures that were meant to stay', async () => {
  await boot({ scene: 'learning' });
  await page.evaluate(() => window.__nvx.setPref('theme', 'Lime'));
  await page.evaluate(() => window.__nvx.setState({ learningTab: 'Maths', mtMode: 'hub' }));
  await page.waitForTimeout(600);
  const body = await text();
  for (const keep of ['ACCURACY', 'TOTAL QUESTIONS', 'HOURS STUDIED'])
    ok(body.includes(keep), keep + ' went with the cells that were being removed');
});

t('the bar is left with no divider dividing nothing', async () => {
  /* The cells were separated by hairlines. Pulling three cells out of six left runs of
     them stacked against each other and one hanging off the end of the row. */
  await boot({ scene: 'learning' });
  await page.evaluate(() => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', 'Ultra X'); });
  const bad = [];
  for (const s of SUBJECTS) {
    await page.evaluate((x) => window.__nvx.setState({ learningTab: x, mtMode: 'hub' }), s);
    await page.waitForTimeout(420);
    const found = await page.evaluate(() => {
      const isRule = (el) => el.tagName === 'DIV' && !el.children.length &&
        !el.textContent.trim() && el.getBoundingClientRect().width <= 2 &&
        el.getBoundingClientRect().height > 8;
      const out = [];
      for (const row of document.querySelectorAll('div')) {
        const kids = [...row.children].filter(c => c.getBoundingClientRect().height > 0);
        if (kids.length < 2 || !kids.some(isRule)) continue;
        for (let i = 0; i < kids.length; i++) {
          if (!isRule(kids[i])) continue;
          if (i === kids.length - 1) out.push('trailing');
          else if (isRule(kids[i + 1])) out.push('doubled');
        }
      }
      return out;
    });
    if (found.length) bad.push(s + ': ' + found.join(','));
  }
  eq(bad.join(' | '), '', 'a hairline is left dividing nothing');
});

t('the learning streak is on Power Level, and it is the real number', async () => {
  /* Real means counted from logged Learning activity, not a stored figure that can drift:
     consecutive days ending today, or ending yesterday if today has not been used yet. */
  await boot({ scene: 'power' });
  const noon = (d) => { const x = new Date(); x.setHours(12, 0, 0, 0); return x.getTime() - d * 86400000; };
  await page.evaluate((ts) => window.__nvx.setState({
    activities: ts.map((t, i) => ({ id: 'a' + i, text: 'lesson', cat: 'Learning', ts: t, min: 10 })) }),
    [noon(0), noon(1), noon(2), noon(3)]);
  await page.waitForTimeout(700);
  const body = await text();
  ok(body.includes('LEARNING STREAK'), 'the learning streak is not on Power Level');
  ok(body.includes('4d'), 'four days of logged learning did not read as 4d');
  eq(await page.evaluate(() => window.__nvx._streakFor('Learning')), 4, 'the streak is not counted from the log');
});

t('a gap in the days breaks the learning streak', async () => {
  await boot({ scene: 'power' });
  const noon = (d) => { const x = new Date(); x.setHours(12, 0, 0, 0); return x.getTime() - d * 86400000; };
  await page.evaluate((ts) => window.__nvx.setState({
    activities: ts.map((t, i) => ({ id: 'b' + i, text: 'lesson', cat: 'Learning', ts: t, min: 10 })) }),
    [noon(0), noon(1), noon(5), noon(6)]);
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => window.__nvx._streakFor('Learning')), 2,
    'days on the far side of a break were counted');
});

t('the streak is no longer duplicated on a subject hub', async () => {
  await boot({ scene: 'learning' });
  await page.evaluate(() => window.__nvx.setPref('theme', 'Lime'));
  await page.evaluate(() => window.__nvx.setState({ learningTab: 'Maths', mtMode: 'hub' }));
  await page.waitForTimeout(600);
  const rows = await page.evaluate(() => [...document.querySelectorAll('div')]
    .filter(e => e.children.length === 0 && e.textContent.trim() === 'STREAK').length);
  eq(rows, 0, 'the stats bar still carries its own STREAK cell');
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
