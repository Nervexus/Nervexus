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
// stops.
//
// The crossfade itself is a plain dissolve: no rotation, no sideways or
// vertical drift (nothing that reads as a card swiping or flipping past
// another). The outgoing photo just fades out while drifting very
// slightly closer (a gentle push-in), and the incoming photo fades in
// while settling down from that same slight zoom — a soft depth cue
// without any directional motion.

const DISSOLVE_SCALE = 0.045;
const SMOOTH = 0.09;

export function createBackdrop() {
  const stack = document.getElementById('photos');
  const scrim = document.getElementById('scrim');
  const images = {};
  const state = {};
  stack.querySelectorAll('img').forEach((img) => {
    const key = img.dataset.photo;
    images[key] = img;
    state[key] = { opacity: 0, scale: 1, tOpacity: 0, tScale: 1 };
  });

  function setSection(keyA, keyB, t) {
    for (const key in state) {
      const s = state[key];
      if (keyA === keyB) {
        s.tOpacity = key === keyA ? 1 : 0;
        s.tScale = 1;
      } else if (key === keyA) {
        s.tOpacity = 1 - t;
        s.tScale = 1 + t * DISSOLVE_SCALE;
      } else if (key === keyB) {
        const u = 1 - t;
        s.tOpacity = t;
        s.tScale = 1 + u * DISSOLVE_SCALE;
      } else {
        s.tOpacity = 0;
        s.tScale = 1;
      }
    }
  }

  function tick() {
    for (const key in state) {
      const s = state[key];
      s.opacity += (s.tOpacity - s.opacity) * SMOOTH;
      s.scale += (s.tScale - s.scale) * SMOOTH;

      const img = images[key];
      img.style.opacity = String(s.opacity);
      const settled = s.opacity > 0.995 && Math.abs(s.scale - 1) < 0.001;
      img.style.animationPlayState = settled ? '' : 'paused';
      img.style.transform = settled ? '' : `scale(${s.scale})`;
    }
  }

  function setOpacity(v) {
    stack.style.opacity = String(v);
    scrim.style.opacity = String(v);
  }

  return { setSection, tick, setOpacity };
}
