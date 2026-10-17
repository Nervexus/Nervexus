import { setState } from './store.js';
import { mountApp } from './app.js';

function computeScrollState() {
  setState({
    navSolid: window.scrollY > 4,
  });
}

// A raw native 'scroll' event can fire far more often than the screen
// actually repaints, especially mid-fling on mobile. The listener itself
// only flags that a scroll happened; the render loop below does the
// actual recompute at most once per rendered frame — see the git history
// on this file for the fuller story (this used to also drive a pinned
// cinematic intro, which is why it was a bigger deal back then).
let scrollDirty = true;
function onScroll() {
  scrollDirty = true;
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { scrollDirty = true; });

function renderLoop() {
  if (scrollDirty) {
    scrollDirty = false;
    computeScrollState();
  }
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

mountApp();
