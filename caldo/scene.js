import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ACCENT = 0xc0742f;
const ACCENT_BRIGHT = 0xe08a3e;
const DECK = 0x3a3d42;
const MEMBRANE = 0x17181b;
const PANEL = 0xb5641f;

// The roof system as four stacked layers, bottom (deck) to top (ridge cap).
// Each layer is built from simple box geometry local to its own origin so
// it can be translated independently for the exploded view — the same
// pattern a lathe-based model would use, just with slabs instead of a
// radial profile.
const PART_DEFS = [
  {
    key: 'deck', color: DECK, metalness: 0.75, roughness: 0.4,
    explode: [0, -0.5, 0],
    size: [1.15, 0.14, 0.8],
  },
  {
    key: 'membrane', color: MEMBRANE, metalness: 0.05, roughness: 0.8,
    explode: [0, -0.14, 0],
    size: [1.08, 0.05, 0.74],
  },
  {
    key: 'panel', color: PANEL, metalness: 0.88, roughness: 0.24,
    explode: [0, 0.3, 0],
    size: [1.0, 0.16, 0.68],
    ribs: 5,
  },
  {
    key: 'ridge', color: ACCENT_BRIGHT, metalness: 0.55, roughness: 0.34,
    explode: [0, 0.58, 0],
    size: [1.0, 0.07, 0.16],
  },
];

// Cumulative base-Y for each layer so the stack lines up continuously when
// gap === 0.
let cursor = 0;
for (const def of PART_DEFS) {
  def.baseY = cursor;
  cursor += def.size[1];
}
const TOTAL_H = cursor;

function makeShadowTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.38)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0xf7f6f3, 1);

  const scene = new THREE.Scene();
  // UnrealBloomPass's composite writes alpha=1 unconditionally, so the
  // canvas can never be transparent through post-processing — paint the
  // scene background directly instead of relying on CSS layering.
  scene.background = new THREE.Color(0xf7f6f3);
  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 50);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const hemi = new THREE.HemisphereLight(0xfff6ec, 0x3a3228, 0.32);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1dd, 1.9);
  key.position.set(3.4, 1.7, 1.9);
  scene.add(key);
  const rim = new THREE.PointLight(ACCENT, 4.5, 10, 2);
  rim.position.set(-1.6, 0.9, -1.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdbe6ff, 0.3);
  fill.position.set(-1.8, 0.6, 1.4);
  scene.add(fill);

  const rig = new THREE.Group();
  rig.position.y = -TOTAL_H * 0.5;
  scene.add(rig);

  const shadowTex = makeShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  rig.add(shadowMesh);

  const parts = {};
  for (const def of PART_DEFS) {
    const [w, h, d] = def.size;
    const geo = new THREE.BoxGeometry(w, h, d);
    const isMetalLayer = def.key === 'panel' || def.key === 'ridge';
    const mat = new THREE.MeshStandardMaterial({
      color: def.color, metalness: def.metalness, roughness: def.roughness,
      envMapIntensity: isMetalLayer ? 0.8 : 1.1,
      emissive: def.key === 'ridge' ? ACCENT : 0x000000,
      emissiveIntensity: def.key === 'ridge' ? 0.15 : 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.position.y = def.baseY + h * 0.5;
    group.add(mesh);

    // Standing-seam ribs across the panel's top face — thin raised strips
    // that catch the key light and read as seamed metal rather than a slab.
    if (def.ribs) {
      const ribMat = new THREE.MeshStandardMaterial({
        color: def.color, metalness: def.metalness, roughness: Math.max(def.roughness - 0.08, 0.05),
        envMapIntensity: 0.6,
      });
      const ribGeo = new THREE.BoxGeometry(0.03, 0.03, d + 0.02);
      for (let i = 0; i < def.ribs; i++) {
        const ribX = (i / (def.ribs - 1) - 0.5) * (w - 0.08);
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.set(ribX, h * 0.5 + 0.015, 0);
        group.add(rib);
      }
    }

    rig.add(group);
    parts[def.key] = { group, restY: group.position.y, explode: def.explode };
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.4, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bloom.setSize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  const camCur = new THREE.Vector3(0, 0.55, 3.6);
  const tgtCur = new THREE.Vector3(0, 0.08, 0);
  const camTarget = new THREE.Vector3();
  const tgtTarget = new THREE.Vector3();
  let fovCur = 30, fovTarget = 30;
  let gapCur = 0, gapTarget = 0;

  function setKeyframe(a, b, t) {
    camTarget.set(
      a.cam[0] + (b.cam[0] - a.cam[0]) * t,
      a.cam[1] + (b.cam[1] - a.cam[1]) * t,
      a.cam[2] + (b.cam[2] - a.cam[2]) * t,
    );
    tgtTarget.set(
      a.tgt[0] + (b.tgt[0] - a.tgt[0]) * t,
      a.tgt[1] + (b.tgt[1] - a.tgt[1]) * t,
      a.tgt[2] + (b.tgt[2] - a.tgt[2]) * t,
    );
    fovTarget = a.fov + (b.fov - a.fov) * t;
    gapTarget = a.gap + (b.gap - a.gap) * t;
  }

  let appOpacity = 1;
  function setAppOpacity(v) { appOpacity = v; }

  function tick() {
    const smooth = 0.085;
    camCur.lerp(camTarget, smooth);
    tgtCur.lerp(tgtTarget, smooth);
    fovCur += (fovTarget - fovCur) * smooth;
    gapCur += (gapTarget - gapCur) * smooth;

    camera.position.copy(camCur);
    camera.fov = fovCur;
    camera.updateProjectionMatrix();
    camera.lookAt(tgtCur);

    for (const key in parts) {
      const p = parts[key];
      p.group.position.set(
        p.explode[0] * gapCur,
        p.restY + p.explode[1] * gapCur,
        p.explode[2] * gapCur,
      );
    }

    rig.visible = appOpacity > 0.01;
    renderer.domElement.style.opacity = String(appOpacity);
    composer.render();
  }

  const vp = new THREE.Vector3();
  function labelScreenPos(key) {
    const p = parts[key];
    vp.set(0, p.group.position.y, 0);
    vp.add(rig.position);
    vp.project(camera);
    return { x: (vp.x * 0.5 + 0.5) * window.innerWidth, y: (-vp.y * 0.5 + 0.5) * window.innerHeight, visible: vp.z < 1 };
  }

  return { setKeyframe, tick, setAppOpacity, labelScreenPos, renderer, camera };
}
