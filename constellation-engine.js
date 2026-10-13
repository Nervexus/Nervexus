/* Provider constellation — the API page's system view.

   A 3D field you fly through rather than a diagram you pan. Providers sit at real depths
   around a core; dragging orbits the camera, the wheel dollies through it, and the field
   drifts on its own so it is never static. Depth drives size, brightness and draw order, so
   moving through it reads as moving inside something rather than sliding a picture around.

   Each provider is an orb with a label pill, and where the app has usage for it the orb
   carries that too — requests, tokens and estimated cost for the last 24 hours — and sizes
   itself by request volume, so the keys doing real work are visibly the biggest objects in
   the field. Nothing is invented: a provider with no usage simply has no usage line.

   Desktop only; the host hides the mount below 900px.

   The core is not drawn here. The host parks the app's real voice-assistant orb over the
   projected origin, and getView() reports where that lands each frame so it tracks the
   camera like anything else in the scene.
*/
(function () {
  // Runs once: the <helmet> relocation re-executes every engine script. See voice-assistant-engine.js.
  if (window.ProviderConstellation) return;

  'use strict';

  var S = {
    el: null, cv: null, ctx: null, raf: null, dpr: 1,
    w: 0, h: 0, nodes: [], stars: [],
    hover: null, t0: 0, onPick: null, onView: null, reduced: false,
    // Camera: yaw/pitch orbit the field, dist dollies through it, drift keeps it alive.
    yaw: 0.35, pitch: -0.28, dist: 1150, drift: 0,
    drag: null, dragEnded: false
  };

  var FOV = 780;
  var CAT = {
    ai:    { c: '#FFB347', rgb: [255, 179, 71] },
    intel: { c: '#4DA3FF', rgb: [77, 163, 255] },
    news:  { c: '#FF5FA8', rgb: [255, 95, 168] }
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function hashId(s) { var h = 0, i; for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  /* Each category gets its own shell at a different radius, with nodes spread over it and
     flattened toward a disc so the result reads as a galaxy rather than a ball. Angles come
     from a hash of the id, so a node keeps its place between renders instead of jumping. */
  function layout() {
    var groups = { ai: [], intel: [], news: [] };
    S.nodes.forEach(function (n) { (groups[n.cat] || groups.news).push(n); });
    var shell = { ai: 300, intel: 520, news: 760 };
    Object.keys(groups).forEach(function (cat) {
      var list = groups[cat], N = list.length;
      list.forEach(function (n, i) {
        var h = hashId(n.id), jitter = (h % 1000) / 1000;
        n.theta0 = (i / Math.max(1, N)) * Math.PI * 2 + (jitter - 0.5) * 0.7;
        n.phi = (((h >> 10) % 1000) / 1000 - 0.5) * 0.95;
        n.r = (shell[cat] || shell.news) * (0.82 + jitter * 0.36);
        n.wy = Math.sin(n.phi) * n.r * 0.55;
        n.spin = 0.02 + jitter * 0.05;   // its own slow orbit, so nothing is ever still
        n.seed = jitter * 6.2832;        // and its own mesh phase, so no two churn in step
      });
    });
  }

  function seedStars() {
    S.stars = [];
    for (var i = 0; i < 620; i++) {
      var th = rand(0, 6.2832), ph = (Math.random() - 0.5) * 1.5, r = rand(300, 2400);
      S.stars.push({
        x: Math.cos(th) * Math.cos(ph) * r,
        y: Math.sin(ph) * r * 0.7,
        z: Math.sin(th) * Math.cos(ph) * r,
        s: rand(0.4, 1.5),
        c: Math.random() < 0.22 ? ['#FF5FA8', '#4DA3FF', '#FFB347', '#C86BFF'][(Math.random() * 4) | 0] : '#ffffff',
        a: rand(0.15, 0.75)
      });
    }
  }

  /* Yaw, then pitch, then perspective divide. Anything behind the camera returns null and is
     simply not drawn, which is what lets you fly past things. */
  function project(x, y, z) {
    var yaw = S.yaw + S.drift;
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    var cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
    var y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    var zc = z2 + S.dist;
    if (zc < 40) return null;
    var k = FOV / zc;
    return { x: S.w / 2 + x1 * k, y: S.h / 2 + y1 * k, k: k, z: zc };
  }

  /* The voice orb is a wireframe icosahedron whose vertices are pushed along their normals
     by noise — it reads as a churning mesh, not a lit ball. Nodes are drawn in that same
     idiom so the map and the assistant look like one family: a dark body, a lat/long mesh
     displaced by cheap noise, and the category hue carried by the lines rather than a fill.

     Two strokes, not one per segment: the far half of the sphere is collected into one path
     at low alpha and the near half into another. A node this size is ~340 segments, and
     stroking each on its own turned a still frame into a stutter. */
  function meshOrb(ctx, cx, cy, r, rgb, alpha, t, seed) {
    /* Line count follows the radius. A fixed mesh looked right at 50px and turned into a
       scribble at 16 — the same reason the orb engine takes a `detail` argument. */
    var LAT = Math.max(3, Math.min(8, Math.round(r / 8)));
    var LON = Math.max(6, Math.min(14, Math.round(r / 4.5)));
    var SEG = Math.max(12, Math.min(22, Math.round(r / 3)));
    var i, j, k;
    var col = function (a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a.toFixed(3) + ')'; };
    var wob = function (u, v) {
      return Math.sin(u * 2.1 + t * 0.9 + seed) * 0.5 + Math.sin(v * 2.7 - t * 0.6 + seed * 1.7) * 0.5;
    };
    // the body, so it sits as an object against the star field rather than a see-through cage
    var body = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.05, cx, cy, r);
    body.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (0.20 * alpha).toFixed(3) + ')');
    body.addColorStop(1, 'rgba(6,6,8,' + (0.92 * alpha).toFixed(3) + ')');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();

    var far = new Path2D(), near = new Path2D();
    var pt = function (th, ph) {
      var d = r * (1 + 0.12 * wob(th * 2, ph * 2));
      var st = Math.sin(th);
      return { x: cx + st * Math.cos(ph) * d, y: cy + Math.cos(th) * d, z: st * Math.sin(ph) };
    };
    for (i = 1; i < LAT; i++) {                       // latitude rings
      var th = Math.PI * i / LAT, started = { f: false, n: false };
      for (j = 0; j <= SEG; j++) {
        var q = pt(th, 6.2832 * j / SEG), path = q.z < 0 ? far : near, key = q.z < 0 ? 'f' : 'n';
        if (!started[key]) { path.moveTo(q.x, q.y); started[key] = true; } else path.lineTo(q.x, q.y);
        if (j === SEG) { started.f = false; started.n = false; }
      }
    }
    for (i = 0; i < LON; i++) {                       // longitude arcs
      var ph = 6.2832 * i / LON, s2 = { f: false, n: false };
      for (k = 0; k <= SEG; k++) {
        var p2 = pt(Math.PI * k / SEG, ph), pa = p2.z < 0 ? far : near, ky = p2.z < 0 ? 'f' : 'n';
        if (!s2[ky]) { pa.moveTo(p2.x, p2.y); s2[ky] = true; } else pa.lineTo(p2.x, p2.y);
      }
    }
    ctx.lineWidth = Math.max(0.6, r * 0.018);
    ctx.strokeStyle = col(0.16 * alpha); ctx.stroke(far);
    ctx.strokeStyle = col(0.72 * alpha); ctx.stroke(near);
  }

  function nodePos(n, t) {
    var th = n.theta0 + (S.reduced ? 0 : t * n.spin * 0.1);
    var cph = Math.cos(n.phi);
    return project(Math.cos(th) * cph * n.r, n.wy, Math.sin(th) * cph * n.r);
  }

  // Volume drives size: a key doing real work is visibly a bigger object in the field.
  function orbRadius(n) { return (n.on ? 5.2 : 3.0) + Math.min(7, Math.sqrt(n.reqs || 0) * 0.9); }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(ts) {
    if (!S.ctx) return;
    var ctx = S.ctx, t = (ts - S.t0) / 1000, i;
    if (!S.reduced && !S.drag) S.drift += 0.00035;

    ctx.clearRect(0, 0, S.w, S.h);

    // starfield, projected the same way so it parallaxes as the camera moves
    for (i = 0; i < S.stars.length; i++) {
      var st = S.stars[i], p = project(st.x, st.y, st.z);
      if (!p) continue;
      ctx.globalAlpha = st.a * Math.min(1, p.k * 2.2);
      ctx.fillStyle = st.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, st.s * p.k * 1.6), 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    var origin = project(0, 0, 0);

    // project once, then paint far-to-near so depth occludes properly
    var drawn = [];
    for (i = 0; i < S.nodes.length; i++) {
      var n = S.nodes[i], q = nodePos(n, t);
      if (!q) { n.sx = null; continue; }
      n.sx = q.x; n.sy = q.y; n.sk = q.k; n.sz = q.z;
      drawn.push(n);
    }
    drawn.sort(function (a, b) { return b.sz - a.sz; });

    if (origin) {
      for (i = 0; i < drawn.length; i++) {
        var ln = drawn[i], lc = (CAT[ln.cat] || CAT.news), lf = Math.min(1, ln.sk * 1.8);
        ctx.save();
        ctx.strokeStyle = ln.on ? lc.c : 'rgba(255,255,255,0.5)';
        ctx.globalAlpha = (S.hover === ln ? 0.9 : (ln.on ? 0.30 : 0.12)) * lf;
        ctx.lineWidth = Math.max(0.4, (S.hover === ln ? 1.4 : 0.9) * ln.sk * 1.4);
        if (!ln.on) ctx.setLineDash([3, 6]);
        ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(ln.sx, ln.sy); ctx.stroke();
        ctx.restore();
      }
    }

    ctx.textBaseline = 'middle';
    for (i = 0; i < drawn.length; i++) {
      var nd = drawn[i], c = (CAT[nd.cat] || CAT.news), rgb = c.rgb;
      var hov = S.hover === nd;
      var rr = Math.max(1.2, orbRadius(nd) * nd.sk * 1.5);
      var fade = Math.min(1, nd.sk * 2.0);

      var g = ctx.createRadialGradient(nd.sx, nd.sy, 0, nd.sx, nd.sy, rr * 3.4);
      var aIn = (nd.on ? 0.55 : 0.18) * fade * (hov ? 1.4 : 1);
      g.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + aIn.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(nd.sx, nd.sy, rr * 3.4, 0, 6.2832); ctx.fill();

      if (rr >= 5) meshOrb(ctx, nd.sx, nd.sy, rr, rgb, (nd.on ? 1 : 0.45) * fade, t, nd.seed || 0);
      else {
        // Below a few pixels a mesh is just noise — small nodes keep the lit sphere.
        var b = ctx.createRadialGradient(nd.sx - rr * 0.3, nd.sy - rr * 0.35, rr * 0.1, nd.sx, nd.sy, rr);
        b.addColorStop(0, nd.on ? 'rgba(255,255,255,' + (0.95 * fade).toFixed(3) + ')'
                                : 'rgba(220,220,230,' + (0.5 * fade).toFixed(3) + ')');
        b.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + ((nd.on ? 0.95 : 0.35) * fade).toFixed(3) + ')');
        ctx.fillStyle = b;
        ctx.beginPath(); ctx.arc(nd.sx, nd.sy, rr, 0, 6.2832); ctx.fill();
      }
    }

    /* Labels are a second pass, walked nearest-first, and a pill that would land on one
       already placed is simply dropped. Depth decides who keeps their label: the thing in
       front of you is named, the thing behind it stays an orb until you move. Cheaper and
       calmer than pushing labels around, which in a moving 3D field would never settle. */
    var placed = [];
    for (i = drawn.length - 1; i >= 0; i--) {
      var nd = drawn[i], c = (CAT[nd.cat] || CAT.news);
      var hov = S.hover === nd;
      var rr = Math.max(1.2, orbRadius(nd) * nd.sk * 1.5);
      var fade = Math.min(1, nd.sk * 2.0);
      if (nd.sk < 0.30) continue;   // too far for text to be worth the pixels

      var fs = Math.max(7.5, Math.min(11, 10 * nd.sk * 1.5));
      ctx.font = fs.toFixed(1) + 'px "JetBrains Mono", ui-monospace, monospace';
      var usage = nd.on && nd.usage ? nd.usage : '';
      var tw = ctx.measureText(nd.label).width;
      if (usage) {
        ctx.font = (fs * 0.86).toFixed(1) + 'px "JetBrains Mono", ui-monospace, monospace';
        tw = Math.max(tw, ctx.measureText(usage).width);
        ctx.font = fs.toFixed(1) + 'px "JetBrains Mono", ui-monospace, monospace';
      }
      var pw = tw + 14, ph = fs + 9 + (usage ? fs + 1 : 0);
      var px = nd.sx + rr + 9, py = nd.sy - ph / 2;

      var hit = false;
      for (var q2 = 0; q2 < placed.length; q2++) {
        var pb = placed[q2];
        if (px < pb.x + pb.w && px + pw > pb.x && py < pb.y + pb.h && py + ph > pb.y) { hit = true; break; }
      }
      if (hit && !hov) continue;
      placed.push({ x: px, y: py, w: pw, h: ph });

      ctx.globalAlpha = (hov ? 0.96 : 0.72) * fade;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.strokeStyle = hov ? c.c : 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      roundRect(ctx, px, py, pw, ph, 5);
      ctx.fill(); ctx.stroke();

      ctx.globalAlpha = fade;
      ctx.textAlign = 'left';
      ctx.fillStyle = hov ? '#ffffff' : (nd.on ? 'rgba(240,242,246,0.95)' : 'rgba(160,160,172,0.85)');
      ctx.fillText(nd.label, px + 7, usage ? py + fs * 0.75 : py + ph / 2);
      if (usage) {
        ctx.font = (fs * 0.86).toFixed(1) + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = c.c;
        ctx.globalAlpha = 0.9 * fade;
        ctx.fillText(usage, px + 7, py + ph - fs * 0.72);
      }
      ctx.globalAlpha = 1;
    }

    if (S.onView) S.onView();
    S.raf = requestAnimationFrame(draw);
  }

  function pick(sx, sy) {
    var best = null, bd = 26 * 26;
    for (var i = 0; i < S.nodes.length; i++) {
      var n = S.nodes[i];
      if (n.sx == null) continue;
      var dx = sx - n.sx, dy = sy - n.sy, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function resize() {
    if (!S.el || !S.cv) return;
    var w = S.el.clientWidth || 900, h = S.el.clientHeight || 520;
    if (w === S.w && h === S.h) return;
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    S.w = w; S.h = h;
    S.cv.width = Math.round(w * S.dpr); S.cv.height = Math.round(h * S.dpr);
    S.cv.style.width = w + 'px'; S.cv.style.height = h + 'px';
    S.ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  }

  var API = {
    mount: function (el, opts) {
      if (!el) return false;
      opts = opts || {};
      if (S.el === el && S.cv) { API.resize(); return true; }
      API.destroy();
      S.el = el; S.onPick = opts.onPick || null;
      try { S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { S.reduced = false; }

      var cv = document.createElement('canvas');
      cv.style.display = 'block'; cv.style.cursor = 'grab';
      el.innerHTML = ''; el.appendChild(cv);
      S.cv = cv; S.ctx = cv.getContext('2d');

      cv.addEventListener('mousemove', function (e) {
        var r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        if (S.drag) {
          S.yaw = S.drag.yaw + (mx - S.drag.x) * 0.005;
          S.pitch = Math.max(-1.2, Math.min(1.2, S.drag.pitch + (my - S.drag.y) * 0.004));
          if (Math.abs(mx - S.drag.x) + Math.abs(my - S.drag.y) > 4) S.drag.moved = true;
          return;
        }
        var n = pick(mx, my);
        if (n !== S.hover) { S.hover = n; cv.style.cursor = n ? 'pointer' : 'grab'; }
      });
      cv.addEventListener('mousedown', function (e) {
        var r = cv.getBoundingClientRect();
        S.drag = { x: e.clientX - r.left, y: e.clientY - r.top, yaw: S.yaw, pitch: S.pitch, moved: false };
        cv.style.cursor = 'grabbing';
      });
      window.addEventListener('mouseup', function () {
        if (S.drag) { S.dragEnded = S.drag.moved; S.drag = null; }
        if (S.cv) S.cv.style.cursor = S.hover ? 'pointer' : 'grab';
      });
      cv.addEventListener('mouseleave', function () { S.hover = null; });
      cv.addEventListener('click', function (e) {
        // A drag that happens to end on an orb should not count as selecting it.
        if (S.dragEnded) { S.dragEnded = false; return; }
        var r = cv.getBoundingClientRect();
        var n = pick(e.clientX - r.left, e.clientY - r.top);
        if (n && S.onPick) S.onPick(n.id, n.cat);
      });
      cv.addEventListener('wheel', function (e) {
        // Dolly, not scale: you move through the field rather than zooming a picture of it.
        e.preventDefault();
        S.dist = Math.max(260, Math.min(2600, S.dist * (e.deltaY < 0 ? 1 / 1.11 : 1.11)));
      }, { passive: false });
      cv.addEventListener('dblclick', function () { API.resetView(); });

      S._onResize = function () { API.resize(); };
      window.addEventListener('resize', S._onResize);

      S.w = 0; S.h = 0;
      seedStars(); resize(); layout();
      S.t0 = performance.now();
      if (!S.raf) S.raf = requestAnimationFrame(draw);
      return true;
    },

    /* nodes: [{id,label,cat,on,reqs,usage}] — `usage` is a pre-formatted line supplied by the
       host, so pricing and number formatting stay in one place in the app rather than being
       reimplemented here. */
    setNodes: function (list) {
      S.nodes = (list || []).map(function (n) {
        return {
          id: n.id, label: (n.label || n.id).toUpperCase(), cat: n.cat || 'news',
          on: !!n.on, reqs: +n.reqs || 0, usage: n.usage || '',
          sx: null, sy: null, sk: 1, sz: 0
        };
      });
      layout();
    },

    resize: function () { resize(); },
    resetView: function () { S.yaw = 0.35; S.pitch = -0.28; S.dist = 1150; S.drift = 0; },
    // Where the world origin lands on screen this frame, so the host can park the real orb there.
    getView: function () {
      var o = project(0, 0, 0);
      return o ? { x: o.x, y: o.y, k: o.k } : { x: S.w / 2, y: S.h / 2, k: 0 };
    },
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
