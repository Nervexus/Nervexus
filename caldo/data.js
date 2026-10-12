// CALDO — scroll keyframes, copy and content data.
// cam/tgt are world-space vectors for the Three.js camera; gap is the
// 0..~1.3 explosion factor applied to the flask's four parts.

export const SECTION_VH = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 170, 120];

export const SECTIONS = [
  // 0 — Hero
  {
    cam: [0, 0.95, 3.5], tgt: [0, 0.78, 0], gap: 0, fov: 32,
    eyebrow: 'CALDO',
    kind: 'hero',
    h: 'Coffee that never goes cold',
    lede: 'A vacuum-sealed flask engineered to hold heat for 12 hours and cold brew for 18 — so the first sip tastes exactly like the last.',
  },
  // 1 — Problem
  {
    cam: [1.7, 1.05, 2.55], tgt: [0, 0.8, 0], gap: 0, fov: 32,
    eyebrow: 'THE PROBLEM', kind: 'text',
    h: 'Cold by 10am.',
    body: 'Most travel mugs lose their fight with heat before lunch. Caldo is built around one idea: your coffee shouldn’t have an expiration time.',
  },
  // 2 — Vacuum wall
  {
    cam: [-1.85, 0.95, 2.0], tgt: [0, 0.85, 0], gap: 0.16, fov: 30,
    eyebrow: 'ENGINEERING', kind: 'text',
    h: 'Two walls. Zero compromise.',
    body: 'A medical-grade vacuum gap sits between double layers of 18/8 stainless steel, stopping heat transfer at the molecular level.',
  },
  // 3 — Retention claim
  {
    cam: [0, 1.35, 2.75], tgt: [0, 0.92, 0], gap: 0, fov: 30,
    eyebrow: 'PERFORMANCE', kind: 'stat',
    h: '12 hours hot. 18 hours cold.',
    body: 'Independently tested at third-party labs. Fill it at 6am — it’s still sipping-hot at dinner.',
  },
  // 4 — Material
  {
    cam: [2.05, 0.6, 1.55], tgt: [0, 0.75, 0], gap: 0, fov: 30,
    eyebrow: 'MATERIAL', kind: 'text',
    h: 'Aerospace-grade steel.',
    body: 'The same 18/8 alloy used in surgical tooling, brushed by hand and sealed against rust, odor and flavor transfer — forever.',
  },
  // 5 — Lid / seal
  {
    cam: [0, 1.88, 1.3], tgt: [0, 1.66, 0], gap: 0.38, fov: 26,
    eyebrow: 'THE SEAL', kind: 'text',
    h: 'A lid that actually seals.',
    body: 'A silicone gasket and threaded cap form a 360° seal rated for full inversion. Toss it in your bag — it will not leak.',
  },
  // 6 — Pour spout
  {
    cam: [-1.25, 1.72, 1.4], tgt: [0, 1.62, 0], gap: 0.22, fov: 28,
    eyebrow: 'DRINKING', kind: 'text',
    h: 'One hand. One motion.',
    body: 'The spout opens with a quarter-turn and closes with a click you can feel. No buttons, no spring to break.',
  },
  // 7 — Capacity
  {
    cam: [0, 0.42, 3.25], tgt: [0, 0.62, 0], gap: 0, fov: 34,
    eyebrow: 'CAPACITY', kind: 'text',
    h: '592ml. Built for a full day.',
    body: 'Enough for a long commute, a half-day hike, or back-to-back meetings — refill once, not six times.',
  },
  // 8 — Finishes
  {
    cam: [1.45, 0.85, 2.15], tgt: [0, 0.8, 0], gap: 0, fov: 30,
    eyebrow: 'FINISH', kind: 'swatches',
    h: 'Five finishes. One standard.',
    body: 'Anodized in small batches: Slate, Clay, Moss, Bone and Midnight. Every finish ages the same way — gracefully.',
  },
  // 9 — Craft
  {
    cam: [-1.65, 0.72, 2.0], tgt: [0, 0.8, 0], gap: 0, fov: 30,
    eyebrow: 'CRAFT', kind: 'text',
    h: 'Made to outlast the trend.',
    body: 'Each flask is pressure-tested twice and hand-inspected before it ships. We’d rather make fewer, better.',
  },
  // 10 — Exploded view (centered on the full spread so all 4 parts fit)
  {
    cam: [0, 0.3, 5.3], tgt: [0, 0.05, 0], gap: 1.3, fov: 46,
    eyebrow: 'ANATOMY', kind: 'exploded',
    h: 'Four parts, no more.',
    body: 'Cap, seal, body, base. Every part unscrews, every part is replaceable — nothing here is designed to be thrown away.',
  },
  // 11 — Part: Cap (exploded center ≈ y 1.61)
  {
    cam: [0.5, 1.8, 1.9], tgt: [0, 1.61, 0], gap: 1.3, fov: 28,
    eyebrow: 'PART 01', kind: 'part',
    h: 'The cap',
    body: 'Machined steel, threaded to the body with aircraft-spec tolerances.',
  },
  // 12 — Part: Stopper (exploded center ≈ y 1.03)
  {
    cam: [0.5, 1.2, 1.85], tgt: [0, 1.03, 0], gap: 1.3, fov: 27,
    eyebrow: 'PART 02', kind: 'part',
    h: 'The seal',
    body: 'Food-grade silicone, rated for 10,000 open-close cycles.',
  },
  // 13 — Part: Body & Base (framed between body center -0.32 and base top -1.53)
  {
    cam: [0.6, -0.15, 2.1], tgt: [0, -0.5, 0], gap: 1.3, fov: 32,
    eyebrow: 'PART 03–04', kind: 'part',
    h: 'The body & base',
    body: 'Double-wall vacuum steel with a non-slip steel base — stable on any desk, any dash.',
  },
  // 14 — Testimonials
  {
    cam: [2.35, 0.82, 1.55], tgt: [0.55, 0.8, 0], gap: 0.45, fov: 30,
    eyebrow: 'REVIEWS', kind: 'testimonials',
    h: 'Loved by people who hate cold coffee.',
  },
  // 15 — FAQ
  {
    cam: [-2.35, 0.82, 1.55], tgt: [-0.55, 0.8, 0], gap: 0.18, fov: 30,
    eyebrow: 'QUESTIONS', kind: 'faq',
    h: 'Everything you’re wondering',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Marisol Reyes', role: 'Early riser',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'I fill it at 5:30am and it’s still too hot to drink by the time I park at work. That’s the whole pitch.',
  },
  {
    name: 'Dana Okafor', role: 'Field nurse',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'Twelve-hour shifts, one fill. I haven’t bought a bad vending-machine coffee since January.',
  },
  {
    name: 'Theo Lindqvist', role: 'Remote, mostly outside',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'Dropped it from a roof rack at 40mph. Dented, still sealed, still hot. Wild.',
  },
  {
    name: 'Priya Natarajan', role: 'Night-shift resident',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces&q=80',
    quote: 'The lid doesn’t leak in my bag — first flask in a decade I can say that about.',
  },
];

export const FAQS = [
  {
    q: 'How long does it actually keep coffee hot?',
    a: '12 hours hot, 18 hours cold, tested at third-party labs at 20°C ambient. Real-world results vary slightly with fill temperature and altitude.',
  },
  {
    q: 'Is it dishwasher safe?',
    a: 'The body and base are top-rack safe. We recommend hand-washing the seal to extend its lifespan past 10,000 cycles.',
  },
  {
    q: 'Does it fit in a car cup holder?',
    a: 'Yes — Caldo is sized to 7.4cm at its widest point, which fits every standard cup holder we’ve tested.',
  },
  {
    q: 'What’s the warranty?',
    a: 'Every Caldo ships with a lifetime warranty against manufacturing defects. Parts are sold separately if something wears out.',
  },
  {
    q: 'Can I buy replacement parts?',
    a: 'Yes. Cap, seal and base are all sold individually — nothing about Caldo is designed to be thrown away.',
  },
  {
    q: 'Where is it made?',
    a: 'Designed in-house and manufactured in a family-run steel works we’ve partnered with since day one.',
  },
];

export const SWATCHES = [
  { name: 'Slate', hex: '#5b6066' },
  { name: 'Clay', hex: '#c4551f' },
  { name: 'Moss', hex: '#5e6b4f' },
  { name: 'Bone', hex: '#e7e2d6' },
  { name: 'Midnight', hex: '#20232b' },
];

export const OG_IMAGE = 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/234405b5-3e0b-423d-a86d-c2171446bfe3_original.png';
