import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ACCENT = 0xc4551f;
const STEEL = 0xd7d8dc;
const STEEL_DARK = 0xb9bac0;
const SEAL = 0x26262a;

// Local-space height map for the flask silhouette, split into four parts.
// Each part owns a height range; the lathe profile within that range is
// built relative to the part's own origin so the part can be translated
// independently for the exploded view.
const PART_DEFS = [
  {
    key: 'base', color: STEEL_DARK, metalness: 0.82, roughness: 0.32,
    explode: [0, -0.5, 0],
    points: [[0.0, 0.0], [0.30, 0.0], [0.40, 0.02], [0.40, 0.095], [0.37, 0.12]],
  },
  {
    key: 'body', color: STEEL, metalness: 0.88, roughness: 0.22,
    explode: [0, -0.12, 0],
    points: [[0.37, 0.0], [0.40, 0.08], [0.40, 1.02], [0.375, 1.28], [0.33, 1.43]],
  },
  {
    key: 'stopper', color: SEAL, metalness: 0.08, roughness: 0.62,
    explode: [0, 0.3, 0],
    points: [[0.33, 0.0], [0.26, 0.035], [0.25, 0.14], [0.27, 0.17]],
  },
  {
    key: 'cap', color: ACCENT, metalness: 0.55, roughness: 0.35,
    explode: [0, 0.58, 0],
    points: [[0.27, 0.0], [0.295, 0.02], [0.295, 0.19], [0.14, 0.255], [0.06, 0.27], [0.0, 0.275]],
  },
];

// Cumulative base-Y for each part so the lathe profiles line up into one
// continuous silhouette when gap === 0.
let cursor = 0;
for (const def of PART_DEFS) {
  def.baseY = cursor;
  const span = def.points[def.points.length - 1][1];
  cursor += span;
}
const TOTAL_H = cursor;

function buildLathe(points, segments = 56) {
  const pts = points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

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
  renderer.setClearColor(0xfbfbfd, 1);

  const scene = new THREE.Scene();
  // UnrealBloomPass's composite writes alpha=1 unconditionally, so the
  // canvas can never be transparent through post-processing — paint the
  // scene background directly instead of relying on CSS layering.
  scene.background = new THREE.Color(0xfbfbfd);
  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 50);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe7e2d6, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.PointLight(ACCENT, 6, 10, 2);
  rim.position.set(-2, 1.4, -1.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-2, 1, 2);
  scene.add(fill);

  const rig = new THREE.Group();
  rig.position.y = -TOTAL_H * 0.5;
  scene.add(rig);

  const shadowTex = makeShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  rig.add(shadowMesh);

  const parts = {};
  for (const def of PART_DEFS) {
    const geo = buildLathe(def.points);
    const mat = new THREE.MeshStandardMaterial({
      color: def.color, metalness: def.metalness, roughness: def.roughness,
      envMapIntensity: 1.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.position.y = def.baseY;
    group.add(mesh);
    rig.add(group);
    parts[def.key] = { group, restY: def.baseY, explode: def.explode, worldAnchorLocalY: def.baseY + def.points[def.points.length - 1][1] * 0.5 };
  }

  // A thin emissive accent ring at the collar, picked up nicely by bloom.
  const ringGeo = new THREE.TorusGeometry(0.265, 0.01, 12, 64);
  const ringMat = new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 1.6, metalness: 0.4, roughness: 0.3 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  parts.stopper.group.add(ring);
  ring.position.y = 0.16;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.38, 0.4, 0.84);
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

  const camCur = new THREE.Vector3(0, 0.95, 3.5);
  const tgtCur = new THREE.Vector3(0, 0.78, 0);
  const camTarget = new THREE.Vector3();
  const tgtTarget = new THREE.Vector3();
  let fovCur = 32, fovTarget = 32;
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
