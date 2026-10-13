// STRATA — scroll pacing, copy and content data.
//
// The site is now two layers: a short, cinematic scroll-pinned INTRO
// (4 sections, driven by the fixed photo backdrop in backdrop.js) that
// dissolves into a normal, statically-flowing page underneath holding
// everything else — services, finishes, anatomy, testimonials, FAQ.
//
// `photo` keys into the fixed photo backdrop (see index.html's #photos) —
// consecutive intro sections sharing a key hold the same image; a change
// of key crossfades across the section boundary. `voidRender: true` marks
// a section whose photo is one of the floating-studio-void renders
// (object-fit:contain, no Ken Burns, text sits below it on mobile) rather
// than a full-bleed environmental photo — see style.css's .ov-void and
// the #photos img[data-photo=...] overrides.

export const SECTION_VH = [150, 150, 150, 150];

export const SECTIONS = [
  // 0 — Hero
  {
    photo: 'hero-house',
    voidRender: true,
    kind: 'hero',
    h: 'The last roof you will ever need.',
    lede: 'Engineered standing-seam systems, hand-fitted by master craftsmen — built for coastal storms and backed by a lifetime transferable warranty.',
  },
  // 1 — Problem
  {
    photo: 'house-angle2',
    voidRender: true,
    eyebrow: 'THE PROBLEM', kind: 'text',
    h: 'Most roofs fail by year eight.',
    body: 'Rushed crews, cut-rate underlayment and big-box materials turn a thirty-year roof into an eight-year liability. STRATA is built around one idea: your roof should never be the weakest part of your home.',
  },
  // 2 — Engineering
  {
    photo: 'engineering-layers',
    voidRender: true,
    eyebrow: 'ENGINEERING', kind: 'text',
    h: 'Four layers. Zero gaps.',
    body: 'A fully adhered ice-and-water membrane sits beneath an insulated steel deck and a continuous standing-seam shell — stopping water, wind and ice at every seam.',
  },
  // 3 — Performance stat
  {
    photo: 'performance-house',
    voidRender: true,
    eyebrow: 'PERFORMANCE', kind: 'stat',
    h: '140mph wind rated. Lifetime warranty.',
    body: 'Independently tested to coastal commercial code and installed to the same tolerance. Put it on once — outlive the mortgage.',
  },
];

// --- Static page content (normal document flow, below the intro) ---------

// The six-step walkthrough replacing the old photo-card grid — a plain,
// text-only process list (no images) covering estimate through warranty.
export const STEPS = [
  {
    h: 'Free on-site inspection',
    body: 'A certified estimator walks your roof in person, documents every vulnerability and gives you a same-week quote — no obligation.',
  },
  {
    h: 'Material & finish selection',
    body: 'Pick your finish from five standard colors. Every panel is then laser-measured and cut to your roof’s exact geometry before the crew ever arrives.',
  },
  {
    h: 'Tear-off & deck prep',
    body: 'Old roofing comes off down to the deck. Any rot or damage underneath is repaired first — nothing new goes down over a compromised base.',
  },
  {
    h: 'Ice & water membrane',
    body: 'A fully adhered ice-and-water membrane seals the deck — the quiet layer that does most of the actual waterproofing work.',
  },
  {
    h: 'Standing-seam install',
    body: 'Panels are mechanically double-locked on site to aerospace tolerances. No exposed fasteners — nothing for water to find.',
  },
  {
    h: 'Final walkthrough & warranty',
    body: 'Every install is inspected twice before we leave the site, then backed by a lifetime transferable warranty.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Marisol Reyes', role: 'Homeowner, Lakeview',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'They found two rotted rafters mid-tear-off and fixed it the same day — no change order, no surprise invoice.',
  },
  {
    name: 'Dana Okafor', role: 'Property Manager',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'We have used STRATA on six rental properties. Zero callbacks in three years — that is unheard of in this business.',
  },
  {
    name: 'Theo Lindqvist', role: 'Homeowner, Coastal Ridge',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'Rode out a category 2 without losing a single panel. The crew down the street was not so lucky.',
  },
  {
    name: 'Priya Natarajan', role: 'Homeowner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'The estimate was the final price, down to the dollar. That alone made them worth the premium.',
  },
];

export const FAQS = [
  {
    q: 'How long does a STRATA roof actually last?',
    a: 'Our standing-seam systems carry a lifetime, transferable material warranty and a 25-year workmanship guarantee — most installs last 50+ years with no maintenance.',
  },
  {
    q: 'Is a metal roof noisy in the rain?',
    a: 'No. With a solid deck and fully adhered underlayment, a STRATA roof is quieter than asphalt shingle in a storm. The classic "tin roof" sound comes from open-batten installs, which we do not do.',
  },
  {
    q: 'How long does installation take?',
    a: 'Most homes are fully installed in 2–4 days. Larger or multi-structure properties are scoped up front, with a firm completion date written into your contract.',
  },
  {
    q: 'Do you work with insurance claims?',
    a: 'Yes — we manage storm and insurance claims directly with your adjuster, from inspection through final sign-off.',
  },
  {
    q: 'What is the warranty?',
    a: 'Lifetime material warranty plus a 25-year workmanship guarantee, fully transferable to the next owner at no cost.',
  },
  {
    q: 'Do you offer financing?',
    a: 'Yes — 0% financing is available for qualified homeowners, with same-as-cash terms up to 18 months.',
  },
];

export const SWATCHES = [
  { name: 'Charcoal', hex: '#2c2f33' },
  { name: 'Zinc Gray', hex: '#5b6066' },
  { name: 'Copper Patina', hex: '#a9672f' },
  { name: 'Bone White', hex: '#e7e2d6' },
  { name: 'Graphite', hex: '#1f2126' },
];

// Maps backdrop photo keys to a static <img> src for use in the normal
// page content below the intro (same photos, reused inline).
export const PHOTO_SRC = {
  'hero-house': './photos/hero-house.webp',
  'house-angle2': './photos/house-angle2.webp',
  'engineering-layers': './photos/engineering-layers.webp',
  'performance-house': './photos/performance-house.webp',
  aerial: 'https://images.unsplash.com/photo-1506092309076-af15fb0051e3?w=1200&q=80&auto=format&fit=crop',
  removing: 'https://images.unsplash.com/photo-1633759593085-1eaeb724fc88?w=1200&q=80&auto=format&fit=crop',
  metal: 'https://images.unsplash.com/photo-1673645652350-6a4c31c1c78f?w=1200&q=80&auto=format&fit=crop',
  drill: 'https://images.unsplash.com/photo-1635424824849-1b09bdcc55b1?w=1200&q=80&auto=format&fit=crop',
  crew: 'https://images.unsplash.com/photo-1635424709961-f3a150459ad4?w=1200&q=80&auto=format&fit=crop',
  tiles: 'https://images.unsplash.com/photo-1518736346281-76873166a64a?w=1200&q=80&auto=format&fit=crop',
  carrying: 'https://images.unsplash.com/photo-1643225523483-e2c434191bba?w=1200&q=80&auto=format&fit=crop',
  working: 'https://images.unsplash.com/photo-1726589004565-bedfba94d3a2?w=1200&q=80&auto=format&fit=crop',
};
