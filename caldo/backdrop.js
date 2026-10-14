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
// How fast each frame's opacity/scale catches up to its scroll-derived
// target. High enough that a photo the user has long since scrolled past
// (its target opacity 0 for a while) finishes disappearing within a few
// hundred ms of the scroll stopping, rather than visibly lingering as a
// faint ghost — but still soft enough to keep the crossfade's inertia
// over the short window where two adjacent photos are actually dissolving
// into each other.
const SMOOTH = 0.16;

export function createBackdrop() {
  const stack = document.getElementById('photos');
  const scrim = document.getElementById('scrim');
  const images = {};
  const state = {};
  stack.querySelectorAll('img').forEach((img) => {
    const key = img.dataset.photo;
    images[key] = img;
    state[key] = { opacity: 0, scale: 1, tOpacity: 0, tScale: 1, wroteRest: false };
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

  // An exponential-decay lerp never mathematically reaches its target —
  // it just gets arbitrarily close. That's invisible after a short,
  // adjacent-section crossfade, but after a big jump (scrolling fast
  // across several sections at once) a photo whose target has been 0 for
  // a while can still be sitting at a faint, very-much-visible opacity —
  // a ghost of a section the user already scrolled past. Snapping to the
  // exact target once within a hair of it guarantees it actually reaches
  // precisely 0 (or 1) instead of approaching it forever.
  const EPSILON = 0.0015;

  function tick() {
    for (const key in state) {
      const s = state[key];
      // Most photos sit at rest (fully hidden, or the one fully shown)
      // on most frames — only the 1-2 actually mid-crossfade ever need
      // work. Once a photo has reached its target and that resting state
      // has been written once, skip it entirely on later idle frames
      // instead of rewriting the same opacity/transform ~60 times a
      // second forever: with up to a dozen photos in the stack, that
      // was extra main-thread work on every single frame, competing with
      // scroll handling right when a fast fling needs the headroom most.
      const atRest = s.opacity === s.tOpacity && s.scale === s.tScale;
      if (atRest && s.wroteRest) continue;

      s.opacity += (s.tOpacity - s.opacity) * SMOOTH;
      s.scale += (s.tScale - s.scale) * SMOOTH;
      if (Math.abs(s.tOpacity - s.opacity) < EPSILON) s.opacity = s.tOpacity;
      if (Math.abs(s.tScale - s.scale) < EPSILON) s.scale = s.tScale;

      const img = images[key];
      img.style.opacity = String(s.opacity);
      const settled = s.opacity > 0.995 && Math.abs(s.scale - 1) < 0.001;
      img.style.animationPlayState = settled ? '' : 'paused';
      img.style.transform = settled ? '' : `scale(${s.scale})`;

      s.wroteRest = s.opacity === s.tOpacity && s.scale === s.tScale;
    }
  }

  function setOpacity(v) {
    stack.style.opacity = String(v);
    scrim.style.opacity = String(v);
  }

  return { setSection, tick, setOpacity };
}
