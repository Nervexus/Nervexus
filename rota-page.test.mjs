/* The rota import, in a real browser:  node rota-page.test.mjs

   rota-import.test.mjs proves the reading. This proves the page around it: that the name is
   prefilled from the account, that every shift is reviewed and can be dropped before it is
   written, and that what lands on the calendar is a work event carrying the hours and the
   people — because a shift that says only "Work" is not what was asked for. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8929;

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

/* Dates relative to whenever this runs, so the suite does not rot: the parser only accepts a
   window around today, and a rota hard-coded to 2026 would fall out of it. */
const ROTA = await (async () => {
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
  const col = (n) => { const x = d(n); return x.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + x.getDate(); };
  const key = (n) => { const x = d(n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  return {
    text: ['Name      ' + col(3) + '      ' + col(4) + '      ' + col(5),
           'Madoxs    09:00-17:00  OFF          12:00-20:00',
           'Sarah     12:00-20:00  09:00-17:00  12:00-20:00',
           'Tom       OFF          12:00-20:00  09:00-17:00'].join('\n'),
    day1: key(3), day3: key(5),
  };
})();

/* The same week, with the day-off codes a real rota uses instead of hours. */
const OFFROTA = await (async () => {
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
  const col = (n) => { const x = d(n); return x.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + x.getDate(); };
  return ['Name      ' + col(3) + '      ' + col(4) + '      ' + col(5) + '      ' + col(6),
          'Madoxs    HOL          D/O          E            09:00-17:00',
          'Sarah     09:00-17:00  09:00-17:00  09:00-17:00  09:00-17:00'].join('\n');
})();

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'calendar', events: [],
    account: { ...(window.__nvx.state.account || {}), name: 'Madoxs' },
    rotaOpen: false, rotaText: '', rotaRows: [], rotaSkip: {}, rotaErr: '', rotaMe: '',
  }, p || {})), patch || null);
  await page.waitForTimeout(600);
}
const text = () => page.evaluate(() => document.body.innerText);
/* The control is an arrow span plus its words, so it is no longer a childless element. */
const clickRotaImport = () => page.evaluate(() => {
  const el = [...document.querySelectorAll('div,label')].find(e => e.textContent.trim() === 'Import work rota');
  if (!el) throw new Error('no rota import control on the calendar');
  el.click();
});
const clickText = (s) => page.evaluate((want) => {
  const el = [...document.querySelectorAll('div,span')]
    .find(e => e.children.length === 0 && e.textContent.trim() === want);
  if (!el) throw new Error('no element reading "' + want + '"');
  (el.classList.contains('sc-interp') ? el.parentElement : el).click();
}, s);

t('the calendar offers a rota import', async () => {
  await boot();
  ok((await text()).includes('Import work rota'), 'there is no rota import on the calendar');
  await clickRotaImport();
  await page.waitForTimeout(500);
  const b = await text();
  ok(b.includes('YOUR NAME ON THE ROTA'), 'the modal did not open');
  eq(await page.evaluate(() => window.__nvx.state.rotaMe), 'Madoxs',
    'the name should be prefilled from the account — it is what tells it which rows are yours');
});

t('it finds your shifts and says who you are on with', async () => {
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: ROTA.text });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(500);
  const rows = await page.evaluate(() => window.__nvx.state.rotaRows);
  eq(rows.length, 2, 'Madoxs works two of those three days');
  eq(rows[0].start + '-' + rows[0].end, '09:00-17:00', 'the first shift');
  const b = await text();
  ok(/2 SHIFTS AGAINST YOUR NAME/.test(b), 'the review header should say how many: ' + b.slice(0, 200));
  ok(b.includes('Sarah 12:00-20:00'), 'the first shift is with Sarah');
  ok(!/Tom 12:00-20:00/.test(b.split('Sarah 12:00-20:00')[0] || ''), 'Tom is off that day and should not be listed');
});

t('a shift can be dropped before anything is written', async () => {
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: ROTA.text });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(400);
  ok((await text()).includes('Add 2 shifts'), 'the button should offer both');
  await page.evaluate(() => window.__nvx.toggleRotaRow(0));
  await page.waitForTimeout(400);
  ok((await text()).includes('Add 1 shift'), 'unticking one should change what the button offers');
  await clickText('Add 1 shift');
  await page.waitForTimeout(600);
  const evs = await page.evaluate(() => window.__nvx.state.events);
  eq(evs.length, 1, 'only the ticked shift should have been written');
  eq(evs[0].date, ROTA.day3, 'and it should be the one that was left ticked');
});

t('what lands on the calendar is a shift, not just the word Work', async () => {
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: ROTA.text });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(400);
  await clickText('Add 2 shifts');
  await page.waitForTimeout(700);
  const evs = await page.evaluate(() => window.__nvx.state.events);
  eq(evs.length, 2, 'both shifts should be on the calendar');
  const e = evs.find(x => x.date === ROTA.day1);
  ok(e, 'the first day is missing');
  eq(e.kind, 'work', 'a shift is a work event — that is what carries an end time and who is there');
  eq(e.time, '09:00', 'start');
  eq(e.endTime, '17:00', 'a shift without an end time is not a shift');
  eq(e.attendees, 'Sarah 12:00-20:00', 'who you are on with should be on the event');
  eq(await page.evaluate(() => window.__nvx.state.rotaOpen), false, 'the modal should close once it is done');
});

t('importing the same rota twice does not double the shifts', async () => {
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: ROTA.text });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(400);
  await clickText('Add 2 shifts');
  await page.waitForTimeout(600);
  await page.evaluate((txt) => { window.__nvx.setState({ rotaOpen: true, rotaText: txt, rotaRows: [], rotaSkip: {} }); window.__nvx.parseRotaText(); }, ROTA.text);
  await page.waitForTimeout(500);
  await clickText('Add 2 shifts');
  await page.waitForTimeout(600);
  eq(await page.evaluate(() => window.__nvx.state.events.length), 2, 'a re-import should not duplicate shifts already on the calendar');
  ok(/already on the calendar/.test(await page.evaluate(() => window.__nvx.state.rotaErr)),
    'and it should say why nothing was added');
});

t('a name that is not on the rota is said, with the names that are', async () => {
  await boot({ rotaOpen: true, rotaMe: 'Madison', rotaText: ROTA.text });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(500);
  const b = await text();
  ok(/none against that name/.test(b), 'it should say the name was not found: ' + b.slice(0, 300));
  ok(/Madoxs/.test(b) && /Sarah/.test(b), 'and list who it did find, so the spelling can be fixed');
  eq(await page.evaluate(() => window.__nvx.state.events.length), 0, 'nothing should have been written');
});

t('the real rota goes in from a spreadsheet paste', async () => {
  /* The layout the feature was built for: dates down column A, a person per column, tabs
     between the cells. Dated forward from today so it stays inside the import window
     whenever this runs. */
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
  const uk = (n) => { const x = d(n); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); };
  const key = (n) => { const x = d(n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const wd = (n) => d(n).toLocaleDateString('en-GB', { weekday: 'long' });
  const sheet = [
    '\t\tChristine\t\tHarriette\t\tTony\t\tAbbie\t\tMadoxs\t\tChris 2 (Moore)\t\t\tOvertime & Lieu Days',
    uk(1) + '\t' + wd(1) + '\t8-6\t9\tD/O\t0\t9-5\t7\tD/O\t0\t8-6\t9\tD/O\t0\t\t3',
    uk(2) + '\t' + wd(2) + '\t9-5\t7\t9-5\t7\tD/O\t0\t9-5\t7\tHOL\t7\t9-5\t7\t\t5',
    '\t\t\t40\t\t40\t\t40\t\t40\t\t40\t\t40',
    uk(3) + '\t' + wd(3) + '\tD/O\t0\t10-4\t6\t10-4\t6\t10-4\t6\t10-4\t6\t10-4\t6\t\t5',
  ].join('\n');

  await boot({ rotaOpen: true, rotaMe: 'Mr Madoxs Harvey', rotaText: sheet });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({
    rows: window.__nvx.state.rotaRows,
    off: window.__nvx.state.rotaOff.map(x => x.cell),
    err: window.__nvx.state.rotaErr,
  }));
  eq(st.err, '', 'it should have read cleanly: ' + st.err);
  eq(st.rows.length, 2, 'two shifts — the HOL day is not one');
  eq(st.rows[0].date, key(1), 'the first shift is the first dated row');
  eq(st.rows[0].start + '-' + st.rows[0].end, '08:00-18:00', '8-6 is an eight till six');
  eq(st.rows[1].start + '-' + st.rows[1].end, '10:00-16:00', '10-4 is a ten till four');
  eq(st.off.join(','), 'HOL', 'the holiday is a day off');
  /* The hours columns between the people are not people, and the weekly-total row is not a
     day: neither may turn up as somebody he is working with. */
  eq(RI_withLabel(st.rows[0]), 'Christine 08:00-18:00 · Tony 09:00-17:00', 'wrong company on the first day');

  await clickText('Add 2 shifts');
  await page.waitForTimeout(700);
  const evs = await page.evaluate(() => window.__nvx.state.events);
  eq(evs.length, 2, 'both shifts should be on the calendar');
  eq(evs[0].kind, 'work', 'and filed as work');
  eq(evs[0].attendees, 'Christine 08:00-18:00 · Tony 09:00-17:00', 'carrying who he is on with');
});
const RI_withLabel = (r) => (r.with || []).map(w => w.name + ' ' + w.start + '-' + w.end).join(' · ');

t('a spreadsheet paste without the names row says so', async () => {
  /* A sheet freezes the names at the top, so copying a block of weeks leaves them behind. */
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
  const uk = (n) => { const x = d(n); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); };
  const noHead = [uk(1) + '\tMonday\t8-6\t9\tD/O\t0\t9-5\t7', uk(2) + '\tTuesday\t9-5\t7\t9-5\t7\tD/O\t0'].join('\n');
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: noHead });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(500);
  const b = await text();
  ok(/row with everyone/.test(b), 'it should name what is missing: ' + b.slice(0, 400));
  eq(await page.evaluate(() => window.__nvx.state.events.length), 0, 'and guess nothing');
});

t('a photo is sent as a picture, not as base64 in the prompt', async () => {
  /* The defect behind every failed screenshot import in this app: the shim that backs
     window.claude flattened a message's content with JSON.stringify, so a vision call sent
     a wall of base64 to a text endpoint. Nothing about it could ever have worked. */
  await boot({ rotaOpen: true, rotaMe: 'Madoxs' });
  const seen = await page.evaluate(async () => {
    const got = [];
    const real = window.AIGateway.ask;
    window.AIGateway.ask = (role, prompt, opts) => { got.push({ role, prompt, opts }); return Promise.resolve({ text: 'x' }); };
    await window.claude.complete({
      role: 'image', system: 'SYSTEM LINE',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJDREVGRw' } },
        { type: 'text', text: 'Transcribe this rota.' },
      ] }],
    });
    window.AIGateway.ask = real;
    return got;
  });
  eq(seen.length, 1, 'the gateway was not called');
  const { prompt, opts } = seen[0];
  ok(opts && opts.image, 'the image never reached the gateway as an image');
  eq(opts.image.media_type, 'image/jpeg', 'the media type was lost');
  eq(opts.image.data, 'QUJDREVGRw', 'the image data was lost');
  ok(!/QUJDREVGRw/.test(prompt), 'the base64 is still being folded into the prompt');
  ok(prompt.includes('SYSTEM LINE'), 'the system line should still lead the prompt');
  ok(prompt.includes('Transcribe this rota.'), 'and the words of the message should survive');
});

t('a photo of the rota goes through the reader and the review, not straight to the calendar', async () => {
  /* Whatever a model gives back is text, and text goes through the same parser and the same
     review as a paste. The AI transcribes; it does not decide which shifts are yours. */
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x; };
  const uk = (n) => { const x = d(n); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); };
  const sheet = ['\t\tChristine\t\tMadoxs',
                 uk(1) + '\tMonday\t8-6\t9\t9-5\t7',
                 uk(2) + '\tTuesday\tD/O\t0\tHOL\t7'].join('\n');
  await boot({ rotaOpen: true, rotaMe: 'Madoxs' });
  await page.evaluate(async (text) => {
    window.claude = { complete: () => Promise.resolve('```\n' + text + '\n```') };
    await window.__nvx.importRotaPhoto(new File(['x'], 'rota.jpg', { type: 'image/jpeg' }));
  }, sheet);
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => ({
    rows: window.__nvx.state.rotaRows.length,
    off: window.__nvx.state.rotaOff.map(x => x.cell),
    events: window.__nvx.state.events.length,
    err: window.__nvx.state.rotaErr,
  }));
  eq(st.err, '', 'it should have read cleanly: ' + st.err);
  eq(st.rows, 1, 'one shift — the HOL day is not one');
  /* The leading empty cells of the heading row have to survive whatever the model wrapped
     its answer in. Trimming them slid every person one column left, so the shifts read back
     were somebody else's — this is the assertion that catches that. */
  eq(st.off.join(','), 'HOL', 'and the holiday is reported as a day off — a D/O here means the columns are misaligned');
  eq(st.events, 0, 'nothing may reach the calendar before it has been reviewed');
  ok((await text()).includes('1 SHIFT AGAINST YOUR NAME'), 'the review should be showing');
});

t('a photo says what it needs rather than failing silently', async () => {
  /* The calendar's screenshot import answers "AI unavailable in this environment" and stops.
     This one has a text path that always works, so it says so. */
  await boot({ rotaOpen: true, rotaMe: 'Madoxs' });
  await page.evaluate(async () => {
    window.claude = undefined;
    await window.__nvx.importRotaPhoto(new File(['x'], 'rota.png', { type: 'image/png' }));
  });
  await page.waitForTimeout(400);
  const err = await page.evaluate(() => window.__nvx.state.rotaErr);
  ok(/no ai provider/i.test(err), 'it should name the reason: ' + err);
  ok(/text/i.test(err), 'and point at the path that does work without a key: ' + err);
});

t('a day with no hours on it is a day out, and is named', async () => {
  /* HOL and D/O are days off; E names a shift without saying when it is, which cannot go in
     a diary as a time. None of them are added, and all of them are reported. */
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: OFFROTA });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({
    rows: window.__nvx.state.rotaRows.length,
    off: window.__nvx.state.rotaOff.map(x => x.cell),
    untimed: window.__nvx.state.rotaUntimed.map(x => x.cell),
  }));
  eq(st.rows, 1, 'only the day with hours on it is a shift');
  eq(st.off.join(','), 'HOL,D/O', 'the two days off should be recognised');
  eq(st.untimed.join(','), 'E', 'a shift code with no hours is untimed, not a day off');
  const b = await text();
  ok(/2 days off/.test(b), 'the review should say how many days off: ' + b.slice(0, 400));
  ok(/1 with no hours given/.test(b), 'and name the untimed one');
  ok(/import again/.test(b), 'and say what to do about it — add the times and re-import');

  await clickText('Add 1 shift');
  await page.waitForTimeout(600);
  const evs = await page.evaluate(() => window.__nvx.state.events);
  eq(evs.length, 1, 'nothing should be written for a day with no hours');
});

t('an imported shift shows on the calendar as work', async () => {
  await boot({ rotaOpen: true, rotaMe: 'Madoxs', rotaText: ROTA.text });
  await page.evaluate(() => window.__nvx.parseRotaText());
  await page.waitForTimeout(400);
  await clickText('Add 2 shifts');
  await page.waitForTimeout(700);
  // The import selects the first shift's day, so the day panel is already showing it.
  const b = await text();
  ok(b.includes('WORK'), 'the shift should be tagged WORK on the calendar: ' + b.slice(0, 400));
  /* Start and finish are stacked in the time column now rather than printed as one range,
     so both have to be there — not the string that used to join them. */
  ok(/09:00/.test(b) && /17:00/.test(b), 'the day panel should show both ends of the shift');
  ok(/with Sarah 12:00-20:00/.test(b), 'and who he is on with');
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
