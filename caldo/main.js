import { setState } from './store.js';
import { mountApp } from './app.js';

const footer = document.getElementById('footer');

function computeScrollState() {
  const footerRect = footer.getBoundingClientRect();
  const footerSpan = Math.max(footerRect.height, 1);
  const footerT = Math.max(0, Math.min(1, (window.innerHeight - footerRect.top) / footerSpan));

  setState({
    footerT,
    scrolledDown: window.scrollY > window.innerHeight * 0.6,
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
