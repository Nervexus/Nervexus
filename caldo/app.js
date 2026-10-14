import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { SECTIONS, STEPS, TESTIMONIALS, FAQS, SWATCHES, PHOTO_SRC } from './data.js';
import { state, subscribe, setState, getSnapshot } from './store.js';

const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useSyncExternalStore } = React;

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

// --- Headline letter/word reveal --------------------------------------

function Reveal({ text, tag = 'h2', className = '', active = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.classList.add('in'));
    return () => cancelAnimationFrame(id);
  }, [active, text]);

  let i = 0;
  const words = text.split(' ').map((word, wi) => {
    const letters = [...word].map((ch) => {
      const delay = i++ * 42;
      return html`<i style=${{ transitionDelay: `${delay}ms` }}>${ch}</i>`;
    });
    i++; // account for the space between words in the stagger count
    return html`<span class="w" key=${wi}>${letters}</span>`;
  });

  return React.createElement(tag, { className: `reveal ${className}`, ref }, words.reduce((acc, w, idx) => {
    acc.push(w);
    if (idx < words.length - 1) acc.push(' ');
    return acc;
  }, []));
}

// --- Nav ---------------------------------------------------------------

function Nav() {
  const s = useStore();
  return html`
    <nav class=${s.navSolid ? 'solid' : ''}>
      <div class="navinner">
        <a href="#top" class="navlogo" onClick=${(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="STRATA home">
          <${LogoMark} />
          <span class="logo">STRATA</span>
        </a>
        <div class="navlinks">
          <a href="#services">Services</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
          <a href="#contact" onClick=${(e) => { e.preventDefault(); setState({ chatOpen: true }); }}>Contact</a>
        </div>
        <div class="navicons">
          <button class="iconbtn" aria-label="Client login"><${AccountIcon} /></button>
          <button class="btn btnprimary navcta" onClick=${() => setState({ chatOpen: true })}>Get Estimate</button>
        </div>
      </div>
    </nav>
  `;
}

// --- Generic section panel ---------------------------------------------

// Full opacity for the section's entire local 0..1 dwell (however long that
// section's scroll range is), with a short crossfade only right at the
// boundary into the previous/next section. A flat radius around `idx` would
// fade long sections (testimonials, FAQ) out before their local progress
// — tied to horizontal travel / accordion interaction — ever reaches 1.
function weightFor(section, idx) {
  const d = section - idx;
  const EDGE = 0.08;
  if (d <= -EDGE || d >= 1 + EDGE) return 0;
  if (d < 0) return 1 - (-d) / EDGE;
  if (d > 1) return 1 - (d - 1) / EDGE;
  return 1;
}

function Panel({ idx, children, side = 'left', extraClass = '' }) {
  const s = useStore();
  const w = weightFor(s.section, idx);
  const activeRef = useRef(false);
  const [bump, setBump] = useState(0);
  const isActive = w > 0.5;
  useEffect(() => {
    if (isActive && !activeRef.current) {
      activeRef.current = true;
      setBump((b) => b + 1);
    } else if (!isActive && activeRef.current) {
      activeRef.current = false;
    }
  }, [isActive]);

  if (w <= 0.001) return null;
  // Also gated on s.introOpacity, not just local weight: once scroll is
  // clamped past the last intro section, that section's weight sits at the
  // top of its own dwell range forever, which would otherwise leave this
  // panel permanently pointer-events:auto — an invisible hit target sitting
  // over the page content below, swallowing clicks/touches meant for it.
  // introOpacity (driven off real scroll geometry in main.js) correctly
  // reaches 0 once the intro has handed off, regardless of any single
  // section's own stuck weight.
  const clickable = w > 0.6 && s.introOpacity > 0.01;
  return html`
    <div
      class=${`ov ov-${side} ${extraClass}`}
      style=${{ opacity: w, transform: `translateY(${(1 - w) * 18}px)`, pointerEvents: clickable ? 'auto' : 'none' }}
      key=${bump}
    >
      ${children}
    </div>
  `;
}

function Eyebrow({ children }) {
  return html`<div class="eyebrow">${children}</div>`;
}

function HeroPanel({ idx }) {
  const data = SECTIONS[idx];
  return html`
    <${Panel} idx=${idx} side="left" extraClass="ov-hero">
      <${Reveal} tag="h1" text=${data.h} />
      <p class="lede">${data.lede}</p>
      <div class="heroactions">
        <button class="btn btnprimary" onClick=${() => setState({ chatOpen: true })}>Get a Free Estimate</button>
        <button class="btn btnghost" onClick=${() => window.scrollTo({ top: window.innerHeight * 1.1, behavior: 'smooth' })}>See the install</button>
      </div>
      <div class="scrollhint"><span class="beamline"></span></div>
    <//>
  `;
}

// Per-section text placement overrides (see style.css's .pos-top and
// .sec-N rules). Problem (1) and Performance (3) sit near the top of
// their frame instead of vertically centered; Performance also moved
// from its default alternating right side to the left.
const TEXT_LAYOUT = {
  1: { side: 'right', top: true },
  2: { side: 'left', top: false },
  3: { side: 'left', top: true },
};

function TextPanel({ idx }) {
  const data = SECTIONS[idx];
  const layout = TEXT_LAYOUT[idx] || { side: idx % 2 === 0 ? 'left' : 'right', top: false };
  const extraClass = `ov-hero sec-${idx}${layout.top ? ' pos-top' : ''}`;
  return html`
    <${Panel} idx=${idx} side=${layout.side} extraClass=${extraClass}>
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} text=${data.h} />
      ${data.body ? html`<p class="body">${data.body}</p>` : null}
    <//>
  `;
}

// --- Static page sections (normal document flow, below the intro) -------

const ChevronIcon = ({ flip }) => html`
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style=${{ transform: flip ? 'scaleX(-1)' : 'none' }}>
    <path d="M9 5l7 7-7 7" />
  </svg>
`;

// Shared fanned-3D-stack placement for a card at `offset` steps from the
// focused one — used by both the steps and reviews carousels below. Pure
// CSS 3D transforms (no Three.js/GSAP dependency), kept to the site's own
// palette rather than borrowing anyone else's.
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

function StepCard({ step, n, offset }) {
  return html`
    <div class="stepcard" style=${fanStyle(offset)}>
      <span class="stepnum">${String(n).padStart(2, '0')}</span>
      <h3>${step.h}</h3>
      <p class="body">${step.body}</p>
    </div>
  `;
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
// gesture itself. Shared by the steps and reviews carousels — same cards,
// same gesture handling, just different card content.
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

function StepsCarousel() {
  const n = STEPS.length;
  const { idx, go, ref, stageRef } = useSwipeCarousel(n);
  return html`
    <div class="stepscarousel" ref=${ref}>
      <div class="cardstage" ref=${stageRef}>
        ${STEPS.map((s, i) => html`<${StepCard} key=${s.h} step=${s} n=${i + 1} offset=${cyclicOffset(i, idx, n)} />`)}
      </div>
      <div class="cardnav">
        <button class="cardarrow" onClick=${() => go(-1)} aria-label="Previous step"><${ChevronIcon} flip /></button>
        <span class="cardcount">${String(idx + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>
        <button class="cardarrow" onClick=${() => go(1)} aria-label="Next step"><${ChevronIcon} /></button>
      </div>
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
      <p class="body">Finished in small batches: Charcoal, Zinc Gray, Copper Patina, Bone White and Graphite. Every finish weathers the same way — beautifully.</p>
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
        <h2>Every layer, engineered on purpose.</h2>
        <p class="body">Six steps, start to finish. No surprises in between.</p>
      </div>
      <${StepsCarousel} />
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

function FaqSection() {
  const s = useStore();
  return html`
    <section id="faq" class="page-section faqwrap-static">
      <div class="page-head">
        <${Eyebrow}>QUESTIONS<//>
        <h2>Everything you are wondering</h2>
      </div>
      <div class="qalist">
        ${FAQS.map((f, i) => html`
          <div class="qa ${s.faqOpen === i ? 'open' : ''}" key=${i}>
            <button class="qbtn" onClick=${() => setState({ faqOpen: s.faqOpen === i ? -1 : i })}>
              <span>${f.q}</span>
              <span class="plus">+</span>
            </button>
            <div class="a" style=${{ maxHeight: s.faqOpen === i ? '160px' : '0px' }}>
              <p>${f.a}</p>
            </div>
          </div>
        `)}
      </div>
    </section>
  `;
}

function PageContent() {
  return html`
    <${React.Fragment}>
      <${ServicesSection} />
      <${TestimonialsSection} />
      <${FaqSection} />
    <//>
  `;
}

// --- Sticky estimate bar ---------------------------------------------

function BuyBar() {
  const s = useStore();
  const show = s.progress > 0.3 && s.footerT < 0.5;
  return html`
    <div class="buybar ${show ? 'show' : ''}">
      <div class="buybarinner">
        <div class="buybarinfo">
          <strong>STRATA Roof System</strong>
          <span>Free on-site estimate · Response within 1 business day</span>
        </div>
        <button class="btn btnprimary" onClick=${() => setState({ chatOpen: true })}>Get Estimate</button>
      </div>
    </div>
  `;
}

// --- Support chat --------------------------------------------------------

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
          <div class="chatmsg">Hi — tell us about your roof and we'll schedule a free on-site estimate, usually within one business day.</div>
        </div>
        <div class="chatinput">
          <input type="text" placeholder="Type a message…" />
          <button class="btn btnprimary chatsend">Send</button>
        </div>
      </div>
      <button class="chatbubble" onClick=${() => setState({ chatOpen: !state.chatOpen })} aria-label="Toggle support chat">
        ${s.chatOpen ? '×' : '💬'}
      </button>
    </div>
  `;
}

// --- Root app --------------------------------------------------------

function Overlays() {
  return html`
    <div id="overlays">
      <${HeroPanel} idx=${0} />
      <${TextPanel} idx=${1} />
      <${TextPanel} idx=${2} />
      <${TextPanel} idx=${3} />
    </div>
    <${BuyBar} />
    <${SupportChat} />
  `;
}

function Footer() {
  return html`
    <div class="footerinner">
      <div class="footpillwrap">
        <form class="footpill" onSubmit=${(e) => { e.preventDefault(); setState({ chatOpen: true }); }}>
          <input type="text" placeholder="Get a free roof estimate…" />
          <button type="submit" aria-label="Request an estimate">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </form>
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
  createRoot(fixedRoot).render(html`<${React.Fragment}><${Nav} /><${Overlays} /><//>`);
  createRoot(pageRoot).render(html`<${PageContent} />`);
  createRoot(footerRoot).render(html`<${Footer} />`);
}
