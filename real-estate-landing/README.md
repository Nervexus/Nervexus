# real-estate-landing

A self-contained luxury real-estate landing page, unrelated to the Nervexus app —
built as a standalone demo/template under a placeholder brand, "Aldridge & Co."

## Files

| file          | what it is                                                        |
|---------------|--------------------------------------------------------------------|
| `index.html`  | the single page — hero, featured listings, process, testimonials, about, contact |
| `style.css`   | all styling                                                        |
| `main.js`     | scroll reveal, sticky header, mobile nav, stat counters, testimonial slider, contact form |
| `favicon.svg` | monogram favicon                                                   |

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

## Viewing it

It's static — open `index.html` directly in a browser, or serve the folder
with any static file server (e.g. `python3 -m http.server` from this
directory).
