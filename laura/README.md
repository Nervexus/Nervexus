# Laura

A dark, monochrome studio-site look: deep black (`#080808`), a raw-WebGL
ambient mesh (a raymarched, SDF-based morphing sphere) on the Laura page,
procedural film-grain noise, Inter thin/extralight headlines, JetBrains
Mono labels, and GSAP-driven reveals and scroll scrubbing. A voice orb, a
chat log, Notes, Reminders, a Vault, and real outbound Calls & texts (via
a free Telegram bot -- "calling" sends an urgent-styled Telegram message
rather than an actual ringing phone call, since no free provider can place
one). Laura can also search the live web (place hours, directions/
travel comparisons, current info) via Gemini's Google Search grounding.
She cannot yet book/pay for anything (restaurants, rides, tickets), parse
a work rota, plan a commute, or touch Instagram — those are later phases
of the full vision (see the roadmap doc shared with this project):

1. **Core assistant** (this) — Gemini + tool-calling loop, a voice orb
   (browser Speech Recognition/Synthesis), persistent chat, Notes,
   Reminders, an encrypted Vault, web search, and outbound calls/texts via
   a free Telegram bot.
2. **Work rota & daily planning** — upload/parse a rota, commute/transit
   planning, an automatic tomorrow briefing, colleague/shift awareness.
3. **Booking management** — natural-language restaurant/activity booking,
   availability search, payment links (never auto-paying), calendar sync.
4. **Instagram intelligence** — analytics, profile/content strategy,
   location & outfit planning, public-account research.
5. **Controlled messaging** — Instagram DMs and SMS with configurable
   reply delays, contact rules, personalized tone, and approval gates.
6. **Unified intelligence** — every feature above wired into one
   proactive, cross-feature assistant.

Booking/paying for things on your behalf (an Uber, a restaurant table, food
delivery) isn't planned as something Laura ever completes unattended — Laura
can look things up and recommend (via web_search, and later real booking
search), but a human always approves and completes any payment.

## Pages

| route        | what it is                                                                 |
|--------------|------------------------------------------------------------------------------|
| `/`          | Home — a studio-site landing page: hero (JS-injected word-reveal headline, metrics), a portfolio grid, a 3-step process section, CTA into `/laura` |
| `/laura`     | the assistant itself — node-diagram view of the orb wired to its tools, + chat/Activity tabs |
| `/notes`     | notes you've written or asked Laura to remember                              |
| `/reminders` | things to do, set by you or by Laura from a conversation                     |
| `/vault`     | encrypted secrets (passwords, etc.) — Laura's own brain has no access to this |
| `/calls`     | have Laura send you an urgent or plain Telegram message, plus a history of past ones |

Notes/Reminders/Vault all use a responsive auto-fit card grid (not a fixed
column count) so a handful of items still fill the row instead of leaving
a lone narrow card — plus search (Notes), pin-to-top (Notes), Low/Normal/
High priority with Overdue/Today/This week/Later grouping (Reminders, also
settable by Laura from a conversation), and copy-without-revealing
(Vault, via the clipboard, no on-screen display needed).

`/laura`, `/notes`, `/reminders`, and `/vault` live under the `(app)`
route group and share `AppSidebar` — a sticky left column on desktop, a
horizontal bar on mobile, with live Notes/Reminders/Vault counts, active-
route highlighting, and a status card. `/` lives under `(marketing)` and
uses the fixed `TopNav`/`SiteFooter` instead — the two route groups don't
affect the URLs, just which chrome wraps each page.

## Key files

| file                           | what it is                                                        |
|----------------------------------|----------------------------------------------------------------------|
| `lib/brain.ts`                    | the brain: system prompt, tool-calling loop (`get_current_time`, `create_note`, `create_reminder`, `list_reminders`, `web_search`, `call_me`, `text_me`), via Gemini |
| `lib/db.ts`                       | Prisma client (SQLite + driver adapter)                              |
| `lib/crypto.ts`                   | AES-256-GCM encrypt/decrypt for Vault entries                        |
| `lib/speech.ts`                   | minimal types for the (unstandardized) Web Speech API                |
| `lib/telegram.ts`                 | `placeCall`/`sendText` -- outbound-only, always to `TELEGRAM_CHAT_ID`, logs every attempt (success or failure) to `CallLog` |
| `components/background/AmbientCanvas.tsx` | layer 0: raw-WebGL raymarched SDF sphere, masked to a fixed radial glow, scroll-scrubbed via GSAP ScrollTrigger |
| `components/background/Vignette.tsx` | layer 1: radial-gradient darkening the viewport's edges               |
| `components/background/NoiseOverlay.tsx` | layer 4: fixed, near-invisible procedural film-grain (SVG `feTurbulence`) |
| `components/TopNav.tsx`           | `(marketing)` layer 3: fixed top nav, `mix-blend-difference`, brand + route links |
| `components/SiteFooter.tsx`       | `(marketing)` layer 3: fixed footer, `mix-blend-difference`, pointer-events-none wrapper around a literal `document.write` year |
| `components/AppSidebar.tsx`       | `(app)` nav: sticky left column (desktop) / top bar (mobile), live tool counts, its own GSAP entrance (since it persists across page navigation instead of remounting) |
| `components/GsapEntrance.tsx`     | per-page wrapper: runs the `.gsap-entrance` stagger reveal and the `.pulse-dot` pulse once on mount |
| `components/IconifyRegister.tsx`  | client-only side-effect import that registers the `<iconify-icon>` custom element |
| `components/VoiceOrb.tsx`         | just the mic tap-target + status ring now (mic input via SpeechRecognition, speaks replies via SpeechSynthesis) -- the ambient WebGL mesh behind the page is the orb, so there's no second decorative ring here |
| `components/Pill.tsx`             | filled dark badge with a leading pulsing dot, used for page headline counts/status |
| `components/Button.tsx`           | the app's one primary (solid neutral-100) and ghost/danger button style |
| `components/IconTile.tsx`         | small glass icon tile, same `bg-neutral-900/40` + blur treatment as the portfolio cards |
| `components/NoteCard.tsx`         | Notes page's node-editor-style card: port dot, title, pin, nested content panel |
| `components/ReminderCard.tsx`     | Reminders page's card: priority accent bar, overdue highlighting      |
| `components/VaultCard.tsx`        | Vault page's card: Reveal and Copy-without-revealing actions          |
| `components/PriorityPicker.tsx`   | Low/Normal/High selector used in the Reminders compose form           |
| `components/EmptyState.tsx`       | shared empty-state block (icon, heading, description, optional chips) |
| `components/SidebarCard.tsx`      | shared sidebar card/chip/stat-row used on Notes, Reminders, Vault     |
| `components/FlowDiagram.tsx`      | `/laura` page's node graph: You → orb → Notes/Reminders/Vault/Web search/Calls, lights up whichever node Laura just used |
| `components/FlowNode.tsx`         | a single node card in that diagram (icon, title, active/inactive/pulsing state) |
| `components/ActivityFeed.tsx`     | `/laura` page's Activity tab: a timeline of what Laura's actually done |
| `components/CallLogCard.tsx`      | `/calls` page's card: call vs. text, message, sent/failed status      |
| `prisma/schema.prisma`            | `Note` (+pinned), `VaultItem`, `ChatMessage`, `Reminder` (+priority), `ActivityLog`, `CallLog` models |
| `app/api/{chat,notes,reminders,vault,activity,calls}/...` | API routes                                         |

## Design system

Three fixed background layers are mounted once in `app/layout.tsx` (so
they persist across client-side navigation): a radial vignette (z-1) and a
near-invisible procedural noise overlay (z-100) sit behind/above every
page, while the WebGL ambient mesh (z-0) -- "the orb" -- is gated to
`/laura` only (`AmbientCanvasGate`, a `usePathname()` check at the same
DOM position, so it mounts/unmounts a real WebGL context per-route rather
than running everywhere). The fixed top nav and footer sit at z-50 (both
`mix-blend-difference`); page content sits at z-10. Typography is Inter (weights 100/200/300/400) for headings and
body text, JetBrains Mono for labels/badges/mono numerals. There's no
color accent anywhere — states (the voice orb's idle/listening/thinking/
speaking, priority levels, etc.) read by brightness and motion rather than
hue; red is kept only for destructive actions and error text. Entrance
animation is GSAP (`.gsap-entrance`, stagger + `power4.out`, wrapped per
page by `GsapEntrance`), plus a `ScrollTrigger`-scrubbed drift/rotation on
the ambient canvas.

## Running it

```bash
cp .env.example .env.local
# add GEMINI_API_KEY (aistudio.google.com/apikey, free tier),
# TURSO_DATABASE_URL/TURSO_AUTH_TOKEN (turso.tech),
# and TOKEN_ENCRYPTION_KEY (openssl rand -hex 32) to .env.local
npm run dev
```

Schema changes aren't applied via `prisma migrate deploy` — Prisma's CLI
doesn't understand `libsql://` connection strings (only the JS driver
adapter used by the running app does). Instead, write the new SQL into a
`prisma/migrations/<timestamp>_name/migration.sql` file as usual, then run
it directly against Turso via `@libsql/client` (see
`scripts/apply-turso-migration.mjs` for the pattern) and record it with
`scripts/record-migration-history.mjs`.

Open [http://localhost:3000](http://localhost:3000). The voice orb needs
Chrome or Edge (Web Speech API support); other browsers fall back to text
only, with a note saying so rather than a crash.

## Web search

`web_search` runs as a second, isolated Gemini call using the built-in
Google Search grounding tool (Gemini doesn't allow mixing that with custom
function declarations in one request). It shares the same free
`GEMINI_API_KEY` quota as everything else, so a question that needs a
search effectively costs two model calls instead of one — fine for
personal use, but worth knowing if replies feel slow or hit the free
tier's rate limit (~5 requests/minute on the flash tier at the time of
writing).

## Activity feed

Every time Laura saves a note, sets a reminder, or runs a web search, it's
recorded to `ActivityLog` and shows up two places: the home page's
"Activity" tab (a plain timeline), and a one-shot glow on the matching node
in the flow diagram right as the reply lands (`/api/chat`'s response
includes `toolsUsed`, which the frontend uses to trigger it). Read-only
tools (`get_current_time`, `list_reminders`) aren't logged — they're not
interesting as a history, just noise.

## Security notes

- **The Vault is UI-only, not an AI tool.** Laura's brain has no
  `read_vault`/`write_vault` tool, on purpose — secrets shouldn't flow
  through an LLM conversation, especially once that conversation can
  happen over SMS or voice. The Vault page is the only thing that ever
  decrypts an entry, and only for the one item you click "Reveal" on
  (the list view never receives decrypted values).
- **Confirm before acting**: the system prompt instructs Laura to describe
  and get a yes before calling any tool with a real-world, hard-to-undo
  side effect (sending you an urgent message, sending an email, booking
  something) — matters since a misheard voice command or an ambiguous
  text could otherwise trigger an unwanted notification. Creating a note
  or a reminder is treated as low-stakes/reversible and doesn't need
  confirmation.
- **Calls/texts are outbound-only, to one fixed chat.** `call_me`/
  `text_me` always message `TELEGRAM_CHAT_ID` — there's no inbound
  handling yet, so there's nothing for a stranger to hijack by messaging
  the bot. The sender-allowlist problem only shows up once Laura can
  *receive* messages (phase 5), at which point incoming updates will need
  to be checked against `TELEGRAM_CHAT_ID` before acting on anything.

## Persistence note

Storage is Turso (hosted libSQL, SQLite-wire-compatible) via
`@prisma/adapter-libsql`, used for both local dev and production — a
serverless host's filesystem isn't durable across deploys/invocations, so
there's no local-SQLite-file mode anymore. `googleapis` is already
installed for a later phase but not wired up yet.

## Accounts needed, by phase

- **Now (calls/texts):** a Telegram bot, created via @BotFather — free,
  no card, no trial limits. See `.env.example` for the exact steps and env
  vars (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). "Calling" you sends an
  urgent-styled Telegram message, not an actual ringing phone call — no
  free provider can do that, since real telephone carriers charge for
  termination. If you ever want an actual ringing call, that needs a paid
  telephony provider (Twilio, etc.) at a fraction of a cent per call.
- **Later (commute planning):** a maps/transit API key (e.g. Google Maps
  Platform) for real bus/train times and journey calculation.
- **Later (Instagram):** a Meta Business + Instagram Graph API app on top
  of a professional Instagram account — Meta's App Review process gates
  most of the DM/analytics scopes and can take time (and isn't guaranteed
  to approve an automated-reply use case).
- **Later (email/calendar):** a Google Cloud project with an OAuth consent
  screen + Gmail/Calendar API scopes enabled.
- **Later (real bookings):** whatever partner API a specific restaurant/
  booking platform offers — most don't have a public self-serve API, so
  this will likely stay "search + hand you the booking link" rather than
  a fully automated booking for most venues.
