// Fixed photo backdrop, crossfading between real photography as the user
// scrolls between sections — the photographic replacement for the old
// Three.js camera rig. Consecutive sections that share a photo just stay
// at full opacity; only an actual change of photo crossfades.
//
// The crossfade itself is a "downward spiral": the outgoing photo spins
// clockwise, drifts sideways, shrinks hard and drops away while the
// incoming photo spins in from a counter-offset above and settles into
// place — both turning and falling the same direction, with a touch of
// motion blur at the peak, so it reads as a vortex rather than a flat
// card-swipe slide.

const SPIRAL_DEG = 34;
const SPIRAL_SCALE = 0.34;
const SPIRAL_DROP = 130;
const SPIRAL_DRIFT = 46;
const SPIRAL_BLUR = 5;

// Smoothstep — slow in, fast through the middle, slow out — so the spin
// itself feels like motion rather than a linear slide.
function ease(t) {
  return t * t * (3 - 2 * t);
}

export function createBackdrop() {
  const stack = document.getElementById('photos');
  const scrim = document.getElementById('scrim');
  const images = {};
  stack.querySelectorAll('img').forEach((img) => {
    images[img.dataset.photo] = img;
  });

  function settle(img) {
    img.style.transform = '';
    img.style.filter = '';
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
    const e = ease(t);
    const blur = Math.sin(e * Math.PI) * SPIRAL_BLUR;
    const blurCss = blur > 0.05 ? `blur(${blur}px)` : '';
    for (const key in images) {
      const img = images[key];
      if (key === keyA) {
        img.style.opacity = String(1 - e);
        img.style.animationPlayState = 'paused';
        img.style.filter = blurCss;
        img.style.transform = `translate(${e * SPIRAL_DRIFT}px, ${e * SPIRAL_DROP}px) rotate(${e * SPIRAL_DEG}deg) scale(${1 - e * SPIRAL_SCALE})`;
      } else if (key === keyB) {
        const u = 1 - e;
        img.style.opacity = String(e);
        img.style.animationPlayState = 'paused';
        img.style.filter = blurCss;
        img.style.transform = `translate(${-u * SPIRAL_DRIFT}px, ${-u * SPIRAL_DROP}px) rotate(${-u * SPIRAL_DEG}deg) scale(${1 - u * SPIRAL_SCALE})`;
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
