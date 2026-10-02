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

- **Project gallery carousel** — six recent projects, one per roofing material/service, each with specs (sqft, roof pitch, year completed) and a detail modal with description + feature list.
- **Material comparison tool** — pick any two of five roofing materials to compare lifespan, typical cost, maintenance, and what each is best suited for. Data lives in the `MATERIALS` array at the top of `main.js`.
- **Animated hero stats**, scroll-reveal sections, sticky header, mobile nav, scroll progress bar, and a testimonial slider — all vanilla JS, no dependencies.

Nothing is hotlinked — every photo on the page, hero included, is a
free-licensed Unsplash photo downloaded and checked into the repo rather
than referenced by URL, so the page renders identically offline and never
breaks on a dead image link. All are used under the Unsplash License (free
for commercial and non-commercial use; attribution not required but
credited here as good practice). None are of a real project — swap them
for actual project photography before this goes live for a real company.

| file                  | subject                                   | credit |
|------------------------|--------------------------------------------|--------|
| `hero-bg.jpg`          | modern house exterior at dusk, lit interior | Michael Brown — unsplash.com/photos/G48h926L2qo |
| `project-slate.jpg`    | ornate slate roof with gabled dormers      | Mark Stuckey — unsplash.com/photos/u7F0MrTkjSI |
| `project-metal.jpg`    | modern house, green standing-seam metal roof | Earl Wilcox — unsplash.com/photos/-S4l2EsOQhc |
| `project-tile.jpg`     | white house with grey clay tile roof        | Edwin Petrus — unsplash.com/photos/_TJ5YqJlJAE |
| `project-shake.jpg`    | weathered wood shingle roof with dormers    | Patrick Wadden — unsplash.com/photos/AE9VxuuxfQ4 |
| `project-shingle.jpg`  | modern two-story house, dark shingle roof   | Troy Mortier — unsplash.com/photos/HckCpdBDeDk |
| `project-reroof.jpg`   | roofer tearing off old shingles             | Zohair Mirza — unsplash.com/photos/GXITWKvgm-k |
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
