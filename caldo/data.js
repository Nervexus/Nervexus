// STRATA — copy and content data.

// A single full-bleed hero photo with the headline/CTA overlaid in a
// frosted card — no scroll-pinned sequence, no crossfade, just a plain
// static section at the top of the page.
export const HERO = {
  photo: './photos/hero-house.webp',
  h: 'The last roof you will ever need.',
  lede: 'Engineered standing-seam systems, hand-fitted by master craftsmen, built for coastal storms and backed by a lifetime transferable warranty.',
};

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
