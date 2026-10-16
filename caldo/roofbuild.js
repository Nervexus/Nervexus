// Interactive 3D roof build-up — a scroll-scrubbed exploded view of a
// standing-seam roof, replacing the old static "Engineering" intro
// section. The 3D scene itself (geometry, materials, procedural
// textures, scroll math) is adapted largely as-is from the original
// build; only the DOM element ids (now namespaced roofbuild-*) and the
// layer copy (now imported from data.js, reworded to STRATA's actual
// standing-seam construction instead of a generic slate roof) changed.
//
// Plain global-THREE script rather than an es module import for Three
// itself (the r128 CDN build is a classic UMD script, loaded before this
// one in index.html) — only this file's own `import` of ROOF_LAYERS uses
// the module system.

import { ROOF_LAYERS as LAYERS } from './data.js';

const N = LAYERS.length;
const stepsEl = document.getElementById('roofbuild-steps');
const lis = LAYERS.map((L, i) => {
  const li = document.createElement('li');
  li.innerHTML = '<span class="n">' + String(i + 1).padStart(2, '0') + '</span><div><h3>' + L.name + '</h3><p>' + L.note + '</p></div>';
  stepsEl.appendChild(li);
  return li;
});

const canvas = document.getElementById('gl');
let renderer = null;
try { if (typeof THREE !== 'undefined') renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { renderer = null; }
if (!renderer) {
  document.getElementById('roofbuild-fallback').hidden = false;
} else {
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdfe0df, 40, 80);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xf2f3f4, 0x8a8d90, 0.85));
const sun = new THREE.DirectionalLight(0xfff6ea, 1.9);
sun.position.set(9, 12, 4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 16, bottom: -8, near: 1, far: 40 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9db7c9, 0.5); fill.position.set(-9, 5, -5); scene.add(fill);
const kick = new THREE.DirectionalLight(0xffc89a, 0.35); kick.position.set(-3, 2, 9); scene.add(kick);

// ---------- Procedural textures (drawn on canvas, no downloads) ----------
const rnd = (a, b) => a + Math.random() * (b - a);
function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.anisotropy = maxAniso; t.encoding = THREE.sRGBEncoding; return t;
}
function noise(g, w, h, n, cols, size = [1, 2]) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; const s = rnd(size[0], size[1]); g.fillRect(Math.random() * w, Math.random() * h, s, s); } }
function grain(g, w, h, base, dark, light) { // wood: grain runs along u
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { const y = Math.random() * h; g.strokeStyle = Math.random() < .6 ? dark : light; g.globalAlpha = rnd(.15, .45); g.lineWidth = rnd(.6, 2.2);
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * rnd(1, 3)); g.stroke(); }
  g.globalAlpha = 1;
  for (let k = 0; k < 2; k++) { const x = rnd(.2, .8) * w, y = rnd(.2, .8) * h; const r = g.createRadialGradient(x, y, 1, x, y, rnd(6, 12)); r.addColorStop(0, dark); r.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = .6; g.fillStyle = r; g.fillRect(x - 14, y - 14, 28, 28); g.globalAlpha = 1; }
}
const T = {
  slate: tex(256, 256, (g, w, h) => { g.fillStyle = '#454f57'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(20,26,31,.25)' : 'rgba(120,135,145,.12)'; g.fillRect(0, Math.random() * h, w, rnd(1, 6)); }
    noise(g, w, h, 5000, ['#3a434a', '#525d65', '#2f373d', '#5d6870']);
    g.strokeStyle = 'rgba(15,20,24,.8)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
    g.fillStyle = '#1a1f22'; [[.25, .18], [.75, .18]].forEach(([x, y]) => { g.beginPath(); g.arc(x * w, y * h, 4, 0, 7); g.fill(); }); }),
  timber: tex(512, 64, (g, w, h) => grain(g, w, h, '#a87a4a', '#6e4a28', '#c99a66')),
  timberDark: tex(512, 64, (g, w, h) => grain(g, w, h, '#8a6238', '#55361b', '#a97c4c')),
  rafter: tex(512, 64, (g, w, h) => grain(g, w, h, '#9c7446', '#5f3f20', '#bf9260')),
  insul: tex(256, 256, (g, w, h) => { g.fillStyle = '#d8b04f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.strokeStyle = ['#f0cd72', '#b88f35', '#e6c062', '#c49a3e'][i % 4]; g.globalAlpha = rnd(.25, .6); g.lineWidth = rnd(.5, 1.6);
      const x = Math.random() * w, y = Math.random() * h, a = rnd(0, 6.3), l = rnd(6, 22); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rnd(-8, 8), y + rnd(-8, 8), x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    g.globalAlpha = 1; }, 2, 2),
  membrane: tex(512, 256, (g, w, h) => { g.fillStyle = '#4f7488'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, ['#4a6e82', '#55798d'], [1, 2]);
    g.fillStyle = 'rgba(230,240,245,.35)'; g.font = '600 22px IBM Plex Mono, monospace';
    for (let y = 40; y < h; y += 90) for (let x = (y / 90 % 2) * 120; x < w; x += 260) g.fillText('BREATHABLE · BS 5250', x, y);
    g.strokeStyle = 'rgba(230,240,245,.45)'; g.setLineDash([14, 10]); g.lineWidth = 3; g.beginPath(); g.moveTo(0, h - 12); g.lineTo(w, h - 12); g.stroke(); }, 4, 3),
  brick: tex(512, 512, (g, w, h) => { g.fillStyle = '#b9b0a3'; g.fillRect(0, 0, w, h);
    const bw = 64, bh = 21; for (let r = 0; r * bh < h; r++) { const off = (r % 2) * bw / 2;
      for (let x = -bw; x < w + bw; x += bw) { const t = rnd(0, 1); g.fillStyle = `rgb(${120 + t * 45 | 0},${62 + t * 22 | 0},${48 + t * 16 | 0})`; g.fillRect(x + off + 2, r * bh + 2, bw - 4, bh - 4);
        g.globalAlpha = .25; noise(g, 0, 0, 0, []); g.globalAlpha = 1; } }
    noise(g, w, h, 6000, ['rgba(0,0,0,.18)', 'rgba(255,255,255,.08)'], [1, 2]); }),
  ground: tex(512, 512, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); r.addColorStop(0, '#2b3a2c'); r.addColorStop(.7, '#1b241c'); r.addColorStop(1, '#0f1417'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, ['rgba(80,110,70,.25)', 'rgba(0,0,0,.25)'], [1, 2]); })
};
const brickL = T.brick.clone(); brickL.needsUpdate = true; brickL.repeat.set(6, 1.4);
const brickS = T.brick.clone(); brickS.needsUpdate = true; brickS.repeat.set(4.4, 1.4);
const brickG = T.brick.clone(); brickG.needsUpdate = true; brickG.repeat.set(0.75, 0.75);

const std = (o) => new THREE.MeshStandardMaterial(o);
const mats = {
  slate: std({ map: T.slate, bumpMap: T.slate, bumpScale: .015, roughness: .42, metalness: .08, color: 0xffffff }),
  ridge: std({ color: 0x30383e, roughness: .5, metalness: .05 }),
  mortar: std({ color: 0x9a958b, roughness: 1 }),
  batten: std({ map: T.timber, roughness: .75 }),
  counter: std({ map: T.timberDark, roughness: .75 }),
  membrane: std({ map: T.membrane, roughness: .65, side: THREE.DoubleSide }),
  insul: std({ map: T.insul, bumpMap: T.insul, bumpScale: .04, roughness: 1 }),
  rafter: std({ map: T.rafter, roughness: .8 }),
  fascia: std({ color: 0xe9e6df, roughness: .55 }),
  gutter: std({ color: 0x15191c, roughness: .35, metalness: .2, side: THREE.DoubleSide }),
  wallL: std({ map: brickL, bumpMap: brickL, bumpScale: .02, roughness: .95 }),
  wallS: std({ map: brickS, bumpMap: brickS, bumpScale: .02, roughness: .95 }),
  gable: std({ map: brickG, bumpMap: brickG, bumpScale: .02, roughness: .95 }),
  top: std({ color: 0x2a2420, roughness: 1 }),
  ground: std({ map: T.ground, roughness: 1 })
};
const layerMats = { slate: [mats.slate, mats.ridge, mats.mortar], batten: [mats.batten], counter: [mats.counter], membrane: [mats.membrane], insul: [mats.insul], rafter: [mats.rafter, mats.fascia, mats.gutter] };
const COPPER = new THREE.Color(0xfff1dd);

// ---------- Geometry ----------
const HALF = 3, PITCH = 35 * Math.PI / 180, RISE = HALF * Math.tan(PITCH), L = HALF / Math.cos(PITCH) + 0.35;
const LEN = 8, WALL = 0.6, RIDGE_Y = WALL + RISE, XS = -LEN / 2, XE = LEN / 2;
function shade(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }
function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
// A layer = one group holding both slopes. Slope coords: x along ridge, z down-slope, y outward.
function makeLayer(build) {
  const g = new THREE.Group();
  [0, Math.PI].forEach(ry => {
    const outer = new THREE.Group(); outer.position.y = RIDGE_Y; outer.rotation.y = ry;
    const side = new THREE.Group(); side.rotation.x = PITCH;
    build(side, outer); outer.add(side); g.add(outer);
  });
  scene.add(shade(g)); return g;
}
const SP = 0.6, rafterXs = []; for (let x = XS + 0.05; x <= XE; x += SP) rafterXs.push(x);
const groups = {};
const EY = -L * Math.sin(PITCH), EZ = L * Math.cos(PITCH);
groups.rafter = makeLayer((s, o) => {
  rafterXs.forEach(x => s.add(box(0.07, 0.22, L, mats.rafter, x, -0.11, L / 2)));
  o.add(box(LEN + 0.24, 0.26, 0.035, mats.fascia, 0, EY - 0.13, EZ + 0.02));
  const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, LEN + 0.24, 20, 1, true, Math.PI, Math.PI), mats.gutter);
  gut.rotation.z = Math.PI / 2; gut.position.set(0, EY - 0.18, EZ + 0.11); o.add(gut);
});
groups.insul = makeLayer(s => { for (let i = 0; i < rafterXs.length - 1; i++) { const a = rafterXs[i] + 0.035, b = rafterXs[i + 1] - 0.035;
  s.add(box(b - a, 0.18, L - 0.4, mats.insul, (a + b) / 2, -0.11, L / 2 - 0.1)); } });
groups.membrane = makeLayer(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 0.1, L, 1, 1), mats.membrane);
  m.rotation.x = -Math.PI / 2; m.position.set(0, 0.006, L / 2); s.add(m); });
groups.counter = makeLayer(s => { rafterXs.forEach(x => s.add(box(0.05, 0.04, L, mats.counter, x, 0.03, L / 2))); });
const GAUGE = 0.24;
groups.batten = makeLayer(s => { for (let z = 0.12; z < L; z += GAUGE) s.add(box(LEN + 0.1, 0.035, 0.06, mats.batten, 0, 0.07, z)); });
groups.slate = makeLayer(s => {
  const W = 0.3, geo = new THREE.BoxGeometry(W - 0.014, 0.014, 0.5);
  const rows = Math.floor((L - 0.1) / GAUGE), cols = Math.ceil(LEN / W) + 1;
  const inst = new THREE.InstancedMesh(geo, mats.slate, rows * cols);
  const d = new THREE.Object3D(), c = new THREE.Color(); let k = 0;
  for (let r = 0; r < rows; r++) { const off = (r % 2) * W / 2;
    for (let ci = 0; ci < cols; ci++) { const x = XS + off + ci * W; if (x > XE + 0.01) continue;
      d.position.set(x + rnd(-.004, .004), 0.1 + 0.004 * (r % 2) + rnd(0, .004), 0.25 + r * GAUGE);
      d.rotation.set(-0.03 + rnd(-.006, .006), rnd(-.012, .012), rnd(-.01, .01)); d.updateMatrix();
      inst.setMatrixAt(k, d.matrix); const t = rnd(.82, 1.1); c.setRGB(t, t * rnd(.98, 1.03), t * rnd(1, 1.06)); inst.setColorAt(k, c); k++; } }
  inst.count = k; s.add(inst);
});
const ridgeGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.44, 24, 1, false, 0, Math.PI);
groups.slate.add(shade(box(LEN + 0.1, 0.05, 0.22, mats.mortar, 0, RIDGE_Y + 0.11, 0)));
for (let x = XS; x < XE - 0.01; x += 0.44) { const r = new THREE.Mesh(ridgeGeo, mats.ridge); r.rotation.z = Math.PI / 2; r.position.set(x + 0.22, RIDGE_Y + 0.13, 0); groups.slate.add(shade(r)); }

// Static house: modern three-storey home with a framed, fully glazed gable
const house = new THREE.Group();
const GF = 1.45;                         // ground-floor height (dark brick)
const W2 = HALF - 0.15, BX0 = XS + 0.15, BX1 = XE - 0.15;
const T2 = {
  render: tex(256, 256, (g, w, h) => { g.fillStyle = '#e7e3dc'; g.fillRect(0, 0, w, h); noise(g, w, h, 7000, ['rgba(0,0,0,.04)', 'rgba(255,255,255,.06)', 'rgba(120,100,80,.04)'], [1, 3]); }, 3, 2),
  brickDark: tex(512, 512, (g, w, h) => { g.fillStyle = '#1e1c1b'; g.fillRect(0, 0, w, h); const bw = 64, bh = 21;
    for (let r = 0; r * bh < h; r++) { const off = (r % 2) * bw / 2; for (let x = -bw; x < w + bw; x += bw) { const t = rnd(0, 1); g.fillStyle = `rgb(${48 + t * 22 | 0},${40 + t * 16 | 0},${38 + t * 12 | 0})`; g.fillRect(x + off + 2, r * bh + 2, bw - 4, bh - 4); } }
    noise(g, w, h, 5000, ['rgba(0,0,0,.25)', 'rgba(255,255,255,.05)'], [1, 2]); }, 6, 2),
  interior: tex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6d6a2'); gr.addColorStop(.55, '#e8b878'); gr.addColorStop(1, '#9a6a3c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    [[.15, .3], [.62, .22], [.4, .68]].forEach(([x, y]) => { const r = g.createRadialGradient(x * w, y * h, 2, x * w, y * h, 90); r.addColorStop(0, 'rgba(255,244,220,.9)'); r.addColorStop(1, 'rgba(255,244,220,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    g.fillStyle = 'rgba(40,28,20,.55)'; g.fillRect(.22 * w, .42 * h, .12 * w, .1 * h); g.fillRect(.66 * w, .74 * h, .14 * w, .08 * h);
    g.fillStyle = 'rgba(60,42,30,.45)'; g.fillRect(.08 * w, .82 * h, .3 * w, .06 * h); g.fillRect(.5 * w, .36 * h, .03 * w, .2 * h);
    g.fillStyle = 'rgba(150,60,50,.6)'; g.fillRect(.72 * w, .4 * h, .08 * w, .12 * h); })
};
const renderM = std({ map: T2.render, bumpMap: T2.render, bumpScale: .01, roughness: .92 });
const dark = std({ map: T2.brickDark, bumpMap: T2.brickDark, bumpScale: .02, roughness: .9 });
const frameM = std({ color: 0x3b3f43, roughness: .6, metalness: .1 });
const soffit = std({ color: 0xd9cdb8, roughness: .8 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fb6c4, roughness: .05, metalness: 0, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false });
const mull = std({ color: 0x1d2124, roughness: .4, metalness: .4 });
function glowPlane(w, h, repX = 1, repY = 1) { const t = T2.interior.clone(); t.needsUpdate = true; t.repeat.set(repX, repY); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); }

// Ground floor (dark brick) and upper floors (white render)
const gfl = new THREE.Mesh(new THREE.BoxGeometry(BX1 - BX0, GF, 2 * W2), dark); gfl.position.set(0, GF / 2, 0); house.add(gfl);
const up = new THREE.Mesh(new THREE.BoxGeometry(BX1 - BX0, WALL - GF, 2 * W2), [renderM, renderM, soffit, renderM, renderM, renderM]); up.position.set(0, GF + (WALL - GF) / 2, 0); house.add(up);
// Rear gable in render
const tri = new THREE.Shape(); tri.moveTo(-W2, 0); tri.lineTo(W2, 0); tri.lineTo(0, RISE - 0.28); tri.lineTo(-W2, 0);
const rg = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false }), renderM); rg.rotation.y = Math.PI / 2; rg.position.set(BX0, WALL, 0); house.add(rg);

// Feature gable: charcoal picture frame wrapping the upper floors and roof profile
const tp = Math.tan(PITCH);
const outer = new THREE.Shape(), OZ = HALF + 0.12, OY0 = GF - 0.05;
outer.moveTo(-OZ, OY0); outer.lineTo(OZ, OY0); outer.lineTo(OZ, RIDGE_Y + 0.38 - OZ * tp); outer.lineTo(0, RIDGE_Y + 0.38); outer.lineTo(-OZ, RIDGE_Y + 0.38 - OZ * tp); outer.lineTo(-OZ, OY0);
const IZ = HALF - 0.2, IY0 = GF + 0.22, IT = RIDGE_Y - 0.12;
const hole = new THREE.Path(); hole.moveTo(-IZ, IY0); hole.lineTo(-IZ, IT - IZ * tp); hole.lineTo(0, IT); hole.lineTo(IZ, IT - IZ * tp); hole.lineTo(IZ, IY0); hole.lineTo(-IZ, IY0);
outer.holes.push(hole);
const FD = 0.85, FX = XE - 0.2;
const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: FD, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2 }), frameM);
frame.rotation.y = Math.PI / 2; frame.position.set(FX, 0, 0); house.add(frame);
// Recessed glazing inside the frame
const holeShape = new THREE.Shape(hole.getPoints());
const gt = T2.interior.clone(); gt.needsUpdate = true; gt.repeat.set(1 / (2 * IZ), 1 / (IT - IY0)); gt.offset.set(.5, -IY0 / (IT - IY0));
const gl = new THREE.Mesh(new THREE.ShapeGeometry(holeShape), new THREE.MeshBasicMaterial({ map: gt }));
gl.rotation.y = Math.PI / 2; gl.position.set(FX + 0.12, 0, 0); house.add(gl);
const gl2 = new THREE.Mesh(new THREE.ShapeGeometry(holeShape), glass); gl2.rotation.y = Math.PI / 2; gl2.position.set(FX + 0.16, 0, 0); house.add(gl2);
// Mullions and transoms
const topAt = z => IT - Math.abs(z) * tp;
[-IZ * 0.5, 0, IZ * 0.5].forEach(z => { const hgt = topAt(z) - IY0; house.add(box(0.05, hgt, 0.05, mull, FX + 0.17, IY0 + hgt / 2, -z)); });
const FLOOR2 = GF + 1.45;
house.add(box(0.05, 0.05, 2 * IZ, mull, FX + 0.17, WALL - 0.05, 0));
{ const y = WALL + 0.75, hw = Math.min(IZ, (IT - y) / tp); house.add(box(0.05, 0.05, 2 * hw, mull, FX + 0.17, y, 0)); }
// Balcony slabs + glass balustrades on each framed floor
[IY0, FLOOR2].forEach(y => {
  house.add(box(0.55, 0.12, 2 * IZ, soffit, FX + 0.43, y - 0.04, 0));
  const b = new THREE.Mesh(new THREE.PlaneGeometry(2 * IZ - 0.1, 0.8), glass); b.rotation.y = Math.PI / 2; b.position.set(FX + 0.68, y + 0.42, 0); house.add(b);
  house.add(box(0.03, 0.03, 2 * IZ - 0.1, mull, FX + 0.68, y + 0.83, 0));
});
// Ground floor glazing on the gable end
const gfg = glowPlane(3.0, 1.05, .6, .35); gfg.rotation.y = Math.PI / 2; gfg.position.set(BX1 + 0.012, 0.6, -0.4); house.add(gfg);
[-1.9, -0.4, 1.1].forEach(z => house.add(box(0.04, 1.05, 0.04, mull, BX1 + 0.03, 0.6, z)));
house.add(box(0.04, 0.04, 3.04, mull, BX1 + 0.03, 1.13, -0.4));
// Side windows on the long elevation
function sideWin(x, y, w, h) {
  const f = box(w + 0.1, h + 0.1, 0.08, mull, x, y, W2 + 0.02); house.add(f);
  const p = glowPlane(w, h, .4, .4); p.position.set(x, y, W2 + 0.065); house.add(p);
  house.add(box(w + 0.2, 0.05, 0.12, frameM, x, y - h / 2 - 0.07, W2 + 0.05));
}
[-2.6, -0.9].forEach(x => { sideWin(x, GF + 0.75, 0.75, 0.95); sideWin(x, FLOOR2 + 0.7, 0.75, 0.95); });
sideWin(1.2, 0.7, 1.4, 0.9);
// Warm light spilling from the glazing
[[XE + 0.6, FLOOR2 + 0.6, 0], [XE + 0.6, GF + 0.6, 0], [XE + 0.4, 0.7, -0.4]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xffb36b, 1.3, 5.5, 2); l.position.set(x, y, z); });
const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.ShadowMaterial({ opacity: .22 })); ground.rotation.x = -Math.PI / 2; ground.position.y = 0; ground.receiveShadow = true; scene.add(ground);
shade(house);
house.traverse(m => { if (m.isMesh && (m.material === glass || m.material.isMeshBasicMaterial)) m.castShadow = false; });

// ---------- Scroll ----------
const stackIndex = { rafter: 0, insul: 1, membrane: 2, counter: 3, batten: 4, slate: 5 };
const GAP = 1.05;
const sec = document.getElementById('roofbuild'), bar = document.getElementById('roofbuild-bar'), hint = document.getElementById('roofbuild-hint');
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function size() { const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); render(); }
function render() {
  const r = sec.getBoundingClientRect();
  // This scroll listener is global (see below) rather than scoped to the
  // section's own visibility, so without this guard every scroll anywhere
  // on the page — reviews, FAQ, the footer — would still redraw the full
  // WebGL scene every frame for no visible benefit.
  if (r.bottom < -600 || r.top > innerHeight + 600) return;
  const total = sec.offsetHeight - innerHeight;
  const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
  const ex = ease(Math.min(1, p / 0.3));
  const active = p < 0.3 ? -1 : Math.min(N - 1, Math.floor((p - 0.3) / 0.7 * N));
  LAYERS.forEach((Ly, i) => {
    groups[Ly.key].position.y = stackIndex[Ly.key] * GAP * ex;
    const on = i === active;
    layerMats[Ly.key].forEach(m => { m.emissive.copy(COPPER); m.emissiveIntensity = on ? 0.16 : 0; });
    lis[i].classList.toggle('on', active < 0 ? i === 0 : on);
  });
  const narrow = camera.aspect < 0.9;
  const ang = 0.7 + p * 0.55, dist = (narrow ? 25 : 18) + ex * 5, ty = 1.5 + ex * 2.6;
  camera.position.set(Math.sin(ang) * dist, ty + 4.6 + ex * 1.6, Math.cos(ang) * dist);
  camera.lookAt(0, ty, 0);
  renderer.render(scene, camera);
  bar.style.width = (p * 100) + '%';
  hint.textContent = p < 0.03 ? 'Scroll to take the roof apart' : (p < 0.3 ? 'Lifting the layers…' : 'Layer ' + (active + 1) + ' of ' + N);
}
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); } }, { passive: true });
addEventListener('resize', size);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { T.membrane.needsUpdate = true; render(); });
size();
}
