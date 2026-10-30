# mobel-living

A self-contained, cinematic scroll-driven furniture landing page under a
placeholder brand, "MØBEL — The Living Collection". Original implementation
inspired by the general style of 3D/WebGL scroll-storytelling sites seen on
aura.build's component gallery — own code, own abstract WebGL visuals, own
copy and product names, no third-party assets or scripts.

## Files

| file                       | what it is                                                                 |
|-----------------------------|------------------------------------------------------------------------------|
| `index.html`                | the single page — loader, nav, hero/UI overlay, shop grid, featured sticky product viewer, pinned horizontal materials scroll, story, gallery, footer |
| `style.css`                 | all styling                                                                   |
| `main.js`                   | Three.js background scene, GSAP masked-text reveals, loader sequence, scroll-scrubbed hero captions/index bar, featured-product chapter/image swap, pinned horizontal materials scroll |
| `favicon.svg`                | monogram favicon                                                             |
| `vendor/three.module.min.js`| Three.js r169, vendored locally (official build, MIT licensed)               |
| `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js` | GSAP 3.12.7 + ScrollTrigger, vendored locally (official build) |

Libraries are vendored as local files rather than loaded from a CDN at
runtime, so nothing the page depends on can change out from under it.

## Notes

- All product imagery is CSS gradient "swatches", not photographs — there
  are no real product photos for this fictional brand, and inventing
  stock-photo-style images would be more misleading than an honest abstract
  treatment.
- The hero/materials background is a small abstract Three.js composition
  (primitives in warm tones, no real 3D furniture models), standing in for
  "shaping the space" without needing licensed or custom-built 3D assets.
- `€6,900` / Fjord / Bark / Stein / Ull / Glød are original placeholder
  names and pricing for this demo brand, not copied from any real site.
