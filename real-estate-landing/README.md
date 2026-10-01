# real-estate-landing

A self-contained luxury real-estate landing page, unrelated to the Nervexus app —
built as a standalone demo/template under a placeholder brand, "Aldridge & Co."

## Files

| file          | what it is                                                        |
|---------------|--------------------------------------------------------------------|
| `index.html`  | the single page — hero, featured listings, process, testimonials, about, contact |
| `style.css`   | all styling                                                        |
| `main.js`     | listings data/render/filter, detail modal + mortgage calculator, favorites + saved drawer, ⌘K command palette, scroll reveal, sticky header, mobile nav, stat counters, testimonial slider, contact form, scroll progress bar |
| `favicon.svg` | monogram favicon                                                   |
| `hero-bg.jpg` | hero background photo                                              |
| `listing-*.jpg` | the 6 listing photos (one per property in the `LISTINGS` array)  |

## Features

- **Filterable listings grid** — beds/max-price filters and a sort dropdown, all client-side against the `LISTINGS` array at the top of `main.js`.
- **Listing detail modal** — click any card for full specs, description, features, and a live mortgage calculator (down payment / rate / term sliders) computed against that property's price.
- **Favorites** — heart icon on cards and in the modal, persisted to `localStorage` (`aldridge_saved_homes`), with a saved-count badge in the header that opens a drawer.
- **Command palette (⌘K / Ctrl+K)** — press the shortcut to jump to a section or open a listing directly; arrow keys + Enter to navigate. (There's no visible trigger button for it anymore — keyboard-only.)
- **Scroll progress bar** at the top of the viewport.

Nothing is hotlinked — every photo on the page, hero included, is a
free-licensed Unsplash photo downloaded and checked into the repo rather
than referenced by URL, so the page renders identically offline and never
breaks on a dead image link. All are used under the Unsplash License (free
for commercial and non-commercial use; attribution not required but
credited here as good practice). None are of a real listing — swap them
for actual property photography before this goes live for a real address.

| file                       | subject                          | credit |
|-----------------------------|-----------------------------------|--------|
| `hero-bg.jpg`               | private pool at dusk              | Aalo Lens — unsplash.com/photos/luxury-infinity-pool-at-sunset-with-lounge-chairs-KgybDitNR18 |
| `listing-marlborough.jpg`   | red brick traditional house       | Roger Starnes Sr — unsplash.com/photos/a-large-red-brick-house-with-white-trim-UwPFdRCQW1o |
| `listing-lighthouse.jpg`    | new-build houses by a pond        | unsplash.com/photos/row-of-modern-houses-by-a-calm-lake-Ph06_YFjRu0 |
| `listing-fenwick.jpg`       | modern townhouses                 | Troy Mortier — unsplash.com/photos/modern-townhouses-with-geometric-designs-on-a-street-44FRvkxNwcY |
| `listing-ashworth.jpg`      | red-sided house with chimney      | unsplash.com/photos/a-red-brick-house-with-a-chimney-in-the-front-yard-OS1rDVqpaD4 |
| `listing-windermere.jpg`    | concrete modern house             | mdreza jalali — unsplash.com/photos/a-modern-house-with-concrete-pillars-GrmNIIId5LM |
| `listing-belgrave.jpg`      | white villa with pool             | John Fornander — unsplash.com/photos/modern-white-villa-with-swimming-pool-Id7u0EkTjBE |

Two entries have no photographer name listed — it wasn't reliably available
when these were sourced; the URL still credits the right photo.

## Rebranding

Everything is placeholder content: the brand name, agent name/bio, phone,
email, office address, DRE license number, and all listing/testimonial data.
Search `index.html` for "Aldridge", "Eleanor", and the contact-info block to
replace them.

## Things worth knowing before editing

- **`.reveal` is fail-open on purpose.** Sections start hidden only when
  `<head>` has set `html.js-reveal`, and a 3s watchdog strips that class if
  `main.js` never confirms the observer started. Keep that shape — an
  unconditional `opacity:0` would leave the page blank below the hero if the
  script ever fails to load.
- **Hero stat numbers render their final value as static text** (e.g. `$0M+`
  reads oddly for a beat before JS counts up) so the page is still correct
  with JavaScript disabled or before `main.js` runs.
- **The contact form has no backend.** Submitting it swaps in a static
  "thank you" state client-side; wire it to a real endpoint (or a service
  like Formspree) before this goes live.
- **All listing/favorite state is client-side only.** Favorites live in
  `localStorage` on that one visitor's browser — there's no server, so
  nothing is shared across devices or visible to the agent. Fine for a
  demo; a real deployment would need a backend for that.

## Viewing it

It's static — open `index.html` directly in a browser, or serve the folder
with any static file server (e.g. `python3 -m http.server` from this
directory).
