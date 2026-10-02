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
| `shape-*.jpg`         | the 6 project photos (one per roof shape in the `PROJECTS` array)  |
| `founder.jpg`        | the About section's founder photo                                  |

## Features

- **Project gallery carousel doubling as client stories** — six recent projects, one per roof shape (gable, hip, Dutch gable, dormer, shed, mansard), each built in a different material so the gallery shows range in both form and material. Each card pairs the completed-roof photo with that homeowner's testimonial quote; the detail modal adds full specs (sqft, roof pitch, year completed), a description, the quote, and a feature list.
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
| `shape-hip.jpg`        | modern house, clean hip roof, dark dimensional shingle | Troy Mortier — unsplash.com/photos/HckCpdBDeDk |
| `shape-dutch.jpg`      | farmhouse with hip-and-gable roofline, copper standing-seam | Roger Starnes Sr — unsplash.com/photos/a-nice-stone-front-modern-farmhouse-CMbIJY92NJ0 |
| `shape-dormer.jpg`     | brick cottage with tiled roof and dormer windows | T (Tanya Barrow) — unsplash.com/photos/y4iBCffm3n0 |
| `shape-shed.jpg`       | modern home with an angled shed/skillion roofline | Brad Chapman — unsplash.com/photos/Vfdqsbjrrjg |
| `shape-mansard.jpg`    | historic brick house with a slate mansard roof | Rylan Hoots — unsplash.com/photos/qfCWOH_2L0A |
| `founder.jpg`          | studio headshot, founder placeholder        | The Connected Narrative — unsplash.com/photos/N8lRH2uxih4 |

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
