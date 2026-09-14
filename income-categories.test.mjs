/* Income categories:  node income-categories.test.mjs

   removeIncomeCategory has existed since income categories could be renamed at all — it
   works, it is symmetric with removeExpenseCategory, and nothing in the page ever called it.
   Expense categories get a remove '×' in the Budget vs Actual panel, but income has no budget
   panel to hide one in, so removing an income category had no path in the UI at all: the
   method was reachable only from a test or the console.

   The fix mirrors the pattern already used for other quick-add chip pickers (the fit-checklist
   chips, for one): a small '×' inside the chip itself, stopping propagation so it does not
   also select the category it is about to remove. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8937;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'business',
    prefs: { ...window.__nvx.state.prefs, incomeCategories: ['Salary', 'Freelance', 'Gift'] },
  }, p || {})), patch || null);
  await page.waitForTimeout(900);
}

const chip = (label) => page.evaluate((want) => {
  const x = [...document.querySelectorAll('span')].find(e => e.textContent.trim().startsWith(want) && /×$/.test(e.textContent.trim()));
  return x ? { text: x.textContent, hasX: !![...x.querySelectorAll('span')].find(s => s.textContent.trim() === '×') } : null;
}, label);

const clickX = (label) => page.evaluate((want) => {
  const x = [...document.querySelectorAll('span')].find(e => e.textContent.trim().startsWith(want) && /×$/.test(e.textContent.trim()));
  const xBtn = x && [...x.querySelectorAll('span')].find(s => s.textContent.trim() === '×');
  if (xBtn) xBtn.click();
  return !!xBtn;
}, label);

t('an income category chip carries a remove control', async () => {
  await boot();
  const c = await chip('Freelance');
  ok(c, 'the Freelance chip is not on the page');
  ok(c.hasX, 'the chip has no × to remove it with');
});

t('clicking × removes the category rather than selecting it', async () => {
  await boot();
  const before = await page.evaluate(() => window.__nvx.state.incCat);
  const clicked = await clickX('Freelance');
  ok(clicked, 'the × on Freelance was not found to click');
  await page.waitForTimeout(300);
  const cats = await page.evaluate(() => window.__nvx.state.prefs.incomeCategories);
  ok(cats.indexOf('Freelance') < 0, 'Freelance is still in the category list: ' + cats.join(','));
  const after = await page.evaluate(() => window.__nvx.state.incCat);
  ok(after !== 'Freelance', 'clicking × selected the category it was meant to remove, got ' + after + ' (was ' + before + ')');
});

t('the last income category cannot be removed down to zero', async () => {
  await boot({ prefs: { ...(await page.evaluate(() => window.__nvx.state.prefs)), incomeCategories: ['Only One'] } });
  await clickX('Only One');
  await page.waitForTimeout(300);
  const cats = await page.evaluate(() => window.__nvx.state.prefs.incomeCategories);
  eq(cats.length, 1, 'the only remaining income category should not be removable');
  eq(cats[0], 'Only One', 'the surviving category changed name: ' + cats.join(','));
});

t('removing the selected category falls back to what is left', async () => {
  await boot();
  await page.evaluate(() => window.__nvx.setState({ incCat: 'Freelance' }));
  await page.waitForTimeout(200);
  await clickX('Freelance');
  await page.waitForTimeout(300);
  const sel = await page.evaluate(() => window.__nvx.state.incCat);
  ok(sel !== 'Freelance', 'the removed category is still the selected one: ' + sel);
  const cats = await page.evaluate(() => window.__nvx.state.prefs.incomeCategories);
  ok(cats.indexOf(sel) >= 0, 'the fallback selection ' + sel + ' is not even a real category: ' + cats.join(','));
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
