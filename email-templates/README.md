# Email templates

Nervexus sends **one** email. Everything outstanding — Performance Terminal, tasks and
missions, calendar, logs, app updates — is collected into a single digest rather than
arriving as five separate messages from five separate senders.

## The files

| File | What it is |
|---|---|
| `digest-preview.html` | **Generated.** Open it in a browser to see the email as it is sent today. |
| `digest-preview.txt` | **Generated.** The plain-text part, and the subject line. |
| `../supabase/functions/_shared/digest-template.js` | **The source.** The renderer both the edge function and the tests load. |

`digest-preview.*` are output, not input — editing them changes nothing. To change the
email, either edit the renderer, or redesign the HTML and have the renderer rebuilt to
match it.

## Redesigning it

Take `digest-preview.html`, lay it out however you want, and keep these placeholders
somewhere in the markup so the content has somewhere to go:

- The greeting line — `Morning {name},`
- A repeating **section**, with a heading (`Performance Terminal`, `Tasks & Missions`,
  `Calendar`, `Logs`, `App Update`) and a list of lines under it
- A repeating **item**: one line of text, an optional smaller `meta` line beneath it, and
  an optional priority flag shown only on `high` / `critical` items
- The button to the app
- The sign-off block

Sections with nothing in them are dropped before rendering, so the design needs to survive
having any subset of them present — including only one.

## Rules the markup has to keep

Email clients are not browsers, and these are not stylistic preferences:

- **Tables for layout.** Outlook drops `display:flex` and `display:grid` entirely.
- **Inline styles only.** No `<style>` block, no `<link>`, no CSS variables — Gmail strips
  or ignores them depending on context.
- **No web fonts.** A linked font silently falls back to Times; the stacks used are ones
  that exist on the devices already.
- **No external images.** Most clients block remote images by default, so anything that
  matters must be text.
- Assume it will be **read on a phone in one column**.

`digest-template.test.mjs` asserts the first three, so a design that breaks them fails the
test suite rather than reaching an inbox.

## Running the tests

```
node digest-template.test.mjs
```

No install, no build — same as the rest of this repo.
