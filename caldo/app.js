import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { SECTIONS, TESTIMONIALS, FAQS, SWATCHES } from './data.js';
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

const ArrowIcon = ({ className }) => html`
  <svg class=${className} viewBox="0 0 12 8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 1l5 5 5-5" />
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
        <a class="logo" href="#hero">STRATA</a>
        <div class="navlinks">
          <a href="#product">Services</a>
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
  const EDGE = 0.22;
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
  return html`
    <div
      class=${`ov ov-${side} ${extraClass}`}
      style=${{ opacity: w, transform: `translateY(${(1 - w) * 18}px)`, pointerEvents: w > 0.6 ? 'auto' : 'none' }}
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
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} tag="h1" text=${data.h} />
      <p class="lede">${data.lede}</p>
      <div class="heroactions">
        <button class="btn btnprimary" onClick=${() => setState({ chatOpen: true })}>Get a Free Estimate</button>
        <button class="btn btnghost" onClick=${() => window.scrollTo({ top: window.innerHeight * 1.1, behavior: 'smooth' })}>See the install</button>
      </div>
      <div class="scrollhint"><${ArrowIcon} className="bob" /><span>Scroll</span></div>
    <//>
  `;
}

function TextPanel({ idx }) {
  const data = SECTIONS[idx];
  const extra = data.kind === 'swatches' ? 'ov-compact' : '';
  return html`
    <${Panel} idx=${idx} side=${idx % 2 === 0 ? 'left' : 'right'} extraClass=${extra}>
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} text=${data.h} />
      ${data.body ? html`<p class="body">${data.body}</p>` : null}
      ${data.kind === 'swatches' ? html`
        <div class="swatches">
          ${SWATCHES.map((sw) => html`<div class="swatch" key=${sw.name} title=${sw.name}><span style=${{ background: sw.hex }}></span>${sw.name}</div>`)}
        </div>
      ` : null}
    <//>
  `;
}

function ExplodedPanel({ idx }) {
  const data = SECTIONS[idx];
  return html`
    <${Panel} idx=${idx} side="left">
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} text=${data.h} />
      <p class="body">${data.body}</p>
    <//>
  `;
}

function PartPanel({ idx }) {
  const data = SECTIONS[idx];
  return html`
    <${Panel} idx=${idx} side="right">
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} text=${data.h} />
      <p class="body">${data.body}</p>
    <//>
  `;
}

// --- Testimonials --------------------------------------------------------

function TestimonialsPanel({ idx }) {
  const s = useStore();
  const w = weightFor(s.section, idx);
  const data = SECTIONS[idx];
  if (w <= 0.001) return null;
  const local = s.sectionIdx === idx ? s.sectionLocal : (s.section > idx ? 1 : 0);
  const travel = Math.max(0, Math.min(1, local)) * -62;
  return html`
    <div class="ov ov-left testi" style=${{ opacity: w }}>
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} text=${data.h} />
    </div>
    <div class="tcardviewport" style=${{ opacity: w }}>
      <div class="tcardrow" style=${{ transform: `translateX(${travel}%)` }}>
        ${TESTIMONIALS.map((t) => html`
          <div class="tcard" key=${t.name}>
            <img src=${t.avatar} alt=${t.name} width="56" height="56" />
            <p class="tquote">"${t.quote}"</p>
            <div class="tname">${t.name}</div>
            <div class="trole">${t.role}</div>
          </div>
        `)}
      </div>
    </div>
  `;
}

// --- FAQ -------------------------------------------------------------

function FaqPanel({ idx }) {
  const s = useStore();
  const w = weightFor(s.section, idx);
  const data = SECTIONS[idx];
  if (w <= 0.001) return null;
  return html`
    <div class="ov ov-right faqwrap" style=${{ opacity: w, pointerEvents: w > 0.6 ? 'auto' : 'none' }}>
      <${Eyebrow}>${data.eyebrow}<//>
      <${Reveal} text=${data.h} />
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
    </div>
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
      <${TextPanel} idx=${4} />
      <${TextPanel} idx=${5} />
      <${TextPanel} idx=${6} />
      <${TextPanel} idx=${7} />
      <${TextPanel} idx=${8} />
      <${TextPanel} idx=${9} />
      <${ExplodedPanel} idx=${10} />
      <${PartPanel} idx=${11} />
      <${PartPanel} idx=${12} />
      <${PartPanel} idx=${13} />
      <${TestimonialsPanel} idx=${14} />
      <${FaqPanel} idx=${15} />
    </div>
    <${BuyBar} />
    <${SupportChat} />
  `;
}

function Footer() {
  return html`
    <div class="footerinner">
      <div class="footertop">
        <div class="footerbrand">STRATA</div>
        <div class="footercols">
          <div>
            <h4>Services</h4>
            <a href="#product">Standing-Seam Roofing</a>
            <a href="#product">Roof Repair & Leak Detection</a>
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
  const footerRoot = document.getElementById('footer-root');
  createRoot(fixedRoot).render(html`<${React.Fragment}><${Nav} /><${Overlays} /><//>`);
  createRoot(footerRoot).render(html`<${Footer} />`);
}
