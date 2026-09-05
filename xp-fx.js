/* XP feedback — the floating gain chip and its spark ring.
   Kept out of the app's render tree on purpose: XP arrives from a dozen unrelated places
   (a logged set, a mission, a login, an income entry) and the effect has to survive the
   re-render those cause. It lives on its own layer over the page and cleans itself up. */
(function (root) {
  // The <helmet> relocation re-executes every script; a second definition would leave the
  // first layer orphaned on the page. See engine-guards.test.mjs.
  if (root.XPFx) return;

  var LAYER_ID = 'xpfx-layer';
  var MAX_CHIPS = 4;          // more than this on screen at once is noise, not feedback
  var live = [];

  function reduced() {
    try { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function styleOnce() {
    if (document.getElementById('xpfx-style')) return;
    var el = document.createElement('style');
    el.id = 'xpfx-style';
    el.textContent = [
      '#' + LAYER_ID + '{position:fixed;right:0;bottom:0;width:220px;height:340px;',
      'pointer-events:none;z-index:2147483000;overflow:visible;}',
      '.xpfx-chip{position:absolute;right:22px;bottom:104px;display:flex;align-items:center;',
      'gap:7px;padding:7px 13px;border-radius:999px;background:#12121a;',
      'border:1px solid rgba(231,216,166,0.55);box-shadow:0 6px 26px rgba(0,0,0,0.42),',
      '0 0 22px rgba(231,216,166,0.22);font-family:"JetBrains Mono",ui-monospace,monospace;',
      'font-size:12px;letter-spacing:0.6px;color:#E7D8A6;white-space:nowrap;',
      'animation:xpfx-rise 1900ms cubic-bezier(.16,.84,.34,1) forwards;}',
      '.xpfx-chip b{color:#ffffff;font-weight:700;}',
      '.xpfx-ring{position:absolute;right:30px;bottom:112px;width:14px;height:14px;',
      'border-radius:50%;border:1.5px solid rgba(231,216,166,0.75);',
      'animation:xpfx-ring 900ms ease-out forwards;}',
      '@keyframes xpfx-rise{0%{opacity:0;transform:translateY(14px) scale(.86);}',
      '14%{opacity:1;transform:translateY(0) scale(1.04);}',
      '26%{transform:translateY(0) scale(1);}',
      '72%{opacity:1;transform:translateY(-56px) scale(1);}',
      '100%{opacity:0;transform:translateY(-92px) scale(.97);}}',
      '@keyframes xpfx-ring{0%{opacity:.85;transform:scale(.4);}',
      '100%{opacity:0;transform:scale(6.5);}}',
      '@media (prefers-reduced-motion: reduce){',
      '.xpfx-chip{animation:xpfx-fade 1600ms linear forwards;}',
      '.xpfx-ring{display:none;}',
      '@keyframes xpfx-fade{0%{opacity:0;}10%{opacity:1;}70%{opacity:1;}100%{opacity:0;}}}'
    ].join('');
    document.head.appendChild(el);
  }

  function layer() {
    var el = document.getElementById(LAYER_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = LAYER_ID;
      document.body.appendChild(el);
    }
    return el;
  }

  /* Shown as a whole number: XP is summed from figures like minutes*1.5 and half a point of
     XP is not a thing anyone can act on. */
  function gain(amount, label) {
    var n = Math.round(+amount || 0);
    if (!(n > 0)) return null;
    if (typeof document === 'undefined' || !document.body) return null;
    styleOnce();
    var host = layer();

    // Stack rather than overlap, and drop the oldest once the stack is full.
    while (live.length >= MAX_CHIPS) { var gone = live.shift(); if (gone && gone.remove) gone.remove(); }

    var chip = document.createElement('div');
    chip.className = 'xpfx-chip';
    chip.innerHTML = '<b>+' + n + '</b> XP';
    if (label) chip.innerHTML += '<span style="color:#8f8f99;">· ' + String(label) + '</span>';
    host.appendChild(chip);
    live.push(chip);
    // Laid out by position in the stack rather than by the length at the time of the push:
    // once eviction starts, that length stops moving and every chip lands on the same spot.
    relayout();

    if (!reduced()) {
      var ring = document.createElement('div');
      ring.className = 'xpfx-ring';
      ring.style.bottom = (parseInt(chip.style.bottom, 10) + 8) + 'px';
      host.appendChild(ring);
      ring.addEventListener('animationend', function () { if (ring.parentNode) ring.remove(); });
    }

    chip.addEventListener('animationend', function () {
      var i = live.indexOf(chip); if (i >= 0) live.splice(i, 1);
      if (chip.parentNode) chip.remove();
      relayout();
    });
    return chip;
  }

  function relayout() {
    live.forEach(function (c, i) { c.style.bottom = (104 + i * 40) + 'px'; });
  }

  function clear() {
    live.forEach(function (c) { if (c && c.remove) c.remove(); });
    live = [];
    var el = document.getElementById(LAYER_ID);
    if (el) el.innerHTML = '';
  }

  root.XPFx = { gain: gain, clear: clear, _live: function () { return live.length; } };
})(typeof window !== 'undefined' ? window : globalThis);
