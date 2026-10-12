// STRATA — scroll keyframes, copy and content data.
// cam/tgt are world-space vectors for the Three.js camera; gap is the
// 0..~1.3 explosion factor applied to the roof system's four layers.

export const SECTION_VH = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 170, 120];

export const SECTIONS = [
  // 0 — Hero
  {
    cam: [0, 0.55, 3.6], tgt: [0, 0.08, 0], gap: 0, fov: 30,
    eyebrow: 'STRATA',
    kind: 'hero',
    h: 'The last roof you will ever need.',
    lede: 'Engineered standing-seam systems, hand-fitted by master craftsmen — built for coastal storms and backed by a lifetime transferable warranty.',
  },
  // 1 — Problem
  {
    cam: [1.6, 0.62, 3.1], tgt: [0, 0.1, 0], gap: 0, fov: 28,
    eyebrow: 'THE PROBLEM', kind: 'text',
    h: 'Most roofs fail by year eight.',
    body: 'Rushed crews, cut-rate underlayment and big-box materials turn a thirty-year roof into an eight-year liability. STRATA is built around one idea: your roof should never be the weakest part of your home.',
  },
  // 2 — Engineering
  {
    cam: [-1.7, 0.58, 2.9], tgt: [0, 0.12, 0], gap: 0.16, fov: 27,
    eyebrow: 'ENGINEERING', kind: 'text',
    h: 'Four layers. Zero gaps.',
    body: 'A fully adhered ice-and-water membrane sits beneath an insulated steel deck and a continuous standing-seam shell — stopping water, wind and ice at every seam.',
  },
  // 3 — Performance stat
  {
    cam: [0, 0.85, 3.3], tgt: [0, 0.18, 0], gap: 0, fov: 27,
    eyebrow: 'PERFORMANCE', kind: 'stat',
    h: '140mph wind rated. Lifetime warranty.',
    body: 'Independently tested to coastal commercial code and installed to the same tolerance. Put it on once — outlive the mortgage.',
  },
  // 4 — Material
  {
    cam: [1.9, 0.42, 2.6], tgt: [0, 0.1, 0], gap: 0, fov: 27,
    eyebrow: 'MATERIAL', kind: 'text',
    h: 'Copper face. Aerospace steel.',
    body: 'A cold-rolled steel core with a hand-finished copper face, the same alloy family used in architectural façades — sealed against salt air, UV and corrosion for life.',
  },
  // 5 — Seal / seam
  {
    cam: [0, 0.95, 2.3], tgt: [0, 0.3, 0], gap: 0.4, fov: 24,
    eyebrow: 'THE SEAL', kind: 'text',
    h: 'A seam that actually seals.',
    body: 'Mechanically double-locked panels form one continuous, watertight shell rated for full submersion testing. No exposed fasteners — nothing for water to find.',
  },
  // 6 — Install / flashing
  {
    cam: [-1.5, 0.78, 2.5], tgt: [0, 0.24, 0], gap: 0.24, fov: 26,
    eyebrow: 'INSTALLATION', kind: 'text',
    h: 'One pass. No shortcuts.',
    body: 'Every panel is laser-measured and hand-fitted on site by a certified five-person crew. Most homes are fully dried-in within a single day.',
  },
  // 7 — Capacity / scale
  {
    cam: [0, 0.3, 3.7], tgt: [0, 0.07, 0], gap: 0, fov: 32,
    eyebrow: 'SCALE', kind: 'text',
    h: '4,200 sq ft. Installed in three days.',
    body: 'From a single roofline to a full estate, our crews move fast without skipping a layer — fully licensed, bonded and insured in every state we serve.',
  },
  // 8 — Finishes
  {
    cam: [1.6, 0.55, 2.9], tgt: [0, 0.1, 0], gap: 0, fov: 27,
    eyebrow: 'FINISH', kind: 'swatches',
    h: 'Five finishes. One standard.',
    body: 'Finished in small batches: Charcoal, Zinc Gray, Copper Patina, Bone White and Graphite. Every finish weathers the same way — beautifully.',
  },
  // 9 — Craft
  {
    cam: [-1.7, 0.52, 2.9], tgt: [0, 0.1, 0], gap: 0, fov: 27,
    eyebrow: 'CRAFT', kind: 'text',
    h: 'Built by people who will still be here in 20 years.',
    body: 'Every crew is factory-certified and every install is inspected twice before we leave the site. We would rather do fewer roofs, better.',
  },
  // 10 — Exploded view
  {
    cam: [0, 0.15, 4.8], tgt: [0, 0.07, 0], gap: 1.3, fov: 42,
    eyebrow: 'ANATOMY', kind: 'exploded',
    h: 'Four layers, no shortcuts.',
    body: 'Deck, membrane, panel, ridge. Every layer is inspected on its own — nothing here is hidden once it is covered.',
  },
  // 11 — Layer: Ridge cap (top, exploded world y ≈ 0.93)
  {
    cam: [0.7, 1.05, 2.3], tgt: [0, 0.93, 0], gap: 1.3, fov: 24,
    eyebrow: 'LAYER 01', kind: 'part',
    h: 'The ridge cap',
    body: 'Hand-formed copper trim seals the ridge line and vents the attic — the final, most visible layer of the system.',
  },
  // 12 — Layer: Standing-seam panel (exploded world y ≈ 0.45)
  {
    cam: [0.75, 0.62, 2.1], tgt: [0, 0.45, 0], gap: 1.3, fov: 25,
    eyebrow: 'LAYER 02', kind: 'part',
    h: 'The standing seam panel',
    body: '24-gauge steel with a copper face, mechanically seamed on site to aerospace tolerances — rated for a 50-year service life.',
  },
  // 13 — Layer: Membrane & deck (framed between membrane -0.23 and deck -0.79)
  {
    cam: [0.8, -0.35, 2.4], tgt: [0, -0.5, 0], gap: 1.3, fov: 28,
    eyebrow: 'LAYER 03–04', kind: 'part',
    h: 'The membrane & deck',
    body: 'A fully adhered ice-and-water membrane over an insulated steel deck — the quiet layer underneath doing most of the work.',
  },
  // 14 — Testimonials
  {
    cam: [2.0, 0.55, 2.8], tgt: [0.5, 0.15, 0], gap: 0.45, fov: 27,
    eyebrow: 'REVIEWS', kind: 'testimonials',
    h: 'Trusted by homeowners who do not like surprises.',
  },
  // 15 — FAQ
  {
    cam: [-2.0, 0.55, 2.8], tgt: [-0.5, 0.15, 0], gap: 0.2, fov: 27,
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
