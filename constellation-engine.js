/* Provider constellation — the API page's overview map.

   Draws the app at the centre of a starfield with every configured provider as a node on a
   radiating spoke. Nothing here is decorative-only: a node's brightness, its ring and the
   style of its connector all read from real provider state, so a glance tells you what is
   actually wired up. A saved, switched-on provider gets a solid spoke and a lit core; one
   you have never touched gets a dashed spoke and a dim dot.

   Desktop only. The host decides that (it hides the mount below 900px) — 45 labelled nodes
   cannot be made legible on a phone without pan-and-zoom, and the cards below already say
   everything this says, in a form that works at that width.

   Canvas rather than DOM: ~45 nodes plus a few hundred drifting particles redrawn every
   frame is exactly what canvas is for, and it keeps the whole thing out of the framework's
   render path so a provider toggle does not re-lay-out the page.
*/
(function () {
  'use strict';

  var S = {
    el: null, cv: null, ctx: null, raf: null, dpr: 1,
    w: 0, h: 0, nodes: [], stars: [], motes: [],
    hover: null, t0: 0, onPick: null, reduced: false,
    // View transform: pan offset in screen px, k = zoom. Nodes are laid out once in world
    // space and this is applied at draw time, so panning never re-runs layout or the label
    // relaxation — those stay stable while you move around.
    vx: 0, vy: 0, k: 1, drag: null
  };

  /* Palette sampled from the reference rather than guessed. Cropping to the nebula and
     bucketing saturated pixels by hue gave roughly 40% warm (red/orange), 40% rose through
     magenta, and a thin seam of blue, over a near-black #05030A ground. The first pass here
     used muted gold/steel/sage, which is why it read as the right shape in the wrong key. */
  var CAT = {
    ai:    { c: '#FFB347', label: 'AI' },
    intel: { c: '#4DA3FF', label: 'INTEL' },
    news:  { c: '#FF5FA8', label: 'NEWS' }
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* Nodes sit on rings, one ring per category, spread evenly around it and nudged by a
     per-node jitter so the result reads as a constellation rather than a clock face. The
     jitter is derived from the id, not Math.random, so a node does not jump to a new spot
     every time the page re-renders. */
  function hashId(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  function layout() {
    var cx = S.w / 2, cy = S.h / 2;
    var minSide = Math.min(S.w, S.h);
    var groups = { ai: [], intel: [], news: [] };
    S.nodes.forEach(function (n) { (groups[n.cat] || groups.news).push(n); });

    var rings = {
      ai:    minSide * 0.20,
      intel: minSide * 0.31,
      news:  minSide * 0.42
    };

    Object.keys(groups).forEach(function (cat) {
      var list = groups[cat], n = list.length;
      if (!n) return;
      list.forEach(function (node, i) {
        var jitter = (hashId(node.id) % 1000) / 1000;
        var ang = (i / n) * Math.PI * 2 + (jitter - 0.5) * (Math.PI * 2 / n) * 0.55;
        // Bias the ring radius per node too, so the ring reads as a band not a circle.
        var r = rings[cat] * (0.88 + jitter * 0.24);
        node.x = cx + Math.cos(ang) * r * 1.45;   // wider than tall: the panel is a letterbox
        node.y = cy + Math.sin(ang) * r * 0.92;
        node.ang = ang;
        // Labels flip side so they never run back over the core.
        node.side = Math.cos(ang) >= 0 ? 1 : -1;
      });
    });
  }

  /* Labels are placed from the node's own angle, so neighbours print over each other. The
     first version of this only compared labels sharing a side, which missed the two cases
     that actually showed up: a label running through the *dot* of the node next to it
     ("POLYGON.IO" into NASDAQ DATA LINK's marker), and two labels meeting head-on from
     opposite sides ("CURRENTS API" into "NEWSDATA.IO"). Now every label box is tested
     against every other label box and against every node marker, regardless of side.
     Only labels move; nodes stay on their spokes, so the shape of the map is untouched. */
  function relaxLabels() {
    if (!S.ctx) return;
    var ctx = S.ctx, LH = 13, PAD = 4, i, j;
    ctx.font = '9.5px "JetBrains Mono", ui-monospace, monospace';
    var live = S.nodes.filter(function (n) { return n.x != null; });
    live.forEach(function (n) {
      n.ly = n.y;
      n.lw = ctx.measureText(n.label).width;
    });
    var box = function (n) {
      var x0 = n.side > 0 ? n.x + 11 : n.x - 11 - n.lw;
      return { x0: x0 - PAD, x1: x0 + n.lw + PAD, y0: n.ly - LH / 2, y1: n.ly + LH / 2 };
    };
    for (var pass = 0; pass < 24; pass++) {
      var moved = false;
      for (i = 0; i < live.length; i++) {
        var a = live[i], ba = box(a);
        // label vs every other node's marker
        for (j = 0; j < live.length; j++) {
          if (i === j) continue;
          var o = live[j];
          if (ba.x1 < o.x - 6 || ba.x0 > o.x + 6) continue;
          if (ba.y1 < o.y - 6 || ba.y0 > o.y + 6) continue;
          a.ly += (a.ly <= o.y ? -1 : 1) * 3;
          ba = box(a); moved = true;
        }
        // label vs label
        for (j = i + 1; j < live.length; j++) {
          var b = live[j], bb = box(b);
          if (ba.x1 < bb.x0 || bb.x1 < ba.x0) continue;
          if (ba.y1 < bb.y0 || bb.y1 < ba.y0) continue;
          var push = ((LH - Math.abs(a.ly - b.ly)) / 2) + 0.6;
          if (a.ly <= b.ly) { a.ly -= push; b.ly += push; } else { a.ly += push; b.ly -= push; }
          ba = box(a); moved = true;
        }
      }
      if (!moved) break;
    }
    // keep everything inside the panel
    live.forEach(function (n) { n.ly = Math.max(9, Math.min(S.h - 9, n.ly)); });
  }

  function seedField() {
    S.stars = [];
    var count = Math.round((S.w * S.h) / 5200);
    for (var i = 0; i < count; i++) {
      S.stars.push({
        x: Math.random() * S.w, y: Math.random() * S.h,
        r: rand(0.3, 1.15), a: rand(0.10, 0.5), tw: rand(0.4, 1.7), ph: rand(0, 6.28)
      });
    }
    /* No mote cloud any more — the host mounts the app's actual voice-assistant orb over the
       centre of this canvas, so the core is the same object that appears on the voice screen
       rather than a lookalike. All that is left here is the glow it sits inside. */
    S.motes = [];
    var m = 0, pal = ['#FF5FA8', '#F2793C', '#F23C5E', '#FF9ECF', '#FFB347', '#4DA3FF', '#C86BFF'];
    for (var j = 0; j < m; j++) {
      S.motes.push({
        a: rand(0, 6.28), r: Math.pow(Math.random(), 0.55) * Math.min(S.w, S.h) * 0.155,
        sp: rand(0.06, 0.34) * (Math.random() < 0.5 ? -1 : 1),
        rr: rand(0.5, 2.3), c: pal[Math.min(pal.length - 1, (Math.pow(Math.random(), 1.5) * pal.length) | 0)],
        al: rand(0.25, 0.95), bob: rand(0, 6.28), bs: rand(0.3, 1.1)
      });
    }
  }

  function resize() {
    if (!S.el || !S.cv) return;
    var w = S.el.clientWidth || 900;
    var h = S.el.clientHeight || 420;
    if (w === S.w && h === S.h) return;
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    S.w = w; S.h = h;
    S.cv.width = Math.round(w * S.dpr);
    S.cv.height = Math.round(h * S.dpr);
    S.cv.style.width = w + 'px';
    S.cv.style.height = h + 'px';
    S.ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    seedField();
    layout();
    relaxLabels();
  }

  function toScreen(x, y) { return { x: (x - S.w / 2) * S.k + S.w / 2 + S.vx, y: (y - S.h / 2) * S.k + S.h / 2 + S.vy }; }
  function toWorld(x, y)  { return { x: (x - S.w / 2 - S.vx) / S.k + S.w / 2, y: (y - S.h / 2 - S.vy) / S.k + S.h / 2 }; }

  function draw(ts) {
    if (!S.ctx) return;
    var ctx = S.ctx, t = (ts - S.t0) / 1000;
    var cx = S.w / 2, cy = S.h / 2;

    ctx.clearRect(0, 0, S.w, S.h);

    // starfield
    for (var i = 0; i < S.stars.length; i++) {
      var s = S.stars[i];
      var a = S.reduced ? s.a : s.a * (0.62 + 0.38 * Math.sin(t * s.tw + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Everything from here on is in world space, so panning and zooming move the whole
    // constellation together. The starfield above stays put, which reads as depth.
    ctx.save();
    ctx.translate(S.w / 2 + S.vx, S.h / 2 + S.vy);
    ctx.scale(S.k, S.k);
    ctx.translate(-S.w / 2, -S.h / 2);

    // core glow, painted as stacked translucent discs rather than a shadow blur
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(S.w, S.h) * 0.22);
    g.addColorStop(0, 'rgba(190,90,170,0.24)');
    g.addColorStop(0.5, 'rgba(120,60,150,0.11)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S.w, S.h);

    // spokes, behind the nodes
    for (i = 0; i < S.nodes.length; i++) {
      var n = S.nodes[i];
      if (n.x == null) continue;
      var live = n.on;
      var isHover = S.hover === n;
      ctx.save();
      ctx.strokeStyle = live ? (CAT[n.cat] || CAT.news).c : 'rgba(255,255,255,0.16)';
      ctx.globalAlpha = isHover ? 0.95 : (live ? 0.42 : 0.20);
      ctx.lineWidth = isHover ? 1.5 : (live ? 1.1 : 0.8);
      if (!live) ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
      ctx.restore();
    }

    // core motes
    for (i = 0; i < S.motes.length; i++) {
      var m = S.motes[i];
      var ang = m.a + (S.reduced ? 0 : t * m.sp);
      var bob = S.reduced ? 0 : Math.sin(t * m.bs + m.bob) * 5;
      var mx = cx + Math.cos(ang) * m.r * 1.35;
      var my = cy + Math.sin(ang) * m.r * 0.85 + bob;
      ctx.globalAlpha = m.al * (S.reduced ? 0.8 : (0.55 + 0.45 * Math.sin(t * 1.4 + m.bob)));
      ctx.fillStyle = m.c;
      ctx.beginPath(); ctx.arc(mx, my, m.rr, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // nodes + labels
    ctx.textBaseline = 'middle';
    for (i = 0; i < S.nodes.length; i++) {
      var nd = S.nodes[i];
      if (nd.x == null) continue;
      var col = (CAT[nd.cat] || CAT.news).c;
      var hov = S.hover === nd;
      var pulse = (nd.on && !S.reduced) ? (0.75 + 0.25 * Math.sin(t * 2 + nd.x * 0.01)) : 1;

      if (nd.on) {
        ctx.globalAlpha = 0.16 * pulse;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, hov ? 13 : 9, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = nd.on ? col : 'rgba(190,190,200,0.55)';
      ctx.beginPath(); ctx.arc(nd.x, nd.y, hov ? 4.6 : 3.2, 0, 6.2832); ctx.fill();

      if (hov) {
        ctx.strokeStyle = col; ctx.globalAlpha = 0.85; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 9.5, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      var lx = nd.x + nd.side * 11;
      var ly = (nd.ly == null) ? nd.y : nd.ly;
      if (Math.abs(ly - nd.y) > 2) {
        ctx.strokeStyle = nd.on ? col : 'rgba(255,255,255,0.18)';
        ctx.globalAlpha = 0.3; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(nd.x + nd.side * 5, nd.y); ctx.lineTo(lx - nd.side * 2, ly); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = nd.side > 0 ? 'left' : 'right';
      ctx.font = (hov ? '600 ' : '') + '9.5px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = hov ? '#ffffff' : (nd.on ? 'rgba(238,240,242,0.88)' : 'rgba(150,150,160,0.7)');
      ctx.fillText(nd.label, lx, ly);
    }

    ctx.restore();
    S.raf = requestAnimationFrame(draw);
  }

  function pick(sx, sy) {
    var p = toWorld(sx, sy), mx = p.x, my = p.y;
    var best = null, bd = (22 / S.k) * (22 / S.k);
    for (var i = 0; i < S.nodes.length; i++) {
      var n = S.nodes[i];
      if (n.x == null) continue;
      var dx = mx - n.x, dy = my - n.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  var API = {
    mount: function (el, opts) {
      if (!el) return false;
      opts = opts || {};
      if (S.el === el && S.cv) { API.resize(); return true; }
      API.destroy();
      S.el = el;
      S.onPick = opts.onPick || null;
      try {
        S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) { S.reduced = false; }

      var cv = document.createElement('canvas');
      cv.style.display = 'block';
      cv.style.cursor = 'default';
      el.innerHTML = '';
      el.appendChild(cv);
      S.cv = cv;
      S.ctx = cv.getContext('2d');

      cv.addEventListener('mousemove', function (e) {
        var r = cv.getBoundingClientRect();
        var mx = e.clientX - r.left, my = e.clientY - r.top;
        if (S.drag) {
          S.vx = S.drag.vx + (mx - S.drag.x);
          S.vy = S.drag.vy + (my - S.drag.y);
          if (Math.abs(mx - S.drag.x) + Math.abs(my - S.drag.y) > 4) S.drag.moved = true;
          return;
        }
        var n = pick(mx, my);
        if (n !== S.hover) { S.hover = n; cv.style.cursor = n ? 'pointer' : 'grab'; }
      });
      cv.addEventListener('mousedown', function (e) {
        var r = cv.getBoundingClientRect();
        S.drag = { x: e.clientX - r.left, y: e.clientY - r.top, vx: S.vx, vy: S.vy, moved: false };
        cv.style.cursor = 'grabbing';
      });
      window.addEventListener('mouseup', function () {
        if (S.drag) { S.dragEnded = S.drag.moved; S.drag = null; }
        if (S.cv) S.cv.style.cursor = S.hover ? 'pointer' : 'grab';
      });
      cv.addEventListener('mouseleave', function () { S.hover = null; });
      cv.addEventListener('click', function (e) {
        // A drag that happens to end on a node should not count as selecting it.
        if (S.dragEnded) { S.dragEnded = false; return; }
        var r = cv.getBoundingClientRect();
        var n = pick(e.clientX - r.left, e.clientY - r.top);
        if (n && S.onPick) S.onPick(n.id, n.cat);
      });
      cv.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = cv.getBoundingClientRect();
        var mx = e.clientX - r.left, my = e.clientY - r.top;
        var before = toWorld(mx, my);
        var k = S.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12);
        S.k = Math.max(0.45, Math.min(3.2, k));
        // Keep the point under the cursor pinned while zooming.
        var after = toWorld(mx, my);
        S.vx += (after.x - before.x) * S.k;
        S.vy += (after.y - before.y) * S.k;
        if (S.onView) S.onView();
      }, { passive: false });
      cv.addEventListener('dblclick', function () { API.resetView(); });
      cv.style.cursor = 'grab';

      S._onResize = function () { API.resize(); };
      window.addEventListener('resize', S._onResize);

      S.w = 0; S.h = 0;
      S.vx = 0; S.vy = 0; S.k = 1;
      resize();
      S.t0 = performance.now();
      if (!S.raf) S.raf = requestAnimationFrame(draw);
      return true;
    },

    /* nodes: [{id, label, cat:'ai'|'intel'|'news', on:bool}] */
    setNodes: function (list) {
      var prev = {};
      S.nodes.forEach(function (n) { prev[n.id] = n; });
      S.nodes = (list || []).map(function (n) {
        var p = prev[n.id];
        return {
          id: n.id, label: (n.label || n.id).toUpperCase(), cat: n.cat || 'news', on: !!n.on,
          x: p ? p.x : null, y: p ? p.y : null, ang: p ? p.ang : 0, side: p ? p.side : 1
        };
      });
      layout();
      relaxLabels();
    },

    resize: function () { resize(); },
    resetView: function () { S.vx = 0; S.vy = 0; S.k = 1; if (S.onView) S.onView(); },
    // The host needs these to keep the orb element parked over the world-space centre.
    getView: function () { return { x: S.vx, y: S.vy, k: S.k }; },
    onViewChange: function (fn) { S.onView = fn; },
    isMounted: function () { return !!(S.cv && S.el && S.el.isConnected); },
    destroy: function () {
      if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
      if (S._onResize) { window.removeEventListener('resize', S._onResize); S._onResize = null; }
      if (S.el) { try { S.el.innerHTML = ''; } catch (e) {} }
      S.el = null; S.cv = null; S.ctx = null; S.hover = null; S.w = 0; S.h = 0;
    }
  };

  window.ProviderConstellation = API;
})();
