import { createBackdrop } from './backdrop.js';
import { SECTIONS, SECTION_VH } from './data.js';
import { setState } from './store.js';
import { mountApp } from './app.js';

const scroller = document.getElementById('scroller');
const footer = document.getElementById('footer');
const grain = document.getElementById('grain');

const backdrop = createBackdrop();

// Cumulative vh weights -> fraction of total scroller height at which each
// section boundary falls. SECTION_VH lets later sections (testimonials,
// FAQ) claim extra scroll room without disturbing earlier pacing.
const totalVh = SECTION_VH.reduce((a, b) => a + b, 0);
const bounds = [];
{
  let acc = 0;
  for (const vh of SECTION_VH) {
    bounds.push(acc / totalVh);
    acc += vh;
  }
  bounds.push(1);
}

function setScrollerHeight() {
  const vh = window.innerHeight;
  scroller.style.height = `${(totalVh / 100) * vh}px`;
}
setScrollerHeight();
window.addEventListener('resize', setScrollerHeight);

function sectionFromFraction(f) {
  const n = SECTIONS.length;
  for (let i = 0; i < n; i++) {
    const a = bounds[i], b = bounds[i + 1];
    if (f >= a && f < b) {
      const local = (f - a) / (b - a);
      return { idx: i, local };
    }
  }
  return { idx: n - 1, local: 1 };
}

function onScroll() {
  const scrollerRect = scroller.getBoundingClientRect();
  const scrollerTop = window.scrollY + scrollerRect.top;
  const scrollerHeight = scroller.offsetHeight - window.innerHeight;
  const f = scrollerHeight > 0 ? Math.max(0, Math.min(1, (window.scrollY - scrollerTop) / scrollerHeight)) : 0;

  const { idx, local } = sectionFromFraction(f);
  const a = SECTIONS[idx];
  const b = SECTIONS[Math.min(idx + 1, SECTIONS.length - 1)];
  // Hold each photo at full opacity for most of its section's dwell and
  // only dissolve into the next one right at the boundary — a linear
  // crossfade across the whole section would leave a long, ghostly
  // double-exposure instead of a clean cut.
  const EDGE = 0.15;
  const t = local <= 1 - EDGE ? 0 : (local - (1 - EDGE)) / EDGE;
  backdrop.setSection(a.photo, b.photo, t);

  // The pinned intro is only the first few sections' worth of scroll — once
  // the user scrolls past it, dissolve the fixed backdrop/overlays away so
  // the normal static page underneath takes over. The dissolve happens in
  // the last stretch of the intro's own scroll range, not a fixed pixel
  // amount, so it still works at any viewport height.
  const OUTRO_EDGE = 0.2;
  const introOpacity = f < 1 - OUTRO_EDGE ? 1 : 1 - (f - (1 - OUTRO_EDGE)) / OUTRO_EDGE;
  backdrop.setOpacity(introOpacity);
  grain.style.opacity = String(0.07 * introOpacity);
  const overlaysEl = document.getElementById('overlays');
  if (overlaysEl) {
    overlaysEl.style.opacity = String(introOpacity);
    overlaysEl.style.pointerEvents = introOpacity < 0.5 ? 'none' : '';
  }

  // Separately, the sticky "Get Estimate" bar (part of the persistent
  // chrome, not the intro) hides once the real footer scrolls into view.
  const footerRect = footer.getBoundingClientRect();
  const footerSpan = Math.max(footerRect.height, 1);
  const footerT = Math.max(0, Math.min(1, (window.innerHeight - footerRect.top) / footerSpan));

  setState({
    progress: f,
    section: idx + local,
    sectionIdx: idx,
    sectionLocal: local,
    footerT,
    navSolid: window.scrollY > 4,
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

mountApp();
