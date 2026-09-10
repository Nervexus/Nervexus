/* The calendar page:  node calendar-page.test.mjs

   Six things, all from one round of real use.

   A rota put six people's shifts and days off on one person's calendar — because the general
   screenshot import was pointed at it, and that import reads every row it can see. A day the
   user is not working has to be a blank day.

   The month also changed size depending on which day was selected: it shared a grid row with
   the day panel, so a busy day stretched it and an empty one shrank it back. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8931;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

const day = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'calendar', events: [], dayColors: {},
    account: { ...(window.__nvx.state.account || {}), name: 'Madoxs' },
  }, p || {})), patch || null);
  await page.waitForTimeout(700);
}
const text = () => page.evaluate(() => document.body.innerText);
const clickText = (s) => page.evaluate((want) => {
  const el = [...document.querySelectorAll('div,span')]
    .find(e => e.children.length === 0 && e.textContent.trim() === want);
  if (!el) throw new Error('no element reading "' + want + '"');
  (el.classList.contains('sc-interp') ? el.parentElement : el).click();
}, s);
const calHeight = () => page.evaluate(() => Math.round(document.querySelector('.cc-cal-hero').getBoundingClientRect().height));

t('the month is one size, whatever day is selected', async () => {
  /* It shared a grid row with the day panel, so grid stretched it to whatever the panel
     happened to be — a day with six events made the month taller than an empty one. */
  const busy = day(1), empty = day(2);
  const evs = [];
  for (let i = 0; i < 8; i++) evs.push({ id: 'e' + i, title: 'Thing ' + i, date: busy, time: '0' + (i + 1) + ':00', repeat: [], kind: 'general' });
  await boot({ events: evs, calSel: empty });
  const quiet = await calHeight();
  await page.evaluate((d) => window.__nvx.setState({ calSel: d }), busy);
  await page.waitForTimeout(500);
  const loud = await calHeight();
  eq(loud, quiet, 'the month changed height when a busy day was selected (' + quiet + ' -> ' + loud + ')');
  ok(quiet > 600, 'the month should keep a real size, got ' + quiet + 'px');
});

t('a day you are not working is a blank day', async () => {
  /* The rota import only ever writes your own shifts, so a day you are off has nothing on
     it — not your colleagues' shifts, and not your own day off as an entry. */
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
  const uk = (n) => { const x = d(n); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); };
  const sheet = ['\t\tChristine\t\tMadoxs\t\tTony',
                 uk(1) + '\tMonday\t8-6\t9\tD/O\t0\t9-5\t7',
                 uk(2) + '\tTuesday\t9-5\t7\t8-6\t9\tD/O\t0'].join('\n');
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: sheet });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(500);
  await clickText('Add 1 shift');
  await page.waitForTimeout(700);
  const evs = await page.evaluate(() => window.__nvx.state.events.map(e => e.date + ' ' + e.title));
  eq(evs.length, 1, 'only his own shift should be written, got ' + evs.join(' | '));
  eq(evs[0], day(2) + ' Work', 'and on the day he is actually working');
  await page.evaluate((x) => window.__nvx.setState({ calSel: x }), day(1));
  await page.waitForTimeout(400);
  ok((await text()).includes('No events yet on this day'), 'the day he is off must be blank');
});

t('a rota is refused by the screenshot import rather than read row by row', async () => {
  /* Pointed at a rota, that import returns a row per person per day — six colleagues' shifts
     and days off on a calendar that should hold one person's. */
  await boot();
  await page.evaluate(async () => {
    window.claude = { complete: () => Promise.resolve('ROTA') };
    await window.__nvx.importCalendarScreenshot(new File(['x'], 'rota.jpg', { type: 'image/jpeg' }));
  });
  await page.waitForTimeout(600);
  const st = await page.evaluate(() => ({ err: window.__nvx.state.calImportErr, n: window.__nvx.state.events.length }));
  eq(st.n, 0, 'nothing from a rota may be written by the general import');
  ok(/work rota/i.test(st.err), 'it should say what it saw: ' + st.err);
  ok(/Import work rota/.test(st.err), 'and point at the tool that handles it: ' + st.err);
});

t('a day can be cleared in one go', async () => {
  const d = day(1);
  await boot({ events: [
    { id: 'a', title: 'One', date: d, time: '09:00', repeat: [], kind: 'general' },
    { id: 'b', title: 'Two', date: d, time: '10:00', repeat: [], kind: 'work', endTime: '17:00' },
    { id: 'c', title: 'Elsewhere', date: day(3), time: '09:00', repeat: [], kind: 'general' },
  ], calSel: d });
  ok((await text()).includes('CLEAR ALL'), 'there is no clear-all on a day with events');
  await clickText('CLEAR ALL');
  await page.waitForTimeout(600);
  const left = await page.evaluate(() => window.__nvx.state.events.map(e => e.id));
  eq(left.join(','), 'c', 'it should clear the selected day and nothing else');
  await page.waitForTimeout(300);
  ok(!(await text()).includes('CLEAR ALL'), 'and take itself away once the day is empty');
});

t('the six day colours are the ones asked for', async () => {
  await boot();
  const defs = await page.evaluate(() => window.__nvx.DAY_COLORS());
  eq(defs.map(c => c[0]).join(','), 'Grey,Black,Navy,Dark Yellow,Red,Pink', 'wrong palette');
  eq(defs.length, 6, 'six colours');
  const old = ['#ffb020', '#2fce86', '#38bdf8', '#4f7bff', '#a855f7', '#ff5fa2'];
  for (const o of old) ok(!defs.some(c => c[1].toLowerCase() === o), o + ' is still in the palette');
});

t('a colour too dark or too pale for the surface is still visible', async () => {
  /* Black on a dark app and white on an ivory one are both invisible. The colour picked is
     what the swatch shows; what is drawn against the surface is pulled far enough toward the
     middle to be seen. */
  await boot();
  const dark = await page.evaluate(() => {
    window.__nvx.state.prefs.theme = 'Sovereign';
    return { black: window.__nvx._hlInk('#1C1917'), red: window.__nvx._hlInk('#9B1C1C') };
  });
  ok(dark.black !== '#1C1917', 'black should be lifted on a dark app, got ' + dark.black);
  ok(window_lum(dark.black) > 60, 'and lifted far enough to see: ' + dark.black);
  eq(dark.red, '#9B1C1C', 'a colour that already reads is left exactly as chosen');
  const light = await page.evaluate(() => {
    window.__nvx.state.prefs.theme = 'Ultra'; window.__nvx.state.prefs.ultraStyle = 'Ultra X';
    return { white: window.__nvx._hlInk('#FFFFFF'), black: window.__nvx._hlInk('#1C1917') };
  });
  ok(light.white !== '#FFFFFF', 'white should be darkened on an ivory card, got ' + light.white);
  eq(light.black, '#1C1917', 'black on an ivory card needs no help');
});
function window_lum(hex) { const m = hex.replace('#', ''); return 0.299 * parseInt(m.slice(0, 2), 16) + 0.587 * parseInt(m.slice(2, 4), 16) + 0.114 * parseInt(m.slice(4, 6), 16); }

t('a work dot follows the raiment and a general dot follows the user', async () => {
  const d = day(1);
  await boot({ events: [
    { id: 'w', title: 'Shift', date: d, time: '09:00', repeat: [], kind: 'work', endTime: '17:00' },
    { id: 'g', title: 'Dentist', date: d, time: '15:00', repeat: [], kind: 'general' },
  ], calSel: d });
  const c = await page.evaluate(() => ({
    work: window.__nvx._evColor(window.__nvx.state.events[0]),
    gen: window.__nvx._evColor(window.__nvx.state.events[1]),
  }));
  eq(c.work, 'var(--forge-accent)', 'a work dot should take the raiment accent');
  ok(c.gen !== 'var(--forge-accent)', 'a general dot should not');

  await page.evaluate(() => window.__nvx.setEvColor('g', '#9B1C1C'));
  await page.waitForTimeout(400);
  eq(await page.evaluate(() => window.__nvx._evColor(window.__nvx.state.events[1])), '#9B1C1C', 'the pick did not take');
  eq(await page.evaluate(() => window.__nvx.state.prefs.evColors.g), '#9B1C1C',
    'it must live in prefs, which is what syncs and survives a reload');
});

t('a colour does not outlive the event it belonged to', async () => {
  const d = day(1);
  await boot({ events: [{ id: 'g', title: 'Dentist', date: d, time: '15:00', repeat: [], kind: 'general' }], calSel: d });
  await page.evaluate(() => window.__nvx.setEvColor('g', '#D6488F'));
  await page.waitForTimeout(300);
  await clickText('CLEAR ALL');
  await page.waitForTimeout(600);
  const left = await page.evaluate(() => Object.keys(window.__nvx.state.prefs.evColors || {}));
  eq(left.join(','), '', 'the colour should go with the event, not sit in prefs for ever');
});

t('the type toggle is the raiment colour, not a black button', async () => {
  await boot();
  await page.evaluate(() => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', 'Ultra X'); });
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div,span')].find(e => e.children.length === 0 && e.textContent.trim() === 'GENERAL');
    const b = el.classList.contains('sc-interp') ? el.parentElement : el;
    const cs = getComputedStyle(b);
    return { bg: cs.backgroundColor, accent: getComputedStyle(document.querySelector('.cc-shell')).getPropertyValue('--forge-add-bg').trim() };
  });
  /* --sel-bg is the raiment's own accent; the old value was a flat white the Ultra sheet then
     repainted near-black, which matched nothing on the page. */
  const rgb = st.bg.match(/\d+/g).map(Number);
  ok(!(rgb[0] < 40 && rgb[1] < 40 && rgb[2] < 40), 'the selected type is still a black button: ' + st.bg);
  ok(!(rgb[0] > 240 && rgb[1] > 240 && rgb[2] > 240), 'nor should it be flat white: ' + st.bg);
  ok(st.accent, 'the raiment accent token should be defined');
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
