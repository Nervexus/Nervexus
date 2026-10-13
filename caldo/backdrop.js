// Fixed photo backdrop, crossfading between real photography as the user
// scrolls between sections — the photographic replacement for the old
// Three.js camera rig. Consecutive sections that share a photo just stay
// at full opacity; only an actual change of photo crossfades.
//
// Like the original CALDO scene, motion here is driven by continuous
// per-frame easing toward scroll-derived targets (a tick() called every
// requestAnimationFrame), not by snapping straight to the scroll position
// or leaning on a CSS transition. That's what gives it inertia — motion
// keeps settling smoothly for a few frames even after the scroll event
// stops — instead of reading as two flat cards swiping past each other.
//
// The crossfade itself is a "downward spiral": the outgoing photo spins
// clockwise, shrinks and drops away while the incoming photo spins in
// from a counter-offset above and settles into place — both turning and
// falling the same direction, purely vertical (no sideways drift, which
// read as a left/right swipe rather than a spiral).

const SPIRAL_DEG = 26;
const SPIRAL_SCALE = 0.28;
const SPIRAL_DROP = 100;
const SMOOTH = 0.09;

export function createBackdrop() {
  const stack = document.getElementById('photos');
  const scrim = document.getElementById('scrim');
  const images = {};
  const state = {};
  stack.querySelectorAll('img').forEach((img) => {
    const key = img.dataset.photo;
    images[key] = img;
    state[key] = {
      opacity: 0, rot: 0, scale: 1, y: 0,
      tOpacity: 0, tRot: 0, tScale: 1, tY: 0,
    };
  });

  function setSection(keyA, keyB, t) {
    for (const key in state) {
      const s = state[key];
      if (keyA === keyB) {
        s.tOpacity = key === keyA ? 1 : 0;
        s.tRot = 0; s.tScale = 1; s.tY = 0;
      } else if (key === keyA) {
        s.tOpacity = 1 - t;
        s.tRot = t * SPIRAL_DEG;
        s.tScale = 1 - t * SPIRAL_SCALE;
        s.tY = t * SPIRAL_DROP;
      } else if (key === keyB) {
        const u = 1 - t;
        s.tOpacity = t;
        s.tRot = -u * SPIRAL_DEG;
        s.tScale = 1 - u * SPIRAL_SCALE;
        s.tY = -u * SPIRAL_DROP;
      } else {
        s.tOpacity = 0;
        s.tRot = 0; s.tScale = 1; s.tY = 0;
      }
    }
  }

  function tick() {
    for (const key in state) {
      const s = state[key];
      s.opacity += (s.tOpacity - s.opacity) * SMOOTH;
      s.rot += (s.tRot - s.rot) * SMOOTH;
      s.scale += (s.tScale - s.scale) * SMOOTH;
      s.y += (s.tY - s.y) * SMOOTH;

      const img = images[key];
      img.style.opacity = String(s.opacity);
      const settled = s.opacity > 0.995 && Math.abs(s.rot) < 0.05 && Math.abs(s.scale - 1) < 0.001;
      img.style.animationPlayState = settled ? '' : 'paused';
      img.style.transform = settled ? '' : `translateY(${s.y}px) rotate(${s.rot}deg) scale(${s.scale})`;
    }
  }

  function setOpacity(v) {
    stack.style.opacity = String(v);
    scrim.style.opacity = String(v);
  }

  return { setSection, tick, setOpacity };
}
