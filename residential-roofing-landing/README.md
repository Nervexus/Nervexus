# residential-roofing-landing

A self-contained residential roofing landing page, unrelated to the
Nervexus app — built as a standalone demo/template under a placeholder
brand, "Thornridge Roofing Co."

## Files

| file                | what it is                                                        |
|----------------------|--------------------------------------------------------------------|
| `index.html`         | the single page — hero, services, projects, material comparison, process, testimonials, about, contact |
| `style.css`          | all styling                                                        |
| `main.js`            | projects data/render, detail modal, material comparison tool, scroll reveal, sticky header, mobile nav, stat counters, testimonial slider, contact form, scroll progress bar |
| `favicon.svg`        | monogram favicon                                                   |
| `hero-bg.jpg`        | hero background photo                                              |
| `shape-<shape>.jpg`   | each project's card thumbnail (one per roof shape in the `PROJECTS` array) |
| `shape-<shape>-2.jpg`, `-3.jpg` | extra angles/detail shots for that project's modal gallery (2-3 photos per project, not a fixed count) |
| `founder.jpg`        | the About section's founder photo                                  |

## Features

- **Project gallery carousel doubling as client stories** — six recent projects, one per roof shape (gable, hip, Dutch gable, dormer, shed, mansard), each built in a different material so the gallery shows range in both form and material. Each card pairs the completed-roof photo with that homeowner's testimonial quote.
- **Per-project photo gallery in the detail modal** — clicking a project opens a modal with 2-3 photos of that job (prev/next arrows, dots, a counter, and left/right arrow-key navigation), not just one static image. Each project's `images` array in `PROJECTS` (in `main.js`) drives it — add more entries there to add more photos. Counts vary by project on purpose; see the note below on why they're not all identical stock-photo sets pretending to be one real property.
- **Material comparison tool** — pick any two of five roofing materials to compare lifespan, typical cost, maintenance, and what each is best suited for. Data lives in the `MATERIALS` array at the top of `main.js`.
- **Animated hero stats**, scroll-reveal sections, sticky header, mobile nav, and a scroll progress bar — all vanilla JS, no dependencies.

Nothing is hotlinked — every photo on the page, hero included, is a
free-licensed Unsplash photo downloaded and checked into the repo rather
than referenced by URL, so the page renders identically offline and never
breaks on a dead image link. All are used under the Unsplash License (free
for commercial and non-commercial use; attribution not required but
credited here as good practice). None are of a real project — swap them
for actual project photography before this goes live for a real company.

| file                  | subject                                   | credit |
|------------------------|--------------------------------------------|--------|
| `hero-bg.jpg`          | two roofers working on a tile/slate roof    | Immo Wegmann — unsplash.com/photos/sKiCvM6sPtU |
| `shape-gable.jpg`      | steep gable roofline, dramatic sunset light | Valentin — unsplash.com/photos/mzkx33pU2go |
| `shape-gable-2.jpg`    | close-up of fresh cedar shake shingles      | Peter Burdon — unsplash.com/photos/SNs1KMPF82Q |
| `shape-gable-3.jpg`    | roofer tearing off old shingles (in-progress) | Zohair Mirza — unsplash.com/photos/GXITWKvgm-k |
| `shape-hip.jpg`        | modern house, clean hip roof, dark dimensional shingle | Troy Mortier — unsplash.com/photos/HckCpdBDeDk |
| `shape-hip-2.jpg`      | aerial view, house with dimensional shingle roof | Paragon Exterior — unsplash.com/photos/-uvuU43FAwQ |
| `shape-hip-3.jpg`      | close-up of two dormer windows on a shingled roof | Patrick Wadden — unsplash.com/photos/AE9VxuuxfQ4 |
| `shape-dutch.jpg`      | farmhouse with hip-and-gable roofline, copper standing-seam | Roger Starnes Sr — unsplash.com/photos/a-nice-stone-front-modern-farmhouse-CMbIJY92NJ0 |
| `shape-dutch-2.jpg`    | same farmhouse style, second angle, copper standing-seam | Roger Starnes Sr — unsplash.com/photos/NFjz6BSzDXQ |
| `shape-dutch-3.jpg`    | close-up of a green standing-seam metal roof | Earl Wilcox — unsplash.com/photos/-S4l2EsOQhc |
| `shape-dormer.jpg`     | brick cottage with tiled roof and dormer windows | T (Tanya Barrow) — unsplash.com/photos/y4iBCffm3n0 |
| `shape-dormer-2.jpg`   | white cottage with tiled roof and dormer windows | T (Tanya Barrow) — unsplash.com/photos/my9L4aEug6k |
| `shape-dormer-3.jpg`   | white mansion with grey clay tile roof      | Edwin Petrus — unsplash.com/photos/_TJ5YqJlJAE |
| `shape-shed.jpg`       | modern home with an angled shed/skillion roofline | Brad Chapman — unsplash.com/photos/Vfdqsbjrrjg |
| `shape-shed-2.jpg`     | brick farmhouse with a dark standing-seam metal roof | Roger Starnes Sr — unsplash.com/photos/eYHIj0NQTPo |
| `shape-mansard.jpg`    | historic brick house with a slate mansard roof | Rylan Hoots — unsplash.com/photos/qfCWOH_2L0A |
| `shape-mansard-2.jpg`  | close-up of scalloped dark slate tiles      | Alexander Philipp — unsplash.com/photos/Mh5LFaR5arM |
| `shape-mansard-3.jpg`  | close-up of an ornate slate roof with gabled dormers | Roger Starnes Sr — unsplash.com/photos/jCheJgJVN0g |
| `founder.jpg`          | studio headshot, founder placeholder        | The Connected Narrative — unsplash.com/photos/N8lRH2uxih4 |

All extra gallery angles are free-licensed stock photos of *different* real
properties sharing a similar roof style/material to the project's main
photo — not six angles of one literal house (that level of access doesn't
exist in stock photography). They're framed as general exterior/detail
shots rather than claiming to be the same address. Swap them for actual
job-site photography before this goes live for a real company.

## Rebranding

Everything is placeholder content: the brand name, founder name/bio,
phone, email, service area, license number, and all project/testimonial
data. Search `index.html` for "Thornridge", "Marcus Thorn", and the
contact-info block to replace them.

## Things worth knowing before editing

- **`.reveal` is fail-open on purpose.** Sections start hidden only when
  `<head>` has set `html.js-reveal`, and a 3s watchdog strips that class if
  `main.js` never confirms the observer started. Keep that shape — an
  unconditional `opacity:0` would leave the page blank below the hero if the
  script ever fails to load.
- **Hero stat numbers render their final value as static text** (e.g.
  `0+` reads oddly for a beat before JS counts up) so the page is still
  correct with JavaScript disabled or before `main.js` runs.
- **The contact form has no backend.** Submitting it swaps in a static
  "thank you" state client-side; wire it to a real endpoint (or a service
  like Formspree) before this goes live.
- **The contact section's map is a real OpenStreetMap embed** (no API key
  needed), but it points at a real waterfront location used purely for a
  believable visual — it does not correspond to the fictional service area
  above it. The on-map caption says so.

## Viewing it

It's static — open `index.html` directly in a browser, or serve the folder
with any static file server (e.g. `python3 -m http.server` from this
directory).
