// Fixed photo backdrop, crossfading between real photography as the user
// scrolls between sections — the photographic replacement for the old
// Three.js camera rig. Consecutive sections that share a photo just stay
// at full opacity; only an actual change of photo crossfades.

export function createBackdrop() {
  const stack = document.getElementById('photos');
  const scrim = document.getElementById('scrim');
  const images = {};
  stack.querySelectorAll('img').forEach((img) => {
    images[img.dataset.photo] = img;
  });

  function setSection(keyA, keyB, t) {
    if (keyA === keyB) {
      for (const key in images) images[key].style.opacity = key === keyA ? '1' : '0';
      return;
    }
    for (const key in images) {
      if (key === keyA) images[key].style.opacity = String(1 - t);
      else if (key === keyB) images[key].style.opacity = String(t);
      else images[key].style.opacity = '0';
    }
  }

  function setOpacity(v) {
    stack.style.opacity = String(v);
    scrim.style.opacity = String(v);
  }

  return { setSection, setOpacity };
}
