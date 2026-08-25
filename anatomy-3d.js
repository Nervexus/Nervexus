// Nervexus — 3D anatomy model for Fitness & Recovery.
//
// Model: "man muscle human body" by Rena (Sketchfab), CC Attribution. The credit line is a
// licence condition, not decoration — it is rendered under the model in index.html.
//
// The source model is a single merged body mesh (split into chunks only by the 65k vertex
// limit) with no skeleton, no textures and no per-muscle groups, so a muscle cannot be picked
// out by name. Instead every vertex is classified into a muscle zone from its position in the
// figure, and the glow is painted per-vertex. Zone boundaries are therefore positional rather
// than true anatomical borders — close, but not exact.
//
// Shipped model has already been processed offline: shoulders widened ~15% on X (the source
// was 0.207 shoulder:height, notably narrow), welded, simplified to 35% and meshopt-compressed
// from 29MB to 2.1MB. three.js + GLTFLoader + the meshopt decoder are bundled locally rather
// than pulled from a CDN so the PWA keeps working offline.
(function () {
  'use strict';

  var BUNDLE_URL = 'anatomy-three.js';
  var MODEL_URL = 'anatomy-model.glb';

  var S = {
    bundle: null, mounted: false, el: null,
    THREE: null, renderer: null, scene: null, camera: null, root: null,
    meshes: [], raf: 0, targetYaw: 0, yaw: 0, pitch: 0, dragging: false,
    lastX: 0, lastY: 0, glow: {}, dirty: true, dist: 4, disposed: false,
  };

  function supported() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  function loadBundle() {
    if (window.NX3D) return Promise.resolve(window.NX3D);
    if (S.bundle) return S.bundle;
    S.bundle = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = BUNDLE_URL;
      s.async = true;
      s.onload = function () { window.NX3D ? res(window.NX3D) : rej(new Error('3D bundle did not initialise')); };
      s.onerror = function () { S.bundle = null; rej(new Error('Could not load the 3D bundle')); };
      document.head.appendChild(s);
    });
    return S.bundle;
  }

  // ---- muscle zoning -------------------------------------------------------
  // Meshopt compression stores positions quantised to -1..1 with the real scale carried on
  // the node transform, so raw attribute values are meaningless on their own. Everything here
  // therefore works in WORLD space normalised by the figure's own height: u = 0 at the feet,
  // 1 at the crown, and lateral/depth distances are expressed as fractions of height. That
  // makes the zoning independent of the model's units, scale and compression settings.
  //
  // Bands below were measured from this figure's silhouette (209 units tall): calves to 22%,
  // thigh 22-44%, hips/glutes 43-53%, waist 53-71%, chest 71-80%, delts/traps 77-90%,
  // head above 90%. The arms sit beyond 11.5% of height from the centre line.
  var B = {
    head: 0.898, trapsTop: 0.802, deltTop: 0.774, chestTop: 0.707,
    upperArm: 0.621, lats: 0.583, waist: 0.525, lowBack: 0.506,
    hips: 0.439, glutes: 0.430, knee: 0.220, ankle: 0.038,
    armX: 0.1146, absX: 0.0573,
  };
  function makeZoner(armZMid, torsoZMid) {
    return function (ax, u, z) {
      if (u > B.head) return 0;                        // head and neck — never lit
      if (ax > B.armX) {                               // ---- arms ----
        if (u >= B.deltTop) return Z.delts;
        if (u >= B.upperArm) return z > armZMid ? Z.biceps : Z.triceps;
        return Z.forearms;
      }
      var front = z > torsoZMid;
      if (u >= B.trapsTop) return Z.traps;             // upper trapezius, both sides
      if (front) {
        if (u >= B.chestTop) return Z.chest;
        if (u >= B.waist) return ax < B.absX ? Z.abs : Z.obliques;
        if (u >= B.hips) return 0;                     // hips
        if (u >= B.knee) return Z.quads;
        if (u >= B.ankle) return Z.calves;
        return 0;
      }
      if (u >= B.chestTop) return Z.traps;             // mid trapezius
      if (u >= B.lats) return Z.lats;
      if (u >= B.lowBack) return Z.lower_back;
      if (u >= B.glutes) return Z.glutes;
      if (u >= B.knee) return Z.hamstrings;
      if (u >= B.ankle) return Z.calves;
      return 0;
    };
  }

  // Zone ids as small ints so they pack into a Uint8Array alongside the geometry.
  var ZONE_NAMES = ['', 'chest', 'lats', 'delts', 'delts_rear', 'biceps', 'triceps', 'forearms',
    'traps', 'abs', 'obliques', 'lower_back', 'glutes', 'quads', 'hamstrings', 'calves', 'adductors'];
  var Z = {};
  ZONE_NAMES.forEach(function (n, i) { if (n) Z[n] = i; });

  // The front figure has no rear deltoid and the back no anterior deltoid, but the app's
  // muscle map emits both — treat them as the same geometry so either lights the shoulder.
  function glowFor(map, zoneId) {
    var name = ZONE_NAMES[zoneId];
    if (!name) return 0;
    var v = map[name];
    if (v == null && name === 'delts') v = map.delts_rear;
    if (v == null && name === 'delts_rear') v = map.delts;
    return v || 0;
  }

  function buildZones(THREE, root) {
    root.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(root);
    var min = box.min, max = box.max;
    var H = Math.max(1e-6, max.y - min.y);
    var cx = (min.x + max.x) / 2, cz = (min.z + max.z) / 2;
    var v = new THREE.Vector3();
    // Normalised world position of vertex i, as (lateral fraction, height fraction, depth fraction).
    var at = function (mesh, pos, i) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      return [Math.abs(v.x - cx) / H, (v.y - min.y) / H, (v.z - cz) / H];
    };
    // Two passes: the arms sit slightly off the figure's depth midline, so the front/back
    // split for biceps vs triceps uses the arms' own centroid rather than a flat zero.
    var armZSum = 0, armN = 0, torsoZSum = 0, torsoN = 0;
    S.meshes.forEach(function (m) {
      var p = m.geometry.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var q = at(m, p, i);
        if (q[1] > B.head) continue;
        if (q[0] > B.armX && q[1] >= B.upperArm && q[1] < B.deltTop) { armZSum += q[2]; armN++; }
        else if (q[0] <= B.armX && q[1] >= B.waist && q[1] < B.trapsTop) { torsoZSum += q[2]; torsoN++; }
      }
    });
    var zoneOf = makeZoner(armN ? armZSum / armN : 0, torsoN ? torsoZSum / torsoN : 0);
    S.meshes.forEach(function (m) {
      var p = m.geometry.attributes.position, n = p.count;
      var ids = new Uint8Array(n);
      for (var i = 0; i < n; i++) { var q = at(m, p, i); ids[i] = zoneOf(q[0], q[1], q[2]); }
      m.userData.zoneIds = ids;
      m.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    });
  }

  // Repaint vertex colours from the current glow map. Cheap enough to run on demand
  // (a few hundred thousand vertices) and only called when the glow actually changes.
  function paint() {
    var BASE_R = 0.74, BASE_G = 0.76, BASE_B = 0.80;
    S.meshes.forEach(function (m) {
      var ids = m.userData.zoneIds;
      if (!ids) return;
      var col = m.geometry.attributes.color, arr = col.array;
      for (var i = 0; i < ids.length; i++) {
        var g = ids[i] ? glowFor(S.glow, ids[i]) : 0;
        var o = i * 3;
        if (g > 0) {
          var t = 0.35 + 0.65 * g;                 // fade with recency
          arr[o] = BASE_R + (1.0 - BASE_R) * t;
          arr[o + 1] = BASE_G * (1 - t * 0.86);
          arr[o + 2] = BASE_B * (1 - t * 0.84);
        } else { arr[o] = BASE_R; arr[o + 1] = BASE_G; arr[o + 2] = BASE_B; }
      }
      col.needsUpdate = true;
    });
  }

  function frame() {
    if (S.disposed) return;
    S.raf = requestAnimationFrame(frame);
    var d = S.targetYaw - S.yaw;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) > 0.0015) { S.yaw += d * 0.12; S.dirty = true; }
    if (!S.dirty) return;
    S.dirty = false;
    if (S.root) S.root.rotation.y = S.yaw;
    var ph = Math.max(-0.5, Math.min(0.5, S.pitch));
    S.camera.position.set(0, Math.sin(ph) * S.dist, Math.cos(ph) * S.dist);
    S.camera.lookAt(0, 0, 0);
    S.renderer.render(S.scene, S.camera);
  }

  function fit() {
    if (!S.el || !S.renderer) return;
    var w = Math.max(120, S.el.clientWidth);
    var h = Math.max(200, Math.round(w * 1.55));
    S.renderer.setSize(w, h, true);
    S.camera.aspect = w / h;
    S.camera.updateProjectionMatrix();
    S.dirty = true;
  }

  function wireDrag(canvas) {
    var down = function (e) {
      S.dragging = true;
      var t = e.touches ? e.touches[0] : e;
      S.lastX = t.clientX; S.lastY = t.clientY;
    };
    var move = function (e) {
      if (!S.dragging) return;
      var t = e.touches ? e.touches[0] : e;
      var dx = t.clientX - S.lastX, dy = t.clientY - S.lastY;
      S.lastX = t.clientX; S.lastY = t.clientY;
      S.yaw += dx * 0.011; S.targetYaw = S.yaw;
      S.pitch += dy * 0.005;
      S.dirty = true;
      if (e.cancelable) e.preventDefault();
    };
    var up = function () { S.dragging = false; };
    canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: true });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', up);
    S._off = function () {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }

  function mount(el) {
    if (S.mounted && S.el === el) return Promise.resolve(true);
    if (!supported()) return Promise.reject(new Error('WebGL is not available on this device'));
    return loadBundle().then(function (NX) {
      var THREE = NX.THREE;
      S.THREE = THREE; S.el = el; S.disposed = false;
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      el.innerHTML = '';
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'display:block;width:100%;height:auto;touch-action:pan-y;cursor:grab;';
      S.renderer = renderer;
      var scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xc4d6ff, 0x1a1c22, 1.15));
      var key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(3, 4, 5); scene.add(key);
      var rim = new THREE.DirectionalLight(0x8ab4ff, 0.75); rim.position.set(-4, 1.5, -3); scene.add(rim);
      S.scene = scene;
      S.camera = new THREE.PerspectiveCamera(26, 0.65, 1, 4000);
      var loader = new NX.GLTFLoader();
      loader.setMeshoptDecoder(NX.MeshoptDecoder);
      return loader.loadAsync(MODEL_URL).then(function (gltf) {
        var root = gltf.scene;
        S.meshes = [];
        root.traverse(function (o) {
          if (!o.isMesh) return;
          S.meshes.push(o);
          o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.03 });
        });
        buildZones(THREE, root);
        paint();
        var box = new THREE.Box3().setFromObject(root);
        var size = box.getSize(new THREE.Vector3());
        var ctr = box.getCenter(new THREE.Vector3());
        // Wrap so rotation happens about the figure's own axis, not the scene origin.
        var pivot = new THREE.Group();
        root.position.sub(ctr);
        pivot.add(root);
        scene.add(pivot);
        S.root = pivot;
        S.dist = size.y * 2.0;
        S.mounted = true;
        fit();
        wireDrag(renderer.domElement);
        if (!S._resize) { S._resize = function () { fit(); }; window.addEventListener('resize', S._resize); }
        S.dirty = true;
        frame();
        return true;
      });
    });
  }

  function setGlow(map) {
    S.glow = map || {};
    if (S.mounted) { paint(); S.dirty = true; }
  }

  function setView(v) {
    S.targetYaw = (v === 'back') ? Math.PI : 0;
    S.pitch = 0;
    S.dirty = true;
  }

  function dispose() {
    S.disposed = true;
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = 0;
    if (S._off) { S._off(); S._off = null; }
    if (S._resize) { window.removeEventListener('resize', S._resize); S._resize = null; }
    try {
      S.meshes.forEach(function (m) { m.geometry.dispose(); if (m.material) m.material.dispose(); });
      if (S.renderer) { S.renderer.dispose(); if (S.renderer.domElement && S.renderer.domElement.parentNode) S.renderer.domElement.parentNode.removeChild(S.renderer.domElement); }
    } catch (e) { }
    S.meshes = []; S.renderer = null; S.scene = null; S.root = null; S.mounted = false; S.el = null;
  }

  // Reports the vertex bounds actually seen and how many vertices landed in each zone —
  // used to confirm the positional zoning matched the model's own coordinate space.
  function debugZones() {
    var hist = {}, bounds = { x: [1e9, -1e9], y: [1e9, -1e9], z: [1e9, -1e9] }, total = 0;
    S.meshes.forEach(function (m) {
      var p = m.geometry.attributes.position, ids = m.userData.zoneIds || [];
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        if (x < bounds.x[0]) bounds.x[0] = x; if (x > bounds.x[1]) bounds.x[1] = x;
        if (y < bounds.y[0]) bounds.y[0] = y; if (y > bounds.y[1]) bounds.y[1] = y;
        if (z < bounds.z[0]) bounds.z[0] = z; if (z > bounds.z[1]) bounds.z[1] = z;
        var n = ZONE_NAMES[ids[i]] || '(none)';   // raw bounds are quantised; zoning uses world space
        hist[n] = (hist[n] || 0) + 1; total++;
      }
    });
    return { total: total, bounds: bounds, zones: hist, meshes: S.meshes.length };
  }

  window.NervexusAnatomy3D = {
    mount: mount, setGlow: setGlow, setView: setView, dispose: dispose,
    supported: supported, isMounted: function () { return S.mounted; },
    debugZones: debugZones,
    CREDIT: 'Model: “man muscle human body” by Rena — CC Attribution',
  };
})();
