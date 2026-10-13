import { setState } from './store.js';
import { mountApp } from './app.js';

const footer = document.getElementById('footer');

// The whole site is one continuously-scrolling page now — no pinned
// backdrop, no scroll-jacking. The only things still driven by scroll
// position are: the nav picking up a solid background past the very top,
// and the sticky "Get Estimate" bar appearing once the user has scrolled
// a bit and hiding again once the real footer comes into view.
function onScroll() {
  const footerRect = footer.getBoundingClientRect();
  const footerSpan = Math.max(footerRect.height, 1);
  const footerT = Math.max(0, Math.min(1, (window.innerHeight - footerRect.top) / footerSpan));

  setState({
    progress: Math.min(1, window.scrollY / (window.innerHeight * 0.6)),
    footerT,
    navSolid: window.scrollY > 4,
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

mountApp();
