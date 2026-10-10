# Coastline Roofing — sales demo site

A premium, mobile-first demo roofing site for a fictional company,
**Coastline Roofing** (Southampton, Hampshire). Built with Next.js (App
Router) + Tailwind CSS v4, ready to deploy on Vercel as-is.

This is a template/demo to send to prospective clients — not a real
business. See [Rebranding for a real client](#rebranding-for-a-real-client)
below for how to turn it into one.

## Stack

- **Next.js 16** (App Router, TypeScript, Cache Components enabled) — the
  whole site is statically prerendered, including the generated Open Graph
  image, so there's nothing slow to wait on.
- **Tailwind CSS v4** — brand colours and fonts are defined once in
  `src/app/globals.css` (`@theme` block) and used as ordinary utility
  classes (`bg-navy-950`, `text-brass-500`, etc.).
- **Fraunces** (an elegant serif, used italic for headlines) paired with
  **Inter** for body copy — self-hosted via `next/font/google`, no layout
  shift, no external font request at runtime.
- No database, no backend, no API keys required to run or deploy.

## The one config file

Every piece of business-specific content — name, tagline, phone/WhatsApp
numbers, email, address, areas covered, services, trust points, reviews,
gallery photos, and brand colours — lives in:

```
src/config/site.ts
```

To re-skin this for a real client, that's the only file you need to edit
(plus swapping the photos in `public/images/`, and `src/app/icon.svg` /
`src/app/opengraph-image.tsx` if they want a different logo mark). Every
component imports from `siteConfig` rather than hardcoding text.

## Sections

1. **Hero** — headline, area served, click-to-call `Call Now` button
   (`tel:` link) and a `Get a Free Quote` anchor button.
2. **Trust bar** — years experience, fully insured, free quotes,
   workmanship guarantee.
3. **Services** — the six services requested (repairs, new roofs, flat
   roofs, guttering & fascias, chimney work, emergency repairs).
4. **Before/After gallery** — a draggable before/after comparison slider
   (`src/components/BeforeAfterSlider.tsx`, the only other client
   component besides the quote form) built with a native `<input
   type="range">` under the hood so it works with touch, mouse, and
   keyboard with no extra JS library.
5. **Reviews** — clearly labelled **"Example reviews — for demo
   purposes"** in the UI, as requested, since the quotes are illustrative,
   not real customer feedback.
6. **Areas covered** — Southampton, Totton, Hythe, Fawley, New Forest,
   Eastleigh (edit the `areasCovered` array in the config to change).
7. **Free quote form** — name, phone, postcode, job type, message. See
   [No backend yet](#no-backend-yet) below.
8. **Footer** — contact details, services, areas, a small "demo site" note.

### Extras

- **Floating contact bubble** (`FloatingContactBubble.tsx`) — a fixed
  circular button bottom-right, on every screen size, that expands into a
  small panel with Call Now / WhatsApp Us options. Closes on an outside
  click or by tapping it again.
- **Open Graph image** — generated at build time
  (`src/app/opengraph-image.tsx`, via `next/og`'s `ImageResponse`), not a
  static photo, so it always matches the brand colours/name/phone in
  `site.ts` without needing a separate design file. Renders instantly
  since it's prerendered, not computed per-request.
- **`noindex`** — set two ways (belt-and-braces): the `robots` field in
  `src/app/layout.tsx`'s metadata, and a static-equivalent
  `src/app/robots.ts` that disallows everything. No page on this site
  will appear in search results.

### No backend yet

The quote form (`src/components/QuoteForm.tsx`) is intentionally
backend-free: submitting it just shows the thank-you message client-side
via `useState`, nothing is sent anywhere. Before using this for a real
client, wire `handleSubmit` up to something that actually captures the
lead — a Next.js [Route
Handler](https://nextjs.org/docs/app/getting-started/route-handlers) that
emails you, a service like [Formspree](https://formspree.io) or
[Getform](https://getform.io), or a simple serverless function into your
CRM of choice.

### Placeholder contact details — safe by design

- **WhatsApp/mobile number** (`07700 900123`) uses [Ofcom's official
  "drama" range](https://www.ofcom.org.uk/phones-and-broadband/telephone-numbers/numbers-for-drama/)
  (`07700 900xxx`), reserved specifically so it can be used in fiction/demos
  without ever reaching a real person. Safe to leave as-is, or swap for
  the real client's number.
- **Landline** (`023 8000 1234`) is a made-up Southampton-format number.
  There's no equivalent official "safe" range for geographic landlines, so
  treat it as a placeholder to replace before this goes anywhere that
  might be taken as a real contact number.
- **Email** (`info@coastlineroofing.co.uk`) is not a real, checked mailbox.

## Photo credits

Every photo is a free-to-use Unsplash photo, downloaded and checked into
`public/images/` rather than hotlinked, so the page renders identically
offline and never breaks on a dead link. Used under the [Unsplash
License](https://unsplash.com/license) (free for commercial use,
attribution appreciated but not required).

| file | subject | credit |
|---|---|---|
| `hero.jpg` | roofer securing shingles on a pitched roof | Raze Solar — unsplash.com/photos/Scaj0T40nFI |
| `gallery-before-1.jpg` | close-up of moss-covered, aged shingles | Lukáš Patúc — unsplash.com/photos/eCqZW4t0D-A |
| `gallery-after-1.jpg` | aerial view of a clean, uniform new roof | Paragon Exterior — unsplash.com/photos/-uvuU43FAwQ |
| `gallery-before-2.jpg` | roofer stripping old shingles mid-repair | Zohair Mirza — unsplash.com/photos/GXITWKvgm-k |
| `gallery-after-2.jpg` | neat, intact dark shingle roof | Yucel M — unsplash.com/photos/TnhkSNZPXd8 |
| `gallery-before-3.jpg` | grimy, moss-clogged old guttering | Aleksi Partanen — unsplash.com/photos/kBc9SXXjezA |
| `gallery-after-3.jpg` | clean new guttering and downpipe | Taylor Hammersla — unsplash.com/photos/6QYiR0utkvA |

**Honesty note on the gallery:** these are representative stock photos
chosen to illustrate "before" and "after" roof conditions — they are
**not** actual before/after photos of the same property (genuine matched
pairs like that essentially don't exist as free stock photography). For a
real client, replace these with their own job-site photos.

## Rebranding for a real client

1. Edit `src/config/site.ts` — name, tagline, headline, contact details,
   address, areas, services, reviews, gallery captions, colours.
2. Replace the photos in `public/images/` with the client's own job
   photos (keep the same filenames, or update the paths in `site.ts`).
3. Update `siteUrl` in `site.ts` once you know the real deployment URL or
   custom domain — this feeds the Open Graph/canonical URLs.
4. Swap `src/app/icon.svg` for their logo mark if they have one.
5. Wire up the quote form to a real backend (see above).
6. Remove the `noindex` robots settings (in `layout.tsx` and
   `robots.ts`) once the real site is ready to be found by Google.
7. Remove the "Demo site — business details shown are fictional." line
   in `Footer.tsx`.

## Local development

```bash
npm install
npm run dev
```

## Deploying

This is a stock Next.js app — deploy it to Vercel by importing the repo
(or via the Vercel CLI), no environment variables or special configuration
required.
