// Fixed photo backdrop, crossfading between real photography as the user
// scrolls between sections — the photographic replacement for the old
// Three.js camera rig. Consecutive sections that share a photo just stay
// at full opacity; only an actual change of photo crossfades.
//
// The crossfade itself is a "downward spiral": the outgoing photo rotates
// clockwise, shrinks and drops away while the incoming photo rotates in
// from a counter-clockwise offset above and settles into place — both
// turning and falling the same direction, like looking down a vortex.

const SPIRAL_DEG = 10;
const SPIRAL_SCALE = 0.08;
const SPIRAL_DROP = 48;

export function createBackdrop() {
  const stack = document.getElementById('photos');
  const scrim = document.getElementById('scrim');
  const images = {};
  stack.querySelectorAll('img').forEach((img) => {
    images[img.dataset.photo] = img;
  });

  function settle(img) {
    img.style.transform = '';
    img.style.animationPlayState = '';
  }

  function setSection(keyA, keyB, t) {
    if (keyA === keyB) {
      for (const key in images) {
        const img = images[key];
        img.style.opacity = key === keyA ? '1' : '0';
        settle(img);
      }
      return;
    }
    for (const key in images) {
      const img = images[key];
      if (key === keyA) {
        img.style.opacity = String(1 - t);
        img.style.animationPlayState = 'paused';
        img.style.transform = `rotate(${t * SPIRAL_DEG}deg) scale(${1 - t * SPIRAL_SCALE}) translateY(${t * SPIRAL_DROP}px)`;
      } else if (key === keyB) {
        img.style.opacity = String(t);
        img.style.animationPlayState = 'paused';
        const u = 1 - t;
        img.style.transform = `rotate(${-u * SPIRAL_DEG}deg) scale(${1 - u * SPIRAL_SCALE}) translateY(${-u * SPIRAL_DROP}px)`;
      } else {
        img.style.opacity = '0';
        settle(img);
      }
    }
  }

  function setOpacity(v) {
    stack.style.opacity = String(v);
    scrim.style.opacity = String(v);
  }

  return { setSection, setOpacity };
}
