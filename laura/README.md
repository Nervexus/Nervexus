# Laura

A personal assistant with an HQ: a voice orb, a chat log, Notes, and a
Vault. No real-world integrations (email/calendar/calls) yet — those are
the next phases:

1. **Core brain + HQ** (this) — Claude + tool-calling loop, a voice orb
   (browser Speech Recognition/Synthesis, no Twilio needed for this part),
   persistent chat, Notes, and an encrypted Vault.
2. **Text (SMS) + Gmail + Calendar** — text the Laura number, it sends email / books things.
3. **Phone calls** — same brain, call the Laura number and talk to it.
4. **Laura calls you** — proactive/scheduled calls (reminders, read-backs).
5. **"Hey Laura" wake-word app** — always-listening mobile/desktop app, same backend.

## Pages

| route      | what it is                                                                 |
|------------|------------------------------------------------------------------------------|
| `/`        | Home — the voice orb + chat, persisted across reloads                        |
| `/notes`   | notes you've written or asked Laura to remember                              |
| `/vault`   | encrypted secrets (passwords, etc.) — Laura's own brain has no access to this |

## Key files

| file                           | what it is                                                        |
|----------------------------------|----------------------------------------------------------------------|
| `lib/anthropic.ts`                | the brain: system prompt, tool-calling loop (`get_current_time`, `create_note`) |
| `lib/db.ts`                       | Prisma client (SQLite + driver adapter)                              |
| `lib/crypto.ts`                   | AES-256-GCM encrypt/decrypt for Vault entries                        |
| `lib/speech.ts`                   | minimal types for the (unstandardized) Web Speech API                |
| `components/VoiceOrb.tsx`         | the orb: mic input via SpeechRecognition, speaks replies via SpeechSynthesis |
| `prisma/schema.prisma`            | `Note`, `VaultItem`, `ChatMessage` models                             |
| `app/api/{chat,notes,vault}/...`  | API routes                                                            |

## Running it

```bash
cp .env.example .env.local
# add ANTHROPIC_API_KEY and TOKEN_ENCRYPTION_KEY (openssl rand -hex 32) to .env.local
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The voice orb needs
Chrome or Edge (Web Speech API support); other browsers fall back to text
only, with a note saying so rather than a crash.

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
  ambiguous text could otherwise trigger a real action. Creating a note is
  treated as low-stakes/reversible and doesn't need confirmation.
- **Only respond to you**: once SMS/calls are wired up (phase 2+), the
  webhook needs to check the caller/sender number against an allowlisted
  `OWNER_PHONE_NUMBER` before doing anything — otherwise anyone who gets
  the Laura number could ask it to send mail from your account.

## Persistence note

SQLite (via `@prisma/adapter-better-sqlite3`) is fine for local dev, but a
serverless host's filesystem isn't durable across deploys/invocations.
Before deploying this for real, swap the adapter in `lib/db.ts` for
`@prisma/adapter-libsql` (Turso) — same SQLite-compatible schema, just a
different adapter and a `DATABASE_URL`/auth token pointing at a hosted
database instead of a local file. `googleapis` and `twilio` are already
installed for phase 2 but not wired up yet.

## Accounts you'll need before phase 2

A Twilio account + phone number, and a Google Cloud project with an OAuth
consent screen + Gmail/Calendar API scopes enabled. Neither is set up yet.
