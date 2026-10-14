import { createBackdrop } from './backdrop.js';
import { SECTIONS, SECTION_VH } from './data.js';
import { setState } from './store.js';
import { mountApp } from './app.js';

const scroller = document.getElementById('scroller');
const footer = document.getElementById('footer');
const grain = document.getElementById('grain');

const backdrop = createBackdrop();

// Flag each <img> backing a "void render" section (see data.js) so
// style.css can give that whole class of photo consistent treatment
// (object-fit:contain, no Ken Burns, mobile positioning) without a
// hardcoded selector per photo key.
for (const s of SECTIONS) {
  if (!s.voidRender) continue;
  const img = document.querySelector(`#photos img[data-photo="${s.photo}"]`);
  if (img) img.dataset.void = 'true';
}

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

// Extra scroll distance reserved purely for the handoff into #page, on
// top of the content-pacing budget below. #page can't start entering the
// viewport until the scroller spacer itself runs out, so this margin is
// literally how long that "page sliding up from the bottom, revealing
// more of itself" transition takes — a full viewport-height here reads
// as a large blank gap before any page content fills the top of the
// screen, so it's kept to a fraction of that instead.
const RELEASE_FRACTION = 0.45;

// Cached rather than read live from window.innerHeight on every scroll —
// mobile Safari changes innerHeight mid-scroll as its URL bar collapses,
// without always firing a resize event first. If the content/release
// span math in onScroll used that live, drifting value while
// scroller.style.height stayed fixed at whatever innerHeight was when it
// was last set, the two desync: f and release stop corresponding to the
// actual pixel height of #scroller, and the fixed intro can end up still
// fully opaque well after #page has already scrolled into view — the
// "140mph" heading stuck overlapping "What's Included". Freezing vh and
// only updating it on an actual resize keeps every calculation anchored
// to the same number #scroller's real height was built from.
let vh = window.innerHeight;

function contentSpanPx() {
  return (totalVh / 100) * vh;
}

function setScrollerHeight() {
  vh = window.innerHeight;
  scroller.style.height = `${contentSpanPx() + RELEASE_FRACTION * vh}px`;
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
  const contentSpan = contentSpanPx();
  const f = contentSpan > 0 ? Math.max(0, Math.min(1, (window.scrollY - scrollerTop) / contentSpan)) : 0;

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
  // the normal static page underneath takes over.
  //
  // f reaches 1 at the end of contentSpan, RELEASE_FRACTION*vh *before*
  // the scroller spacer actually ends (that's what keeps the fixed
  // backdrop pinned covering the viewport right up until the spacer runs
  // out). #page, the next sibling in the document, only starts entering
  // the viewport during that final stretch — fixed elements can't be
  // scrolled past, so #page physically cannot appear any sooner. Driving
  // the fade off this same scroll window — rather than off f — makes the
  // backdrop dissolve in lockstep with the page sliding up underneath it
  // instead of fading to blank first and revealing the page only after.
  const releaseStart = scrollerTop + contentSpan;
  const releaseSpan = RELEASE_FRACTION * vh;
  const release = releaseSpan > 0
    ? Math.max(0, Math.min(1, (window.scrollY - releaseStart) / releaseSpan))
    : 0;
  // The fixed backdrop/overlays (position:fixed, painted above #page) stay
  // on top of whatever of #page has scrolled into view underneath for as
  // long as their opacity is non-zero — so fading out over the *entire*
  // release window left faded-but-still-legible intro text overlapping
  // the services section once it was mostly revealed. Finishing the fade
  // within the first 40% of the window — well before the page content
  // becomes prominent — clears it out of the way first instead.
  const FADE_FRACTION = 0.4;
  const introOpacity = Math.max(0, 1 - release / FADE_FRACTION);
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

// Continuous per-frame easing (see backdrop.js) rather than snapping
// straight to scroll position — this is what gives the backdrop its
// inertia instead of a flat, scroll-locked swipe.
function renderLoop() {
  backdrop.tick();
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

mountApp();
