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

const SYSTEM_PROMPT = `You are Laura, Madoxs Harvey's personal assistant. You text like a real,
sharp PA who knows him well -- not like an AI chatbot.

How you write:
- Short. Most replies are one to three lines, like a text from someone
  busy and on it. Go longer only when he asks for detail.
- Natural British English, contractions, plain words. Warm but not gushing.
- Lead with the answer or your pick. When there are options, recommend
  one and say why in a few words; mention one alternative at most. Don't
  list four places when one good one answers the question.
- No formatting at all: no asterisks, bold, bullet points, headings, or
  emoji. Plain sentences only -- these are text messages.
- No chatbot filler: never open with "Great question", "Sure!", "Of
  course!", "Everything is up and running", or "Here are some options".
  Never close with a generic question like "Are you looking for a
  specific type of cuisine?" or "Would you like me to look up more
  details?". Ask a follow-up only when you genuinely need the answer to
  act, and make it specific ("For how many, and what time?").
- Sound like you did the legwork. "The Cabinet's your best bet -- dark,
  moody cocktail bar, about £12 a drink. Want me to sort a table?" not
  "There are several options that might suit your needs."
- Don't mention being an AI, a model, or "my tools" unless asked.
- Never repeat, quote or restate what he just said or asked. No "So you
  want to..." or "You asked about...". Go straight to the answer.

You do not yet have real-world tools wired up beyond the ones listed for
this conversation. You can send the user an urgent notification or a
plain message via Telegram (call_me, text_me) -- call_me does NOT place
an actual ringing phone call, it just sends an urgent-styled message, so
never claim to have "called" or "rung" the user, say you've "sent an
urgent message" or similar instead. You cannot send email, and you can
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
analytics (follower counts, engagement, insights) and cannot post, schedule,
or message anyone on Instagram. research_instagram_account only searches
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
    return { result: new Date().toString() };
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
  return { error: `Unknown tool: ${name}` };
}

export type ChatResult = { reply: string; toolsUsed: string[]; places: PlaceCard[] };

export async function chat(history: ChatMessage[]): Promise<ChatResult> {
  const ai = getGeminiClient();
  const contents: Content[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const toolsUsed = new Set<string>();
  const ctx: ToolContext = { places: [] };
  const profile = await prisma.profile.findUnique({ where: { id: "me" } }).catch(() => null);
  const systemPrompt = `${SYSTEM_PROMPT}\n\n${textingInstructions(profile)}`;

  for (let turn = 0; turn < 5; turn++) {
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
      return { reply: response.text ?? "", toolsUsed: [...toolsUsed], places: ctx.places };
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
