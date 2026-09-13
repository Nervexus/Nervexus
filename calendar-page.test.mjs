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
  eq(b.onStage, 3, 'the three panels are not the ones on the ground');
  ok(b.glass && b.inside, 'the panels are not glass over it');
});

t('the ground is lit in the raiment, not one hard-coded colour', async () => {
  const seen = {};
  for (const style of ['Ultra X', 'Noir', 'Maison Élysée', 'Maison Éverpine']) {
    await boot();
    await page.evaluate((st) => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', st); }, style);
    await page.waitForTimeout(800);
    seen[style] = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.cc-shell')).getPropertyValue('--lcb-accent').trim());
    ok(seen[style], style + ': the ground has no accent');
  }
  const vals = Object.values(seen);
  eq(new Set(vals).size, vals.length, 'two raiments are lighting the ground the same colour: ' + JSON.stringify(seen));
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
  eq(cards.length, 3, 'the calendar does not carry three cards');
  eq(cards.map(c => c.badge.trim()).join(' | '), '01 - MO | 02 - DY | 03 - HL', 'the marks are wrong or out of order');
  eq(cards.map(c => c.title.trim()).join(' | '), 'Month | The Day | Highlight', 'the titles are wrong');
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
