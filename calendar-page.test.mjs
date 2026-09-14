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
  /* The card used to carry a 760px minimum so a five-week month did not sit shorter than a
     six-week one. The grid carries that now — six rows' worth, always — so the panel hugs its
     days instead of leaving a third of itself empty under them. The invariant is the grid's,
     and the card is whatever the grid plus its head comes to. */
  const grid = await page.evaluate(() => Math.round(document.querySelector('.cal-grid').getBoundingClientRect().height));
  ok(grid >= 320, 'the grid does not hold six rows, got ' + grid + 'px');
  ok(quiet > 400, 'the month collapsed, got ' + quiet + 'px');
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

const dropZone = (label) => page.evaluate((want) => {
  const el = [...document.querySelectorAll('div,label')].find(e => e.textContent.trim() === want);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const icon = el.querySelector('[data-icon]');
  return {
    ink: cs.color, border: cs.borderTopColor, style: cs.borderTopStyle,
    icon: icon ? getComputedStyle(icon).color : null,
    emoji: /[⬀-⯿←-⇿️]/.test(el.textContent),
    lines: Math.round(el.getBoundingClientRect().height),
  };
}, label);

t('the import controls take the raiment, not a hard-coded dark-theme grey', async () => {
  /* They were a white dashed border and #c3c3ca text — written for a dark background and
     very nearly invisible on an ivory card. */
  await boot();
  for (const [style, want] of [['Ultra X', 'rgb(91, 26, 26)'], ['Maison Élysée', 'rgb(60, 90, 125)'], ['Noir', 'rgb(196, 189, 176)']]) {
    await page.evaluate((st) => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', st); }, style);
    await page.waitForTimeout(900);
    const z = await dropZone('Import work rota');
    ok(z, 'the rota import is missing on ' + style);
    eq(z.ink, want, style + ': the label is not the raiment ink');
    eq(z.style, 'dashed', style + ': it should still read as a drop zone');
    ok(z.border !== 'rgba(255, 255, 255, 0.2)', style + ': the border is still the dark-theme white');
  }
});

t('the arrow is the same colour as the words beside it', async () => {
  /* The Ultra sheet paints every [data-icon] the theme accent with !important, which is right
     for the nav — where the icon is the control — and wrong inside a button with its own ink:
     the arrow came out near-black against an oxblood label. */
  await boot();
  await page.evaluate(() => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', 'Ultra X'); });
  await page.waitForTimeout(900);
  for (const label of ['Import work rota', 'Calendar screenshot · appointments only']) {
    const z = await dropZone(label);
    ok(z, label + ' is missing');
    eq(z.icon, z.ink, label + ': the arrow does not match its own label');
  }
});

t('the arrow is drawn, not an emoji the platform colours itself', async () => {
  /* ⬆ renders as a blue iOS glyph that cannot take the colour of the control it sits in. */
  await boot();
  for (const label of ['Import work rota', 'Calendar screenshot · appointments only']) {
    const z = await dropZone(label);
    eq(z.emoji, false, label + ' still carries an emoji arrow');
    ok(z.icon !== null, label + ' has no drawn icon at all');
  }
  /* Scoped to what is actually rendered: outerHTML also carries the source comment that
     explains why the emoji went, which is not an emoji on the page. */
  const shown = await page.evaluate(() => document.body.innerText);
  ok(!/\u2b06/.test(shown), 'an emoji arrow is still being rendered somewhere');
});

t('a shift shows when it ends, not only when it starts', async () => {
  /* The end time was already on the event and the only place it appeared was buried in the
     line beside who you are with. The time column had room for it all along. */
  const d = day(1);
  await boot({ events: [
    { id: 'w', title: 'Work', date: d, time: '08:00', repeat: [], kind: 'work', endTime: '18:00', attendees: 'Christine 08:00-18:00' },
    { id: 'g', title: 'Dentist', date: d, time: '15:00', repeat: [], kind: 'general', estMins: 45 },
  ], calSel: d });
  /* Climb from the title to the first ancestor that also carries a clock time: the row's
     depth is a detail of the markup and not what is being tested. */
  const rowOf = (title) => {
    let el = [...document.querySelectorAll('div,span')].find(e => e.children.length === 0 && e.textContent.trim() === title);
    while (el && !/^\d\d:\d\d$/m.test(el.innerText || '')) el = el.parentElement;
    return el ? el.innerText : null;
  };
  const rows = await page.evaluate((fn) => ({ text: eval('(' + fn + ')')('Work') }), rowOf.toString());
  ok(/08:00/.test(rows.text) && /18:00/.test(rows.text), 'the shift row should carry both times: ' + JSON.stringify(rows.text));
  /* Stacked, not side by side: the finish sits on its own line under the start. */
  ok(/08:00\s*\n\s*18:00/.test(rows.text), 'the end time should sit under the start: ' + JSON.stringify(rows.text));
  ok(/with Christine/.test(rows.text), 'and who he is on with is still there');
  /* And the detail line no longer opens with the hours it used to repeat. Christine's own
     08:00-18:00 stays — that is her shift, not his, and it is the point of the field. */
  const detail = rows.text.split('\n').find(l => /Christine/.test(l));
  ok(/^with /.test(detail), 'the detail line should lead with who, not with the hours: ' + JSON.stringify(detail));
});

t('an event with no end time shows one time and no empty line', async () => {
  const d = day(1);
  await boot({ events: [{ id: 'g', title: 'Dentist', date: d, time: '15:00', repeat: [], kind: 'general' }], calSel: d });
  const row = await page.evaluate(() => {
    let el = [...document.querySelectorAll('div,span')].find(e => e.children.length === 0 && e.textContent.trim() === 'Dentist');
    while (el && !/^\d\d:\d\d$/m.test(el.innerText || '')) el = el.parentElement;
    return el ? el.innerText : '';
  });
  eq((row.match(/\d\d:\d\d/g) || []).length, 1, 'a general event with no duration has exactly one time: ' + JSON.stringify(row));
});

t('the panels are glass over a lit ground', async () => {
  /* The template, applied to the panels the page already has rather than to three cards
     added beside them. The ground is part of the card: glass with nothing behind it is a
     grey box, so the field is a gradient in the raiment's own accent. */
  await boot();
  const b = await page.evaluate(() => {
    const stage = document.querySelector('.lcb-stage');
    if (!stage) return null;
    const field = stage.querySelector('.lcb-field');
    const cards = [...stage.querySelectorAll('.lc-card')];
    return { field: !!field,
             lit: field ? getComputedStyle(field).backgroundImage : '',
             onStage: cards.length,
             glass: cards.every(c => /blur/.test(getComputedStyle(c).backdropFilter)),
             /* the panels sit ON the field, not beside it */
             inside: cards.every(c => stage.contains(c)) };
  });
  ok(b, 'there is no lit ground on the calendar');
  ok(b.field, 'the ground is missing');
  ok(/gradient/.test(b.lit), 'the ground is flat, not lit');
  eq(b.onStage, 3, 'the panels are not the ones on the ground');
  ok(b.glass && b.inside, 'the panels are not glass over it');
});

t('the ground shares one bloom, with a small lean toward each raiment\'s own hue', async () => {
  /* It used to be lit in each raiment's accent outright — oxblood, gold, blue, green — then
     became one pearl shared bit-for-bit across every light raiment, which read as colourless
     on the two raiments most defined by their colour. Asked for directly afterward: Ultra X
     wants a slight red lean, Maison a slight baby-blue one, nothing bigger. The warm/cool
     bloom on top — the part that actually reads as "pearl" — is still exactly one shared
     thing; only the base tone underneath it leans per raiment now. */
  const seen = {};
  for (const style of ['Ultra X', 'Noir', 'Maison Élysée', 'Maison Éverpine']) {
    await boot();
    await page.evaluate((st) => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', st); }, style);
    await page.waitForTimeout(800);
    seen[style] = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.cc-shell'));
      return { lit: cs.getPropertyValue('--lcb-lit').trim(), dim: cs.getPropertyValue('--lcb-dim').trim(),
               far: cs.getPropertyValue('--lcb-far').trim() };
    });
    ok(seen[style].lit && seen[style].dim, style + ': the ground has lost its bloom');
  }
  /* The bloom itself is still shared outright across the three light raiments. */
  const bloom = ['Ultra X', 'Maison Élysée', 'Maison Éverpine'].map(k => JSON.stringify({ lit: seen[k].lit, dim: seen[k].dim }));
  eq(new Set(bloom).size, 1, 'the light raiments are not sharing one bloom: ' + bloom.join(' | '));
  /* Ultra X leans warm (more red than blue), Maison leans cool (more blue than red), and
     neither matches the other or Éverpine, which was not asked for a tint of its own. */
  const rgb = (h) => { const m = h.replace('#', ''); return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(4, 6), 16)]; };
  const x = rgb(seen['Ultra X'].far), m = rgb(seen['Maison Élysée'].far);
  ok(x[0] > x[1], 'Ultra X ground should lean red, got ' + seen['Ultra X'].far);
  ok(m[1] > m[0], 'Maison ground should lean blue, got ' + seen['Maison Élysée'].far);
  ok(seen['Ultra X'].far !== seen['Maison Élysée'].far, 'Ultra X and Maison should not share the exact same ground tint');
  eq(seen['Maison Éverpine'].far, '#C6C4C2', 'Éverpine\'s ground moved even though only Ultra X and Maison were asked for a tint');
  /* Noir is the same bloom in graphite — the one thing that follows the raiment is how light
     it is, because its panels are pale ink on translucent white and a pale ground under those
     is pale on pale. */
  const chan = (c) => (String(c).match(/[\d.]+/g) || []).map(Number);
  const lit = chan(seen['Ultra X'].lit), noirLit = chan(seen['Noir'].lit);
  eq(lit.slice(0, 3).join(','), noirLit.slice(0, 3).join(','), 'Noir is a different hue, not the same pearl darker');
  ok(noirLit[3] < lit[3], 'Noir should be the dimmer of the two, got ' + noirLit[3] + ' against ' + lit[3]);
  const darker = (h) => parseInt(h.replace('#', '').slice(0, 2), 16);
  ok(darker(seen['Noir'].far) < darker(seen['Ultra X'].far), 'Noir is not the darker ground');
});

t('the ground tightens on a phone rather than keeping a desktop margin', async () => {
  await boot();
  const desk = await page.evaluate(() => Math.round(parseFloat(getComputedStyle(document.querySelector('.lcb-stage')).paddingTop)));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(600);
  const phone = await page.evaluate(() => Math.round(parseFloat(getComputedStyle(document.querySelector('.lcb-stage')).paddingTop)));
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(400);
  ok(phone < desk, 'the ground keeps its ' + phone + 'px desktop margin on a 390px frame');
});

t('the three panels wear the card layout', async () => {
  /* One card language across the Logs, from the template: a glass panel, a numbered mark in
     a pill, and a letterspaced title above whatever the card holds. */
  await boot();
  const cards = await page.evaluate(() => [...document.querySelectorAll('.lc-card')].map(c => ({
    badge: (c.querySelector('.lc-badge') || {}).textContent || '',
    title: (c.querySelector('.lc-title') || {}).textContent || '',
    glass: getComputedStyle(c).backdropFilter,
  })));
  eq(cards.length, 3, 'the calendar does not carry its three panels');
  eq(cards.map(c => c.badge.trim()).join(' | '), '01 - MO | 02 - NW | 03 - DY', 'the marks are wrong or out of order');
  /* The Month card's title used to say the literal word "Month" — the month name was shown
     only up in the page header, so the card itself never said which one it was. */
  ok(/^\w+ \d{4}$/.test(cards[0].title.trim()), 'the Month card does not name the actual month: ' + cards[0].title);
  eq(cards.map(c => c.title.trim()).slice(1).join(' | '), 'Now | The Day', 'the other titles are wrong');
  ok(cards.every(c => /blur/.test(c.glass)), 'the panels are not glass');
});

t('the card is readable on every raiment it can be worn with', async () => {
  /* The bug this is here for: keying the card's ground off the raiment name looked right and
     was wrong. Éverpine's dark-green card is the home scene only — everywhere else, the
     calendar included, it wears the ivory one, so a card painted dark green from the raiment
     name came out with the page's dark ink on a dark ground and the month vanished. */
  /* Chromium hands back color(srgb r g b / a) for some computed values, where the channels
     are 0-1 rather than 0-255. Reading those as 0-255 makes a white card look black, which is
     a test that fails on a page that is fine. */
  const chans = (c) => {
    const f = (String(c).match(/[\d.]+/g) || []).map(Number);
    return /^color\(/.test(String(c).trim()) ? f.slice(0, 3).map(v => v * 255).concat(f.slice(3)) : f;
  };
  const lum = (c) => {
    const [r, g, b] = chans(c);
    const s = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  for (const style of ['Ultra X', 'Noir', 'Maison Élysée', 'Maison Éverpine']) {
    await boot();
    await page.evaluate((st) => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', st); }, style);
    await page.waitForTimeout(900);
    const c = await page.evaluate(() => {
      const card = document.querySelector('.lc-card');
      const shell = document.querySelector('.cc-shell');
      /* Composite the card over what is actually behind it, so a translucent ground is
         measured as the colour a person sees rather than as its own alpha. */
      const ch = (c) => { const f = (String(c).match(/[\d.]+/g) || []).map(Number);
        return /^color\(/.test(String(c).trim()) ? f.slice(0, 3).map(v => v * 255).concat(f.slice(3)) : f; };
      const mix = (fg, bg) => {
        const F = ch(fg), B = ch(bg);
        const a = F.length > 3 ? F[3] : 1;
        return 'rgb(' + [0, 1, 2].map(i => Math.round(F[i] * a + (B[i] == null ? 255 : B[i]) * (1 - a))).join(',') + ')';
      };
      const ground = getComputedStyle(shell).backgroundColor;
      const num = [...card.querySelectorAll('span')].find(e => /^\d+$/.test(e.textContent.trim()));
      const label = card.querySelector('.lc-title');
      return { bg: mix(getComputedStyle(card).backgroundColor, ground),
               ink: num ? getComputedStyle(num).color : '',
               title: label ? getComputedStyle(label).color : '' };
    });
    ok(c.ink, style + ': there are no day numbers on the card to measure');
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const dayR = ratio(c.bg, c.ink), titleR = ratio(c.bg, c.title);
    ok(dayR >= 2, style + ': the day numbers are ' + dayR.toFixed(2) + ':1 against the card — they disappear into it');
    ok(titleR >= 2, style + ': the card title is ' + titleR.toFixed(2) + ':1 against the card');
  }
});

t('the card steps down on a phone', async () => {
  await boot();
  const deskPad = await page.evaluate(() => Math.round(parseFloat(getComputedStyle(document.querySelector('.lc-card')).paddingTop)));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(600);
  const phone = await page.evaluate(() => {
    const c = document.querySelector('.lc-card');
    return { pad: Math.round(parseFloat(getComputedStyle(c).paddingTop)),
             title: Math.round(parseFloat(getComputedStyle(c.querySelector('.lc-title')).fontSize)) };
  });
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(400);
  ok(phone.pad < deskPad, 'the card padding is the same ' + phone.pad + 'px on a phone as on a desk');
  ok(phone.title <= 11, 'the card title is still ' + phone.title + 'px on a phone');
});

t('NOW carries a real dial that reads the same time as the words beside it', async () => {
  /* The hands are moved from the app's own one-second tick rather than from state, because a
     setState every second would re-render the whole page to move a second hand. Everything is
     read off one Date, so the dial and the reading can never disagree. */
  await boot();
  await page.waitForTimeout(1200);
  const c = await page.evaluate(() => {
    const h = document.querySelector('[data-calclock]');
    if (!h) return null;
    const deg = (k) => { const t = h.querySelector('[data-hand="' + k + '"]').getAttribute('transform') || '';
      const m = t.match(/rotate\(([-\d.]+)/); return m ? +m[1] : null; };
    return { time: h.querySelector('[data-calclock-time]').textContent.trim(),
             date: h.querySelector('[data-calclock-date]').textContent.trim(),
             hour: deg('h'), min: deg('m'), sec: deg('s') };
  });
  ok(c, 'there is no clock on the calendar');
  ok(/^\d{1,2}(:\d{2})?(am|pm)$/.test(c.time), 'the clock reads "' + c.time + '"');
  ok(/^\w{3}, \d{1,2}(st|nd|rd|th) \w+$/.test(c.date), 'the date reads "' + c.date + '"');
  for (const k of ['hour', 'min', 'sec'])
    ok(c[k] !== null && c[k] >= 0 && c[k] < 360, 'the ' + k + ' hand is at ' + c[k] + ' degrees');
  /* The hands have to agree with the reading. The minute hand is 6° per minute. */
  const m = /:(\d{2})/.test(c.time) ? +c.time.match(/:(\d{2})/)[1] : 0;
  ok(Math.abs(c.min - (m * 6)) < 7, 'the minute hand says ' + c.min + '° and the clock says :' + m);
  const h12 = +c.time.match(/^(\d{1,2})/)[1] % 12;
  ok(Math.abs(c.hour - (h12 * 30 + m * 0.5)) < 2, 'the hour hand and the reading disagree');
});

t('the movement sweeps rather than ticking', async () => {
  /* A quartz watch jumps once a second; an automatic sweeps, because its escapement beats
     eight times in that second. Sampling faster than a second has to show the hands moving,
     or the dial is a picture of a watch rather than a watch. */
  await boot();
  await page.waitForTimeout(900);
  const read = () => page.evaluate(() => {
    const deg = (k) => { const t = document.querySelector('[data-hand="' + k + '"]').getAttribute('transform') || '';
      const m = t.match(/rotate\(([-\d.]+)/); return m ? +m[1] : null; };
    return { s: deg('s'), m: deg('m'), h: deg('h') };
  });
  const shots = [];
  for (let i = 0; i < 6; i++) { shots.push(await read()); await page.waitForTimeout(140); }
  const moves = shots.slice(1).filter((v, i) => v.s !== shots[i].s).length;
  ok(moves >= 3, 'the second hand moved ' + moves + ' times in 6 samples across ~0.8s — it is ticking, not sweeping');
  /* The minute hand creeps with it. A minute hand that only moves on the minute is the
     giveaway, and across a second it should have moved a little and not a whole degree. */
  const mSpread = Math.max(...shots.map(v => v.m)) - Math.min(...shots.map(v => v.m));
  ok(mSpread > 0, 'the minute hand is parked between minutes');
  ok(mSpread < 1, 'the minute hand moved ' + mSpread.toFixed(3) + ' degrees in under a second');
  /* All three are derived from one reading, so they cannot disagree about the time. The hour
     hand must sit at a whole hour plus half a degree for each minute the minute hand shows. */
  const last = shots[shots.length - 1];
  const minsPast = last.m / 6;
  const off = (last.h - minsPast * 0.5 + 360) % 30;
  ok(Math.min(off, 30 - off) < 0.2,
     'the hour hand is ' + last.h.toFixed(2) + ' degrees with the minute hand at ' + minsPast.toFixed(2) + ' minutes past');
});

t('the dial ticks without re-rendering the page', async () => {
  /* If this ever moves to state, every input on the page loses focus once a second. */
  await boot();
  await page.click('input[placeholder="Event title"]');
  await page.type('input[placeholder="Event title"]', 'Typing through a tick');
  const before = await page.evaluate(() => document.querySelector('[data-hand="s"]').getAttribute('transform'));
  await page.waitForTimeout(2200);
  const after = await page.evaluate(() => document.querySelector('[data-hand="s"]').getAttribute('transform'));
  ok(before !== after, 'the second hand did not move in two seconds');
  const held = await page.evaluate(() => ({
    focused: document.activeElement && document.activeElement.placeholder === 'Event title',
    value: document.querySelector('input[placeholder="Event title"]').value }));
  eq(held.value, 'Typing through a tick', 'the tick wiped what was being typed');
  ok(held.focused, 'the tick stole focus from the field, so it is re-rendering the page');
});

t('the scope says how much of the calendar the list below is', async () => {
  const d0 = day(0), d2 = day(2), d9 = day(9);
  const seed = { calSel: d0, calScope: 'day', events: [
    { id: 'a', title: 'Dinner with Sarah', date: d0, time: '19:30', repeat: [], kind: 'general' },
    { id: 'b', title: 'Shift at the yard', date: d0, time: '09:00', endTime: '17:00', repeat: [], kind: 'work' },
    { id: 'c', title: 'Dentist', date: d2, time: '11:15', repeat: [], kind: 'general' },
    { id: 'e', title: 'Flight', date: d9, time: '06:40', repeat: [], kind: 'general' },
  ]};
  await boot(seed);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.cal-scope-row')]
    .map(r => ({ text: r.textContent.replace(/\s+/g, ' ').trim(), on: r.classList.contains('cal-scope-on') })));
  eq(rows.length, 3, 'the scope is not three rows');
  /* Today 2, the next seven days 3, the month ahead 4 — and each count is what picking it
     actually produces, which is the only reason a count is worth showing. */
  ok(/Today 2/.test(rows[0].text), 'Today miscounts: ' + rows[0].text);
  ok(/Upcoming 3/.test(rows[1].text), 'Upcoming miscounts: ' + rows[1].text);
  ok(/All 4/.test(rows[2].text), 'All miscounts: ' + rows[2].text);
  eq(rows.filter(r => r.on).length, 1, 'more than one scope is showing as chosen');
  ok(rows[0].on, 'the day scope is not the one chosen to start with');

  const listed = () => page.evaluate(() => window.__nvx.__render ? 0 :
    [...document.querySelectorAll('span')].filter(e => /^(Dinner with Sarah|Shift at the yard|Dentist|Flight)$/.test(e.textContent.trim())).length);
  eq(await listed(), 2, 'the day scope is not listing the day');

  await page.evaluate(() => [...document.querySelectorAll('.cal-scope-row')].find(r => /Upcoming/.test(r.textContent)).click());
  await page.waitForTimeout(800);
  eq(await listed(), 3, 'picking Upcoming did not widen the list');
  ok((await text()).includes('The next seven days'), 'the panel did not say what it is showing now');

  await page.evaluate(() => [...document.querySelectorAll('.cal-scope-row')].find(r => /All/.test(r.textContent)).click());
  await page.waitForTimeout(800);
  eq(await listed(), 4, 'picking All did not widen the list');
  ok((await text()).includes('The month ahead'), 'the panel did not say what it is showing now');
});

t('a wider list says which day each row belongs to', async () => {
  const d0 = day(0), d3 = day(3);
  await boot({ calSel: d0, calScope: 'upcoming', events: [
    { id: 'a', title: 'Dinner with Sarah', date: d0, time: '19:30', repeat: [], kind: 'general' },
    { id: 'c', title: 'Dentist', date: d3, time: '11:15', repeat: [], kind: 'general' },
  ]});
  const b = await text();
  /* Two rows across two days, so the date is the only thing telling them apart. */
  const stamps = await page.evaluate(() => [...document.querySelectorAll('span,div')]
    .filter(e => e.children.length === 0 && /^\w{3}, \w{3} \d{1,2}$/.test(e.textContent.trim())).length);
  ok(stamps >= 2, 'the rows in a seven-day list carry no date (' + stamps + ')');
  await boot({ calSel: d0, calScope: 'day', events: [
    { id: 'a', title: 'Dinner with Sarah', date: d0, time: '19:30', repeat: [], kind: 'general' } ]});
  const one = await page.evaluate(() => [...document.querySelectorAll('span,div')]
    .filter(e => e.children.length === 0 && /^\w{3}, \w{3} \d{1,2}$/.test(e.textContent.trim())).length);
  eq(one, 0, 'a one-day list is stamping every row with the day it obviously is');
});

t('Clear all is not offered for a list that is not one day', async () => {
  /* It removes every event on the selected day. Offered above a seven-day list it reads as
     "clear these", which is not what it does. */
  const d0 = day(0);
  const ev = [{ id: 'a', title: 'Dinner with Sarah', date: d0, time: '19:30', repeat: [], kind: 'general' }];
  await boot({ calSel: d0, calScope: 'day', events: ev });
  ok(/CLEAR ALL|Clear all/i.test(await text()), 'Clear all is missing on a single day');
  await boot({ calSel: d0, calScope: 'all', events: ev });
  ok(!/CLEAR ALL/i.test(await text()), 'Clear all is still offered over a month-wide list');
});

t('picking Today also takes you to today', async () => {
  /* A scope called Today that leaves you looking at a day in March is lying about what it did. */
  await boot({ calSel: day(9), calScope: 'all' });
  await page.evaluate(() => [...document.querySelectorAll('.cal-scope-row')].find(r => /Today/.test(r.textContent)).click());
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => ({ scope: window.__nvx.state.calScope, sel: window.__nvx.state.calSel }));
  eq(st.scope, 'day', 'picking Today did not narrow the scope');
  eq(st.sel, day(0), 'picking Today left the selection on another date');
});

t('the month gets the width, and the clock and the day share what is under it', async () => {
  /* The month is the block the page is for, so it is not sharing a row with a sidebar any
     more. The clock is a fixed measure — a dial and three rows and nothing else — and the day
     takes whatever is left, which is where the list and the whole add form live. */
  await boot();
  const box = await page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), w: Math.round(b.width), y: Math.round(b.y) }; };
    const cards = [...document.querySelectorAll('.lc-card')];
    return { month: r(cards[0]), now: r(cards[1]), day: r(cards[2]) };
  });
  ok(box.month.w > box.now.w + box.day.w - 60, 'the month is not the full width of the block');
  ok(box.now.y > box.month.y + box.month.w / 4, 'the clock is not under the month');
  eq(box.now.y, box.day.y, 'the clock and the day are not on the same row');
  ok(box.day.x > box.now.x + box.now.w - 40, 'the day is not beside the clock');
  ok(box.day.w > box.now.w, 'the day is not the wider of the two');
});

t('a day tagged before still shows its colour', async () => {
  const d = day(3);
  await boot({ dayColors: { [d]: '#9B1C1C' } });
  const painted = await page.evaluate((ds) => {
    const n = +ds.slice(-2);
    const cell = [...document.querySelectorAll('.cal-cell')]
      .find(c => +((c.querySelector('.cal-cell-num') || {}).textContent || 0) === n);
    return cell ? getComputedStyle(cell.querySelector('.cal-cell-pill')).backgroundColor : '';
  }, d);
  ok(/rgba?\(155, 28, 28/.test(painted), 'a tagged day has to show its colour on the grid, got ' + painted);
});

t('a block is glass with a lit rim, and groups things as panes inside it', async () => {
  /* The rim is what makes a pane read as glass rather than a tinted rectangle: light caught
     on the top and left edge from inside. And the reference groups things as cards within a
     card rather than ruling them apart. */
  await boot();
  const look = await page.evaluate(() => {
    const card = document.querySelector('.lc-card');
    const subs = document.querySelectorAll('.lc-card .lc-sub');
    return { shadow: getComputedStyle(card).boxShadow,
             radius: Math.round(parseFloat(getComputedStyle(card).borderRadius)),
             subs: subs.length,
             subShadow: subs.length ? getComputedStyle(subs[0]).boxShadow : '' };
  });
  ok(/inset/.test(look.shadow), 'the block has no rim: ' + look.shadow);
  ok(look.radius >= 16, 'the block corner is ' + look.radius + 'px');
  ok(look.subs >= 1, 'nothing inside a block is grouped as its own pane (' + look.subs + ')');
  ok(/inset/.test(look.subShadow), 'a nested pane has no rim of its own');
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
