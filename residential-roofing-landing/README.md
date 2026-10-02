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
| `project-*.jpg`      | the 6 project photos (one per entry in the `PROJECTS` array)       |
| `founder.jpg`        | the About section's founder photo                                  |

## Features

- **Project gallery carousel doubling as client stories** — six recent projects, one per roofing material/service, each card pairing the completed-roof photo with that homeowner's testimonial quote. The detail modal adds full specs (sqft, roof pitch, year completed), a description, the quote, and a feature list.
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
| `project-slate.jpg`    | close-up of a fresh dark slate roof, diamond pattern | Kay Nauwelaerts — unsplash.com/photos/RECyNQXnVas |
| `project-metal.jpg`    | modern house, green standing-seam metal roof | Earl Wilcox — unsplash.com/photos/-S4l2EsOQhc |
| `project-tile.jpg`     | white house with grey clay tile roof        | Edwin Petrus — unsplash.com/photos/_TJ5YqJlJAE |
| `project-shake.jpg`    | close-up of fresh cedar shake shingles      | Peter Burdon — unsplash.com/photos/SNs1KMPF82Q |
| `project-shingle.jpg`  | aerial view, house with new dimensional shingle roof | Paragon Exterior — unsplash.com/photos/-uvuU43FAwQ |
| `project-reroof.jpg`   | close-up of a fresh dark grey tile roof     | Michael Jasmund — unsplash.com/photos/m_vEaZizd2s |
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
