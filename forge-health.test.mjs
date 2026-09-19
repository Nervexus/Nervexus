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
  for (const label of ['FUEL', 'PROTEIN', 'HYDRATION', 'LOG TODAY'])
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
  /* Something has to be logged before this can be asked. It used to read the day with an
     empty record, and what it was actually sampling was the round cap each ring drew at
     zero — three dots at twelve o'clock that were a defect, not a colour sample. */
  const feed = () => page.evaluate(() => window.__nvx.setState({ health: { ...window.__nvx.state.health,
    meals: [{ id: 'r', name: 'Lunch', kcal: 1200, protein: 90, date: window.__nvx._todayStr() }] } }));
  const cap = () => page.evaluate(() => {
    const cv = document.querySelector('canvas[data-chart="healthRings"]');
    const d = cv.getContext('2d').getImageData(Math.round(cv.width / 2), 0, 1, cv.height).data;
    for (let i = 0; i < d.length; i += 4)
      if (d[i + 3] > 200) return { r: d[i], g: d[i + 1], b: d[i + 2] };
    return null;
  });
  await boot('health', 'Ultra X');
  await feed();
  await page.waitForTimeout(1400);
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

t('Health wears the same card block Calendar and Power Level do', async () => {
  /* Two dark ruled cards sitting on the Forge page, while Calendar and Power Level had already
     moved to the pearl ground and the lit-rim card block. Health carries the same template
     now: the .lcb-stage/.lcb-field ground under it, and .lc-card panels with a rim, not the
     old sit-style abyss/grain field it briefly wore. */
  await boot('health', 'Ultra X');
  const p = await page.evaluate(() => {
    const stage = document.querySelector('.lcb-stage');
    if (!stage) return null;
    const cards = [...stage.querySelectorAll('.lc-card')];
    return {
      field: !!stage.querySelector('.lcb-field'),
      cardCount: cards.length,
      glass: cards.every(c => /blur/.test(getComputedStyle(c).backdropFilter)),
      rim: cards.every(c => /inset/.test(getComputedStyle(c).boxShadow)),
    };
  });
  ok(p, 'the Health centre is not on the pearl stage');
  ok(p.field, 'no lit ground under Health');
  eq(p.cardCount, 3, 'Health should carry its three panels (Today, Log Today, Meals)');
  ok(p.glass, 'the panels are not glass');
  ok(p.rim, 'the panels have no lit rim');
});

t('every line and pill on it is the same fixed block-design colour, on every raiment', async () => {
  /* The card stays the shared ivory/graphite pearl — that is the idea of it — and the things
     drawn ON it used to be the raiment (Ultra X oxblood, Maison Élysée blue, Éverpine gold,
     Noir white). Block design was later reverted to Ultra X's original and made the same for
     every raiment, --lc-accent included, so those four different inks are now one fixed ink
     everywhere — the point calendar-page.test.mjs already established for --lc-accent. */
  const accent = 'rgb(41, 37, 36)';
  for (const style of ['Ultra X', 'Maison Élysée', 'Maison Éverpine', 'Noir']) {
    await boot('health', style);
    const got = await page.evaluate(() => {
      const title = document.querySelector('.lc-title');
      const add = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'ADD');
      return { title: title ? getComputedStyle(title).color : '',
               pill: add ? getComputedStyle(add).backgroundColor : '' };
    });
    eq(got.title, accent, style + ' the card title is not the fixed block-design ink');
    eq(got.pill, accent, style + ' ADD is not the fixed block-design colour');
  }
});

t('the page does not scroll sideways on a phone', async () => {
  await boot('health');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(600);
  const over = await page.evaluate(() => {
    const sc = document.querySelector('.cc-scene') || document.scrollingElement;
    return sc.scrollWidth - sc.clientWidth;
  });
  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.waitForTimeout(400);
  ok(over <= 1, 'Health scrolls sideways on a phone by ' + over + 'px');
});

t('a meal still goes in through the new surface', async () => {
  /* The redesign moved every control onto a different element. A card that looks right and
     cannot take a meal is worse than the sit panel was. */
  await boot('health');
  /* Typed into the real inputs, not pushed into state: the point of the test is that the
     fields the redesign replaced are still wired to the handlers. */
  await page.fill('.lcb-stage input[placeholder^="Meal"]', 'Porridge and eggs');
  await page.fill('.lcb-stage input[placeholder="kcal"]', '620');
  await page.fill('.lcb-stage input[placeholder="protein g"]', '38');
  await page.waitForTimeout(400);
  const hit = await page.evaluate(() => {
    const add = [...document.querySelectorAll('.lcb-stage span')]
      .find(e => e.textContent.trim() === 'ADD' && e.onclick);
    if (!add) return false; add.click(); return true;
  });
  ok(hit, 'there is no ADD on the card that does anything');
  await page.waitForTimeout(700);
  /* ADD asks before it writes now, and the gate reads the meal back as it will be logged.
     Nothing is in the list until that is answered. */
  const asked = await page.evaluate(() => window.__nvx.state.logGate);
  ok(asked && asked.kind === 'meal', 'ADD did not open the log gate');
  ok(!(await text()).includes('620 / 2400 kcal'), 'the meal landed before it was confirmed');
  const said = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find(e => e.textContent.trim() === 'CONFIRM' && e.onclick);
    if (!el) return false; el.click(); return true;
  });
  ok(said, 'there is no CONFIRM on the gate');
  await page.waitForTimeout(900);
  const b = await text();
  ok(b.includes('Porridge and eggs'), 'the meal did not land in the list');
  ok(b.includes('620 / 2400 kcal'), 'the rings row did not take the meal');
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
