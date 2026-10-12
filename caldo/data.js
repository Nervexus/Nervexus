// STRATA — scroll pacing, copy and content data.
// `photo` keys into the fixed photo backdrop (see index.html's #photos and
// backdrop.js) — consecutive sections sharing a key hold the same image;
// a change of key crossfades across the section boundary.

export const SECTION_VH = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 170, 120];

export const SECTIONS = [
  // 0 — Hero
  {
    photo: 'aerial',
    eyebrow: 'STRATA',
    kind: 'hero',
    h: 'The last roof you will ever need.',
    lede: 'Engineered standing-seam systems, hand-fitted by master craftsmen — built for coastal storms and backed by a lifetime transferable warranty.',
  },
  // 1 — Problem
  {
    photo: 'removing',
    eyebrow: 'THE PROBLEM', kind: 'text',
    h: 'Most roofs fail by year eight.',
    body: 'Rushed crews, cut-rate underlayment and big-box materials turn a thirty-year roof into an eight-year liability. STRATA is built around one idea: your roof should never be the weakest part of your home.',
  },
  // 2 — Engineering
  {
    photo: 'metal',
    eyebrow: 'ENGINEERING', kind: 'text',
    h: 'Four layers. Zero gaps.',
    body: 'A fully adhered ice-and-water membrane sits beneath an insulated steel deck and a continuous standing-seam shell — stopping water, wind and ice at every seam.',
  },
  // 3 — Performance stat
  {
    photo: 'aerial',
    eyebrow: 'PERFORMANCE', kind: 'stat',
    h: '140mph wind rated. Lifetime warranty.',
    body: 'Independently tested to coastal commercial code and installed to the same tolerance. Put it on once — outlive the mortgage.',
  },
  // 4 — Material
  {
    photo: 'tiles',
    eyebrow: 'MATERIAL', kind: 'text',
    h: 'Copper face. Aerospace steel.',
    body: 'A cold-rolled steel core with a hand-finished copper face, the same alloy family used in architectural façades — sealed against salt air, UV and corrosion for life.',
  },
  // 5 — Seal / seam
  {
    photo: 'metal',
    eyebrow: 'THE SEAL', kind: 'text',
    h: 'A seam that actually seals.',
    body: 'Mechanically double-locked panels form one continuous, watertight shell rated for full submersion testing. No exposed fasteners — nothing for water to find.',
  },
  // 6 — Install / flashing
  {
    photo: 'drill',
    eyebrow: 'INSTALLATION', kind: 'text',
    h: 'One pass. No shortcuts.',
    body: 'Every panel is laser-measured and hand-fitted on site by a certified five-person crew. Most homes are fully dried-in within a single day.',
  },
  // 7 — Capacity / scale
  {
    photo: 'aerial',
    eyebrow: 'SCALE', kind: 'text',
    h: '4,200 sq ft. Installed in three days.',
    body: 'From a single roofline to a full estate, our crews move fast without skipping a layer — fully licensed, bonded and insured in every state we serve.',
  },
  // 8 — Finishes
  {
    photo: 'tiles',
    eyebrow: 'FINISH', kind: 'swatches',
    h: 'Five finishes. One standard.',
    body: 'Finished in small batches: Charcoal, Zinc Gray, Copper Patina, Bone White and Graphite. Every finish weathers the same way — beautifully.',
  },
  // 9 — Craft
  {
    photo: 'crew',
    eyebrow: 'CRAFT', kind: 'text',
    h: 'Built by people who will still be here in 20 years.',
    body: 'Every crew is factory-certified and every install is inspected twice before we leave the site. We would rather do fewer roofs, better.',
  },
  // 10 — Anatomy overview
  {
    photo: 'carrying',
    eyebrow: 'ANATOMY', kind: 'exploded',
    h: 'Four layers, no shortcuts.',
    body: 'Deck, membrane, panel, ridge. Every layer is inspected on its own — nothing here is hidden once it is covered.',
  },
  // 11 — Layer: Ridge cap
  {
    photo: 'working',
    eyebrow: 'LAYER 01', kind: 'part',
    h: 'The ridge cap',
    body: 'Hand-formed copper trim seals the ridge line and vents the attic — the final, most visible layer of the system.',
  },
  // 12 — Layer: Standing-seam panel
  {
    photo: 'drill',
    eyebrow: 'LAYER 02', kind: 'part',
    h: 'The standing seam panel',
    body: '24-gauge steel with a copper face, mechanically seamed on site to aerospace tolerances — rated for a 50-year service life.',
  },
  // 13 — Layer: Membrane & deck
  {
    photo: 'removing',
    eyebrow: 'LAYER 03–04', kind: 'part',
    h: 'The membrane & deck',
    body: 'A fully adhered ice-and-water membrane over an insulated steel deck — the quiet layer underneath doing most of the work.',
  },
  // 14 — Testimonials
  {
    photo: 'crew',
    eyebrow: 'REVIEWS', kind: 'testimonials',
    h: 'Trusted by homeowners who do not like surprises.',
  },
  // 15 — FAQ
  {
    photo: 'aerial',
    eyebrow: 'QUESTIONS', kind: 'faq',
    h: 'Everything you are wondering',
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
