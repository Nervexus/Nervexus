/* The boot splash going out clean:  node boot-splash.test.mjs

   The crest (favicon.png, pulsing) sat inside the splash's backdrop, and the whole splash
   fades out as one thing over 500ms once boot finishes. A CSS animation overrides an inline
   opacity every frame it's running, so the crest kept pulsing at near-full brightness the
   entire time the backdrop's own opacity was dropping toward zero — against the old opaque
   cards that low-alpha blend was invisible. Once the calendar's cards became real glass, a
   still-bright, still-recognisable crest blending through at low alpha read as a watermark
   stamped into whatever card happened to be behind it, on every fresh load.

   The fix removes the crest outright the instant boot finishes, rather than fading it with
   the backdrop — nothing is left mid-pulse for the backdrop's own fade to blend through. This
   has to be proven against the app's real boot timers (the _bootSeq() setInterval/setTimeout
   chain), not by pushing bootDone/bootGone into state directly — a hand-set state would prove
   the markup is right but not that the real sequence actually reaches it the same way. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8948;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

/* A fresh navigation, with the app's own boot timers left running untouched — this is the
   one thing this file must not shortcut. */
async function freshLoad() {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
}

const crestInfo = () => page.evaluate(() => {
  const img = document.querySelector('img[src="favicon.png"][style*="bootPulse"]');
  const overlay = document.querySelector('div[style*="position: fixed"][style*="z-index: 200"]');
  return {
    bootDone: !!window.__nvx.state.bootDone,
    bootGone: !!window.__nvx.state.bootGone,
    crestPresent: !!img,
    overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null,
  };
});

t('the crest is gone the instant boot finishes, not faded with the backdrop', async () => {
  await freshLoad();
  /* Poll on the app's own clock rather than sleeping a guessed duration, so this does not
     depend on exactly how long the four boot lines take to step through. */
  let sample = await crestInfo();
  const deadline = Date.now() + 4000;
  const track = [sample];
  while (!sample.bootDone && Date.now() < deadline) {
    await page.waitForTimeout(30);
    sample = await crestInfo();
    track.push(sample);
  }
  ok(sample.bootDone, 'boot never finished in 4s — nothing here was exercised');
  ok(!sample.crestPresent, 'the crest is still in the DOM the instant bootDone flips');

  /* And it has to stay gone through the backdrop's own fade, not just at the first instant —
     confirmed by also catching the backdrop genuinely mid-fade (neither 0 nor 1) at some
     point in this window, which is the proof there was something left to blend through. */
  let sawMidFade = false, sawCrestAfterDone = false;
  const fadeDeadline = Date.now() + 900;
  while (Date.now() < fadeDeadline) {
    const s = await crestInfo();
    if (s.crestPresent) sawCrestAfterDone = true;
    const o = parseFloat(s.overlayOpacity);
    if (o > 0.02 && o < 0.98) sawMidFade = true;
    if (s.bootGone) break;
    await page.waitForTimeout(40);
  }
  ok(sawMidFade, 'never actually caught the backdrop mid-fade — this run proves nothing');
  ok(!sawCrestAfterDone, 'the crest reappeared, or never left, during the backdrop’s fade');
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
