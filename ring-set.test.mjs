/* The MOVE rings:  node ring-set.test.mjs

   Two defects, from one screenshot. The rings were drawn hard against the edge of their
   canvas while glowing 14px outward, so the glow was cut off square on all four sides — the
   set looked boxed in by something invisible. And every raiment that was not Noir shared one
   palette, so Maison Élysée wore Ultra X's oxblood.

   The box is testable without looking at it: read the canvas back and check that no pixel on
   its border was ever painted. The palettes are asserted on the trio each raiment names. */
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
/* A 3x screen on purpose: the ring canvas is the one chart allowed past the 2x cap, and a
   headless browser is 1x, where that change would be invisible. */
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 }, deviceScaleFactor: 3 });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

const WORKOUTS = [
  { ts: Date.now() - 3600000,      name: 'Bench Press', part: 'Chest', sets: 5, reps: 5, weight: 80 },
  { ts: Date.now() - 2 * 86400000, name: 'Squat',       part: 'Legs',  sets: 5, reps: 5, weight: 100 },
  { ts: Date.now() - 4 * 86400000, name: 'Row',         part: 'Back',  sets: 4, reps: 8, weight: 70 },
];

async function boot(style, workouts) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((wo) => window.__nvx.setState({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'forge', forgeCentre: 'home', workouts: wo || [] }), workouts || null);
  if (style) {
    await page.evaluate((st) => {
      window.__nvx.setPref('theme', 'Ultra');
      window.__nvx.setPref('ultraStyle', st);
    }, style);
  }
  await page.waitForTimeout(1600);
}

/* The border of the canvas, one pixel deep, in backing-store pixels. If the glow is being
   clipped this is where it shows: a ring that fits leaves its own frame untouched. */
const edge = () => page.evaluate(() => {
  const cv = document.querySelector('canvas[data-chart="fitRings"]');
  if (!cv) return null;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const worst = { a: 0, at: '' };
  const scan = (x, y, w, h, name) => {
    const d = ctx.getImageData(x, y, w, h).data;
    for (let i = 3; i < d.length; i += 4)
      if (d[i] > worst.a) { worst.a = d[i]; worst.at = name; }
  };
  scan(0, 0, W, 1, 'top'); scan(0, H - 1, W, 1, 'bottom');
  scan(0, 0, 1, H, 'left'); scan(W - 1, 0, 1, H, 'right');
  return { W, H, css: Math.round(cv.getBoundingClientRect().width), dpr: window.devicePixelRatio, alpha: worst.a, at: worst.at };
});

t('the rings are not cut off by the edge of their canvas', async () => {
  await boot('Ultra X');
  const e = await edge();
  ok(e, 'there is no MOVE ring canvas on the Forge home');
  eq(e.dpr, 3, 'the test browser is not on a 3x screen, so the cap cannot be observed');
  eq(e.W, e.css * 3, 'the canvas is ' + e.W + ' backing pixels across a ' + e.css + 'px box — it is still capped at 2x and looks soft');
  /* 8/255 is well under anything the eye reads as an edge; a clipped glow lands in the
     hundreds. Not zero, because a shadow this soft has a long tail. */
  ok(e.alpha <= 8, 'the ' + e.at + ' edge of the canvas is painted (alpha ' + e.alpha + '), so the glow is being cut off square');
});

t('the same is true on every raiment', async () => {
  for (const st of ['Noir', 'Maison Élysée', 'Maison Éverpine']) {
    await boot(st);
    const e = await edge();
    ok(e, 'no ring canvas on ' + st);
    ok(e.alpha <= 8, st + ': the ' + e.at + ' edge is painted (alpha ' + e.alpha + ')');
  }
});

t('each raiment wears its own three colours', async () => {
  await boot();
  const want = {
    'Ultra X':         ['#8E1F1F', '#FFFFFF', '#1C1917'],   // red, white, black
    'Noir':            ['#FFFFFF', '#C9A24A', '#8B8578'],   // white, gold, grey
    'Maison Élysée':   ['#4E6E96', '#1E2F4A', '#FFFFFF'],   // blue, navy, white
    'Maison Éverpine': ['#E7D8A6', '#C2A76A', '#7E9080'],   // its own champagne
  };
  const got = await page.evaluate((styles) => {
    const out = {};
    for (const st of styles) {
      window.__nvx.state.prefs.theme = 'Ultra';
      window.__nvx.state.prefs.ultraStyle = st;
      out[st] = window.__nvx.RING_PALETTE().cols;
    }
    return out;
  }, Object.keys(want));
  for (const st of Object.keys(want))
    eq(got[st].join(','), want[st].join(','), st + ' is wearing the wrong rings');
  const trios = Object.values(want).map(v => v.join(','));
  eq(new Set(trios).size, trios.length, 'two raiments are sharing a palette');
});

t('a base theme keeps the colours the page passed in', async () => {
  await boot();
  const pal = await page.evaluate(() => {
    window.__nvx.state.prefs.theme = 'Sovereign';
    return window.__nvx.RING_PALETTE();
  });
  eq(pal, null, 'a non-Ultra theme should not be overridden — it has no raiment');
});

t('a near-white ring is backed so it can be seen on an ivory card', async () => {
  /* Ultra X and Maison Élysée both name white, and both cards are ivory. White on ivory is
     nothing at all, so the pale ring gets a hairline of the card's ink under it. */
  const pale = await page.evaluate(() => ({
    white: window.__nvx._ringPale('#FFFFFF'),
    cream: window.__nvx._ringPale('#E7D8A6'),
    red: window.__nvx._ringPale('#8E1F1F'),
    navy: window.__nvx._ringPale('#1E2F4A'),
    junk: window.__nvx._ringPale('rgba(1,2,3,1)'),
  }));
  ok(pale.white, 'white is not being treated as pale, so it gets no backing');
  ok(!pale.red, 'the red ring should not be given a backing hairline');
  ok(!pale.navy, 'the navy ring should not be given a backing hairline');
  ok(!pale.junk, 'a non-hex colour should fall through rather than throw');
  ok(pale.cream, 'champagne is light enough to need backing where a card is ivory');
});

t('the light raiments are the ivory ones', async () => {
  const light = await page.evaluate(() => {
    const out = {};
    for (const st of ['Ultra X', 'Noir', 'Maison Élysée', 'Maison Éverpine']) {
      window.__nvx.state.prefs.theme = 'Ultra';
      window.__nvx.state.prefs.ultraStyle = st;
      out[st] = window.__nvx.RING_PALETTE().light;
    }
    return out;
  });
  eq(light['Ultra X'], true, 'Ultra X is an ivory card');
  eq(light['Maison Élysée'], true, 'Maison Élysée is an ivory card');
  eq(light['Noir'], false, 'Noir is dark; a white ring needs no help');
  /* Éverpine's dark-green card only exists on the home scene, and no ring set lives there —
     on every page that has one, Éverpine is wearing the ivory card like Ultra X. */
  eq(light['Maison Éverpine'], true, 'Éverpine wears the ivory card wherever a ring set actually is');
});

/* The first opaque pixel straight down the middle from the top: the cap of the outermost
   ring, which starts at twelve o'clock. It is there even at zero, because the cap is round. */
const capColour = () => page.evaluate(() => {
  const cv = document.querySelector('canvas[data-chart="fitRings"]');
  const ctx = cv.getContext('2d');
  const x = Math.round(cv.width / 2);
  const d = ctx.getImageData(x, 0, 1, cv.height).data;
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 200) return { r: d[i], g: d[i + 1], b: d[i + 2] };
  return null;
});

t('switching raiment repaints the rings rather than leaving the old colours', async () => {
  /* Every chart picks its palette at the moment it is drawn, and the signature that decides
     whether to redraw never mentioned the raiment — so changing raiment left the rings in
     whatever colours the one before had. */
  await boot(null, WORKOUTS);
  await page.evaluate(() => { window.__nvx.setPref('theme', 'Ultra'); window.__nvx.setPref('ultraStyle', 'Ultra X'); });
  await page.waitForTimeout(1400);
  const x = await capColour();
  ok(x, 'nothing was drawn on Ultra X');
  ok(x.r > x.g + 40 && x.r > x.b + 40, 'Ultra X should lead with red, got rgb(' + [x.r, x.g, x.b] + ')');

  await page.evaluate(() => window.__nvx.setPref('ultraStyle', 'Maison Élysée'));
  await page.waitForTimeout(1400);
  const m = await capColour();
  ok(m, 'nothing was drawn after switching to Maison Élysée');
  ok(m.b > m.r + 30, 'the rings kept the previous raiment: Maison should lead with blue, got rgb(' + [m.r, m.g, m.b] + ')');

  await page.evaluate(() => window.__nvx.setPref('ultraStyle', 'Noir'));
  await page.waitForTimeout(1400);
  const n = await capColour();
  ok(n && n.r > 230 && n.g > 230 && n.b > 230, 'Noir should lead with white, got ' + JSON.stringify(n));
});

/* Painted pixels that are not the faint track behind the rings. */
const filled = () => page.evaluate(() => {
  const cv = document.querySelector('canvas[data-chart="fitRings"]');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++;
  return n;
});

t('an account that has logged nothing gets empty rings', async () => {
  /* The third ring was the literal 0.9 — a page that had never been given a workout still
     showed 90% of something. All three read the logs now. */
  await boot('Ultra X', []);
  const empty = await filled();
  await boot('Ultra X', WORKOUTS);
  const full = await filled();
  ok(full > empty * 2.5, 'logging a week barely moved the rings (' + empty + ' -> ' + full + '), so one of them is not reading the logs');
  ok(empty < full / 2.5, 'an empty log still paints ' + empty + ' pixels of ring against ' + full + ' — something is hard-coded');
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
