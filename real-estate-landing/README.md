# real-estate-landing

A self-contained luxury real-estate landing page, unrelated to the Nervexus app —
built as a standalone demo/template under a placeholder brand, "Aldridge & Co."

## Files

| file          | what it is                                                        |
|---------------|--------------------------------------------------------------------|
| `index.html`  | the single page — hero, featured listings, process, testimonials, about, contact |
| `style.css`   | all styling                                                        |
| `main.js`     | listings data/render/filter, detail modal + mortgage calculator, favorites + saved drawer, ⌘K command palette, scroll reveal, sticky header, mobile nav, stat counters, testimonial slider, contact form, scroll progress bar, custom cursor |
| `favicon.svg` | monogram favicon                                                   |

## Features

- **Filterable listings grid** — beds/max-price filters and a sort dropdown, all client-side against the `LISTINGS` array at the top of `main.js`.
- **Listing detail modal** — click any card for full specs, description, features, and a live mortgage calculator (down payment / rate / term sliders) computed against that property's price.
- **Favorites** — heart icon on cards and in the modal, persisted to `localStorage` (`aldridge_saved_homes`), with a saved-count badge in the header that opens a drawer.
- **Command palette (⌘K / Ctrl+K)** — click the search icon or press the shortcut to jump to a section or open a listing directly; arrow keys + Enter to navigate.
- **Scroll progress bar** and a **custom cursor** (desktop, fine-pointer, motion-safe only — see below).

Nothing else is referenced — no external images. Listing photography is
represented with CSS gradient + SVG line-art placeholders rather than hotlinked
stock photos, so the page renders identically offline and never breaks on a
dead image link. Swap `.listing-media` backgrounds for real photography when
there is a real listing to show.

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
- **The custom cursor is gated three ways** (`prefers-reduced-motion`,
  `hover: hover`, `pointer: fine`) and only adds `has-custom-cursor` —
  which is what actually hides the native cursor — once all three pass.
  Don't add `cursor:none` anywhere unscoped, or touch/reduced-motion
  visitors lose their cursor with nothing drawn in its place.

## Viewing it

It's static — open `index.html` directly in a browser, or serve the folder
with any static file server (e.g. `python3 -m http.server` from this
directory).
