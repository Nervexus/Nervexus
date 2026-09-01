# Email templates

Nervexus sends **one** email. Everything outstanding — Performance Terminal, tasks and
missions, calendar, logs, app updates — is collected into a single digest rather than
arriving as five separate messages from five separate senders.

There is therefore **one template**, rendered into different amounts of content. The files
below are that one template in every state it can reach.

## Start here

**`ALL-STATES.html`** — every state on one page, in Maison Élysée. This is the file to read.

## The states, individually

| File | State |
|---|---|
| `state-01-full.html` | Everything outstanding — the busiest the email gets |
| `state-02-single.html` | One item only — the most common real case |
| `state-03-two-sections.html` | Two sections, nothing urgent |
| `state-04-critical.html` | Account locked — the most severe email sent |
| `state-05-update-only.html` | A release note on its own |
| `state-06-long-text.html` | Long mission names and checklist titles — wrapping stress test |
| `state-07-test-email.html` | What the "Send test email" button produces |
| `plain-text-versions.txt` | The plain-text part and subject line for all seven |

`state-01-full-noir.html` and `state-01-full-terminal.html` are the two alternate colour
schemes, kept for reference. **Maison Élysée is the chosen one and the default.**

## Editing them

These files are **generated output**, not input — the source is
`../supabase/functions/_shared/digest-template.js`. Edit the HTML however you like and send
it back; the renderer gets rebuilt to match what you send.

Keep these pieces somewhere in the markup so the content has somewhere to go:

- the greeting — `Morning {name},`
- a repeating **section**: a heading (`Performance Terminal`, `Tasks & Missions`,
  `Calendar`, `Logs`, `App Update`) with a list of lines under it
- a repeating **item**: one line of text, an optional smaller `meta` line beneath it, and a
  priority flag shown only on `high` / `critical`
- the button to the app
- the sign-off block

Empty sections are dropped before rendering, so the design has to survive any subset being
present — `state-02` and `state-05` are what that looks like.

## Rules the markup has to keep

Email clients are not browsers, and these are not stylistic preferences:

- **Tables for layout.** Outlook drops `display:flex` and `display:grid` entirely.
- **Inline styles only.** No `<style>` block, no `<link>`, no CSS variables — Gmail strips
  or ignores them depending on context.
- **No web fonts.** A linked font silently falls back to Times.
- **No external images.** Most clients block remote images by default, so anything that
  matters has to be text.
- Assume a **phone, one column**.

`digest-template.test.mjs` asserts all of these, plus AA contrast on every colour pair, so a
design that breaks them fails the suite rather than reaching an inbox.

## The palette

Taken from the app's own `.theme-ultra.theme-maison`, not approximated:

| Role | Value | From |
|---|---|---|
| Ground | `#F2ECE0` | `--u-bg` |
| Card | `#FBF7EF` | `--u-card` |
| Ink | `#2E4560` | `--u-ink` |
| Accent (section labels) | `#3C5A7D` | `--u-accent` |
| Button text | `#F6F0E4` | `--m-cream` |
| Muted | `#5A6E8C` | `--u-muted`, **deepened** |
| Rules | `#D9DBDA` / `#D1D2CE` | `--u-line`, **flattened** |

Two deliberate departures, both because email is not the app:

- `--u-line` is `rgba(60,90,125,0.18)`, and the same rgba over two backdrops gives two
  colours. Email needs solids, so both composites are precomputed.
- `--u-muted` `#6E82A0` is 3.7:1 on the card — under the 4.5:1 needed for body text. In the
  app it sits on a bright screen you are already looking at; an email is read on a phone in
  daylight. Deepened to `#5A6E8C`, same family, 4.9:1.

## Running the tests

```
node digest-template.test.mjs
```

No install, no build — same as the rest of this repo.
