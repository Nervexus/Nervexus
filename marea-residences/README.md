# marea-residences

A dark-luxury real-estate landing page for **MAREA Residences**, a fictional
five-residence development at a fictional "Port Aurelia." Built with Tailwind
CSS (CDN) + vanilla JS, unrelated to the Nervexus app or the other demo site
in this repo (`real-estate-landing/`).

## Why this exists / a note on originality

This was requested as a recreation of a real, named competitor's live
marketing site — down to its exact copy, its exact hosted image URLs, and
"indistinguishable from the source" fidelity. That's not something built
here: cloning another business's branding, commissioned imagery, and
marketing copy verbatim isn't appropriate regardless of the requester's
intent, especially on a page built around lead-capture forms. What's built
instead is an **original** site using the same aesthetic techniques and
implementation architecture (dark-luxury palette, noise overlay, cursor
glow, canvas button animation, mouse-tracked card light, scroll-reveal
system, theme toggle, marquee ticker, conic-gradient CTA button) under an
invented brand, invented copy, and invented imagery.

## Files

| file          | what it is                                                        |
|---------------|--------------------------------------------------------------------|
| `index.html`  | the single page — nav, hero, philosophy, infrastructures, ticker, floor plans, CTA, footer, lead modal |
| `style.css`   | all bespoke CSS: theme variables, noise overlay, cursor glow, animations/keyframes, reveal system |
| `main.js`     | theme toggle, cursor glow (rAF), scroll reveal (IntersectionObserver), mouse-tracked service cards, hero canvas wave, lead modal, form handling, custom smooth scroll |
| `favicon.svg` | monogram favicon                                                  |

## Dependencies (loaded at runtime, not vendored)

- Tailwind CSS via `cdn.tailwindcss.com` — used for layout/spacing utilities; all bespoke effects (animations, theme variables, pseudo-elements) live in `style.css` since Tailwind's CDN build can't express those.
- Iconify web component (`code.iconify.design`) for all icons (`solar:*`, `fa6-brands:*`).
- Google Fonts: Inter + Playfair Display.

All three are fetched over the network at page-load. In this sandbox's
headless-browser tests, Google Fonts and similar third-party CDN fetches
fail on the sandbox's proxy certificate — that's a sandbox-only artifact
(see `real-estate-landing/README.md` for the same note); real visitors'
browsers fetch them normally. There's no offline fallback for Iconify
icons, so a network failure there means icons render as their fallback
(empty) — worth vendoring the icon set if this ever needs to work fully
offline.

## No placeholders, but no real assets either

There's no photography — `.hero-bg`, `.philosophy-image`, and `.cta-bg`
are crafted CSS gradients rather than stock photos or hotlinked images,
consistent with `real-estate-landing/`'s approach: it keeps the page
self-contained and it never breaks on a dead image link. Swap those
backgrounds for real photography before treating this as more than a
design/technique demo.

## Things worth knowing before editing

- **Theme is `data-theme` on both `<html>` and `<body>`**, toggled by
  `main.js` and persisted to `localStorage` (`marea_theme`). CSS variables
  are redefined per theme under `:root[data-theme="dark"]` /
  `:root[data-theme="light"]`.
- **The cursor glow and hero canvas button are `requestAnimationFrame`-driven**,
  not CSS animations, and the cursor glow is gated behind
  `(hover: hover) and (pointer: fine)` so touch devices don't get a
  phantom glow div sitting at a stale position.
- **All `.btn` / `.nav-cta` elements open the lead modal on click**, except
  buttons with `type="submit"` inside a form (those submit normally). This
  is wired generically via `[data-modal-trigger]`, not per-button.
- **Forms have no backend.** All three (hero/nav modal, CTA section,
  footer callback) just swap in a client-side success state.
- **Reveal system** (`reveal-clip-left`, `reveal-slide-right`,
  `reveal-pop`, `reveal-zoom`, `stagger-scale`) is driven by one
  `IntersectionObserver` at threshold `0.15`. It's fail-open like
  `real-estate-landing/`'s: hidden state only applies under
  `html.js-reveal`, set inline in `<head>` before first paint, with a 3s
  watchdog that strips it if `main.js` never confirms the observer
  started. The `.visible` override rules are qualified with
  `html.js-reveal` too — an unqualified `.visible` rule would tie on
  specificity with the hidden rule and lose, leaving everything invisible
  forever (a bug this exact repo hit once already in the sibling project).

## Viewing it

Static — open `index.html` directly, or serve the folder
(`python3 -m http.server` from this directory).
