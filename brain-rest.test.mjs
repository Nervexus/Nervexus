/* Brain Rest:  node brain-rest.test.mjs

   Five minutes sitting in silence, on the Forge's Mental centre. Two gates before the clock
   starts, because the point is the sitting rather than the timer. This holds the gates in
   order, the clock against the wall rather than a counter, and the card down to the one or
   two actions each stage actually offers. */
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const { chromium } = playwright;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8941;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

async function boot(patch) {
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__nvx, null, { timeout: 20000 });
  await page.evaluate((p) => window.__nvx.setState(Object.assign({
    loggedIn: true, perfCheckinOpen: false, whatsNewOpen: false, staleOpen: false,
    toasts: [], levelUp: null, scene: 'forge', forgeCentre: 'mental',
  }, p || {})), patch || null);
  await page.waitForTimeout(700);
}
const stage = () => page.evaluate(() => window.__nvx.state.brStage);
const title = () => page.evaluate(() => (document.querySelector('.lu-card h2') || {}).innerText || '');
const ring = () => page.evaluate(() => {
  const r = document.querySelector('.lu-ring'); if (!r) return null;
  const d = r.querySelectorAll('div');
  return { label: d[0].innerText.trim(), value: d[1].innerText.trim() };
});
/* Click the element that carries the handler: matching on text alone also picks up the
   wrapping row, whose textContent is the same once one of the two buttons is hidden. */
const click = (label) => page.evaluate((l) => {
  const hits = [...document.querySelectorAll('span,div')].filter(x => x.children.length <= 1 && x.textContent.trim() === l);
  for (const h of hits) {
    const target = h.classList.contains('sc-interp') ? h.parentElement : h;
    if (target && target.onclick) { target.click(); return true; }
  }
  return false;
}, label);

t('the Mental centre is a page now, not an empty one', async () => {
  await boot();
  const body = await page.evaluate(() => document.body.innerText);
  ok(/Brain Rest/.test(body), 'the Mental centre does not offer Brain Rest');
  ok(!/Nothing here yet/.test(body), 'the Mental centre is still the empty-page card');
  ok(await click('BEGIN'), 'there is nothing to start it with');
});

t('it asks twice before the clock starts, in order', async () => {
  await boot();
  eq(await stage(), '', 'it should be shut until asked for');
  await click('BEGIN');
  await page.waitForTimeout(400);
  eq(await stage(), 'ready', 'first gate');
  ok(/Are you ready/i.test(await title()), 'the first gate asks: ' + (await title()));
  /* Nothing is running yet — the clock must not start behind the gates. */
  eq(await page.evaluate(() => window.__nvx.state.brEndsAt), 0, 'the clock started before the gates were answered');

  await click('I’M READY');
  await page.waitForTimeout(400);
  eq(await stage(), 'devices', 'second gate');
  ok(/devices away/i.test(await title()), 'the second gate asks: ' + (await title()));
  eq(await page.evaluate(() => window.__nvx.state.brEndsAt), 0, 'the clock started before the devices gate was answered');

  await click('THEY’RE AWAY');
  await page.waitForTimeout(500);
  eq(await stage(), 'sitting', 'it should be running once both gates are answered');
  ok(await page.evaluate(() => window.__nvx.state.brEndsAt > Date.now() + 290000), 'the sit is not a full five minutes');
});

t('either gate can be backed out of, and nothing is left running', async () => {
  for (const at of ['ready', 'devices']) {
    await boot();
    await click('BEGIN');
    await page.waitForTimeout(300);
    if (at === 'devices') { await click('I’M READY'); await page.waitForTimeout(300); }
    eq(await stage(), at, 'setting up ' + at);
    ok(await click('NOT YET'), 'no way out of the ' + at + ' gate');
    await page.waitForTimeout(400);
    eq(await stage(), '', 'backing out of ' + at + ' left it open');
    eq(await page.evaluate(() => !!window.__nvx._brTimer), false, 'a timer was left running after ' + at);
  }
});

t('the clock is the wall clock, so a slept tab cannot shorten the sit', async () => {
  await boot();
  await click('BEGIN'); await page.waitForTimeout(250);
  await click('I’M READY'); await page.waitForTimeout(250);
  await click('THEY’RE AWAY'); await page.waitForTimeout(1400);
  const r1 = await ring();
  eq(r1.label, 'REMAINING', 'the ring should be counting down');
  ok(/^4:5\d$/.test(r1.value), 'the clock reads ' + r1.value + ' a second in');
  await page.waitForTimeout(2200);
  const r2 = await ring();
  ok(r2.value !== r1.value, 'the clock did not move');
  /* The end is a timestamp. Moving it is the only thing that ends the sit early, which is
     what proves a counter is not what is being read. */
  const left = await page.evaluate(() => Math.round((window.__nvx.state.brEndsAt - Date.now()) / 1000));
  ok(left > 280 && left < 300, 'the end moved on its own: ' + left + 's left');
});

t('while you are sitting there is nothing to do and nothing moving', async () => {
  await boot();
  await click('BEGIN'); await page.waitForTimeout(250);
  await click('I’M READY'); await page.waitForTimeout(250);
  await click('THEY’RE AWAY'); await page.waitForTimeout(900);
  /* No sheen: five silent minutes should not have an animation running across the card. */
  eq(await page.evaluate(() => !!document.querySelector('.lu-sheen')), false, 'the sheen is still running while sitting');
  /* One button, and it is the quiet one. An empty primary used to render as a blank white
     bar across the card. */
  const buttons = await page.evaluate(() => [...document.querySelectorAll('.lu-card span')]
    .filter(e => e.onclick).map(e => e.textContent.trim()));
  eq(buttons.length, 1, 'expected one action while sitting, got: ' + JSON.stringify(buttons));
  eq(buttons[0], 'END EARLY', 'the only action should be to end it');
});

t('it finishes, and finishing puts the timer away', async () => {
  await boot();
  await click('BEGIN'); await page.waitForTimeout(250);
  await click('I’M READY'); await page.waitForTimeout(250);
  await click('THEY’RE AWAY'); await page.waitForTimeout(600);
  await page.evaluate(() => window.__nvx.setState({ brEndsAt: Date.now() + 700 }));
  await page.waitForTimeout(1800);
  eq(await stage(), 'done', 'it did not finish when the clock ran out');
  ok(/Five minutes/.test(await title()), 'the finish says: ' + (await title()));
  eq(await page.evaluate(() => !!window.__nvx._brTimer), false, 'the timer is still running after it finished');
  const buttons = await page.evaluate(() => [...document.querySelectorAll('.lu-card span')]
    .filter(e => e.onclick).map(e => e.textContent.trim()));
  eq(buttons.join(','), 'CONTINUE', 'the finish should offer only CONTINUE, got: ' + JSON.stringify(buttons));
  await click('CONTINUE');
  await page.waitForTimeout(500);
  eq(await stage(), '', 'CONTINUE did not close it');
});

t('it wears the level-up card’s language', async () => {
  /* Asked for by name: the two moments that stop you and ask you to look at one thing should
     look like each other. The rule is an inset frame rather than a card border, because at
     full screen a border on the window edge reads as browser chrome. */
  await boot();
  await click('BEGIN');
  await page.waitForTimeout(500);
  const look = await page.evaluate(() => {
    const c = document.querySelector('.lu-card'); if (!c) return null;
    const f = document.querySelector('.lu-frame');
    return { card: !!c, ring: !!document.querySelector('.lu-ring'), sheen: !!document.querySelector('.lu-sheen'),
             anim: getComputedStyle(c).animationName,
             frame: f ? getComputedStyle(f).borderTopColor : null,
             serif: /Cormorant/.test(getComputedStyle(document.querySelector('.lu-card h2')).fontFamily) };
  });
  ok(look && look.card, 'it is not built on the level-up card');
  ok(look.ring, 'no ring');
  ok(look.sheen, 'no sheen on a gate');
  ok(look.serif, 'the headline is not the serif the level-up card uses');
  eq(look.anim, 'luPop', 'it does not arrive the way the level-up card does');
  ok(look.frame && /231, 216, 166/.test(look.frame), 'the champagne rule is missing: ' + look.frame);
});

t('it takes the whole screen, at both widths', async () => {
  /* A five minute sit that leaves the app visible around the edges is asking you to stop
     while showing you everything you stopped doing. */
  for (const [w, h] of [[1440, 1000], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    await boot();
    await click('BEGIN');
    /* Past the end of luPop: the entrance scales the card, so measuring inside those 520ms
       reads the animation rather than the layout. */
    await page.waitForTimeout(900);
    const box = await page.evaluate(() => {
      const c = document.querySelector('.lu-card').getBoundingClientRect();
      return { w: Math.round(c.width), h: Math.round(c.height),
               vw: window.innerWidth, vh: window.innerHeight,
               /* and nothing of the app behind it is legible through the overlay */
               opaque: getComputedStyle(document.querySelector('.lu-card')).backgroundColor };
    });
    eq(box.w, box.vw, 'at ' + w + 'px it is ' + box.w + 'px wide, not full width');
    eq(box.h, box.vh, 'at ' + w + 'px it is ' + box.h + 'px tall, not full height');
    ok(!/rgba\(.*, 0\.\d+\)/.test(box.opaque), 'the ground is see-through: ' + box.opaque);
    /* And it fits: nothing on it should need scrolling, least of all the way out. */
    const fits = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.lu-card span')].filter(e => e.onclick);
      return btns.length && btns.every(b => { const r = b.getBoundingClientRect(); return r.bottom <= window.innerHeight + 1 && r.top >= 0; });
    });
    ok(fits, 'at ' + w + 'px a button is off screen');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
});

t('nothing threw through any of it', async () => {
  eq(pageErrors.join(' | '), '', 'page errors');
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
