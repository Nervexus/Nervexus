# nervexus-site

The marketing site at https://nervexus-site.vercel.app — a separate Vercel project
(`nervexus-site`) from the app itself (`nervexus`, served from the repository root).

Until now it had no source control: the only copy was whatever Vercel was serving, and it
was deployed straight from a local folder. These files were recovered from the live
deployment and are the source of truth from here on.

## Files

| file            | what it is                                                    |
|-----------------|---------------------------------------------------------------|
| `index.html`    | landing page — hero, providers marquee, 8 feature cards, FAQ  |
| `about.html`    | about page                                                    |
| `ultra-x.html`  | Ultra X page                                                  |
| `style.css`     | all styling for the three pages                               |
| `main.js`       | scroll reveal, intro mask, mobile nav, folding feature cards  |
| `morph-hero.js` | about-page hero animation                                     |
| `favicon.png`   | shared with the app                                           |

That is the complete set — nothing else is referenced by any page, and the stylesheet
pulls no `url()` assets.

## Deploying

This directory is **not** what `nervexus.vercel.app` serves; the app deploys from the repo
root, and this folder just rides along in that deployment. To publish the site, deploy this
directory to the `nervexus-site` project:

    cd site
    vercel deploy --prod        # linked via .vercel/project.json, or pick nervexus-site

Deploying replaces the whole deployment, so ship all seven files together — a partial
upload 404s whatever it leaves out.

## Things worth knowing before editing

- **`.reveal` is fail-open on purpose.** Sections start hidden only when `<head>` has set
  `html.js-reveal`, and a 3s watchdog strips that class if `main.js` never confirms the
  observer started. Previously `opacity:0` was unconditional, so any failure to load
  `main.js` left the whole page below the hero permanently invisible. Keep that shape.
- **The reveal runs in its own IIFE, first.** It used to share one with the intro-mask
  animation, so a throw in that code stopped the observer registering at all.
- **Feature cards are `position:sticky` on desktop only.** Below 760px they go static and
  fold, because a stacked deck on a 390px screen just means cards overlapping — and while
  a card fades in you can read the one stacked underneath it.
- **`.feature` has mobile rules in two places.** The original block sits mid-file; the
  folding block is at the end. Equal specificity, so the last one wins — keep the folding
  rules last or their padding is silently overridden.
- **The mobile nav pins the header opaque while open.** Header opacity is driven by scroll
  position and eases toward 1 over about a second; without pinning, a menu opened during
  that window is see-through.

## Links between site and app

Two, one in each direction. Both are absolute URLs and both need updating if either moves
to a custom domain:

- site → app: `https://nervexus.vercel.app` (the Log In buttons, in all three pages)
- app → site: `https://nervexus-site.vercel.app` (the globe button in the app's top bar)
