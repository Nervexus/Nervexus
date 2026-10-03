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
| `shape-<shape>.jpg`   | each project's card thumbnail / first gallery photo (one per roof shape in the `PROJECTS` array) |
| `shape-dutch-2.jpg`  | a second, genuinely different angle of the Harrow Farmhouse — see below |
| `shape-gable-2.jpg`, `shape-gable-3.jpg` | two more photos of the Oakhaven Residence — see below |
| `shape-hip-2.jpg`    | a close-up of the Ridgemont House's roof tile — see below |
| `founder.jpg`        | the About section's founder photo                                  |

## Features

- **Project gallery carousel doubling as client stories** — six recent projects, one per roof shape (gable, hip, Dutch gable, dormer, shed, mansard), each built in a different material so the gallery shows range in both form and material. Each card pairs the completed-roof photo with that homeowner's testimonial quote.
- **Per-project photo gallery in the detail modal** — clicking a project opens a modal that can show multiple photos of that job (prev/next arrows, dots, a counter, and left/right arrow-key navigation) when more than one is available. Each project's `images` array in `PROJECTS` (in `main.js`) drives it; the gallery controls auto-hide for a single-photo project. **The Harrow Farmhouse** (2 photos), **The Oakhaven Residence** (3 photos), and **The Ridgemont House** (2 photos) currently have galleries; the rest are single-photo. See the note below before adding more.
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
| `shape-dutch.jpg`      | farmhouse with hip-and-gable roofline, copper standing-seam | Roger Starnes Sr — unsplash.com/photos/a-nice-stone-front-modern-farmhouse-CMbIJY92NJ0 |
| `shape-dutch-2.jpg`    | the same farmhouse, a second angle          | Roger Starnes Sr — unsplash.com/photos/NFjz6BSzDXQ |
| `shape-dormer.jpg`     | brick cottage with tiled roof and dormer windows | T (Tanya Barrow) — unsplash.com/photos/y4iBCffm3n0 |
| `shape-shed.jpg`       | modern home with an angled shed/skillion roofline | Brad Chapman — unsplash.com/photos/Vfdqsbjrrjg |
| `shape-mansard.jpg`    | historic brick house with a slate mansard roof | Rylan Hoots — unsplash.com/photos/qfCWOH_2L0A |
| `founder.jpg`          | studio headshot, founder placeholder        | The Connected Narrative — unsplash.com/photos/N8lRH2uxih4 |

`shape-gable.jpg`, `shape-gable-2.jpg`, and `shape-gable-3.jpg` (the
Oakhaven Residence — grey-brick Tudor, slate gable roof) are **not**
Unsplash and don't fit the table above. They were supplied directly by
the project owner, who found them via Pinterest/reverse image search and
asserted they're free to use; unlike every other photo on this page, I
could not independently verify the photographer, source, or license — so
if this goes anywhere public-facing, confirm usage rights (or replace
them with verified-licensed or real job-site photos) before relying on
them. `shape-gable-3.jpg` is an up-close shot of the same slate, supplied
the same way.

`shape-hip.jpg` and `shape-hip-2.jpg` (the Ridgemont House) are the same
situation — supplied by the project owner via Pinterest, license
unverified, swap before going live. **Note the mismatch:** the project
copy describes "a four-sided hip roof... no gable end left exposed," but
`shape-hip.jpg` shows a roofline with at least two visible gable ends. I
left the copy as-is since this is placeholder content either way, but if
this project goes live, either the description/tag or the photo should
change so they agree.

**Why only two projects have a multi-photo gallery.** For the other four,
I tried hard to find real multi-angle photo sets — checking whether each
photographer had shot the same property more than once (matching siding,
trim, landscaping, and publish date), not just a similar-looking house.
`shape-dutch.jpg` / `shape-dutch-2.jpg` passed that check: same
photographer, same publish date, visibly the same farmhouse from two
sides. Every other Unsplash candidate I found turned out to be a
*different* house by the same photographer (rural America and suburban
Australia both have a lot of similar-looking homes) — so rather than
present unrelated houses as if they were one property, those four stay
single-photo. If you want multi-photo galleries for them too, you'll need
either real job-site photos or a stock set you've personally verified is
one property; just add more paths to that project's `images` array in
`main.js`.

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
