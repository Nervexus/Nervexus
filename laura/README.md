# Laura

A personal assistant. This is the **core brain** — just Claude with a
tool-calling loop and a chat UI, no real-world integrations yet. The plan
is to build this up in phases:

1. **Core brain** (this) — Claude + tool-calling loop + a web chat UI to test it.
2. **Text (SMS) + Gmail + Calendar** — text the Laura number, it sends email / books things.
3. **Phone calls** — same brain, call the Laura number and talk to it.
4. **Laura calls you** — proactive/scheduled calls (reminders, read-backs).
5. **"Hey Laura" wake-word app** — always-listening mobile/desktop app, same backend.

## Files

| file                    | what it is                                                        |
|---------------------------|----------------------------------------------------------------------|
| `lib/anthropic.ts`        | the brain: system prompt, tool-calling loop, one demo tool (`get_current_time`) to prove the loop works end to end |
| `app/api/chat/route.ts`   | API route the chat UI calls                                          |
| `app/page.tsx`             | the chat UI                                                          |

## Running it

```bash
cp .env.example .env.local
# add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and talk to Laura.

## Design notes for later phases

- **Confirm before acting**: the system prompt already instructs Laura to
  describe and get a yes before calling any tool with a real-world,
  hard-to-undo side effect (sending an email, making a call, booking
  something) — this matters once real tools are wired up, since a
  misheard voice command or an ambiguous text could otherwise trigger a
  real action.
- **Only respond to you**: once SMS/calls are wired up (phase 2+), the
  webhook needs to check the caller/sender number against an allowlisted
  `OWNER_PHONE_NUMBER` before doing anything — otherwise anyone who gets
  the Laura number can ask it to send mail from your account.
- **Persistence**: phase 2 needs a real database (conversation history,
  OAuth refresh tokens, scheduled reminders). `prisma`, `googleapis`, and
  `twilio` are already installed for that — SQLite is fine for local dev,
  but switch to a hosted Postgres (Neon, Supabase, Vercel Postgres) before
  deploying for real, since serverless hosts don't give SQLite a durable
  filesystem.
- **Accounts you'll need before phase 2**: a Twilio account + phone
  number, and a Google Cloud project with an OAuth consent screen +
  Gmail/Calendar API scopes enabled. Neither is set up yet.
