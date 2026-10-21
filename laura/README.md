# Laura

A dark, Batcomputer-styled HQ: amber-on-black, angular panels, corner-
bracket HUD framing, a live status/clock readout, and a radar sweep on
the orb itself. A voice orb, a chat log, Notes,
Reminders, and a Vault. Laura can also search the live web (place hours,
directions/travel comparisons, current info) via Gemini's Google Search
grounding. She cannot yet send email/texts, make calls, or book/pay for
anything (rides, food, reservations) — those need real third-party
accounts and are later phases:

1. **Core brain + HQ** (this) — Gemini + tool-calling loop, a voice orb
   (browser Speech Recognition/Synthesis, no Twilio needed for this part),
   persistent chat, Notes, Reminders, an encrypted Vault, and web search.
2. **Text (SMS) + Gmail + Calendar** — text the Laura number, it sends email / books things.
3. **Phone calls** — same brain, call the Laura number and talk to it.
4. **Laura calls you** — proactive/scheduled calls (reminders read aloud, etc.).
5. **"Hey Laura" wake-word app** — always-listening mobile/desktop app, same backend.

Booking/paying for things on your behalf (an Uber, a restaurant table, food
delivery) isn't planned as a generic capability — those platforms mostly
don't offer self-serve APIs for individual developers. Laura can look things
up and recommend (via web_search), but won't execute a real-world purchase.

## Pages

| route        | what it is                                                                 |
|--------------|------------------------------------------------------------------------------|
| `/`          | Home — a minimal full-height hero: pill badge, serif headline, bracket CTA into `/laura`, ambient animated background |
| `/laura`     | the assistant itself — node-diagram view of the orb wired to its tools, + chat/Activity tabs |
| `/notes`     | notes you've written or asked Laura to remember                              |
| `/reminders` | things to do, set by you or by Laura from a conversation                     |
| `/vault`     | encrypted secrets (passwords, etc.) — Laura's own brain has no access to this |

Notes/Reminders/Vault all use a responsive auto-fit card grid (not a fixed
column count) so a handful of items still fill the row instead of leaving
a lone narrow card — plus search (Notes), pin-to-top (Notes), Low/Normal/
High priority with Overdue/Today/This week/Later grouping (Reminders, also
settable by Laura from a conversation), and copy-without-revealing
(Vault, via the clipboard, no on-screen display needed).

## Key files

| file                           | what it is                                                        |
|----------------------------------|----------------------------------------------------------------------|
| `lib/brain.ts`                    | the brain: system prompt, tool-calling loop (`get_current_time`, `create_note`, `create_reminder`, `list_reminders`, `web_search`), via Gemini |
| `lib/db.ts`                       | Prisma client (SQLite + driver adapter)                              |
| `lib/crypto.ts`                   | AES-256-GCM encrypt/decrypt for Vault entries                        |
| `lib/speech.ts`                   | minimal types for the (unstandardized) Web Speech API                |
| `lib/clip.ts`                      | the notched-corner clip-path shared by the primary button and icon tiles |
| `components/VoiceOrb.tsx`         | the orb: mic input via SpeechRecognition, speaks replies via SpeechSynthesis |
| `components/DustRing.tsx`         | canvas particle ring drawn behind the orb's button, colored per status |
| `components/DotGrid.tsx`          | dark dot-grid canvas background, used on each tool page's header      |
| `components/DotWaveField.tsx`     | perspective dot-wave grid canvas behind the Home hero                 |
| `components/Pill.tsx`             | filled dark badge with a leading amber dot, used for page headline counts/status |
| `components/Button.tsx`           | the app's one primary (notched amber gradient) and ghost/danger button style |
| `components/IconTile.tsx`         | small notched-corner icon tile, same brand motif as the primary button |
| `components/NoteCard.tsx`         | Notes page's node-editor-style card: port dot, title, pin, nested content panel |
| `components/ReminderCard.tsx`     | Reminders page's card: priority accent bar, overdue highlighting      |
| `components/VaultCard.tsx`        | Vault page's card: Reveal and Copy-without-revealing actions          |
| `components/PriorityPicker.tsx`   | Low/Normal/High selector used in the Reminders compose form           |
| `components/EmptyState.tsx`       | shared empty-state block (icon, heading, description, optional chips) |
| `components/SidebarCard.tsx`      | shared sidebar card/chip/stat-row used on Notes, Reminders, Vault     |
| `components/StatusBar.tsx`        | live clock + "SYSTEMS NOMINAL" readout at the top of the sidebar      |
| `components/FlowDiagram.tsx`      | home page's node graph: You → orb → Notes/Reminders/Vault/Web search/Calls, lights up whichever node Laura just used |
| `components/FlowNode.tsx`         | a single node card in that diagram (icon, title, active/inactive/pulsing state) |
| `components/ActivityFeed.tsx`     | home page's Activity tab: a timeline of what Laura's actually done     |
| `prisma/schema.prisma`            | `Note` (+pinned), `VaultItem`, `ChatMessage`, `Reminder` (+priority), `ActivityLog` models |
| `app/api/{chat,notes,reminders,vault,activity}/...` | API routes                                         |

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
  side effect (sending an email, making a call, booking something) —
  matters once real tools exist, since a misheard voice command or an
  ambiguous text could otherwise trigger a real action. Creating a note or
  a reminder is treated as low-stakes/reversible and doesn't need
  confirmation.
- **Only respond to you**: once SMS/calls are wired up (phase 2+), the
  webhook needs to check the caller/sender number against an allowlisted
  `OWNER_PHONE_NUMBER` before doing anything — otherwise anyone who gets
  the Laura number could ask it to send mail from your account.

## Persistence note

Storage is Turso (hosted libSQL, SQLite-wire-compatible) via
`@prisma/adapter-libsql`, used for both local dev and production — a
serverless host's filesystem isn't durable across deploys/invocations, so
there's no local-SQLite-file mode anymore. `googleapis` and `twilio` are
already installed for phase 2 but not wired up yet.

## Accounts you'll need before phase 2

A Twilio account + phone number, and a Google Cloud project with an OAuth
consent screen + Gmail/Calendar API scopes enabled. Neither is set up yet.
