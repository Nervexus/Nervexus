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

export const FEATURES = [
  {
    photo: 'tiles',
    eyebrow: 'MATERIAL',
    h: 'Copper face. Aerospace steel.',
    body: 'A cold-rolled steel core with a hand-finished copper face, the same alloy family used in architectural façades — sealed against salt air, UV and corrosion for life.',
  },
  {
    photo: 'metal',
    eyebrow: 'THE SEAL',
    h: 'A seam that actually seals.',
    body: 'Mechanically double-locked panels form one continuous, watertight shell rated for full submersion testing. No exposed fasteners — nothing for water to find.',
  },
  {
    photo: 'drill',
    eyebrow: 'INSTALLATION',
    h: 'One pass. No shortcuts.',
    body: 'Every panel is laser-measured and hand-fitted on site by a certified five-person crew. Most homes are fully dried-in within a single day.',
  },
  {
    photo: 'aerial',
    eyebrow: 'SCALE',
    h: '4,200 sq ft. Installed in three days.',
    body: 'From a single roofline to a full estate, our crews move fast without skipping a layer — fully licensed, bonded and insured in every state we serve.',
  },
  {
    photo: 'crew',
    eyebrow: 'CRAFT',
    h: 'Built by people who will still be here in 20 years.',
    body: 'Every crew is factory-certified and every install is inspected twice before we leave the site. We would rather do fewer roofs, better.',
  },
];

export const ANATOMY = [
  {
    photo: 'tiles',
    label: 'Layer 01',
    h: 'The deck',
    body: 'An insulated steel deck — the structural base every other layer builds on.',
  },
  {
    photo: 'removing',
    label: 'Layer 02',
    h: 'The membrane',
    body: 'A fully adhered ice-and-water membrane, the quiet layer doing most of the waterproofing work.',
  },
  {
    photo: 'drill',
    label: 'Layer 03',
    h: 'The standing seam panel',
    body: '24-gauge steel with a copper face, mechanically seamed on site to aerospace tolerances.',
  },
  {
    photo: 'working',
    label: 'Layer 04',
    h: 'The ridge cap',
    body: 'Hand-formed copper trim seals the ridge line and vents the attic.',
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
