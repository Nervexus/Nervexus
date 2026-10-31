import { Type, type Content, type FunctionDeclaration } from "@google/genai";
import { prisma } from "@/lib/db";
import { placeCall, sendText, sendWithButtons } from "@/lib/telegram";
import { getGeminiClient, MODEL } from "@/lib/gemini";
import { getShifts, whoAmIWorkingWith, planCommute, saveShifts } from "@/lib/rota";
import { checkTracking } from "@/lib/tracking";
import { getTomorrowBriefing } from "@/lib/briefing";
import { outreach } from "@/lib/hq";
import { buildDay, localTime, todayYmd, tomorrowYmd, upcomingKeyDates, upcomingPlans } from "@/lib/routine";
import { searchBookingOptions, listBookings, readyToBookLinks, friendlyDateTime } from "@/lib/booking";
import { researchInstagramAccount, listContentIdeas } from "@/lib/instagram";
import { lookupPlace, type PlaceCard } from "@/lib/places";
import { textingInstructions } from "@/lib/texting";
import { activeModeBlock, detectMode, modeCatalogue, type ModeId } from "@/lib/modes";
import { USER_TIMEZONE } from "@/lib/booking-links";
import { isGoogleConfigured } from "@/lib/google";
import { getCalendarEvents, createCalendarEvent } from "@/lib/calendar";
import { sendEmail, readEmails, readEmailBody } from "@/lib/gmail";
import { scrapePage, getWeather, getNews, translateText, calculate, findLeads, enrichLead } from "@/lib/scrape";

const SYSTEM_PROMPT = `You are Laura, Madoxs Harvey's personal assistant.

== WHO YOU ARE ==
Madoxs is 19, lives in Fawley in Hampshire, works shifts, and is building a
website business on the side. You've been looking after him for a while:
you know his rota, his routine, the people he works with and what he's
working towards. Talk to him like a real person who knows him -- not a
search engine, not a customer-service bot, not a system reading out data.

What makes you you:
- Warm, quick and a bit dry. You're on his side and it shows.
- You notice things: an early start, a long day, a clash, something he's
  likely to forget. Mention it when it actually matters.
- You have opinions and you share them ("I'd get an early night").
- You talk about his life, not about records. You never sound like you're
  reading from a database.
- You remember what's been said in this conversation and build on it.
- Use his name now and then, never in every message.

== CONVERSATIONAL MODES ==
You naturally shift register depending on what he's asking, the way a
person does without thinking about it. Each turn you get a best guess at
the mode under "THIS MESSAGE" -- use it unless the message clearly needs
something else. Never announce or mention a mode. If the topic changes,
shift with it smoothly. A reply can blend modes (a work answer with a
casual line at the end is fine).

${modeCatalogue()}

== TURNING DATA INTO CONVERSATION ==
Tool results come back as raw data: ids, 24-hour times, abbreviated dates,
lists. Never pass that through. Say it the way a person would:
- Times: "9 till 5", "half 7", "6 in the morning" -- not "09:00 to 17:00".
- Dates: "tomorrow", "Thursday", "next Saturday" -- not "Thu 31 Oct". Only
  give the full date when it's more than a week away.
- People: "Christine, Harriette, Tony and Chris 2" in a sentence, not a list.
- Never show ids, field names, brackets, or things like "status: pending".
- Pick what matters. Six reminders and one is urgent? Lead with that one.
- Add the human bit when there is one: "early one", "long day that",
  "you're off after that".
Bad: "Shift: Thu 31 Oct, 09:00 to Thu 31 Oct, 17:00 (with Christine, Harriette)."
Good: "You're in 9 till 5 tomorrow with Christine and Harriette."
Never invent shifts, events, reminders, people or any personal detail. If
the data isn't there, say so plainly.

== HOW YOU WRITE (always, across all modes) ==
- Natural British English, contractions, plain words.
- Lead with the answer. Options: recommend one, say why briefly, mention
  one alternative at most.
- No formatting: no asterisks, bold, bullets, headings, or emoji (unless
  texting style settings say otherwise). Plain sentences only.
- No chatbot filler. Never open with "Great question", "Sure!", "Of
  course!", "Here are some options", and never say "How may I assist you".
- Don't tack an offer of more help onto every reply. Once in a while, when
  there's an obvious next thing, a short "Anything else about tomorrow?" is
  fine. Most replies just end when the point's made.
- Ask a follow-up only when you genuinely need it to act, and make it
  specific ("For how many, and what time?").
- Sound like you did the legwork. "The Cabinet's your best bet -- dark,
  moody cocktail bar, about £12 a drink. Want me to sort a table?" not
  "There are several options that might suit your needs."
- Don't mention being an AI, a model, or "my tools" unless asked.
- Never repeat or restate what he just said. Go straight to the answer.
- Vary your language. Don't reuse the same opener or closer from your
  recent messages. A real person doesn't.

You have a full set of real-world tools. You can send the user an urgent
notification or a plain message via Telegram (call_me, text_me) --
call_me does NOT place an actual ringing phone call, it just sends an
urgent-styled message, so never claim to have "called" or "rung" the
user, say you've "sent an urgent message" or similar instead. You can
NEVER complete, confirm, or pay for a booking yourself -- no matter how
clearly the user authorizes it. For restaurants/activities/travel, use
search_booking_options to find real current options and links, then
create_booking to save one you're tracking (status "idea" if just
researched, "pending" once the user says they're going to book it
themselves) -- always via that link, never by you. When the user picks a
place and wants to book it, use prepare_booking instead: it saves the
booking as pending and sends them a Telegram message with ready-to-book
links (prefilled with the date, time and party size where possible) and
an "I booked it" button they tap once they've finished -- then tell them
to check Telegram. Ask for the date, time and party size first if you
don't have them. Don't claim to have
booked, confirmed, or paid for anything unless the user tells you they did
it and asks you to update the record. If asked to do something else you
can't do yet, say so plainly and briefly explain what's still missing.

When you do have a tool that takes a real-world, hard-to-undo action --
including call_me and text_me, which send a real notification to the
user's phone -- describe exactly what you're about to do and ask for a
yes before calling it, unless the user has already clearly confirmed
earlier in this same conversation. Creating a note or a reminder is
low-stakes and reversible, so those don't need confirmation -- just do
them when asked.

For anything you don't know for certain -- whether a place is open right
now, current prices, directions, which way to travel (train vs. rideshare
vs. walking), recent news, or any other real-world fact that can change --
use web_search rather than guessing from memory. Summarize what you find
plainly; don't dump raw search results.

You have access to the user's work rota (get_shifts, who_am_i_working_with)
-- use it for questions about shifts, days off, or who they're working
with. If the rota has no shifts yet, say so and suggest they add one on
the Rota page rather than guessing. For "what does tomorrow look like" or
similar, use get_tomorrow_briefing rather than combining get_shifts and
list_reminders yourself -- it already covers the shift, commute, and
reminders together.

Daily routine: Madoxs (19, Fawley, shift worker) has a routine built into
the app -- skincare, hair and beard, perfume oils, work blocks (outreach to
roofers Mon/Wed/Fri after shift, driving theory Tue/Thu, weekly review
Sunday) and key dates up to the Budapest trip. Use get_routine for anything
about it ("what's my routine today", "what should I wear tonight", "is it
an exfoliator night"). When he tells you about a perfume oil he owns, save
it with add_fragrance (work out day/night/cold from its notes if he doesn't
say). His goals: grow the website business (£250 sites for roofers), pass
his driving test and get a car, find a 2-bed rental near Waterside, and
look his best -- keep advice short and practical toward those.

Outreach: Madoxs runs a separate outreach app (Signal Outreach) that
emails roofers about £250 websites; it's linked to you. Use
get_outreach_stats for "how's outreach going", list_outreach_leads /
get_outreach_lead for leads and who replied, add_outreach_lead when he
mentions a new prospect, and set_outreach_lead_status when he says a lead
booked a call, won, or went cold. You can draft an email to a lead with
draft_outreach_email -- it only queues a draft for him to review in the
outreach app; you never send outreach messages yourself, so say "I've
queued a draft for you to check", never "I've sent it". Replies are
checked about hourly on weekdays, so the newest ones can lag.

Lead generation: use find_leads to search Google, Yell, Checkatrade and
other directories for roofers (or any trade) in a given area -- it
returns their name, phone, email, and website. Use enrich_lead to dig
deeper into a specific company (visit their site, rate its quality,
find the owner). Companies with no website or a poor-quality one are the
best prospects for a £250 rebuild. After finding leads, offer to add
them to the outreach system with add_outreach_lead.

Email: you can send emails on Madoxs's behalf with send_email (from his
own Gmail), read his inbox with read_emails, and pull the full body of
a specific email with read_email_body. Confirm before sending. If Google
isn't connected yet, tell him to visit the System page and connect it.

Calendar: use get_calendar to see his upcoming events, and
create_calendar_event to add one. Combine this with his rota for full
scheduling questions.

Web: you can read any web page with scrape_page (articles, products,
tracking pages, anything), get_weather for forecasts, get_news for
headlines, translate text, and do maths with calculate. scrape_page is
your go-to for checking anything live on the web -- parcel tracking
pages, product prices, event tickets, opening hours. Use it freely.

Notes: you can search and list saved notes with list_notes, update them
with update_note, and create new ones with create_note. Use notes to
keep track of things for him.

Your rota and reminders are yours to keep tidy: when he pastes a rota or
tells you his hours, add them with add_shifts (only his shifts, skip days
off); edit an existing shift with update_shift (change times, date,
location or colleagues); remove a wrong one with remove_shift; tick off,
move, rename or delete reminders with update_reminder (get ids from
get_shifts / list_reminders first). When he sends a parcel tracking link or number,
use check_tracking and tell him where it's at in a line. Files he sends
on Telegram (rota photos, spreadsheets, PDFs, letters, screenshots) are
read for you automatically. Paying for things and completing bookings,
and anything in the Vault, stay off-limits.

When he asks for something you can't do yet, or says "tell Claude" /
"pass this on", log it with forward_to_claude (Claude Code is the
developer who builds you) and tell him it's in Settings under For Claude
Code, ready to paste into the developer chat. Don't promise when it'll be
built.

Going out (restaurants, bars, activities, days out): before recommending
anywhere, find out what it's for if you don't already know -- ask in one
short, natural text, e.g. "Nice -- what's the occasion? Date, night out
with the lads, something chill? And roughly what budget?" Read the
occasion (a date, a group, larping/an event, a chill day, a work thing)
and pick to fit it. Once you have a pick, call show_place for it (and at
most one alternative) -- that sends him photos of the place with its
rating, price, vibe and an honest verdict. Don't repeat those details in
your own reply; add your personal take in a line, e.g. "Perfect for a
date -- ask for a booth at the back." Then offer to book it
(prepare_booking) once he's keen.

Use list_bookings to check what the user is already tracking before
suggesting something new (so you don't duplicate an existing idea).

There is no Instagram account connected yet, so you have no real
analytics (follower counts, engagement, insights) and cannot post or
schedule. Instagram messages and DMs are out of scope for good: you never
read, draft, send or reply to Instagram messages, even if asked. research_instagram_account only searches
the public web for what's findable about an account -- never invent
follower/engagement numbers it didn't find. You CAN help brainstorm post
ideas, captions, hashtags, locations, and outfits yourself (that's just
creative writing, not a real tool), and save one with create_content_idea
so it's tracked on the Content page -- but always as a draft the user
reviews and posts themselves, never as something you did.

You never have access to the Vault. If asked for a password or secret,
say you can't see the Vault's contents and the user should look it up
there themselves.`;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Deliberately not exposing Vault reads/writes as a tool: an LLM
// conversation is the wrong place for secrets to flow through,
// especially once this talks over SMS/voice in later phases.
const tools: FunctionDeclaration[] = [
  {
    name: "get_current_time",
    description: "Get the current date and time.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "create_note",
    description: "Save a note for the user to see later in their Notes list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title for the note." },
        body: { type: Type.STRING, description: "The note's content." },
      },
      required: ["title", "body"],
    },
  },
  {
    name: "create_reminder",
    description:
      "Save a reminder with a specific due date/time. Resolve relative times " +
      "('tomorrow at 5pm') to an absolute ISO 8601 datetime yourself, using " +
      "get_current_time for 'now' if you need it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title, e.g. 'Call the dentist'." },
        dueAt: {
          type: Type.STRING,
          description: "Absolute ISO 8601 datetime the reminder is due, e.g. 2026-10-21T17:00:00Z.",
        },
        note: { type: Type.STRING, description: "Optional extra detail." },
        priority: {
          type: Type.STRING,
          description:
            "How urgent this is: 'low', 'normal', or 'high'. Use 'high' for things the " +
            "user stresses the importance of or that have real consequences if missed.",
        },
      },
      required: ["title", "dueAt"],
    },
  },
  {
    name: "list_reminders",
    description: "List the user's upcoming (not-yet-done) reminders, soonest first.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "web_search",
    description:
      "Search the live web for something you don't know for certain: whether a " +
      "place is open or has availability right now, current prices, directions " +
      "or travel options between two places, recent news, or any other " +
      "real-world fact that can change over time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "What to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "call_me",
    description:
      "Send the user an urgent-styled Telegram notification -- the free stand-in " +
      "for 'calling' them (it does not place an actual ringing phone call). " +
      "Confirm with the user first, per the hard-to-undo-action rule.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: "The urgent message to send." },
      },
      required: ["message"],
    },
  },
  {
    name: "text_me",
    description:
      "Send the user a plain Telegram message. Confirm with the user first, per " +
      "the hard-to-undo-action rule.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: "The message body." },
      },
      required: ["message"],
    },
  },
  {
    name: "get_shifts",
    description: "List the user's upcoming work shifts, soonest first.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.NUMBER,
          description: "How many days ahead to look. Defaults to 14 if not given.",
        },
      },
    },
  },
  {
    name: "who_am_i_working_with",
    description: "Find who the user is scheduled to work with on a given date.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "Absolute ISO 8601 date (e.g. 2026-10-25), resolved from relative terms " +
            "like 'tomorrow' or 'Friday' using get_current_time if needed.",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "plan_commute",
    description:
      "Work out when to leave home for the shift on a given date, searching live " +
      "transit info. Needs home/work addresses set on the Rota page first -- if " +
      "the tool says they're missing, tell the user to add them there.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "Absolute ISO 8601 date of the shift to plan for, resolved from relative " +
            "terms like 'tomorrow' using get_current_time if needed.",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "get_tomorrow_briefing",
    description:
      "Get tomorrow's shift (with a commute plan, if addresses are set) and " +
      "tomorrow's reminders, combined into one summary. Use this for 'what does " +
      "tomorrow look like', 'brief me on tomorrow', or similar.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_routine",
    description:
      "Get Madoxs's routine for today or tomorrow: shift, morning and night " +
      "skincare steps, work block, hair/beard status, which perfume oil to wear " +
      "(and picks for each plan this week), and key dates.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING, enum: ["today", "tomorrow"], description: "Defaults to today." },
      },
    },
  },
  {
    name: "add_fragrance",
    description: "Save a perfume oil the user owns to their fragrance list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        notes: { type: Type.STRING, description: "Scent notes, e.g. 'oud, vanilla, smoky'." },
        day: { type: Type.BOOLEAN, description: "Good for daytime." },
        night: { type: Type.BOOLEAN, description: "Good for evenings/nights out." },
        cold: { type: Type.BOOLEAN, description: "Good in cold weather." },
      },
      required: ["name"],
    },
  },
  {
    name: "get_outreach_stats",
    description: "Outreach numbers from the outreach app: sent and replies today and this week, calls booked, won, and warm leads.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "list_outreach_leads",
    description: "List outreach leads by status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ["warm", "new", "contacted", "replied", "call_booked", "won", "lost"],
          description: "Defaults to warm.",
        },
      },
    },
  },
  {
    name: "get_outreach_lead",
    description: "One outreach lead with its message history. Needs the lead id from list_outreach_leads or get_outreach_stats.",
    parameters: { type: Type.OBJECT, properties: { id: { type: Type.STRING } }, required: ["id"] },
  },
  {
    name: "add_outreach_lead",
    description: "Add a prospect to the outreach app. It starts as warm and stays out of the automatic email sequence. Duplicates return the existing lead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Contact's name." },
        company: { type: Type.STRING },
        phone: { type: Type.STRING },
        email: { type: Type.STRING },
        website: { type: Type.STRING },
        note: { type: Type.STRING },
      },
      required: ["name", "company"],
    },
  },
  {
    name: "set_outreach_lead_status",
    description: "Update a lead's status in the outreach app. Any status stops automatic follow-ups to that lead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["warm", "call_booked", "won", "lost"] },
        note: { type: Type.STRING },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "draft_outreach_email",
    description:
      "Queue a draft email to a lead for Madoxs to review and send from the outreach app. Never sends anything. Email only -- fails if the lead has no email address.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        leadId: { type: Type.STRING },
        text: { type: Type.STRING, description: "The email body, in Madoxs's voice: short, friendly, no hard sell." },
        subject: { type: Type.STRING, description: "Optional; defaults to 'Re: <last subject>'." },
      },
      required: ["leadId", "text"],
    },
  },
  {
    name: "recent_outreach_activity",
    description: "The latest replies and lead status changes the outreach app has reported to you.",
    parameters: { type: Type.OBJECT, properties: { days: { type: Type.NUMBER, description: "Defaults to 7." } } },
  },
  {
    name: "add_shifts",
    description:
      "Add one or more work shifts to his rota -- e.g. when he pastes his rota as text or tells you his hours. " +
      "Only add his own shifts (Madoxs), skip days off (D/O, OFF, HOL). Read shorthand like '8-6' as 08:00-18:00. " +
      "Use UK local times. Shifts already on the rota at the same start are skipped.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        shifts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
              start: { type: Type.STRING, description: "HH:MM, 24-hour UK time" },
              end: { type: Type.STRING, description: "HH:MM, 24-hour UK time (past midnight is fine for nights)" },
              colleagues: { type: Type.STRING, description: "Comma-separated, if known." },
              location: { type: Type.STRING },
            },
            required: ["date", "start", "end"],
          },
        },
      },
      required: ["shifts"],
    },
  },
  {
    name: "remove_shift",
    description: "Delete a shift from his rota. Needs the shift id from get_shifts.",
    parameters: { type: Type.OBJECT, properties: { id: { type: Type.STRING } }, required: ["id"] },
  },
  {
    name: "update_shift",
    description:
      "Edit an existing shift on his rota -- change times, date, location, colleagues or note. Needs the shift id from get_shifts. " +
      "Only include fields you're changing; omit the rest.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Shift id from get_shifts." },
        date: { type: Type.STRING, description: "New date YYYY-MM-DD, if changing the day." },
        start: { type: Type.STRING, description: "New start HH:MM 24-hour UK time." },
        end: { type: Type.STRING, description: "New end HH:MM 24-hour UK time." },
        location: { type: Type.STRING, description: "New location." },
        colleagues: { type: Type.STRING, description: "New colleagues, comma-separated." },
        note: { type: Type.STRING, description: "New note." },
      },
      required: ["id"],
    },
  },
  {
    name: "update_reminder",
    description:
      "Change a reminder: mark it done, move it to a new time, rename it, or delete it. Needs the reminder id from list_reminders.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        action: { type: Type.STRING, enum: ["done", "reschedule", "rename", "delete"] },
        dueAt: { type: Type.STRING, description: "New absolute ISO 8601 time, for reschedule." },
        title: { type: Type.STRING, description: "New title, for rename." },
      },
      required: ["id", "action"],
    },
  },
  {
    name: "check_tracking",
    description:
      "Check a parcel's delivery status from a tracking link or tracking number he sends. Report the status, expected " +
      "delivery and latest update in a line or two; if it couldn't be read, say so.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        input: { type: Type.STRING, description: "The tracking URL or tracking number." },
        courier: { type: Type.STRING, description: "Courier name if known (Royal Mail, Evri, DPD...)." },
      },
      required: ["input"],
    },
  },
  {
    name: "forward_to_claude",
    description:
      "Pass something on to Claude Code, the developer who builds this app: a feature Madoxs wants that you can't do " +
      "yet, a bug, or a note he asks you to forward ('tell Claude...'). Write it clearly enough to act on without him.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, enum: ["feature", "bug", "note"] },
        summary: { type: Type.STRING, description: "One line, e.g. 'Let Laura read Google Calendar'." },
        details: { type: Type.STRING, description: "What he wants and why, with any example he gave." },
      },
      required: ["summary"],
    },
  },
  {
    name: "search_booking_options",
    description:
      "Search the live web for real restaurant/activity/travel options matching " +
      "what the user wants, with current availability info and a direct booking " +
      "link where possible. This only researches -- it never books anything.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "What the user wants, e.g. 'Italian restaurant near Soho for 4 Friday 8pm'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_booking",
    description:
      "Save a booking the user is tracking -- something you researched, or one " +
      "they're telling you about. This never books or pays for anything itself.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title, e.g. 'Dinner at Lina's'." },
        category: {
          type: Type.STRING,
          description: "'restaurant', 'activity', 'travel', or 'other'. Defaults to 'other'.",
        },
        dateTime: {
          type: Type.STRING,
          description: "Absolute ISO 8601 datetime, if known.",
        },
        partySize: { type: Type.NUMBER, description: "Number of people, if known." },
        location: { type: Type.STRING, description: "Where it is, if known." },
        link: { type: Type.STRING, description: "The booking link, if you found or were given one." },
        status: {
          type: Type.STRING,
          description:
            "'idea' (just researched, default), or 'pending' if the user said they're " +
            "going to book it. Never set 'confirmed' unless the user tells you they " +
            "already completed the booking themselves.",
        },
        note: { type: Type.STRING, description: "Anything else worth keeping." },
      },
      required: ["title"],
    },
  },
  {
    name: "show_place",
    description:
      "Show the user a specific venue you're recommending: looks up its current rating, " +
      "price, vibe and an honest verdict from reviews, and sends photos of it from its " +
      "website. Use for your top pick (and at most one alternative).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The venue's name, e.g. 'The Cabinet'." },
        location: { type: Type.STRING, description: "Town or area, e.g. 'Winchester'." },
      },
      required: ["name"],
    },
  },
  {
    name: "prepare_booking",
    description:
      "When the user wants to book a specific place: save it as pending and send them a " +
      "Telegram message with ready-to-book links (prefilled where the site allows) plus " +
      "'I booked it' / 'Skip' buttons. Tapping 'I booked it' confirms it and sets a " +
      "reminder. This never books or pays for anything itself.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title, e.g. 'Dinner at Lina's'." },
        category: { type: Type.STRING, description: "'restaurant', 'activity', 'travel', or 'other'." },
        dateTime: { type: Type.STRING, description: "Absolute ISO 8601 datetime with offset." },
        partySize: { type: Type.NUMBER, description: "Number of people." },
        location: { type: Type.STRING, description: "Area or address, e.g. 'Soho, London'." },
        link: { type: Type.STRING, description: "The venue's own booking link, if research found one." },
      },
      required: ["title"],
    },
  },
  {
    name: "list_bookings",
    description: "List bookings the user is currently tracking (not cancelled).",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "research_instagram_account",
    description:
      "Search the live web for what's publicly known about an Instagram account -- " +
      "content style, niche, anything publicly reported. There's no connected " +
      "Instagram account, so this never returns real follower counts or engagement " +
      "unless a specific public source states them.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        handle: { type: Type.STRING, description: "The Instagram handle, with or without '@'." },
      },
      required: ["handle"],
    },
  },
  {
    name: "create_content_idea",
    description:
      "Save a content idea (post/reel/story) the user is planning -- your own " +
      "brainstormed caption/hashtags/location/outfit, or what the user describes. " +
      "This only tracks a draft; it never posts anything.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title, e.g. 'Beach sunset reel'." },
        type: { type: Type.STRING, description: "'post', 'reel', 'story', or 'other'. Defaults to 'post'." },
        caption: { type: Type.STRING, description: "Draft caption, if you've written one." },
        hashtags: { type: Type.STRING, description: "Comma-separated hashtags, no '#'." },
        location: { type: Type.STRING, description: "Suggested location, if any." },
        outfit: { type: Type.STRING, description: "Suggested outfit, if any." },
        scheduledAt: { type: Type.STRING, description: "Absolute ISO 8601 datetime, if the user picked one." },
        note: { type: Type.STRING, description: "Anything else worth keeping." },
      },
      required: ["title"],
    },
  },
  {
    name: "list_content_ideas",
    description: "List content ideas the user is currently tracking (not posted or discarded).",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "start_video_call",
    description:
      "Send the user a link to an instant, free video/audio call (Jitsi Meet) -- for " +
      "when a live conversation would help more than text. This does not place an " +
      "actual ringing phone call and Laura does not join the call herself; it just " +
      "gives the user a link to start one, e.g. to loop in someone else.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  // ── Email & Calendar ──
  {
    name: "send_email",
    description:
      "Send an email from Madoxs's Gmail. This sends a real email — always confirm with " +
      "him first. If Google isn't connected, say so.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING, description: "Recipient email address." },
        subject: { type: Type.STRING },
        body: { type: Type.STRING, description: "Plain text email body. Write in Madoxs's voice unless told otherwise." },
        cc: { type: Type.STRING, description: "CC address, if any." },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "read_emails",
    description:
      "Read recent emails from Madoxs's Gmail inbox. Use Gmail search syntax for the query " +
      "(e.g. 'from:amazon.co.uk', 'is:unread', 'subject:invoice', 'newer_than:2d').",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Gmail search query. Defaults to recent inbox." },
        maxResults: { type: Type.NUMBER, description: "How many to return, max 20. Defaults to 10." },
      },
    },
  },
  {
    name: "read_email_body",
    description: "Read the full body of a specific email. Needs the message id from read_emails.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING, description: "The email's message id." } },
      required: ["id"],
    },
  },
  {
    name: "get_calendar",
    description:
      "Get upcoming events from Madoxs's Google Calendar. Combine with get_shifts for a full " +
      "picture of his schedule.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: { type: Type.NUMBER, description: "How many days ahead to look. Defaults to 7." },
      },
    },
  },
  {
    name: "create_calendar_event",
    description:
      "Add an event to Madoxs's Google Calendar. This creates a real calendar event — confirm first.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        start: { type: Type.STRING, description: "ISO 8601 datetime with timezone offset, e.g. 2026-11-01T14:00:00+00:00." },
        end: { type: Type.STRING, description: "ISO 8601 datetime with timezone offset." },
        location: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["title", "start", "end"],
    },
  },
  // ── Web & scraping ──
  {
    name: "scrape_page",
    description:
      "Read any web page and extract information from it — articles, product pages, " +
      "tracking pages, timetables, anything public. Much more reliable than web_search " +
      "when you already have the URL. Can answer a specific question about the page.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The full URL to read." },
        question: { type: Type.STRING, description: "Optional: a specific question to answer about the page." },
      },
      required: ["url"],
    },
  },
  {
    name: "get_weather",
    description: "Get the current weather and forecast for a location. Temperatures in Celsius.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: "City or area, e.g. 'Fawley, Hampshire' or 'London'." },
      },
      required: ["location"],
    },
  },
  {
    name: "get_news",
    description: "Get the latest news headlines — general UK news or about a specific topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "Optional: a topic to search for, e.g. 'Premier League' or 'tech'." },
      },
    },
  },
  {
    name: "translate",
    description: "Translate text between languages.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "The text to translate." },
        to: { type: Type.STRING, description: "Target language, e.g. 'Spanish', 'French', 'Japanese'." },
      },
      required: ["text", "to"],
    },
  },
  {
    name: "calculate",
    description:
      "Do maths — from simple sums to unit conversions, percentages, mortgage calculations, " +
      "currency conversions, tip splitting, anything with numbers.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: "The calculation or question, e.g. '15% of 340', '£250 in euros', 'split £87.50 between 4 people'." },
      },
      required: ["expression"],
    },
  },
  // ── Notes management ──
  {
    name: "list_notes",
    description: "Search and list saved notes. Returns titles, ids, and a preview of each.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search: { type: Type.STRING, description: "Optional: search term to filter notes by title or body." },
        limit: { type: Type.NUMBER, description: "Max notes to return, defaults to 10." },
      },
    },
  },
  {
    name: "update_note",
    description: "Edit or delete a saved note. Needs the note id from list_notes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        action: { type: Type.STRING, enum: ["edit", "delete"], description: "What to do with the note." },
        title: { type: Type.STRING, description: "New title, for edit." },
        body: { type: Type.STRING, description: "New body text, for edit." },
      },
      required: ["id", "action"],
    },
  },
  {
    name: "schedule_message",
    description:
      "Schedule a Telegram message to send later — e.g. 'remind me at 7am' or 'text me " +
      "tonight at 10pm'. Creates a reminder that triggers a Telegram notification when due.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: "The message to send." },
        sendAt: { type: Type.STRING, description: "ISO 8601 datetime when to send it." },
      },
      required: ["message", "sendAt"],
    },
  },
  // ── Lead generation ──
  {
    name: "find_leads",
    description:
      "Search Google, Yell, Checkatrade and other directories for real businesses " +
      "in an area — finds their name, phone, email, and website. Perfect for finding " +
      "roofers (or any trade) to add to the outreach system. Returns structured results " +
      "you can then add with add_outreach_lead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trade: { type: Type.STRING, description: "The trade or business type, e.g. 'roofers', 'builders', 'plumbers'." },
        area: { type: Type.STRING, description: "Town, city or region to search in, e.g. 'Southampton', 'Hampshire', 'Bournemouth'." },
        count: { type: Type.NUMBER, description: "How many leads to find. Defaults to 10, max 20." },
      },
      required: ["trade", "area"],
    },
  },
  {
    name: "enrich_lead",
    description:
      "Get more details about a specific company — visit their website to find email, " +
      "phone, owner name, and rate their website quality (poor sites are the best " +
      "prospects for a £250 website rebuild). Use after find_leads for promising prospects.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        company: { type: Type.STRING, description: "The company name to research." },
        website: { type: Type.STRING, description: "Their website URL, if known." },
      },
      required: ["company"],
    },
  },
];

// Isolated from the main tool-calling loop: Gemini doesn't support mixing
// its built-in googleSearch tool with custom function declarations in the
// same request, so this runs as a separate, search-only call whose answer
// comes back as plain text (like any other tool result).
async function webSearch(query: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: query,
    config: { tools: [{ googleSearch: {} }] },
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk) => chunk.web?.uri)
    .filter((uri): uri is string => Boolean(uri))
    .slice(0, 3);

  const answer = response.text ?? "Couldn't find anything useful.";
  return sources?.length ? `${answer}\n\nSources: ${sources.join(", ")}` : answer;
}

// Tools worth surfacing in the home page's Activity feed -- a real-world
// effect, or an answer that came from outside the model's own memory.
// get_current_time/list_reminders are read-only/self-referential noise.
const LOGGED_TOOLS = new Set([
  "create_note",
  "create_reminder",
  "web_search",
  "call_me",
  "text_me",
  "plan_commute",
  "get_tomorrow_briefing",
  "search_booking_options",
  "create_booking",
  "prepare_booking",
  "show_place",
  "research_instagram_account",
  "create_content_idea",
  "start_video_call",
  "add_fragrance",
  "add_shifts",
  "remove_shift",
  "update_shift",
  "update_reminder",
  "check_tracking",
  "forward_to_claude",
  "add_outreach_lead",
  "set_outreach_lead_status",
  "draft_outreach_email",
  "send_email",
  "read_emails",
  "read_email_body",
  "get_calendar",
  "create_calendar_event",
  "scrape_page",
  "get_weather",
  "get_news",
  "translate",
  "calculate",
  "list_notes",
  "update_note",
  "schedule_message",
  "find_leads",
  "enrich_lead",
]);

async function logActivity(tool: string, summary: string) {
  await prisma.activityLog.create({ data: { tool, summary } }).catch((err) => {
    console.error("activity log write failed:", err);
  });
}

type ToolContext = { places: PlaceCard[] };

async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<Record<string, unknown>> {
  if (name === "get_current_time") {
    return { result: `${ukNow()} (UK time)` };
  }
  if (name === "create_note") {
    const { title, body } = args as { title?: string; body?: string };
    if (!title || !body) {
      return { error: "a note needs both a title and a body" };
    }
    const note = await prisma.note.create({ data: { title, body } });
    await logActivity("create_note", `Saved note "${note.title}"`);
    return { result: `Saved note "${note.title}".` };
  }
  if (name === "create_reminder") {
    const { title, dueAt, note, priority } = args as {
      title?: string;
      dueAt?: string;
      note?: string;
      priority?: string;
    };
    if (!title || !dueAt) {
      return { error: "a reminder needs both a title and a dueAt datetime" };
    }
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) {
      return { error: "dueAt must be a valid ISO 8601 datetime" };
    }
    const safePriority = ["low", "normal", "high"].includes(priority ?? "") ? priority! : "normal";
    const reminder = await prisma.reminder.create({
      data: { title, dueAt: due, note: note ?? null, priority: safePriority },
    });
    await logActivity("create_reminder", `Set reminder "${reminder.title}"`);
    return { result: `Set a reminder for "${reminder.title}" at ${due.toString()}.` };
  }
  if (name === "list_reminders") {
    const reminders = await prisma.reminder.findMany({
      where: { done: false },
      orderBy: { dueAt: "asc" },
    });
    if (reminders.length === 0) return { result: "No upcoming reminders." };
    return {
      result: reminders
        .map((r) => `- [id:${r.id}] ${r.title} (${friendlyDateTime(r.dueAt)})${r.note ? `: ${r.note}` : ""}`)
        .join("\n"),
    };
  }
  if (name === "web_search") {
    const { query } = args as { query?: string };
    if (!query) return { error: "web_search needs a query" };
    try {
      const result = await webSearch(query);
      await logActivity("web_search", `Searched: "${query}"`);
      return { result };
    } catch (err) {
      console.error("web_search error:", err);
      return { error: err instanceof Error ? err.message : "web search failed" };
    }
  }
  if (name === "call_me") {
    const { message } = args as { message?: string };
    if (!message) return { error: "call_me needs a message to send" };
    const result = await placeCall(message);
    if (!result.ok) return { error: result.error };
    await logActivity("call_me", `Sent an urgent message: "${message}"`);
    return { result: "Sent as an urgent notification." };
  }
  if (name === "text_me") {
    const { message } = args as { message?: string };
    if (!message) return { error: "text_me needs a message body" };
    const result = await sendText(message);
    if (!result.ok) return { error: result.error };
    await logActivity("text_me", `Sent a message: "${message}"`);
    return { result: "Sent." };
  }
  if (name === "get_shifts") {
    const { days } = args as { days?: number };
    const shifts = await getShifts(typeof days === "number" ? days : 14);
    if (shifts.length === 0) return { result: "No upcoming shifts on the rota." };
    return {
      result: shifts
        .map(
          (s) =>
            `- [id:${s.id}] ${friendlyDateTime(s.startAt)} to ${friendlyDateTime(s.endAt)}` +
            (s.location ? ` at ${s.location}` : "") +
            (s.colleagues ? ` (with ${s.colleagues})` : "")
        )
        .join("\n"),
    };
  }
  if (name === "who_am_i_working_with") {
    const { date } = args as { date?: string };
    if (!date) return { error: "who_am_i_working_with needs a date" };
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return { error: "date must be a valid ISO 8601 date" };
    const answer = await whoAmIWorkingWith(parsed);
    return { result: answer };
  }
  if (name === "plan_commute") {
    const { date } = args as { date?: string };
    if (!date) return { error: "plan_commute needs a date" };
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return { error: "date must be a valid ISO 8601 date" };

    const dayStart = new Date(parsed);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const shift = await prisma.shift.findFirst({
      where: { startAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startAt: "asc" },
    });
    if (!shift) return { error: `No shift on the rota for ${dayStart.toDateString()}.` };

    try {
      const plan = await planCommute(shift.id);
      await logActivity("plan_commute", `Planned commute for ${dayStart.toDateString()}`);
      return { result: plan };
    } catch (err) {
      console.error("plan_commute error:", err);
      return { error: err instanceof Error ? err.message : "Couldn't plan the commute." };
    }
  }
  if (name === "get_tomorrow_briefing") {
    try {
      const briefing = await getTomorrowBriefing();
      await logActivity("get_tomorrow_briefing", "Pulled tomorrow's briefing");
      return { result: briefing.summary };
    } catch (err) {
      console.error("get_tomorrow_briefing error:", err);
      return { error: err instanceof Error ? err.message : "Couldn't build tomorrow's briefing." };
    }
  }
  if (name === "get_routine") {
    try {
      const which = args.day === "tomorrow" ? "tomorrow" : "today";
      const [day, plans] = await Promise.all([
        buildDay(which === "tomorrow" ? tomorrowYmd() : todayYmd()),
        upcomingPlans(7),
      ]);
      return { result: { day, plansThisWeek: plans, keyDates: upcomingKeyDates(4) } };
    } catch (err) {
      console.error("get_routine error:", err);
      return { error: "Couldn't load the routine." };
    }
  }
  if (name === "add_fragrance") {
    const { name: oilName, notes, day, night, cold } = args as {
      name?: string; notes?: string; day?: boolean; night?: boolean; cold?: boolean;
    };
    if (!oilName?.trim()) return { error: "add_fragrance needs a name" };
    const oil = await prisma.fragrance.create({
      data: { name: oilName.trim(), notes: notes?.trim() || null, day: !!day, night: !!night, cold: !!cold },
    });
    await logActivity("add_fragrance", `Added perfume oil: ${oil.name}`);
    return { result: oil };
  }
  if (OUTREACH_TOOLS.has(name)) {
    try {
      return { result: await runOutreachTool(name, args) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Outreach request failed." };
    }
  }
  if (name === "add_shifts") {
    const list = Array.isArray(args.shifts) ? (args.shifts as { date?: string; start?: string; end?: string; colleagues?: string; location?: string }[]) : [];
    const parsed = [];
    for (const x of list) {
      const time = (t?: string) => (t && /^(\d{1,2}):(\d{2})$/.test(t) ? t.split(":").map(Number) : null);
      const st = time(x.start);
      const en = time(x.end);
      if (!x.date || !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !st || !en) continue;
      const startAt = localTime(x.date, st[0], st[1]);
      let endAt = localTime(x.date, en[0], en[1]);
      if (endAt <= startAt) endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000); // night shift
      parsed.push({ startAt: startAt.toISOString(), endAt: endAt.toISOString(), location: x.location ?? null, colleagues: x.colleagues ?? null, note: null });
    }
    if (parsed.length === 0) return { error: "No valid shifts to add (need date YYYY-MM-DD, start and end HH:MM)." };
    const added = await saveShifts(parsed, "chat");
    await logActivity("add_shifts", `Added ${added.length} shift${added.length === 1 ? "" : "s"} from chat`);
    return {
      result: `Added ${added.length} of ${parsed.length}${parsed.length - added.length ? ` (${parsed.length - added.length} already on the rota)` : ""}: ` +
        added.map((a) => `${friendlyDateTime(new Date(a.startAt))}–${friendlyDateTime(new Date(a.endAt)).slice(-5)}`).join("; "),
    };
  }
  if (name === "remove_shift") {
    const id = String(args.id ?? "");
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) return { error: "No shift with that id -- use get_shifts first." };
    await prisma.shift.delete({ where: { id } });
    await logActivity("remove_shift", `Removed the ${friendlyDateTime(shift.startAt)} shift`);
    return { result: `Removed the shift on ${friendlyDateTime(shift.startAt)}.` };
  }
  if (name === "update_shift") {
    const id = String(args.id ?? "");
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) return { error: "No shift with that id -- use get_shifts first." };
    const time = (t?: string) => (t && /^(\d{1,2}):(\d{2})$/.test(t) ? t.split(":").map(Number) : null);
    const data: Record<string, unknown> = {};
    const dateStr = typeof args.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : null;
    const baseDate = dateStr ?? shift.startAt.toISOString().slice(0, 10);
    const st = time(args.start as string | undefined);
    const en = time(args.end as string | undefined);
    if (st) data.startAt = localTime(baseDate, st[0], st[1]).toISOString();
    else if (dateStr) {
      const old = new Date(shift.startAt);
      data.startAt = localTime(dateStr, old.getUTCHours(), old.getUTCMinutes()).toISOString();
    }
    if (en) {
      let endDt = localTime(baseDate, en[0], en[1]);
      const startDt = data.startAt ? new Date(data.startAt as string) : shift.startAt;
      if (endDt <= startDt) endDt = new Date(endDt.getTime() + 24 * 60 * 60 * 1000);
      data.endAt = endDt.toISOString();
    } else if (dateStr) {
      const old = new Date(shift.endAt);
      let endDt = localTime(dateStr, old.getUTCHours(), old.getUTCMinutes());
      const startDt = data.startAt ? new Date(data.startAt as string) : shift.startAt;
      if (endDt <= startDt) endDt = new Date(endDt.getTime() + 24 * 60 * 60 * 1000);
      data.endAt = endDt.toISOString();
    }
    if (typeof args.location === "string") data.location = args.location || null;
    if (typeof args.colleagues === "string") data.colleagues = args.colleagues || null;
    if (typeof args.note === "string") data.note = args.note || null;
    if (Object.keys(data).length === 0) return { error: "Nothing to change -- pass at least one field." };
    const updated = await prisma.shift.update({ where: { id }, data });
    await logActivity("update_shift", `Updated the ${friendlyDateTime(shift.startAt)} shift`);
    return { result: `Updated the shift: now ${friendlyDateTime(updated.startAt)}–${friendlyDateTime(updated.endAt).slice(-5)}${updated.location ? ` at ${updated.location}` : ""}.` };
  }
  if (name === "update_reminder") {
    const id = String(args.id ?? "");
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) return { error: "No reminder with that id -- use list_reminders first." };
    const action = String(args.action ?? "");
    if (action === "delete") {
      await prisma.reminder.delete({ where: { id } });
      await logActivity("update_reminder", `Deleted reminder "${reminder.title}"`);
      return { result: `Deleted "${reminder.title}".` };
    }
    if (action === "done") {
      await prisma.reminder.update({ where: { id }, data: { done: true } });
      await logActivity("update_reminder", `Ticked off "${reminder.title}"`);
      return { result: `Ticked off "${reminder.title}".` };
    }
    if (action === "reschedule") {
      const due = new Date(String(args.dueAt ?? ""));
      if (Number.isNaN(due.getTime())) return { error: "reschedule needs a valid ISO dueAt" };
      await prisma.reminder.update({ where: { id }, data: { dueAt: due, done: false } });
      await logActivity("update_reminder", `Moved "${reminder.title}"`);
      return { result: `Moved "${reminder.title}" to ${friendlyDateTime(due)}.` };
    }
    if (action === "rename") {
      const title = String(args.title ?? "").trim();
      if (!title) return { error: "rename needs a title" };
      await prisma.reminder.update({ where: { id }, data: { title } });
      return { result: `Renamed to "${title}".` };
    }
    return { error: "action must be done, reschedule, rename or delete" };
  }
  if (name === "check_tracking") {
    const input = String(args.input ?? "").trim();
    if (!input) return { error: "check_tracking needs a link or number" };
    try {
      const result = await checkTracking(input, typeof args.courier === "string" ? args.courier : null);
      await logActivity("check_tracking", "Checked a delivery");
      return { result };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't check that tracking." };
    }
  }
  if (name === "forward_to_claude") {
    const summary = String(args.summary ?? "").trim().slice(0, 200);
    if (!summary) return { error: "forward_to_claude needs a summary" };
    const kind = ["feature", "bug", "note"].includes(String(args.kind)) ? String(args.kind) : "feature";
    const details = typeof args.details === "string" && args.details.trim() ? args.details.trim().slice(0, 2000) : null;
    await prisma.devRequest.create({ data: { kind, summary, details } });
    await logActivity("forward_to_claude", `Passed to Claude Code: ${summary}`);
    return { result: "Logged for Claude Code. It shows under Settings > For Claude Code, where he can copy it into the developer chat." };
  }
  if (name === "search_booking_options") {
    const { query } = args as { query?: string };
    if (!query) return { error: "search_booking_options needs a query" };
    try {
      const result = await searchBookingOptions(query);
      await logActivity("search_booking_options", `Searched booking options: "${query}"`);
      return { result };
    } catch (err) {
      console.error("search_booking_options error:", err);
      return { error: err instanceof Error ? err.message : "Booking search failed." };
    }
  }
  if (name === "create_booking") {
    const { title, category, dateTime, partySize, location, link, status, note } = args as {
      title?: string;
      category?: string;
      dateTime?: string;
      partySize?: number;
      location?: string;
      link?: string;
      status?: string;
      note?: string;
    };
    if (!title) return { error: "create_booking needs a title" };
    const safeCategory = ["restaurant", "activity", "travel", "other"].includes(category ?? "")
      ? category!
      : "other";
    const safeStatus = ["idea", "pending", "confirmed", "cancelled"].includes(status ?? "")
      ? status!
      : "idea";
    let parsedDate: Date | null = null;
    if (dateTime) {
      parsedDate = new Date(dateTime);
      if (Number.isNaN(parsedDate.getTime())) return { error: "dateTime must be a valid ISO 8601 datetime" };
    }
    const booking = await prisma.booking.create({
      data: {
        title,
        category: safeCategory,
        status: safeStatus,
        dateTime: parsedDate,
        partySize: partySize ?? null,
        location: location ?? null,
        link: link ?? null,
        note: note ?? null,
      },
    });
    await logActivity("create_booking", `Saved booking "${booking.title}" (${booking.status})`);
    return { result: `Saved "${booking.title}" as ${booking.status}.` };
  }
  if (name === "show_place") {
    const { name: placeName, location } = args as { name?: string; location?: string };
    if (!placeName) return { error: "show_place needs a name" };
    const card = await lookupPlace(placeName, location ?? null);
    ctx.places.push(card);
    await logActivity("show_place", `Looked up ${card.name}`);
    return {
      result:
        `Shown to the user with ${card.images.length} photo(s): ` +
        JSON.stringify({ rating: card.rating, price: card.price, vibe: card.vibe, verdict: card.verdict, website: card.website }),
    };
  }
  if (name === "prepare_booking") {
    const { title, category, dateTime, partySize, location, link } = args as {
      title?: string;
      category?: string;
      dateTime?: string;
      partySize?: number;
      location?: string;
      link?: string;
    };
    if (!title) return { error: "prepare_booking needs a title" };
    const safeCategory = ["restaurant", "activity", "travel", "other"].includes(category ?? "") ? category! : "other";
    let parsedDate: Date | null = null;
    if (dateTime) {
      parsedDate = new Date(dateTime);
      if (Number.isNaN(parsedDate.getTime())) return { error: "dateTime must be a valid ISO 8601 datetime" };
    }
    const booking = await prisma.booking.create({
      data: {
        title,
        category: safeCategory,
        status: "pending",
        dateTime: parsedDate,
        partySize: partySize ?? null,
        location: location ?? null,
        link: link ?? null,
      },
    });
    const links = readyToBookLinks(booking);
    const details = [
      booking.dateTime ? friendlyDateTime(booking.dateTime) : null,
      booking.partySize ? `${booking.partySize} people` : null,
      booking.location,
    ]
      .filter(Boolean)
      .join(" · ");
    const sent = await sendWithButtons(
      `📍 ${booking.title}${details ? `\n${details}` : ""}\n\nBook it with one of these, then tap "I booked it".`,
      [
        links.map((l) => ({ text: l.label, url: l.url })),
        [
          { text: "✅ I booked it", callback_data: `bk:ok:${booking.id}` },
          { text: "✖ Skip", callback_data: `bk:no:${booking.id}` },
        ],
      ]
    );
    await logActivity("prepare_booking", `Sent booking links for "${booking.title}"`);
    return sent
      ? { result: `Saved "${booking.title}" as pending and sent the booking links to Telegram.` }
      : { result: `Saved "${booking.title}" as pending, but sending the Telegram message failed.` };
  }
  if (name === "list_bookings") {
    const bookings = await listBookings();
    if (bookings.length === 0) return { result: "No bookings being tracked." };
    return {
      result: bookings
        .map(
          (b) =>
            `- ${b.title} (${b.status}${b.category !== "other" ? `, ${b.category}` : ""})` +
            (b.dateTime ? ` at ${b.dateTime.toString()}` : "") +
            (b.location ? `, ${b.location}` : "")
        )
        .join("\n"),
    };
  }
  if (name === "research_instagram_account") {
    const { handle } = args as { handle?: string };
    if (!handle) return { error: "research_instagram_account needs a handle" };
    try {
      const result = await researchInstagramAccount(handle);
      await logActivity("research_instagram_account", `Researched @${handle.replace(/^@/, "")}`);
      return { result };
    } catch (err) {
      console.error("research_instagram_account error:", err);
      return { error: err instanceof Error ? err.message : "Instagram research failed." };
    }
  }
  if (name === "create_content_idea") {
    const { title, type, caption, hashtags, location, outfit, scheduledAt, note } = args as {
      title?: string;
      type?: string;
      caption?: string;
      hashtags?: string;
      location?: string;
      outfit?: string;
      scheduledAt?: string;
      note?: string;
    };
    if (!title) return { error: "create_content_idea needs a title" };
    const safeType = ["post", "reel", "story", "other"].includes(type ?? "") ? type! : "post";
    let parsedDate: Date | null = null;
    if (scheduledAt) {
      parsedDate = new Date(scheduledAt);
      if (Number.isNaN(parsedDate.getTime()))
        return { error: "scheduledAt must be a valid ISO 8601 datetime" };
    }
    const idea = await prisma.contentIdea.create({
      data: {
        title,
        type: safeType,
        caption: caption ?? null,
        hashtags: hashtags ?? null,
        location: location ?? null,
        outfit: outfit ?? null,
        scheduledAt: parsedDate,
        note: note ?? null,
      },
    });
    await logActivity("create_content_idea", `Saved content idea "${idea.title}"`);
    return { result: `Saved "${idea.title}" as a ${idea.type} idea.` };
  }
  if (name === "list_content_ideas") {
    const ideas = await listContentIdeas();
    if (ideas.length === 0) return { result: "No content ideas being tracked." };
    return {
      result: ideas
        .map(
          (i) =>
            `- ${i.title} (${i.type}, ${i.status})` +
            (i.scheduledAt ? ` for ${i.scheduledAt.toString()}` : "")
        )
        .join("\n"),
    };
  }
  if (name === "start_video_call") {
    const link = `https://meet.jit.si/laura-${Math.random().toString(36).slice(2, 10)}`;
    const result = await sendText(`📹 Video call: ${link}`);
    if (!result.ok) return { error: result.error };
    await logActivity("start_video_call", "Sent a video call link");
    return { result: `Sent the call link: ${link}` };
  }
  // ── Email ──
  if (name === "send_email") {
    if (!isGoogleConfigured()) return { error: "Google isn't connected yet. Tell him to visit System and connect Google." };
    const { to, subject, body, cc } = args as { to?: string; subject?: string; body?: string; cc?: string };
    if (!to || !subject || !body) return { error: "send_email needs to, subject, and body" };
    try {
      const res = await sendEmail({ to, subject, body, cc });
      await logActivity("send_email", `Sent email to ${to}: "${subject}"`);
      return { result: `Email sent to ${to}.`, id: res.id };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to send email." };
    }
  }
  if (name === "read_emails") {
    if (!isGoogleConfigured()) return { error: "Google isn't connected yet. Tell him to visit System and connect Google." };
    try {
      const emails = await readEmails({
        query: typeof args.query === "string" ? args.query : undefined,
        maxResults: typeof args.maxResults === "number" ? args.maxResults : undefined,
      });
      await logActivity("read_emails", `Read ${emails.length} email(s)`);
      if (emails.length === 0) return { result: "No emails matching that search." };
      return {
        result: emails
          .map((e) => `- [id:${e.id}] ${e.unread ? "(unread) " : ""}From: ${e.from}\n  Subject: ${e.subject}\n  ${e.snippet.slice(0, 120)}`)
          .join("\n"),
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't read emails." };
    }
  }
  if (name === "read_email_body") {
    if (!isGoogleConfigured()) return { error: "Google isn't connected yet." };
    const id = String(args.id ?? "");
    if (!id) return { error: "read_email_body needs a message id" };
    try {
      const body = await readEmailBody(id);
      return { result: body };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't read that email." };
    }
  }
  // ── Calendar ──
  if (name === "get_calendar") {
    if (!isGoogleConfigured()) return { error: "Google isn't connected yet. Tell him to visit System and connect Google." };
    try {
      const days = typeof args.days === "number" ? args.days : 7;
      const events = await getCalendarEvents(days);
      await logActivity("get_calendar", `Checked calendar (${events.length} events)`);
      if (events.length === 0) return { result: `Nothing on the calendar for the next ${days} day${days === 1 ? "" : "s"}.` };
      return {
        result: events
          .map((e) => `- ${e.title}${e.allDay ? " (all day)" : ` ${e.start} to ${e.end}`}${e.location ? ` at ${e.location}` : ""}`)
          .join("\n"),
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't read the calendar." };
    }
  }
  if (name === "create_calendar_event") {
    if (!isGoogleConfigured()) return { error: "Google isn't connected yet." };
    const { title, start, end, location, description } = args as {
      title?: string; start?: string; end?: string; location?: string; description?: string;
    };
    if (!title || !start || !end) return { error: "create_calendar_event needs title, start, and end" };
    try {
      const res = await createCalendarEvent({ title, start, end, location, description });
      await logActivity("create_calendar_event", `Added "${title}" to calendar`);
      return { result: `Added "${title}" to the calendar.`, link: res.link };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't create the event." };
    }
  }
  // ── Web & scraping ──
  if (name === "scrape_page") {
    const url = String(args.url ?? "").trim();
    if (!url) return { error: "scrape_page needs a URL" };
    try {
      const result = await scrapePage(url, typeof args.question === "string" ? args.question : undefined);
      await logActivity("scrape_page", `Read ${url.slice(0, 60)}`);
      return { result };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't read that page." };
    }
  }
  if (name === "get_weather") {
    const location = String(args.location ?? "").trim();
    if (!location) return { error: "get_weather needs a location" };
    try {
      const result = await getWeather(location);
      await logActivity("get_weather", `Checked weather for ${location}`);
      return { result };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't get the weather." };
    }
  }
  if (name === "get_news") {
    try {
      const result = await getNews(typeof args.topic === "string" ? args.topic : undefined);
      await logActivity("get_news", args.topic ? `Got news about ${args.topic}` : "Got latest news");
      return { result };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't fetch the news." };
    }
  }
  if (name === "translate") {
    const text = String(args.text ?? "").trim();
    const to = String(args.to ?? "").trim();
    if (!text || !to) return { error: "translate needs text and a target language" };
    try {
      const result = await translateText(text, to);
      await logActivity("translate", `Translated to ${to}`);
      return { result };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Translation failed." };
    }
  }
  if (name === "calculate") {
    const expression = String(args.expression ?? "").trim();
    if (!expression) return { error: "calculate needs an expression" };
    try {
      const result = await calculate(expression);
      await logActivity("calculate", `Calculated: ${expression.slice(0, 60)}`);
      return { result };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Calculation failed." };
    }
  }
  // ── Notes management ──
  if (name === "list_notes") {
    const search = typeof args.search === "string" ? args.search.trim() : null;
    const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 10;
    const where = search
      ? { OR: [{ title: { contains: search } }, { body: { contains: search } }] }
      : {};
    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    if (notes.length === 0) return { result: search ? `No notes matching "${search}".` : "No saved notes." };
    return {
      result: notes
        .map((n) => `- [id:${n.id}] ${n.title}\n  ${(n.body ?? "").slice(0, 100)}${(n.body ?? "").length > 100 ? "…" : ""}`)
        .join("\n"),
    };
  }
  if (name === "update_note") {
    const id = String(args.id ?? "");
    const action = String(args.action ?? "");
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return { error: "No note with that id -- use list_notes first." };
    if (action === "delete") {
      await prisma.note.delete({ where: { id } });
      await logActivity("update_note", `Deleted note "${note.title}"`);
      return { result: `Deleted "${note.title}".` };
    }
    if (action === "edit") {
      const data: Record<string, string> = {};
      if (typeof args.title === "string" && args.title.trim()) data.title = args.title.trim();
      if (typeof args.body === "string") data.body = args.body;
      if (Object.keys(data).length === 0) return { error: "edit needs a title or body to change" };
      await prisma.note.update({ where: { id }, data });
      await logActivity("update_note", `Updated note "${data.title ?? note.title}"`);
      return { result: `Updated "${data.title ?? note.title}".` };
    }
    return { error: "action must be edit or delete" };
  }
  if (name === "schedule_message") {
    const message = String(args.message ?? "").trim();
    const sendAt = String(args.sendAt ?? "");
    if (!message || !sendAt) return { error: "schedule_message needs message and sendAt" };
    const due = new Date(sendAt);
    if (Number.isNaN(due.getTime())) return { error: "sendAt must be a valid ISO 8601 datetime" };
    await prisma.reminder.create({
      data: {
        title: `📩 ${message.slice(0, 80)}`,
        dueAt: due,
        note: `__scheduled_message__:${message}`,
        priority: "high",
      },
    });
    await logActivity("schedule_message", `Scheduled message for ${friendlyDateTime(due)}`);
    return { result: `Scheduled. He'll get a Telegram notification at ${friendlyDateTime(due)}.` };
  }
  // ── Lead generation ──
  if (name === "find_leads") {
    const trade = String(args.trade ?? "").trim();
    const area = String(args.area ?? "").trim();
    if (!trade || !area) return { error: "find_leads needs a trade and area" };
    const count = Math.min(Math.max(typeof args.count === "number" ? args.count : 10, 1), 20);
    try {
      const leads = await findLeads(trade, area, count);
      await logActivity("find_leads", `Found ${leads.length} ${trade} in ${area}`);
      if (leads.length === 0) return { result: `Couldn't find any ${trade} in ${area}. Try a broader area or different search term.` };
      return {
        result: leads
          .map((l, i) =>
            `${i + 1}. ${l.company}${l.name ? ` (${l.name})` : ""} — ${l.location}` +
            (l.phone ? `\n   Phone: ${l.phone}` : "") +
            (l.email ? `\n   Email: ${l.email}` : "") +
            (l.website ? `\n   Website: ${l.website}` : " (no website)")
          )
          .join("\n"),
        leads,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Lead search failed." };
    }
  }
  if (name === "enrich_lead") {
    const company = String(args.company ?? "").trim();
    if (!company) return { error: "enrich_lead needs a company name" };
    const website = typeof args.website === "string" ? args.website.trim() : null;
    try {
      const info = await enrichLead(company, website);
      await logActivity("enrich_lead", `Enriched lead: ${company}`);
      return {
        result: {
          company,
          ...info,
          verdict: !info.hasWebsite
            ? "No website at all — strong prospect for a new build."
            : info.websiteQuality === "poor"
              ? "Has a website but it's poor quality — great prospect for a rebuild."
              : info.websiteQuality === "decent"
                ? "Decent website — might still be interested in an upgrade."
                : "Good website — probably not a hot prospect.",
        },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't enrich that lead." };
    }
  }
  return { error: `Unknown tool: ${name}` };
}

export type ChatResult = { reply: string; toolsUsed: string[]; places: PlaceCard[]; mode: ModeId };
export type ChatOptions = { channel?: "web" | "telegram" };

const TELEGRAM_NUDGE = `
== CHANNEL: TELEGRAM ==
He's texting you on Telegram, so text back the way a person would: natural,
warm and conversational. Short is good, but never clipped, cold or robotic
-- proper friendly sentences, not fragments of data. If you've got two
separate things to say (the answer, then a heads-up), put a blank line
between them and they'll arrive as separate messages, like real texting.
Three messages at most.`;

function ukNow(): string {
  return new Date().toLocaleString("en-GB", {
    timeZone: USER_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function chat(history: ChatMessage[], opts?: ChatOptions): Promise<ChatResult> {
  const ai = getGeminiClient();
  const contents: Content[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const toolsUsed = new Set<string>();
  const ctx: ToolContext = { places: [] };
  const profile = await prisma.profile.findUnique({ where: { id: "me" } }).catch(() => null);
  const channelBlock = opts?.channel === "telegram" ? TELEGRAM_NUDGE : "";
  const mode = detectMode(history.filter((m) => m.role === "user").map((m) => m.content));
  const systemPrompt = `${SYSTEM_PROMPT}\n\n${textingInstructions(profile)}${channelBlock}\n\n${activeModeBlock(mode, ukNow())}`;

  for (let turn = 0; turn < 8; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: tools }],
      },
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return { reply: response.text ?? "", toolsUsed: [...toolsUsed], places: ctx.places, mode: mode.id };
    }

    // Echo back the model's own content verbatim (not just the function
    // calls) -- it carries a thoughtSignature per part that Gemini
    // requires on the next turn for multi-step tool use.
    const modelContent = response.candidates?.[0]?.content;
    contents.push(
      modelContent ?? {
        role: "model",
        parts: functionCalls.map((call) => ({ functionCall: call })),
      }
    );

    const responses = await Promise.all(
      functionCalls.map(async (call) => {
        const name = call.name ?? "";
        if (LOGGED_TOOLS.has(name)) toolsUsed.add(name);
        return {
          functionResponse: {
            name: call.name,
            id: call.id,
            response: await runTool(name, call.args ?? {}, ctx),
          },
        };
      })
    );

    contents.push({ role: "user", parts: responses });
  }

  return {
    reply: "Sorry, I got stuck thinking about that -- try asking again.",
    toolsUsed: [...toolsUsed],
    places: ctx.places,
    mode: mode.id,
  };
}

const OUTREACH_TOOLS = new Set([
  "get_outreach_stats",
  "list_outreach_leads",
  "get_outreach_lead",
  "add_outreach_lead",
  "set_outreach_lead_status",
  "draft_outreach_email",
  "recent_outreach_activity",
]);

async function runOutreachTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const id = encodeURIComponent(String(args.id ?? args.leadId ?? ""));
  switch (name) {
    case "get_outreach_stats":
      return outreach("/stats");
    case "list_outreach_leads":
      return outreach(`/leads?status=${encodeURIComponent(String(args.status ?? "warm"))}`);
    case "get_outreach_lead":
      return outreach(`/leads/${id}`);
    case "add_outreach_lead": {
      const lead = await outreach("/leads", { method: "POST", body: args });
      await logActivity("add_outreach_lead", `Added outreach lead: ${String(args.company ?? args.name)}`);
      return lead;
    }
    case "set_outreach_lead_status": {
      const res = await outreach(`/leads/${id}/status`, { method: "POST", body: { status: args.status, note: args.note } });
      await logActivity("set_outreach_lead_status", `Outreach lead marked ${String(args.status)}`);
      return res;
    }
    case "draft_outreach_email": {
      const res = await outreach("/drafts", {
        method: "POST",
        body: { leadId: args.leadId, text: args.text, ...(args.subject ? { subject: args.subject } : {}) },
      });
      await logActivity("draft_outreach_email", "Queued an outreach draft for review");
      return res;
    }
    case "recent_outreach_activity": {
      const days = Math.min(Math.max(Number(args.days) || 7, 1), 30);
      return prisma.outreachEvent.findMany({
        where: { type: { not: "message_sent" }, at: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
        orderBy: { at: "desc" },
        take: 30,
        select: { type: true, leadId: true, leadName: true, company: true, preview: true, status: true, at: true },
      });
    }
  }
  throw new Error(`Unknown outreach tool ${name}`);
}
