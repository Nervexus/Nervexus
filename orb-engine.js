/* orb-engine.js — vanilla-JS Canvas2D "liquid metal" particle-sphere orb.
   Inspired by the Transformers: Age of Extinction "transformium" effect — a mass
   of small metallic shard particles that churns/swirls across the sphere's
   surface, glints as facets catch the light, and has individual shards
   periodically break free and re-settle, rather than a rigid cloud of static
   dots. No external dependencies — renders immediately, nothing to fail to load.

   Exposes window.OrbEngine.mount(container, opts) -> {
     setHue, setSatMul, setDimMul, setSpecMul, setOverrideMix,
     setForceHover, setHoverIntensity, destroy
   }
   opts: hue, satMul, dimMul, specMul, overrideMix, overrideColor1/2/3 ([r,g,b] 0..1),
         hoverIntensity, rotateOnHover, forceHoverState */
(function (root) {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Evenly distribute n points on a unit sphere (golden-angle spiral), each with
  // its own churn/glint/detach timing so the surface reads as alive, not synced.
  function fibonacciSphere(n) {
    var pts = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / Math.max(1, n - 1)) * 2;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = golden * i;
      pts.push({
        x: Math.cos(theta) * r, y: y, z: Math.sin(theta) * r,
        phase: Math.random() * Math.PI * 2,
        tw: 0.6 + Math.random() * 0.8,
        // Swirl/churn: 3 independent low-freq wobble waves per particle so the
        // surface roils instead of rotating as one rigid shell.
        swA: Math.random() * Math.PI * 2, swB: Math.random() * Math.PI * 2, swC: Math.random() * Math.PI * 2,
        swFA: 0.00025 + Math.random() * 0.00035, swFB: 0.0003 + Math.random() * 0.0004, swFC: 0.0002 + Math.random() * 0.0003,
        // Glint: sharp, brief specular flashes as a "facet" catches the light.
        glintPhase: Math.random() * Math.PI * 2, glintSpeed: 0.0009 + Math.random() * 0.0018,
        // Detach: rare, brief outward pulses — a shard breaks free and re-settles.
        detachPhase: Math.random() * Math.PI * 2, detachSpeed: 0.00018 + Math.random() * 0.00022,
        // Spikes point radially outward from the cluster core (like the reference —
        // a bristling ball of wire-thin metal spikes), with a per-spike angular kink
        // and length so the silhouette is tufted/irregular, not a perfect sea urchin.
        // Kink/wobble are kept small — this is a fixed kink, not a live wiggle, so
        // the cluster holds its shape instead of looking like it's swimming.
        spikeKink: (Math.random() - 0.5) * 0.5, spikeLenMul: 0.45 + Math.random() * 1.9,
        spikeWob: Math.random() * Math.PI * 2, spikeWobSpeed: 0.00015 + Math.random() * 0.0003
      });
    }
    return pts;
  }

  function hueToRgb01(hueDeg) {
    var h = ((hueDeg % 360) + 360) % 360 / 360;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    var q = 0.65, p = 0.25;
    return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)];
  }

  function mount(container, opts) {
    opts = opts || {};
    var hue = opts.hue != null ? opts.hue : 240;
    var satMul = opts.satMul != null ? opts.satMul : 1;
    var dimMul = opts.dimMul != null ? opts.dimMul : 1;
    var specMul = opts.specMul != null ? opts.specMul : 1;
    var overrideMix = opts.overrideMix != null ? opts.overrideMix : 0;
    var col1 = opts.overrideColor1 || hueToRgb01(hue);
    var col2 = opts.overrideColor2 || hueToRgb01(hue + 24);
    var col3 = opts.overrideColor3 || [0.05, 0.05, 0.08];
    // Chrome/liquid-metal base — near-white hot highlight, cool dark shadow — with
    // the theme hue applied as a thin tint rather than fully saturating every shard.
    var metalHi = [0.93, 0.95, 0.99];
    var metalLo = [0.05, 0.06, 0.09];
    var hoverIntensity = opts.hoverIntensity != null ? opts.hoverIntensity : 0.3;
    var rotateOnHover = opts.rotateOnHover !== false;
    var forceHoverState = !!opts.forceHoverState;
    var destroyed = false;

    var canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    if (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var points = [];
    function rebuildPoints() {
      var size = Math.max(container.clientWidth, container.clientHeight) || 200;
      var n = Math.round(clamp(size / 460 * 220, 80, 260));
      points = fibonacciSphere(n);
    }
    rebuildPoints();

    var dpr = 1, cw = 0, ch = 0;
    function resize() {
      if (destroyed) return;
      dpr = Math.min(2, root.devicePixelRatio || 1);
      cw = container.clientWidth; ch = container.clientHeight;
      if (!cw || !ch) return;
      canvas.width = Math.max(1, cw * dpr);
      canvas.height = Math.max(1, ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildPoints();
    }
    root.addEventListener('resize', resize);
    resize();

    var targetHover = 0, hoverAmt = 0;
    // Current drifted centre (updated every frame below) so hover detection tracks
    // the cluster's actual on-screen position, not the container's fixed centre.
    var curOcx = 0, curOcy = 0;
    function onMove(e) {
      var rect = container.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var size = Math.min(rect.width, rect.height) || 1;
      var ux = (x - curOcx) / size, uy = (y - curOcy) / size;
      targetHover = Math.sqrt(ux * ux + uy * uy) < 0.9 ? 1 : 0;
    }
    function onLeave() { targetHover = 0; }
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);

    function mixCol(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
    function toCss(rgb01, alpha) {
      var gray = rgb01[0] * 0.299 + rgb01[1] * 0.587 + rgb01[2] * 0.114;
      var r = lerp(gray, rgb01[0], satMul) * dimMul, g = lerp(gray, rgb01[1], satMul) * dimMul, b = lerp(gray, rgb01[2], satMul) * dimMul;
      r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
      return 'rgba(' + (r * 255 | 0) + ',' + (g * 255 | 0) + ',' + (b * 255 | 0) + ',' + alpha + ')';
    }

    var rotY = 0, lastT = 0, breathePhase = Math.random() * Math.PI * 2;
    // Fish-swim drift: two mismatched-frequency waves make the centre wander an
    // organic, non-repeating path around the container instead of holding still.
    var driftPhaseA = Math.random() * Math.PI * 2, driftPhaseB = Math.random() * Math.PI * 2;
    var driftFA = 0.00023 + Math.random() * 0.00006, driftFB = 0.00015 + Math.random() * 0.00005;
    var rafId;
    function frame(t) {
      rafId = root.requestAnimationFrame(frame);
      if (!cw || !ch) return;
      var dt = lastT ? (t - lastT) / 1000 : 0.016;
      lastT = t;

      var eff = forceHoverState ? 1 : (rotateOnHover ? targetHover : 0);
      hoverAmt += (eff - hoverAmt) * 0.08;
      var speed = 0.22 + hoverAmt * 0.55 * clamp(hoverIntensity + 1, 0.3, 2) + (forceHoverState ? 0.35 : 0);
      rotY += dt * speed;
      var tiltX = Math.sin(t * 0.00035) * 0.14;
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      // Churn scales up a little with hover/listening, like the mass agitating.
      // Kept small — this is surface texture, not the cluster drifting around.
      var churnAmt = 0.02 + hoverAmt * 0.018 + (forceHoverState ? 0.012 : 0);

      // Compact core radius — the spike cluster floats in open space like the
      // reference (a fist-sized bristling clump), not a shape filling the frame.
      var R = Math.min(cw, ch) * 0.3 * (1 + Math.sin(t * 0.0011 + breathePhase) * 0.02 + hoverAmt * 0.035);
      var focal = R * 2.6;

      // Wander the whole cluster's centre around the container like a fish
      // swimming, and derive a heading + speed from the path's own velocity so
      // the silhouette can flex (stretch along the direction of travel) as it
      // moves — both computed once per frame, not per particle.
      var wanderMax = Math.max(0, Math.min(cw, ch) * 0.5 - R - 26);
      var wanderRange = Math.min(wanderMax, Math.min(cw, ch) * 0.16);
      var angA = t * driftFA + driftPhaseA, angB = t * driftFB + driftPhaseB;
      var ocx = cw / 2 + Math.sin(angA) * wanderRange;
      var ocy = ch / 2 + Math.sin(angB) * wanderRange * 0.72;
      var dvx = Math.cos(angA) * driftFA * wanderRange, dvy = Math.cos(angB) * driftFB * wanderRange * 0.72;
      var headAngle = Math.atan2(dvy, dvx);
      var speedNorm = clamp(Math.sqrt(dvx * dvx + dvy * dvy) / (wanderRange * 0.00016), 0, 1);
      var squash = 0.14 * speedNorm;
      var hc = Math.cos(headAngle), hs = Math.sin(headAngle);
      curOcx = ocx; curOcy = ocy;

      ctx.clearRect(0, 0, cw, ch);

      // Soft ambient glow behind the sphere, using the mid-tone palette color.
      var g = ctx.createRadialGradient(ocx, ocy, 0, ocx, ocy, R * 1.35);
      g.addColorStop(0, toCss(col2, 0.16 * dimMul + hoverAmt * 0.08));
      g.addColorStop(1, toCss(col2, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      // Faint core mass glow so the shard cloud reads as one dense, cohesive
      // object rather than scattered dust — a soft chrome sphere underneath.
      var core = ctx.createRadialGradient(ocx, ocy, 0, ocx, ocy, R * 0.92);
      core.addColorStop(0, toCss(mixCol(col3, col1, 0.5), 0.1 * dimMul + hoverAmt * 0.05));
      core.addColorStop(0.75, toCss(col3, 0.06 * dimMul));
      core.addColorStop(1, toCss(col3, 0));
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, cw, ch);

      var proj = [];
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        // Per-shard churn: nudge the base sphere position along a slowly-drifting
        // offset so the surface roils instead of rotating as one rigid shell.
        var swx = Math.sin(t * p.swFA + p.swA) * churnAmt;
        var swy = Math.sin(t * p.swFB + p.swB) * churnAmt;
        var swz = Math.sin(t * p.swFC + p.swC) * churnAmt;
        var px = p.x + swx, py = p.y + swy, pz = p.z + swz;
        var plen = Math.sqrt(px * px + py * py + pz * pz) || 1;
        // Detach: a rare, brief outward pulse — the shard breaks free and re-settles.
        var detach = Math.pow(Math.max(0, Math.sin(t * p.detachSpeed + p.detachPhase)), 28);
        var radialMul = 1 + detach * 0.22;
        px = (px / plen) * radialMul; py = (py / plen) * radialMul; pz = (pz / plen) * radialMul;

        // rotate around Y then tilt around X
        var x1 = px * cosY + pz * sinY, z1 = -px * sinY + pz * cosY;
        var y1 = py * cosX - z1 * sinX, z2 = py * sinX + z1 * cosX;
        var persp = focal / (focal + z2 * R);
        var glint = Math.pow(Math.max(0, Math.sin(t * p.glintSpeed + p.glintPhase)), 9);
        // Flex the silhouette along the direction of travel: rotate into the
        // heading frame, stretch/squash there, then rotate back — so the
        // cluster elongates slightly as it swims rather than staying rigid.
        var offx = x1 * R * persp, offy = y1 * R * persp;
        var lx = offx * hc + offy * hs, ly = -offx * hs + offy * hc;
        lx *= (1 + squash); ly *= (1 - squash * 0.6);
        var fx = lx * hc - ly * hs, fy = lx * hs + ly * hc;
        proj.push({
          sx: ocx + fx, sy: ocy + fy,
          depth: (z2 + 1) / 2, persp: persp, tw: p.tw, phase: p.phase,
          glint: glint, detach: detach,
          kink: p.spikeKink + Math.sin(t * p.spikeWobSpeed + p.spikeWob) * 0.1, lenMul: p.spikeLenMul
        });
      }
      proj.sort(function (a, b) { return a.depth - b.depth; });

      for (var j = 0; j < proj.length; j++) {
        var q = proj[j];
        var twinkle = 0.85 + Math.sin(t * 0.0022 * q.tw + q.phase) * 0.15;
        var alpha = clamp(0.46 + q.depth * 0.62, 0, 1) * twinkle * (1 - q.detach * 0.3);
        var rad = (1.15 + q.depth * 2) * (cw < 120 ? 0.6 : 1) * (1 + hoverAmt * 0.2 + q.detach * 0.4);

        // Base shard tone: cool dark metal -> bright chrome by depth, tinted by
        // the theme hue; a sharp glint spikes it towards near-white — the
        // "facet catching the light" flash.
        var depthCol = mixCol(metalLo, metalHi, clamp(q.depth * 1.1 + 0.15, 0, 1));
        var tinted = mixCol(depthCol, col1, 0.22 + overrideMix * 0.18);
        var shardCol = mixCol(tinted, [1, 1, 1], q.glint * 0.92);
        var glowCol = mixCol(col1, [1, 1, 1], q.glint * 0.7);

        // ctx.shadowBlur is a full blur pass per draw call — very expensive on
        // canvas2d. Only pay for it on the handful of particles actually glinting
        // this frame (most sit at glint≈0 most of the time); everything else
        // renders flat. This is the single biggest lag fix.
        if (q.glint > 0.15) {
          var glow = clamp(specMul * (0.6 + q.depth * 0.6 + q.glint * 2.2) * (1 + hoverAmt * 0.6 + (forceHoverState ? 0.4 : 0)), 0, 4.5);
          ctx.shadowBlur = rad * (2 + glow * 2.6); ctx.shadowColor = toCss(glowCol, Math.min(1, 0.55 * glow));
        } else if (ctx.shadowBlur !== 0) { ctx.shadowBlur = 0; }

        // Thin wire spike radiating outward from the cluster core (screen-space
        // direction from the orb's centre through this point), kinked and
        // length-varied per spike so the silhouette bristles/tufts unevenly —
        // like the reference — instead of a smooth uniform sea-urchin.
        var dx = q.sx - ocx, dy = q.sy - ocy, dlen = Math.sqrt(dx * dx + dy * dy) || 1;
        var ndx = dx / dlen, ndy = dy / dlen;
        var ca = Math.cos(q.kink), sa = Math.sin(q.kink);
        var rdx = ndx * ca - ndy * sa, rdy = ndx * sa + ndy * ca;
        var perpx = -rdy, perpy = rdx;
        var baseIn = rad * 0.5;
        var bx = q.sx - rdx * baseIn, by = q.sy - rdy * baseIn;
        var spikeLen = rad * (3.4 + q.glint * 1.8) * q.lenMul;
        var tx = q.sx + rdx * spikeLen, ty = q.sy + rdy * spikeLen;
        var wid = Math.max(0.5, rad * 0.5);
        ctx.fillStyle = toCss(shardCol, alpha);
        ctx.beginPath();
        ctx.moveTo(bx + perpx * wid, by + perpy * wid);
        ctx.lineTo(bx - perpx * wid, by - perpy * wid);
        ctx.lineTo(tx, ty);
        ctx.closePath();
        ctx.fill();
        // A bright glint spark right at the tip — the sharpest highlight in the
        // reference, where a facet flashes as it catches the light.
        if (q.glint > 0.35) {
          ctx.fillStyle = toCss([1, 1, 1], alpha * q.glint);
          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(0.5, rad * 0.35 * q.glint), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      // Listening ring — a soft pulsing halo just outside the sphere silhouette.
      if (forceHoverState) {
        var pulse = (Math.sin(t * 0.0026) + 1) / 2;
        ctx.beginPath();
        ctx.arc(ocx, ocy, R * (1.06 + pulse * 0.07), 0, Math.PI * 2);
        ctx.strokeStyle = toCss(col1, 0.16 + pulse * 0.14);
        ctx.lineWidth = Math.max(1, R * 0.012);
        ctx.stroke();
      }
    }
    rafId = root.requestAnimationFrame(frame);

    return {
      setHue: function (v) { hue = v; col1 = hueToRgb01(hue); col2 = hueToRgb01(hue + 24); },
      setSatMul: function (v) { satMul = v; },
      setDimMul: function (v) { dimMul = v; },
      setSpecMul: function (v) { specMul = v; },
      setOverrideMix: function (v) { overrideMix = v; },
      setForceHover: function (v) { forceHoverState = !!v; },
      setHoverIntensity: function (v) { hoverIntensity = v; },
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        root.cancelAnimationFrame(rafId);
        root.removeEventListener('resize', resize);
        container.removeEventListener('mousemove', onMove);
        container.removeEventListener('mouseleave', onLeave);
        try { if (canvas.parentNode === container) container.removeChild(canvas); } catch (e) {}
      }
    };
  }

  root.OrbEngine = { mount: mount };
})(window);
