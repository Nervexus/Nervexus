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

t('Health wears the same place Mental opens into', async () => {
  /* Two dark ruled cards sitting on the Forge page, while the centre next door was a pale
     field you step into. Same app, two different materials. Health is the same field now —
     the same sheen, the same grain, and the hairline doing the column-dividing rather than
     a border. */
  await boot('health', 'Ultra X');
  const p = await page.evaluate(() => {
    const pan = document.querySelector('.rest-panel');
    if (!pan) return null;
    const head = [...pan.querySelectorAll('div')].find(e => e.textContent.trim() === 'Log Today');
    return {
      abyss: !!pan.querySelector('.rest-abyss'),
      grain: !!pan.querySelector('.rest-grain'),
      rule: !!pan.querySelector('.rest-rule'),
      serif: head ? /Cormorant/.test(getComputedStyle(head).fontFamily) : false,
      /* the card it used to be, and the translucency that came with it */
      card: pan.classList.contains('cc-glowcard') || !!pan.querySelector('.cc-glowcard'),
      ink: getComputedStyle(pan).getPropertyValue('--ab-ink').trim(),
    };
  });
  ok(p, 'the Health centre is not the abyss panel');
  ok(p.abyss, 'no field'); ok(p.grain, 'no grain');
  ok(p.rule, 'the hairline is not dividing the two halves');
  ok(p.serif, 'Log Today is not the serif the sit uses');
  ok(!p.card, 'the ruled card is still there');
  eq(p.ink, '#2A2A28', 'Ultra X is not reading the pale field');
});

t('and it goes black for Noir only', async () => {
  await boot('health', 'Noir');
  const n = await page.evaluate(() => {
    const pan = document.querySelector('.rest-panel');
    return pan ? getComputedStyle(pan).getPropertyValue('--ab-ink').trim() : '';
  });
  eq(n, '#ECE8E0', 'Noir is not wearing the black variant');
});

t('the hint text is the field\'s, not the raiment\'s', async () => {
  /* Lines and pills wear the raiment; body copy and hints do not. .theme-ultra
     input::placeholder paints every hint the raiment's muted ink with !important, which on
     Maison Elysee is its blue — a blue hint sitting inside a grey field. */
  await boot('health', 'Maison Élysée');
  const c = await page.evaluate(() => {
    const f = document.querySelector('.rest-panel .rest-field');
    if (!f) return null;
    const pan = document.querySelector('.rest-panel');
    return { hint: getComputedStyle(f, '::placeholder').color,
             muted: getComputedStyle(pan).getPropertyValue('--ab-muted').trim() };
  });
  ok(c, 'no field to read');
  /* --ab-muted is #6E6C67 on every raiment but Noir */
  eq(c.hint, 'rgb(110, 108, 103)', 'the hint is wearing the raiment (' + c.hint + ') not the field');
  eq(c.muted, '#6E6C67', 'the muted token moved');
});

t('every line and pill on it is the raiment\'s own colour', async () => {
  /* The field stays white — that is the idea of it — but the things drawn ON the field are
     the raiment, or the panel is the same object in all four and the raiment has been
     stepped away from. Ultra X oxblood, Maison Élysée blue, Éverpine gold, Noir white. */
  const want = {
    'Ultra X':          { accent: '#5B1A1A', line: 'rgba(91,26,26,0.32)',    fill: 'rgb(91, 26, 26)' },
    'Maison Élysée':    { accent: '#3C5A7D', line: 'rgba(60,90,125,0.34)',   fill: 'rgb(60, 90, 125)' },
    'Maison Éverpine':  { accent: '#7C6A38', line: 'rgba(124,106,56,0.34)',  fill: 'rgb(124, 106, 56)' },
    'Noir':             { accent: '#FFFFFF', line: 'rgba(236,232,224,0.24)', fill: 'rgb(236, 232, 224)' },
  };
  for (const [style, w] of Object.entries(want)) {
    await boot('health', style);
    const got = await page.evaluate(() => {
      const pan = document.querySelector('.rest-panel');
      const cs = getComputedStyle(pan);
      const add = [...pan.querySelectorAll('.rest-chip-on')].find(e => e.textContent.trim() === 'ADD');
      const field = pan.querySelector('.rest-field');
      return { accent: cs.getPropertyValue('--ab-accent').trim(),
               line: cs.getPropertyValue('--ab-line').trim(),
               pill: add ? getComputedStyle(add).backgroundColor : '',
               under: field ? getComputedStyle(field).borderBottomColor : '' };
    });
    eq(got.accent, w.accent, style + ' has the wrong accent');
    eq(got.line, w.line, style + ' has the wrong hairline');
    eq(got.pill, w.fill, style + ' ADD is not the raiment colour');
    ok(got.under !== 'rgb(0, 0, 0)' && got.under !== '', style + ' field underline is unpainted');
  }
});

t('the two halves stack on a phone', async () => {
  await boot('health');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(600);
  const cols = await page.evaluate(() => {
    const sp = document.querySelector('.rest-split');
    return sp ? getComputedStyle(sp).gridTemplateColumns.trim().split(/\s+/).length : 0;
  });
  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.waitForTimeout(400);
  eq(cols, 1, 'the split is still ' + cols + ' columns wide on a phone');
});

t('the panel is built for the frame it is in', async () => {
  /* It was authored at desktop sizes and those went straight onto a 390px screen: a 168px
     ring and three 30px serif figures filled the frame between them, and ADD stretched
     across whatever the two number fields left over. The whole thing steps down together
     on a phone rather than one piece at a time, so the proportions hold. */
  const read = () => page.evaluate(() => {
    const pan = document.querySelector('.rest-panel');
    const px = (el, prop) => el ? Math.round(parseFloat(getComputedStyle(el)[prop])) : 0;
    const add = [...pan.querySelectorAll('.rest-chip-on')].find(e => e.textContent.trim() === 'ADD');
    return { rings: px(pan.querySelector('.rest-rings'), 'width'),
             figure: px(pan.querySelector('.rest-figure'), 'fontSize'),
             head: px(pan.querySelector('.rest-h2'), 'fontSize'),
             addW: add ? Math.round(add.getBoundingClientRect().width) : 0,
             panelH: Math.round(pan.getBoundingClientRect().height),
             panelW: Math.round(pan.getBoundingClientRect().width) };
  });

  await boot('health');
  const desk = await read();
  eq(desk.rings, 168, 'the desktop ring changed size');
  eq(desk.figure, 30, 'the desktop figure changed size');
  ok(desk.addW < desk.panelW * 0.2, 'ADD is ' + desk.addW + 'px of a ' + desk.panelW + 'px panel — it is stretching again');

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(700);
  const phone = await read();
  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.waitForTimeout(400);
  ok(phone.rings <= 100, 'the ring is still ' + phone.rings + 'px on a phone');
  ok(phone.figure <= 20, 'the figures are still ' + phone.figure + 'px on a phone');
  ok(phone.head <= 22, 'Log Today is still ' + phone.head + 'px on a phone');
  /* Roughly half a 900px window. Above that the logging half — the reason the page is not
     decoration — is below the fold on the device it is most used on. */
  ok(phone.panelH < 480, 'the panel is ' + phone.panelH + 'px tall on a 390px frame');
});

t('a meal still goes in through the new surface', async () => {
  /* The redesign moved every control onto a different element. A panel that looks right and
     cannot take a meal is worse than the cards were. */
  await boot('health');
  /* Typed into the real inputs, not pushed into state: the point of the test is that the
     fields the redesign replaced are still wired to the handlers. */
  await page.fill('.rest-panel input[placeholder^="Meal"]', 'Porridge and eggs');
  await page.fill('.rest-panel input[placeholder="kcal"]', '620');
  await page.fill('.rest-panel input[placeholder="protein g"]', '38');
  await page.waitForTimeout(400);
  const hit = await page.evaluate(() => {
    const add = [...document.querySelectorAll('.rest-panel .rest-chip')]
      .find(e => e.textContent.trim() === 'ADD' && e.onclick);
    if (!add) return false; add.click(); return true;
  });
  ok(hit, 'there is no ADD on the panel that does anything');
  await page.waitForTimeout(800);
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
