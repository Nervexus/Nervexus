import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { INTRO, FEATURES, ANATOMY, TESTIMONIALS, FAQS, SWATCHES, PHOTO_SRC } from './data.js';
import { state, subscribe, setState, getSnapshot } from './store.js';

const html = htm.bind(React.createElement);
const { useEffect, useRef, useSyncExternalStore } = React;

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

// --- Headline letter/word reveal --------------------------------------

// Triggers its own reveal animation once the headline scrolls into view,
// rather than depending on a parent scroll-position gate — the page is
// normal document flow now, nothing pins sections to the viewport.
function Reveal({ text, tag = 'h2', className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        el.classList.add('in');
        io.disconnect();
      }
    }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [text]);

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

function Eyebrow({ children }) {
  return html`<div class="eyebrow">${children}</div>`;
}

// --- Intro: Hero header, then a pinned 3D-tilt gallery bridging image
// one (Hero) and image two (Problem), then Problem's narrative text. ----

function HeroHeader() {
  const data = INTRO[0];
  return html`
    <section class="page-section hero-header">
      <${Reveal} tag="h1" text=${data.h} />
      <p class="lede">${data.lede}</p>
      <div class="heroactions">
        <button class="btn btnprimary" onClick=${() => setState({ chatOpen: true })}>Get a Free Estimate</button>
        <button class="btn btnghost" onClick=${() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>See the install</button>
      </div>
    </section>
  `;
}

// A pinned, scroll-driven 3D gallery reveal: the two-column grid tilts up
// from a steep perspective to flat as the user scrolls through a tall
// runway, then each column drifts vertically at a slightly different rate
// (parallax) before releasing into the next section. Values are read
// directly off scroll position every frame — no eased/lerped "inertia" —
// matching how the reference component drives its transforms straight off
// scrollYProgress.
function GallerySection() {
  const scrollRef = useRef(null);
  const gridRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function mapRange(t, inMin, inMax, outMin, outMax) {
      const p = clamp01((t - inMin) / (inMax - inMin));
      return outMin + (outMax - outMin) * p;
    }

    let ticking = false;
    function update() {
      ticking = false;
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const progress = total > 0 ? clamp01(-rect.top / total) : 0;

      const rotateX = mapRange(progress, 0, 0.5, 60, 0);
      const scale = mapRange(progress, 0.5, 0.9, 1.15, 1);
      if (gridRef.current) gridRef.current.style.transform = `rotateX(${rotateX}deg) scale(${scale})`;

      const y1 = mapRange(progress, 0.5, 1, -6, 2);
      const y2 = mapRange(progress, 0.5, 1, 6, -2);
      if (col1Ref.current) col1Ref.current.style.transform = `translateY(${y1}%)`;
      if (col2Ref.current) col2Ref.current.style.transform = `translateY(${y2}%)`;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  return html`
    <div class="gallery-scroll" ref=${scrollRef}>
      <div class="gallery-sticky">
        <div class="gallery-grid" ref=${gridRef}>
          <div class="gallery-col" ref=${col1Ref}><img src=${PHOTO_SRC['hero-house']} alt="" /></div>
          <div class="gallery-col" ref=${col2Ref}><img src=${PHOTO_SRC['house-angle2']} alt="" /></div>
        </div>
      </div>
    </div>
  `;
}

function ProblemSection() {
  const data = INTRO[1];
  return html`
    <section class="page-section intro-text-section">
      <div class="intro-copy">
        <${Eyebrow}>${data.eyebrow}<//>
        <${Reveal} text=${data.h} />
        <p class="body">${data.body}</p>
      </div>
    </section>
  `;
}

function IntroTextSection({ data }) {
  return html`
    <section class="page-section intro-text-section">
      <img src=${PHOTO_SRC[data.photo]} alt="" />
      <div class="intro-copy">
        <${Eyebrow}>${data.eyebrow}<//>
        <${Reveal} text=${data.h} />
        <p class="body">${data.body}</p>
      </div>
    </section>
  `;
}

// --- Static page sections (normal document flow) -------------------------

function FeatureCard({ f }) {
  return html`
    <div class="feature">
      <img class="featureimg" src=${PHOTO_SRC[f.photo]} alt="" />
      <div class="featurebody">
        <${Eyebrow}>${f.eyebrow}<//>
        <h3>${f.h}</h3>
        <p class="body">${f.body}</p>
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
      </div>
      <div class="featuregrid">
        ${FEATURES.map((f) => html`<${FeatureCard} key=${f.h} f=${f} />`)}
      </div>
      <${FinishesStrip} />
    </section>
  `;
}

function AnatomySection() {
  return html`
    <section class="page-section anatomy-section">
      <div class="page-head">
        <${Eyebrow}>ANATOMY<//>
        <h2>Four layers, no shortcuts.</h2>
        <p class="body">Deck, membrane, panel, ridge. Every layer is inspected on its own — nothing here is hidden once it is covered.</p>
      </div>
      <div class="anatomygrid">
        ${ANATOMY.map((a) => html`
          <div class="anatomyitem" key=${a.h}>
            <img src=${PHOTO_SRC[a.photo]} alt="" />
            <div class="eyebrow">${a.label}</div>
            <h4>${a.h}</h4>
            <p class="body">${a.body}</p>
          </div>
        `)}
      </div>
    </section>
  `;
}

function TestimonialsSection() {
  return html`
    <section id="reviews" class="page-section">
      <div class="page-head">
        <${Eyebrow}>REVIEWS<//>
        <h2>Trusted by homeowners who do not like surprises.</h2>
      </div>
      <div class="tgrid">
        ${TESTIMONIALS.map((t) => html`
          <div class="tcard" key=${t.name}>
            <img src=${t.avatar} alt=${t.name} width="56" height="56" />
            <p class="tquote">"${t.quote}"</p>
            <div class="tname">${t.name}</div>
            <div class="trole">${t.role}</div>
          </div>
        `)}
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
      <${HeroHeader} />
      <${GallerySection} />
      <${ProblemSection} />
      ${INTRO.slice(2).map((d) => html`<${IntroTextSection} key=${d.h} data=${d} />`)}
      <${ServicesSection} />
      <${AnatomySection} />
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

function Footer() {
  return html`
    <div class="footerinner">
      <div class="footertop">
        <div class="footerbrand">STRATA</div>
        <div class="footercols">
          <div>
            <h4>Services</h4>
            <a href="#services">Standing-Seam Roofing</a>
            <a href="#services">Roof Repair & Leak Detection</a>
            <a href="#faq">Insurance Claims</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
            <a href="#contact" onClick=${(e) => { e.preventDefault(); setState({ chatOpen: true }); }}>Contact</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Warranty</a>
          </div>
        </div>
      </div>
      <div class="footerbottom">
        <span>© ${new Date().getFullYear()} STRATA Roofing. Built to outlast the weather.</span>
      </div>
    </div>
  `;
}

export function mountApp() {
  const fixedRoot = document.getElementById('app-fixed-root');
  const pageRoot = document.getElementById('page-root');
  const footerRoot = document.getElementById('footer-root');
  createRoot(fixedRoot).render(html`<${React.Fragment}><${Nav} /><${BuyBar} /><${SupportChat} /><//>`);
  createRoot(pageRoot).render(html`<${PageContent} />`);
  createRoot(footerRoot).render(html`<${Footer} />`);
}
