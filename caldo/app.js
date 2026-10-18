import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { HERO, ROOF_TYPES, TESTIMONIALS, FAQS, SWATCHES } from './data.js';
import { state, subscribe, setState, getSnapshot } from './store.js';

const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } = React;

const cx = (...parts) => parts.filter(Boolean).join(' ');

function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// --- Icons -----------------------------------------------------------

const AccountIcon = () => html`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M4.5 20c1.4-4 4.3-6 7.5-6s6.1 2 7.5 6" />
  </svg>
`;

// A simple roofline/ridge mark — same motif as the browser-tab favicon,
// drawn inline here instead of as an <img> so it inherits the nav's
// current text color for free.
const LogoMark = () => html`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 13 12 5l9 8" />
    <path d="M12 5v4" />
  </svg>
`;

// --- Announcement bar ---------------------------------------------------

// A seamless, endless horizontal ticker: two identical copies of the
// message placed back to back, animated from translateX(0) to
// translateX(-50%) — since both copies are the same width, the moment
// the first scrolls fully offscreen the second is sitting exactly
// where the first started, so the loop point is invisible.
const ANNOUNCE_MSG = '10% OFF YOUR WINTER ROOF — LIMITED TIME';

function AnnounceBar() {
  const repeated = Array.from({ length: 8 }, () => ANNOUNCE_MSG);
  const Sequence = ({ hidden }) => html`
    <div class="announceseq" aria-hidden=${hidden ? 'true' : undefined}>
      ${repeated.map((msg, i) => html`<span key=${i}>${msg}</span>`)}
    </div>
  `;
  return html`
    <div class="announcebar">
      <div class="announcetrack">
        <${Sequence} hidden=${false} />
        <${Sequence} hidden=${true} />
      </div>
    </div>
  `;
}

// --- Nav ---------------------------------------------------------------

function Nav() {
  const s = useStore();
  return html`
    <nav class=${s.navSolid ? 'solid' : ''}>
      <div class="navinner">
        <a href="#top" class="navlogo" onClick=${(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="STRATA home">
          <${LogoMark} />
        </a>
        <div class="navlinks">
          <a href="#services">Services</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
          <a href="#contact" onClick=${(e) => { e.preventDefault(); setState({ chatOpen: true }); }}>Contact</a>
        </div>
        <div class="navicons">
          <button class="iconbtn" aria-label="Client login"><${AccountIcon} /></button>
        </div>
      </div>
    </nav>
  `;
}

function Eyebrow({ children }) {
  return html`<div class="eyebrow">${children}</div>`;
}

// A single full-bleed hero photo with the headline/CTA overlaid in a
// frosted card for contrast — no pin, no crossfade, no scroll-triggered
// animation, just a plain static section at the very top of the page.
// The photo itself already has the STRATA wordmark baked in (no CSS
// watermark overlay needed on top of it).
function HeroSection() {
  return html`
    <section class="herofull">
      <img src=${HERO.photo} alt="" />
      <div class="herocard">
        <h1>${HERO.h}</h1>
        <p class="lede">${HERO.lede}</p>
        <div class="heroactions">
          <button class="btn btnprimary" onClick=${() => setState({ chatOpen: true })}>Get a Free Estimate</button>
        </div>
      </div>
    </section>
  `;
}

// --- Static page sections (normal document flow) -------------------------

const ChevronIcon = ({ flip }) => html`
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style=${{ transform: flip ? 'scaleX(-1)' : 'none' }}>
    <path d="M9 5l7 7-7 7" />
  </svg>
`;

// Fanned-3D-stack placement for a card at `offset` steps from the
// focused one — used by the roof types and reviews carousels below.
// Pure CSS 3D transforms (no Three.js/GSAP dependency), kept to the
// site's own palette rather than borrowing anyone else's.
function fanStyle(offset) {
  const abs = Math.abs(offset);
  if (abs > 2) {
    return { opacity: 0, pointerEvents: 'none', transform: `translate(-50%, 0) translateX(${offset > 0 ? 640 : -640}px) scale(0.5)` };
  }
  return {
    transform: `translate(-50%, 0) translateX(${offset * 72}%) translateZ(${-abs * 90}px) rotateY(${offset * -26}deg) scale(${1 - abs * 0.12})`,
    opacity: abs === 0 ? 1 : abs === 1 ? 0.55 : 0.22,
    zIndex: String(10 - abs),
    pointerEvents: abs === 0 ? 'auto' : 'none',
  };
}

function cyclicOffset(i, idx, n) {
  let offset = i - idx;
  if (offset > n / 2) offset -= n;
  if (offset < -n / 2) offset += n;
  return offset;
}

function TestimonialCard({ t, offset }) {
  return html`
    <div class="tcard" style=${fanStyle(offset)}>
      <${QuoteIcon} />
      <img class="tphoto" src=${t.avatar} alt=${t.name} />
      <div class="tcontent">
        <p class="tquote">"${t.quote}"</p>
        <div class="tname">${t.name}</div>
        <div class="trole">${t.role}</div>
      </div>
    </div>
  `;
}

// Drives a swipeable fanned-card-stack carousel: current index, keyboard
// left/right nav (only while the carousel is in view), and the drag
// gesture itself. Shared by the roof types and reviews carousels.
function useSwipeCarousel(n) {
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  const stageRef = useRef(null);
  const go = (d) => setIdx((i) => (i + d + n) % n);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2;
      if (!inView) return;
      go(e.key === 'ArrowLeft' ? -1 : 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  // Swipe the card stage itself, not the page — a horizontal drag spins
  // to the next/previous card; a vertical drag is left alone so the page
  // still scrolls normally. Only locks (preventDefault) once a gesture
  // has clearly declared itself horizontal, so a straight-down scroll
  // starting on the cards is never swallowed.
  //
  // The stack follows the finger in real time (direct DOM style, no React
  // re-render per move — that's what made it feel laggy) instead of only
  // reacting on release, and a fast short flick advances the card even if
  // it didn't cross the distance threshold, matching how a native swiper
  // actually feels.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let active = false, decided = false, horizontal = false, startX = 0, startY = 0, dragX = 0;
    let lastX = 0, lastY = 0, lastT = 0, velocity = 0;

    function begin(x, y) {
      active = true; decided = false; horizontal = false; startX = x; startY = y; dragX = 0;
      lastX = x; lastY = y; lastT = performance.now(); velocity = 0;
      el.style.transition = 'none';
    }
    function move(x, y, evt) {
      if (!active) return;
      const dx = x - startX, dy = y - startY;
      if (!decided && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        decided = true;
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (!horizontal) el.style.transition = '';
      }
      if (!decided) return;
      if (!horizontal) {
        // touch-action is 'none' here (see style.css) so the browser never
        // starts its own scroll on this element — that's what stopped a
        // vertical swipe from racing the JS decision above and winning as
        // a native scroll before we could tell it was vertical. Replicate
        // the scroll by hand instead, so starting a drag on the card still
        // scrolls the page exactly like it would anywhere else.
        window.scrollBy(0, lastY - y);
        lastY = y;
        return;
      }
      if (evt && evt.cancelable) evt.preventDefault();
      dragX = dx;
      el.style.transform = `translateX(${dx}px)`;
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = (x - lastX) / dt;
      lastX = x; lastT = now;
    }
    function end() {
      if (!active) return;
      active = false;
      el.style.transition = '';
      el.style.transform = '';
      if (!horizontal) return;
      const flicked = Math.abs(velocity) > 0.45 && Math.abs(dragX) > 12;
      const dragged = Math.abs(dragX) > 36;
      if (flicked || dragged) go(dragX < 0 ? 1 : -1);
    }

    // Native touch events for touch, Pointer Events for everything else
    // (mouse/pen) — not Pointer Events for touch too. Safari's pointer
    // event delivery for touch has had real, device-visible timing quirks
    // (a quick flick sometimes not registering at all unless the finger
    // pauses on first contact); touch events are the one path every mobile
    // browser has had reliable for years. A touchscreen fires both a
    // 'touchstart' and a same-gesture 'pointerdown', so the pointer
    // handlers below explicitly ignore pointerType 'touch' to avoid
    // double-driving begin/move/end from the same gesture.
    function onTouchStart(e) {
      const t = e.touches[0];
      begin(t.clientX, t.clientY);
    }
    function onTouchMove(e) {
      const t = e.touches[0];
      move(t.clientX, t.clientY, e);
    }
    function onTouchEnd() { end(); }

    function onPointerDown(e) {
      if (e.pointerType === 'touch') return;
      begin(e.clientX, e.clientY);
      try { el.setPointerCapture(e.pointerId); } catch { /* pointer session already gone */ }
    }
    function onPointerMove(e) {
      if (e.pointerType === 'touch') return;
      if (e.buttons === 0) return;
      move(e.clientX, e.clientY, e);
    }
    function onPointerUp(e) {
      if (e.pointerType === 'touch') return;
      end();
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [n]);

  return { idx, go, ref, stageRef };
}

// --- Layers wheel -----------------------------------------------------
//
// A vertical drum of cards, no resting "ring" state — the front layer sits
// flat and full size on load, with its neighbours already rotated away
// above and below it in perspective. Scrolling down (or dragging up) turns
// the drum forward to the next layer. One number — `pos` — read by a single
// rAF pass that writes transforms straight to the DOM: 0 is item 0 at the
// front, 1 is item 1 at the front, and so on.

const WHEEL_CARD_H = 0.42; // front card height, of the stage
const WHEEL_CARD_MAX_W = 0.82; // ...but never wider than this much of the stage (mostly a narrow-viewport cap)
const WHEEL_CARD_RATIO = 1.3; // card width / height — enough room for real copy
const WHEEL_STEP = 40; // degrees between cards on the drum
const WHEEL_DRUM = 2.22; // drum radius, in card heights — tuned against STEP
const WHEEL_LENS = 2.7; // perspective distance
// The drum hangs on an arc whose centre sits off to the left, so the card at
// the front is at the arc's near point and its neighbours have already
// swung back left as well as up and down. This is that arc's radius.
const WHEEL_BOW = 1.82;
const WHEEL_INDEX = 0.04; // the index down the right-hand side
const WHEEL_CULL = 1.6; // items further than this off-centre stop drawing
const WHEEL_UNITS = 900; // how much of a wheel-notch counts as one item
const WHEEL_DRAG_UNITS = 420; // ...and how much of a dragged pixel does
const WHEEL_SETTLE = 140; // quiet time before the wheel settles on an item
const WHEEL_EASE = 0.12; // fraction of remaining distance closed per frame

const wheelClamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wheelRad = (deg) => (deg * Math.PI) / 180;

// How far left the arc has carried something `drumDeg` off the front.
function wheelBowAt(drumDeg, bow) {
  return -bow * (1 - Math.cos(wheelRad(drumDeg)));
}

function wheelPlace(drumDeg, drumR, bow) {
  return (
    `translateX(${wheelBowAt(drumDeg, bow)}px)` +
    ` rotateX(${drumDeg}deg) translateZ(${drumR}px)`
  );
}

function LayersWheel({ items, action }) {
  const stageRef = useRef(null);
  const wheelRef = useRef(null);
  const cardRefs = useRef([]);

  const turn = useRef(0);
  const target = useRef(0);
  const [active, setActive] = useState(0);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * WHEEL_CARD_H * WHEEL_CARD_RATIO, w * WHEEL_CARD_MAX_W);
    const cardH = cardW / WHEEL_CARD_RATIO;
    const drumR = cardH * WHEEL_DRUM;
    return {
      cardW,
      cardH,
      drumR,
      bow: cardH * WHEEL_BOW,
      depth: cardH * WHEEL_LENS,
      index: cardH * WHEEL_INDEX,
    };
  }, [stage, count]);

  useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { drumR, bow } = metrics;

    if (wheelRef.current) wheelRef.current.style.transform = `translateZ(${-drumR}px)`;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : WHEEL_EASE);

      const pos = turn.current;

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * WHEEL_STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = wheelPlace(drumDeg, drumR, bow);
          card.style.opacity = Math.abs(d) > WHEEL_CULL ? '0' : '1';
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
      }

      const near = wheelClamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = useCallback((next) => {
    target.current = wheelClamp(next, 0, last);
  }, [last]);

  const settling = useRef(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event) => {
      // Scrolling down should move forward through the layers (Framing
      // toward Flashing & Trim), not backward — confirmed against the
      // deployed site, not just a synthetic test (the sandboxed test
      // environment's wheel-event sign does not reliably match a real
      // browser's). Only intercept the gesture (preventDefault) while
      // that would actually move the drum; at either end the page
      // scrolls on underneath it.
      const next = target.current - event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last) event.preventDefault();
      to(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(() => to(Math.round(target.current)), WHEEL_SETTLE);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last]);

  const drag = useRef(null);

  return html`
    <section class="layerswheel">
      <div
        ref=${stageRef}
        tabIndex="0"
        role="listbox"
        aria-activedescendant=${`layerswheel-${active}`}
        class="layerswheelstage"
        style=${{ perspective: `${metrics.depth}px` }}
        onPointerDown=${(event) => {
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove=${(event) => {
          if (drag.current === null) return;
          to(target.current + (drag.current - event.clientY) / WHEEL_DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp=${() => {
          drag.current = null;
          to(Math.round(target.current));
        }}
        onKeyDown=${(event) => {
          if (event.key === 'ArrowDown') to(Math.round(target.current) + 1);
          else if (event.key === 'ArrowUp') to(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
        }}
      >
        <div ref=${wheelRef} class="layerswheelwheel">
          ${items.map((item, i) => {
            const Tag = item.href ? 'a' : 'div';
            return html`
              <${Tag}
                key=${item.title}
                id=${`layerswheel-${i}`}
                role="option"
                aria-selected=${i === active}
                href=${item.href}
                ref=${(node) => { cardRefs.current[i] = node; }}
                class=${cx('layerswheelcard', !item.image && 'textonly')}
                style=${{
                  width: metrics.cardW,
                  height: metrics.cardH,
                  marginLeft: -metrics.cardW / 2,
                  marginTop: -metrics.cardH / 2,
                }}
              >
                <span class="layerswheelface">
                  ${item.image ? html`
                    <span class="layerswheelmedia"><img src=${item.image} alt="" draggable="false" /></span>
                  ` : null}
                  <span class="layerswheeltext">
                    <span class="layerswheeltag">${item.tagline}</span>
                    <h3>${item.title}</h3>
                    <p>${item.body}</p>
                  </span>
                  ${action && item.href ? html`
                    <span class="layerswheelaction">
                      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                        <path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      ${action}
                    </span>
                  ` : null}
                </span>
              <//>
            `;
          })}
        </div>
      </div>

      <ol class="layerswheelindex" style=${{ fontSize: metrics.index }}>
        ${items.map((item, i) => html`
          <li key=${item.title}>
            <button type="button" onClick=${() => to(i)} class=${cx(i === active && 'active')}>
              ${item.title}
            </button>
          </li>
        `)}
      </ol>
    </section>
  `;
}

function LayersWheelSection() {
  const wheelItems = ROOF_TYPES.map((t) => ({ title: t.name, image: t.photo, tagline: t.tagline, body: t.body }));
  return html`
    <div class="layerswheelwrap">
      <${LayersWheel} items=${wheelItems} />
    </div>
  `;
}

function ReviewsCarousel() {
  const n = TESTIMONIALS.length;
  const { idx, go, ref, stageRef } = useSwipeCarousel(n);
  return html`
    <div class="stepscarousel" ref=${ref}>
      <div class="cardstage revstage" ref=${stageRef}>
        ${TESTIMONIALS.map((t, i) => html`<${TestimonialCard} key=${t.name} t=${t} offset=${cyclicOffset(i, idx, n)} />`)}
      </div>
      <div class="cardnav">
        <button class="cardarrow" onClick=${() => go(-1)} aria-label="Previous review"><${ChevronIcon} flip /></button>
        <span class="cardcount">${String(idx + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>
        <button class="cardarrow" onClick=${() => go(1)} aria-label="Next review"><${ChevronIcon} /></button>
      </div>
    </div>
  `;
}

function FinishesStrip() {
  return html`
    <div class="finishes">
      <h3>Five finishes. One standard.</h3>
      <p class="body">Finished in small batches: Charcoal, Zinc Gray, Copper Patina, Bone White and Graphite. Every finish weathers the same way, beautifully.</p>
      <div class="swatches">
        ${SWATCHES.map((sw) => html`<div class="swatch" key=${sw.name} title=${sw.name}><span style=${{ background: sw.hex }}></span>${sw.name}</div>`)}
      </div>
    </div>
  `;
}

function ServicesSection() {
  return html`
    <section id="services" class="page-section">
      <div class="page-head">
        <${Eyebrow}>WHAT'S INCLUDED<//>
        <h2>Built in layers. Every one engineered.</h2>
        <p class="body">From the framing up, every STRATA roof is built the same deliberate way — here's what's actually underneath the metal.</p>
      </div>
      <${LayersWheelSection} />
      <${FinishesStrip} />
    </section>
  `;
}

const QuoteIcon = () => html`
  <svg class="tquoteicon" viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
    <path d="M9.5 7C6.5 8.6 5 11 5 13.8c0 2.4 1.4 3.9 3.3 3.9 1.7 0 2.9-1.3 2.9-3 0-1.6-1.1-2.7-2.5-2.7-.3 0-.5 0-.7.1.3-1.6 1.6-3.2 3.4-4.2L9.5 7Zm9 0C15.5 8.6 14 11 14 13.8c0 2.4 1.4 3.9 3.3 3.9 1.7 0 2.9-1.3 2.9-3 0-1.6-1.1-2.7-2.5-2.7-.3 0-.5 0-.7.1.3-1.6 1.6-3.2 3.4-4.2L18.5 7Z"/>
  </svg>
`;

function TestimonialsSection() {
  return html`
    <section id="reviews" class="reviewsband">
      <div class="page-section reviewsinner">
        <div class="page-head">
          <${Eyebrow}>REVIEWS<//>
          <h2>Trusted by homeowners who do not like surprises.</h2>
        </div>
        <${ReviewsCarousel} />
      </div>
    </section>
  `;
}

// Measures its own answer's real height (scrollHeight) rather than
// expanding to a shared fixed cap — a hardcoded max-height clips any
// answer longer than whatever that number assumed, which a genuinely
// detailed, multi-sentence answer easily exceeds.
function QaItem({ f, isOpen, onToggle }) {
  const ref = useRef(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    if (ref.current) setH(ref.current.scrollHeight);
  }, [f, isOpen]);
  return html`
    <div class="qa ${isOpen ? 'open' : ''}">
      <button class="qbtn" onClick=${onToggle}>
        <span>${f.q}</span>
        <span class="plus">+</span>
      </button>
      <div class="a" ref=${ref} style=${{ maxHeight: isOpen ? `${h}px` : '0px' }}>
        <div class="apad">
          <p>${f.a}</p>
          ${f.bullets ? html`
            <ul class="qbullets">
              ${f.bullets.map((b) => html`<li key=${b}>${b}</li>`)}
            </ul>
          ` : null}
          ${f.note ? html`<p class="qnote">${f.note}</p>` : null}
        </div>
      </div>
    </div>
  `;
}

function FaqSection() {
  const s = useStore();
  return html`
    <section id="faq" class="page-section faqwrap-static">
      <div class="page-head">
        <${Eyebrow}>QUESTIONS<//>
        <h2>Everything you are wondering</h2>
      </div>
      <div class="qalist">
        ${FAQS.map((f, i) => html`<${QaItem} key=${i} f=${f} isOpen=${s.faqOpen === i} onToggle=${() => setState({ faqOpen: s.faqOpen === i ? -1 : i })} />`)}
      </div>
    </section>
  `;
}

function PageContent() {
  return html`
    <${React.Fragment}>
      <${HeroSection} />
      <${ServicesSection} />
      <${TestimonialsSection} />
      <${FaqSection} />
    <//>
  `;
}

// --- Support chat --------------------------------------------------------

// No separate floating toggle button here — every CTA on the page
// (nav, hero, sticky bar, footer) already opens this same panel, and a
// persistent extra bubble on top of those was one competing CTA too many.
// The panel's own header close button is enough to dismiss it.
function SupportChat() {
  const s = useStore();
  return html`
    <div class="supportwrap">
      <div class="chatpanel ${s.chatOpen ? 'open' : ''}">
        <div class="chathead">
          <strong>STRATA Concierge</strong>
          <button class="chatclose" onClick=${() => setState({ chatOpen: false })} aria-label="Close">×</button>
        </div>
        <div class="chatbody">
          <div class="chatmsg">Hi, tell us about your roof and we'll schedule a free on-site estimate, usually within one business day.</div>
        </div>
        <div class="chatinput">
          <input type="text" placeholder="Type a message…" />
          <button class="btn btnprimary chatsend">Send</button>
        </div>
      </div>
    </div>
  `;
}

// --- Root app --------------------------------------------------------

function Footer() {
  return html`
    <div class="footerinner">
      <div class="footpillwrap">
        <button class="footpill" onClick=${() => setState({ chatOpen: true })}>
          <span>Get a Free Estimate</span>
          <span class="footpillicon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      <div class="footbrand">STRATA</div>
      <h2 class="footheadline">Inspect.<br /><span>Install.</span><br />Guarantee.</h2>

      <div class="foottrust">
        <span>LIFETIME WARRANTY</span>
        <span>140 MPH WIND RATED</span>
        <span>FREE ON-SITE ESTIMATE</span>
        <span>SAME-WEEK QUOTE</span>
      </div>

      <div class="footwatermark">
        <h1>STRATA</h1>
        <div class="footfade"></div>
      </div>

      <div class="footlegal">© ${new Date().getFullYear()} STRATA Roofing. Built to outlast the weather.</div>
    </div>
  `;
}

export function mountApp() {
  const fixedRoot = document.getElementById('app-fixed-root');
  const pageRoot = document.getElementById('page-root');
  const footerRoot = document.getElementById('footer-root');
  createRoot(fixedRoot).render(html`<${React.Fragment}><${AnnounceBar} /><${Nav} /><${SupportChat} /><//>`);
  createRoot(pageRoot).render(html`<${PageContent} />`);
  createRoot(footerRoot).render(html`<${Footer} />`);
}
