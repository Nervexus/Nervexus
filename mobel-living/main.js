import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

/* =======================================================================
   1. WebGL background scene (#gl)
   A small abstract composition of extruded forms that drift slowly and
   respond to scroll depth through the intro — standing in for "shaping
   the space" without needing real product models.
======================================================================= */
const canvas = document.querySelector("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0c0c0b, 0.045);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 9);

const ambient = new THREE.AmbientLight(0xd8c9a8, 0.55);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffe8c2, 1.1);
key.position.set(4, 5, 6);
scene.add(key);

const rim = new THREE.DirectionalLight(0xb9a27d, 0.6);
rim.position.set(-5, -2, -4);
scene.add(rim);

const forms = new THREE.Group();
scene.add(forms);

const materials = [
  new THREE.MeshStandardMaterial({ color: 0xb08a5c, roughness: 0.55, metalness: 0.1 }),
  new THREE.MeshStandardMaterial({ color: 0x8a7a5c, roughness: 0.75, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0xcfc4b3, roughness: 0.4, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0x4a3f2c, roughness: 0.6, metalness: 0.15 }),
];

const geometries = [
  new THREE.BoxGeometry(1.6, 1.6, 1.6),
  new THREE.CylinderGeometry(0.9, 0.9, 1.8, 48),
  new THREE.TorusGeometry(1, 0.32, 32, 96),
  new THREE.IcosahedronGeometry(1.1, 0),
  new THREE.ConeGeometry(0.9, 1.6, 48),
];

const meshes = [];
const count = 7;
for (let i = 0; i < count; i++) {
  const geo = geometries[i % geometries.length];
  const mat = materials[i % materials.length];
  const mesh = new THREE.Mesh(geo, mat);
  const angle = (i / count) * Math.PI * 2;
  const radius = 3.4 + (i % 3) * 0.8;
  mesh.position.set(
    Math.cos(angle) * radius,
    Math.sin(i * 1.7) * 1.6,
    Math.sin(angle) * radius - 2
  );
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.userData.spin = (Math.random() - 0.5) * 0.15;
  mesh.userData.baseY = mesh.position.y;
  mesh.userData.floatOffset = Math.random() * Math.PI * 2;
  forms.add(mesh);
  meshes.push(mesh);
}

function resizeRenderer() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resizeRenderer);

let introProgress = 0; // 0..1, updated by ScrollTrigger below

let clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();

  forms.rotation.y = introProgress * Math.PI * 0.6 + t * 0.02;
  camera.position.z = 9 - introProgress * 3.2;
  camera.position.y = 0.4 + introProgress * 0.6;
  camera.lookAt(0, 0, -2);

  meshes.forEach((m) => {
    m.rotation.x += m.userData.spin * 0.01;
    m.rotation.y += m.userData.spin * 0.015;
    m.position.y = m.userData.baseY + Math.sin(t * 0.4 + m.userData.floatOffset) * 0.25;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

/* =======================================================================
   2. Loader sequence
======================================================================= */
const loaderFill = document.querySelector("#loaderFill");
const body = document.body;

function runLoader() {
  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => {
      body.classList.remove("loading");
      revealHero();
    },
  });

  tl.to(loaderFill, { width: "100%", duration: 1.3, ease: "power2.inOut" }, 0)
    .to(
      "#loader .mask .line",
      { yPercent: 0, duration: 0.9, stagger: 0.08 },
      0.1
    )
    .to("#loader", { opacity: 0, duration: 0.6 }, "+=0.35");
}

// Every masked line on the page starts hidden just below its mask. Set
// once, up front, so GSAP owns the transform from the start -- nothing
// else ever writes a transform onto a .line outside of a GSAP tween.
gsap.set(".mask .line", { yPercent: 100 });

window.addEventListener("load", () => {
  // Small minimum-duration floor so the loader reads intentionally
  // rather than flickering on a fast connection.
  gsap.delayedCall(0.4, runLoader);
});

/* =======================================================================
   3. Hero masked-text reveal (plays once, right after the loader)
======================================================================= */
function revealHero() {
  gsap.to(".intro-pin .hero-inner .mask .line", {
    yPercent: 0,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.09,
  });
}

/* =======================================================================
   4. Generic masked-heading reveal on scroll, for every other .mask
      outside the hero.
======================================================================= */
gsap.utils.toArray(".mask").forEach((mask) => {
  if (mask.closest(".intro-pin") || mask.closest("#loader")) return;
  const line = mask.querySelector(".line");
  if (!line) return;
  gsap.to(
    line,
    {
      yPercent: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: mask,
        start: "top 85%",
      },
    }
  );
});

/* =======================================================================
   5. Intro scroll-scrub: index bar, chapter number, captions, canvas
======================================================================= */
const indexFill = document.querySelector("#indexFill");
const indexCurrent = document.querySelector("#indexCurrent");
const caps = gsap.utils.toArray(".cap");
const CHAPTER_COUNT = 5;

ScrollTrigger.create({
  trigger: "#intro",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    introProgress = p;
    indexFill.style.width = `${p * 100}%`;
    const chapter = Math.min(CHAPTER_COUNT, Math.floor(p * CHAPTER_COUNT) + 1);
    indexCurrent.textContent = String(chapter).padStart(2, "0");

    caps.forEach((cap) => {
      const a = parseFloat(cap.dataset.a);
      const b = parseFloat(cap.dataset.b);
      const fadeRange = (b - a) * 0.25;
      let opacity = 0;
      if (p >= a && p <= b) {
        if (p < a + fadeRange) opacity = (p - a) / fadeRange;
        else if (p > b - fadeRange) opacity = (b - p) / fadeRange;
        else opacity = 1;
      }
      cap.style.opacity = Math.max(0, Math.min(1, opacity));
      cap.style.transform = `translate(-50%, ${24 - opacity * 24}px)`;
    });
  },
});

/* =======================================================================
   6. Featured sticky product — image + chapter swap, progress fill
======================================================================= */
const featImages = gsap.utils.toArray(".feat-image");
const featChapters = gsap.utils.toArray(".feat-chapter");
const featFill = document.querySelector("#featFill");

ScrollTrigger.create({
  trigger: "#featured",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    featFill.style.width = `${p * 100}%`;
    const idx = Math.min(featImages.length - 1, Math.floor(p * featImages.length));

    featImages.forEach((img, i) => img.classList.toggle("is-active", i === idx));
    featChapters.forEach((chap, i) => chap.classList.toggle("is-active", i === idx));
  },
});

/* =======================================================================
   7. Materials — pinned horizontal scroll
======================================================================= */
const matTrack = document.querySelector("#matTrack");

function matTrackDistance() {
  return matTrack.scrollWidth - window.innerWidth;
}

ScrollTrigger.create({
  trigger: "#materials .mat-viewport",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const distance = matTrackDistance();
    matTrack.style.transform = `translateX(-${distance * self.progress}px)`;
  },
});

window.addEventListener("resize", () => ScrollTrigger.refresh());
