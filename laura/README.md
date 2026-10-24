# Laura

A dark, monochrome studio-site look: deep black (`#080808`), a raw-WebGL
ambient mesh (a raymarched, SDF-based morphing sphere) on the Laura page,
procedural film-grain noise, Inter thin/extralight headlines, JetBrains
Mono labels, and GSAP-driven reveals and scroll scrubbing. A voice orb, a
chat log, Notes, Reminders, a Vault, real outbound Calls & texts (via
a free Telegram bot -- "calling" sends an urgent-styled Telegram message
rather than an actual ringing phone call, since no free provider can place
one), and a Rota — upload a photo of your work schedule (Gemini vision
parses it, no OCR service needed) or add shifts by hand, then ask Laura
"who am I working with Thursday" or have her plan when to leave for a
shift against your saved home/work addresses. Laura can also search the
live web (place hours, directions/travel comparisons, current info) via
Gemini's Google Search grounding — commute planning reuses that same
grounding tool as a stand-in for a dedicated transit API, upgradable later
without changing the calling code's shape. A daily job also pushes a
"tomorrow" briefing (shift + commute + reminders, combined) to Telegram
unprompted, and the same briefing shows as a card on the Laura page and
answers "what does tomorrow look like" in chat. She can also research
restaurants/activities/travel by searching the live web for real options
and booking links, and track what you're interested in on a Bookings
page -- but she can NEVER complete, confirm, or pay for a booking herself,
no matter how clearly you ask; you always finish it yourself via the link
she finds. She can also research public Instagram accounts (content style,
niche, anything publicly findable) and brainstorm/track post ideas --
captions, hashtags, location, outfit -- on a Content page, but has no real
analytics or posting ability until a real Instagram account is connected.
She cannot yet touch calendars or send/receive Instagram DMs — those are
the rest of the full vision (see the roadmap doc shared with this project):

1. **Core assistant** (this) — Gemini + tool-calling loop, a voice orb
   (browser Speech Recognition/Synthesis), persistent chat, Notes,
   Reminders, an encrypted Vault, web search, and outbound calls/texts via
   a free Telegram bot.
2. **Work rota & daily planning** (this) — upload/parse a rota, commute/
   transit planning, colleague/shift awareness, and an automatic tomorrow
   briefing combining shift + commute + reminders into one summary, pushed
   to Telegram daily via a Vercel Cron job.
3. **Booking management** (this, partial) — natural-language restaurant/
   activity/travel research and a Bookings tracker (idea → pending →
   confirmed) are live; calendar sync isn't built yet. Laura never books or
   pays for anything herself -- a human always completes it via the link
   she finds.
4. **Instagram intelligence** (this, partial) — public-account research and
   a content-idea tracker (captions/hashtags/location/outfit brainstorming)
   are live, both via web search rather than the Instagram Graph API;
   real analytics, scheduling, and actual posting need a connected
   professional Instagram account, not set up yet.
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
| `/notes`     | notes you've written or asked Laura to remember, grouped into one or more Glass Folders (`components/ui/glass-folder-cards.tsx`) you can add and PIN-lock — click a note to edit or delete it |
| `/reminders` | a month calendar — click a day to see/add/edit reminders due then, set by you or by Laura from a conversation |
| `/vault`     | encrypted secrets (passwords, etc.) — Laura's own brain has no access to this |
| `/calls`     | have Laura send you an urgent or plain Telegram message, plus a history of past ones |
| `/settings`  | every credential Laura uses or will use, and whether it's connected (status only, never the actual secret values) — links to the full setup guide |
| `/rota`      | your work schedule — upload a rota photo or add shifts by hand, per-shift commute planning, home/work address + arrival-buffer settings |
| `/bookings`  | restaurants/activities/travel Laura's researched or you've added — search live options, track idea → pending → confirmed, open the booking link to finish it yourself |
| `/content`   | Instagram post ideas — research a public account, brainstorm/add captions, hashtags, location, and outfit, track idea → scheduled → posted |

Vault uses a responsive auto-fit card grid (not a fixed column count) so
a handful of items still fill the row instead of leaving a lone narrow
card, plus copy-without-revealing via the clipboard (no on-screen display
needed). Reminders carry Low/Normal/High priority (also settable by Laura
from a conversation), shown as a small colored dot on each day's tag in
the calendar.

`/laura`, `/notes`, `/reminders`, `/rota`, `/vault`, and `/calls` live
under the `(app)` route group and share `AppSidebar` — a sticky left
column on desktop, a horizontal bar on mobile, with live per-page counts,
active-route highlighting, and a status card. `/` lives under `(marketing)` and
uses the fixed `TopNav`/`SiteFooter` instead — the two route groups don't
affect the URLs, just which chrome wraps each page.

## Key files

| file                           | what it is                                                        |
|----------------------------------|----------------------------------------------------------------------|
| `lib/brain.ts`                    | the brain: system prompt, tool-calling loop (`get_current_time`, `create_note`, `create_reminder`, `list_reminders`, `web_search`, `call_me`, `text_me`, `get_shifts`, `who_am_i_working_with`, `plan_commute`, `get_tomorrow_briefing`, `search_booking_options`, `create_booking`, `list_bookings`, `research_instagram_account`, `create_content_idea`, `list_content_ideas`), via Gemini |
| `lib/db.ts`                       | Prisma client (SQLite + driver adapter)                              |
| `lib/gemini.ts`                   | shared Gemini client/model (`getGeminiClient()`, `MODEL`), used by `lib/brain.ts` and `lib/rota.ts` |
| `lib/crypto.ts`                   | AES-256-GCM encrypt/decrypt for Vault entries                        |
| `lib/pin.ts`                      | salted-hash/verify a note folder's lock PIN (scrypt + `timingSafeEqual`), never stores the PIN itself |
| `lib/speech.ts`                   | minimal types for the (unstandardized) Web Speech API                |
| `lib/telegram.ts`                 | `placeCall`/`sendText` -- outbound-only, always to `TELEGRAM_CHAT_ID`, logs every attempt (success or failure) to `CallLog` |
| `lib/rota.ts`                     | `parseRotaImage` (Gemini vision, structured JSON output), `getShifts`, `whoAmIWorkingWith`, `planCommute` (Gemini + Google Search grounding, saved to `Shift.commutePlan`) |
| `lib/briefing.ts`                 | `getTomorrowBriefing` -- tomorrow's shift + commute plan + reminders, combined into one plain-text summary |
| `lib/booking.ts`                  | `searchBookingOptions` (Gemini + Google Search grounding, with source links), `listBookings` -- Laura never books/pays, only researches and tracks |
| `lib/instagram.ts`                | `researchInstagramAccount` (Gemini + Google Search grounding, public info only -- never invents follower/engagement numbers), `listContentIdeas` |
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
| `components/ui/glass-folder-cards.tsx` | drop-in third-party component (vendored as-is, not modified): a glass-and-canvas "folder" object -- notes are its files. Lives in `components/ui/` rather than flat in `components/` since it's a drop-in primitive, not a hand-rolled app component |
| `components/ReminderCard.tsx`     | a reminder's card: priority accent bar, done/overdue state -- used in the selected day's panel on the Reminders calendar |
| `components/VaultCard.tsx`        | Vault page's card: Reveal and Copy-without-revealing actions          |
| `components/PriorityPicker.tsx`   | Low/Normal/High selector used in the Reminders compose form           |
| `components/EmptyState.tsx`       | shared empty-state block (icon, heading, description, optional chips) |
| `components/SidebarCard.tsx`      | shared sidebar card/chip/stat-row used on Notes, Reminders, Vault     |
| `components/FlowDiagram.tsx`      | `/laura` page's node graph: You → orb → Notes/Reminders/Vault/Web search/Calls/Rota/Bookings/Content, lights up whichever node Laura just used |
| `components/FlowNode.tsx`         | a single node card in that diagram (icon, title, active/inactive/pulsing state) |
| `components/ActivityFeed.tsx`     | `/laura` page's Activity tab: a timeline of what Laura's actually done |
| `components/CallLogCard.tsx`      | `/calls` page's card: call vs. text, message, sent/failed status      |
| `components/SettingsCard.tsx`     | `/settings` page's card: connected/expires soon/not set status, read-only |
| `app/api/settings/status/route.ts` | reads `process.env` presence/shape only (decodes the Turso token's `exp` claim to flag an expiring one) -- never returns an actual secret value |
| `components/ShiftCard.tsx`        | `/rota` page's card: date/time range, location/colleagues, "from photo" badge, inline "Plan commute" + delete |
| `components/BookingCard.tsx`      | `/bookings` page's card: category icon, date/party/location, booking link, idea/pending/confirmed/cancel status buttons |
| `components/ContentCard.tsx`      | `/content` page's card: type icon, caption/hashtags, idea/scheduled/posted/discard status buttons |
| `prisma/schema.prisma`            | `Note` (+pinned), `VaultItem`, `ChatMessage`, `Reminder` (+priority), `ActivityLog`, `CallLog`, `Shift`, `Profile`, `Booking`, `ContentIdea` models |
| `components/TomorrowBriefing.tsx` | `/laura` page card: today's answer to "what does tomorrow look like" -- renders nothing while loading or if there's nothing to show |
| `app/api/{chat,notes,reminders,vault,activity,calls,rota,profile,briefing,bookings,content,settings}/...` | API routes                                         |
| `vercel.json`                     | Vercel Cron config: fires `/api/briefing/send` daily to push tomorrow's briefing to Telegram unprompted |

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

## Notes

`/notes` renders one `GlassFolder` (`components/ui/glass-folder-cards.tsx`)
per `NoteFolder`, each scoped to its own notes and rendered with a
monochrome `ArtRecipe` to match the app's no-color-accent rule instead of
the component's colorful built-in presets. There's always at least the
"default" folder (seeded by its migration); a dashed "+ New folder" tile
creates more, optionally with a PIN. The component only reads its `files`
prop once ("the folder owns the list" after that), so the page keys each
folder on a `${folderId}-${generation}` counter and remounts it after every
add/save/delete to sync real server data back in, rather than expecting a
prop update to take effect. Clicking a file opens a plain title/body edit
form below the folder; the "+" key both shows an optimistic file
immediately and persists the real note behind it. The component is
vendored as-is and not modified -- two of its internal patterns (reading
`ids.current` during render, a `setState` inside an effect) trip the newer
React 19.2 hooks lint rules, same as four pre-existing instances elsewhere
in this codebase; rewriting a third-party component's carefully-tuned
identity/animation logic to satisfy a lint rule risks breaking it, so those
are left alone.

A folder can be locked with a PIN (the small lock icon by its name): a
locked folder stores a salted hash of the PIN (`lib/pin.ts`, scrypt +
`timingSafeEqual`), never the PIN itself, and renders as a plain "Enter PIN
to open" tile instead of a `GlassFolder` until the right one is typed.
There's no server-side session for this -- the page just keeps unlocked
folder ids in memory for as long as it's open, so a reload re-locks
everything. The lock icon toggles straight back to locked with no PIN
needed (nothing to re-verify, it's just hiding the folder again); setting
a new PIN or removing one (`Remove lock`, under an unlocked locked folder)
both go through `/api/notes/folders/[id]` and do require the current PIN
when one's already set.

## Reminders

`/reminders` is a month calendar (`buildMonthGrid` always returns 42 cells
-- 6 full weeks -- so the grid never reflows height between months) instead
of the earlier Overdue/Today/This week/Later list. Each day with reminders
due shows up to 3 as small tag pills (a priority-colored dot + truncated
title, `+N more` beyond that); clicking a day lists that day's reminders as
full `ReminderCard`s plus a quick-add row (title, time, priority) scoped to
that date. Same data model and API routes as before -- this only changed
how the existing reminders are browsed and added, not what a reminder is.

## Web search

`web_search` runs as a second, isolated Gemini call using the built-in
Google Search grounding tool (Gemini doesn't allow mixing that with custom
function declarations in one request). It shares the same free
`GEMINI_API_KEY` quota as everything else, so a question that needs a
search effectively costs two model calls instead of one — fine for
personal use, but worth knowing if replies feel slow or hit the free
tier's rate limit (~5 requests/minute on the flash tier at the time of
writing).

## Rota & commute planning

Upload a photo of a work rota (any format — a photo of a printed sheet, a
screenshot, a handwritten table) and `parseRotaImage` sends it straight to
Gemini as multimodal input with a structured JSON `responseSchema` — no
separate OCR step, and no new API key, since it reuses `GEMINI_API_KEY`.
Parsed shifts are shown for review/editing before anything is saved
(`POST /api/rota/parse` only previews; saving is a separate explicit
`POST /api/rota` per shift). Shifts can also be added by hand.

Commute planning (`planCommute`, wired to `plan_commute` in `lib/brain.ts`
and the "Plan commute" button on `ShiftCard`) needs `homeAddress` +
`workAddress` set once on `/rota`'s sidebar (stored in the singleton
`Profile` row) and otherwise returns a plain "I don't have your addresses
yet" message instead of erroring. It currently answers via Gemini's
Google Search grounding tool — the same mechanism `web_search` uses — as a
stand-in for a dedicated transit API; the result is saved to
`Shift.commutePlan` so it only has to be computed once per shift.

## Tomorrow briefing

`getTomorrowBriefing` (`lib/briefing.ts`) pulls tomorrow's shift, computes
its commute plan if one isn't cached yet, and tomorrow's not-yet-done
reminders, then joins them into one plain-text summary. It's surfaced
three ways from the same function, so there's exactly one place the
combining logic lives:

- **On request** — `get_tomorrow_briefing` in `lib/brain.ts`, for "what
  does tomorrow look like" in chat.
- **On the page** — `TomorrowBriefing.tsx` fetches `GET /api/briefing` and
  shows a card above the chat on `/laura`; it renders nothing while
  loading or if tomorrow has neither a shift nor a reminder, rather than
  showing an empty or error state.
- **Unprompted** — `GET /api/briefing/send`, fired daily by the Vercel
  Cron job in `vercel.json` (defaults to 19:00 UTC — edit the cron
  expression for your own evening), texts the summary via the same
  Telegram bot `call_me`/`text_me` use. Gated on `CRON_SECRET`, which
  Vercel sends automatically as a Bearer token once the env var is set on
  the project — see `.env.example`.

## Bookings

`searchBookingOptions` (`lib/booking.ts`) reuses the same Gemini Google
Search grounding pattern as `web_search` and commute planning, tuned to
return real places/activities, current availability if findable, and a
direct link to book or reserve. It's a research tool only: Laura's system
prompt is explicit that she can NEVER complete, confirm, or pay for a
booking herself, however clearly the user asks -- `create_booking` saves
what she found (or what the user tells her) as a tracked record with a
status (`idea` → `pending` → `confirmed`, or `cancelled`), and the
`/bookings` page's booking link is always where the user finishes it
themselves. The same search box, add-by-hand form, and status buttons are
on the page directly, so tracking a booking doesn't require going through
chat at all.

## Content & Instagram research

`researchInstagramAccount` (`lib/instagram.ts`) reuses the same Gemini
Google Search grounding pattern again, tuned to surface what's publicly
findable about an Instagram account -- content style, niche, anything a
public source reports. There's no Instagram Graph API connected yet, so
it's explicitly instructed to never invent follower counts or engagement
numbers it didn't actually find; this is competitor/inspiration research,
not real analytics. `create_content_idea` saves a post/reel/story draft
(title, caption, hashtags, location, outfit) Laura brainstormed herself or
the user described, tracked `idea` → `scheduled` → `posted` on the
`/content` page -- same research-box/add-by-hand/status-button pattern as
Bookings. Nothing here ever posts to Instagram; it's planning and tracking
only, same as the booking tracker's "never books or pays" rule.

## Activity feed

Every time Laura saves a note, sets a reminder, or runs a web search, it's
recorded to `ActivityLog` and shows up two places: the home page's
"Activity" tab (a plain timeline), and a one-shot glow on the matching node
in the flow diagram right as the reply lands (`/api/chat`'s response
includes `toolsUsed`, which the frontend uses to trigger it). Read-only
tools (`get_current_time`, `list_reminders`) aren't logged — they're not
interesting as a history, just noise.

## Settings

`/settings` reads `process.env` presence (and, for Turso, the auth
token's own `exp` JWT claim) server-side and returns status only --
`connected`, `expires soon`, or `not set` -- never an actual secret value,
so the page is safe to leave open. It links to a living credentials setup
guide (a Claude-authored doc, not part of this repo) with exact steps for
everything still missing.

Building this page surfaced a real bug in `GsapEntrance`: its reveal
animation only scanned for `.gsap-entrance` elements once, on mount, so
anything rendered later from an async fetch (a Settings card, a Rota
shift, a Booking, a Content idea) inherited the CSS's pre-set `opacity: 0`
and then never got animated in -- permanently invisible. It just hadn't
been noticed yet because those other pages' lists have always been empty
in testing. Fixed with a `MutationObserver` inside `GsapEntrance` that
re-scans for new `.gsap-entrance`/`.pulse-dot` elements as they're added,
tracking what's already been animated in a `WeakSet` so nothing re-fires.

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
  Platform) for real bus/train times and journey calculation — commute
  planning already works today via Gemini's Google Search grounding, but a
  dedicated transit API would give exact timings instead of a search-based
  estimate.
- **Later (Instagram analytics/posting/DMs):** a Meta Business + Instagram
  Graph API app on top of a professional Instagram account — Meta's App
  Review process gates most of the DM/analytics scopes and can take time
  (and isn't guaranteed to approve an automated-reply use case). Public-
  account research and content-idea brainstorming/tracking already work
  today via Gemini's Google Search grounding, same as commute and booking
  search.
- **Later (email/calendar):** a Google Cloud project with an OAuth consent
  screen + Gmail/Calendar API scopes enabled.
- **Later (real-time booking availability):** whatever partner API a
  specific restaurant/booking platform offers (OpenTable, Resy, etc.) —
  most don't have a public self-serve API, so booking search already works
  today via Gemini's Google Search grounding ("search + hand you the
  booking link"), and will likely stay that way for most venues rather
  than a fully automated booking.
