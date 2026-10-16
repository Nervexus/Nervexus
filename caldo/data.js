// STRATA — copy and content data.
//
// The old scroll-pinned cinematic intro (a fixed photo backdrop
// crossfading behind 4 sections) is gone, replaced by plain static
// sections in normal document flow — see app.js's HeroSection,
// ProblemSection, PerformanceSection, and the interactive 3D roof
// build-up in roofbuild.js for what used to be the "Engineering" beat.

export const HERO = {
  photo: 'hero-house',
  h: 'The last roof you will ever need.',
  lede: 'Engineered standing-seam systems, hand-fitted by master craftsmen, built for coastal storms and backed by a lifetime transferable warranty.',
};

export const PROBLEM = {
  photo: 'house-angle2',
  eyebrow: 'THE PROBLEM',
  h: 'Most roofs fail by year eight.',
  body: 'Rushed crews, cut-rate underlayment and big-box materials turn a thirty-year roof into an eight-year liability. STRATA is built around one idea: your roof should never be the weakest part of your home.',
};

export const PERFORMANCE = {
  photo: 'performance-house',
  eyebrow: 'PERFORMANCE',
  h: '140mph wind rated. Lifetime warranty.',
  body: 'Independently tested to coastal commercial code and installed to the same tolerance. Put it on once. Outlive the mortgage.',
};

// Feeds the interactive 3D roof build-up (roofbuild.js). `key` is wired
// directly into that scene's geometry groups — rafter/insul/membrane/
// counter/batten/slate — so it has to stay exactly as is; name/note are
// just the display copy and are safe to edit freely. Reworded from the
// original generic slate-roof labels to STRATA's actual standing-seam
// construction (reusing phrasing already established elsewhere on the
// site — the ice-and-water membrane, the mechanically double-locked,
// no-exposed-fastener panel system) so this doesn't contradict what the
// rest of the page says STRATA actually builds.
export const ROOF_LAYERS = [
  { key: 'rafter', name: 'Rafters', note: 'The structural timber frame underneath. We check for rot, sag and damage before anything new goes back on.' },
  { key: 'insul', name: 'Insulated deck', note: 'Insulated steel decking across the rafters. Most of your heating and cooling bill is decided right here.' },
  { key: 'membrane', name: 'Ice & water membrane', note: 'A fully adhered membrane that seals every seam, the layer that does most of the actual waterproofing work.' },
  { key: 'counter', name: 'Counter battens', note: 'Treated timber furring that lifts the panel system clear of the deck, giving any trapped moisture a clear path to the gutter.' },
  { key: 'batten', name: 'Clip rail', note: 'Concealed fastening rail the panels lock onto. No exposed screws through the roof, anywhere.' },
  { key: 'slate', name: 'Standing-seam shell', note: 'Mechanically double-locked steel panels, finished in your choice of five colors. The only layer you ever see.' },
];

// --- Static page content (normal document flow) ---------------------

// The six-step walkthrough replacing the old photo-card grid — a plain,
// text-only process list (no images) covering estimate through warranty.
export const STEPS = [
  {
    h: 'Free on-site inspection',
    body: 'A certified estimator walks your roof in person, documents every vulnerability and gives you a same-week quote, no obligation.',
  },
  {
    h: 'Material & finish selection',
    body: 'Pick your finish from five standard colors. Every panel is then laser-measured and cut to your roof’s exact geometry before the crew ever arrives.',
  },
  {
    h: 'Tear-off & deck prep',
    body: 'Old roofing comes off down to the deck. Any rot or damage underneath is repaired first. Nothing new goes down over a compromised base.',
  },
  {
    h: 'Ice & water membrane',
    body: 'A fully adhered ice-and-water membrane seals the deck, the quiet layer that does most of the actual waterproofing work.',
  },
  {
    h: 'Standing-seam install',
    body: 'Panels are mechanically double-locked on site to aerospace tolerances. No exposed fasteners, nothing for water to find.',
  },
  {
    h: 'Final walkthrough & warranty',
    body: 'Every install is inspected twice before we leave the site, then backed by a lifetime transferable warranty.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Marisol Reyes', role: 'Homeowner, Lakeview',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&q=80',
    quote: 'They found two rotted rafters mid-tear-off and fixed it the same day, no change order, no surprise invoice.',
  },
  {
    name: 'Dana Okafor', role: 'Property Manager',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80',
    quote: 'We have used STRATA on six rental properties. Zero callbacks in three years. That is unheard of in this business.',
  },
  {
    name: 'Theo Lindqvist', role: 'Homeowner, Coastal Ridge',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=faces&q=80',
    quote: 'Rode out a category 2 without losing a single panel. The crew down the street was not so lucky.',
  },
  {
    name: 'Priya Natarajan', role: 'Homeowner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80',
    quote: 'The estimate was the final price, down to the dollar. That alone made them worth the premium.',
  },
];

export const FAQS = [
  {
    q: 'How long does a STRATA roof actually last?',
    a: 'Our standing-seam systems carry a lifetime, transferable material warranty and a 25-year workmanship guarantee. Most installs last 50+ years with no maintenance.',
  },
  {
    q: 'Is a metal roof noisy in the rain?',
    a: 'No. With a solid deck and fully adhered underlayment, a STRATA roof is quieter than asphalt shingle in a storm. The classic "tin roof" sound comes from open-batten installs, which we do not do.',
  },
  {
    q: 'How long does installation take?',
    a: 'It mostly comes down to roof size and complexity:',
    bullets: [
      'Single-story, 2,000 to 2,500 sq ft, simple gable or hip roof, one tear-off layer: 2 to 3 days',
      '3,000+ sq ft, steep pitches, multiple valleys or dormers: 4 to 6 days',
      'Multi-structure properties (house plus garage or guest house): scoped and quoted as separate timelines',
      'More than one existing roofing layer to tear off: adds time',
      'Wet or high-wind days: built into the schedule as weather holds, never rushed through',
    ],
    note: 'Whatever the estimate comes out to, it is written into your contract as a firm completion date before work begins, not a moving target.',
  },
  {
    q: 'Do you work with insurance claims?',
    a: 'Yes, we manage storm and insurance claims directly with your adjuster, from inspection through final sign-off.',
  },
  {
    q: 'What is the warranty?',
    a: 'Lifetime material warranty plus a 25-year workmanship guarantee, fully transferable to the next owner at no cost.',
  },
  {
    q: 'Do you offer financing?',
    a: 'Yes, 0% financing is available for qualified homeowners, with same-as-cash terms up to 18 months.',
  },
];

export const SWATCHES = [
  { name: 'Charcoal', hex: '#2c2f33' },
  { name: 'Zinc Gray', hex: '#5b6066' },
  { name: 'Copper Patina', hex: '#a9672f' },
  { name: 'Bone White', hex: '#e7e2d6' },
  { name: 'Graphite', hex: '#1f2126' },
];

// The static <img> src for each of the 3 plain intro sections above.
export const PHOTO_SRC = {
  'hero-house': './photos/hero-house.webp',
  'house-angle2': './photos/house-angle2.webp',
  'performance-house': './photos/performance-house.webp',
};
