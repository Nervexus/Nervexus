import { Type, type Content, type FunctionDeclaration } from "@google/genai";
import { prisma } from "@/lib/db";
import { placeCall, sendText } from "@/lib/telegram";
import { getGeminiClient, MODEL } from "@/lib/gemini";
import { getShifts, whoAmIWorkingWith, planCommute } from "@/lib/rota";
import { getTomorrowBriefing } from "@/lib/briefing";

const SYSTEM_PROMPT = `You are Laura, a personal voice/text assistant. You are warm, direct, and
efficient -- you sound like a sharp human assistant, not a generic chatbot.
Keep replies short enough to read comfortably as a text message or hear as
speech: a sentence or two for most things, more only when the user actually
asked for detail.

You do not yet have real-world tools wired up beyond the ones listed for
this conversation. You can send the user an urgent notification or a
plain message via Telegram (call_me, text_me) -- call_me does NOT place
an actual ringing phone call, it just sends an urgent-styled message, so
never claim to have "called" or "rung" the user, say you've "sent an
urgent message" or similar instead. You cannot send email or book or pay
for anything (rides, food, reservations) -- those aren't wired up yet.
Don't claim to have done one of those unless a tool call in this
conversation actually did it. If asked to do something you can't do yet,
say so plainly and briefly explain what's still missing (e.g. "I can look
that up, but I can't actually book it yet").

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
]);

async function logActivity(tool: string, summary: string) {
  await prisma.activityLog.create({ data: { tool, summary } }).catch((err) => {
    console.error("activity log write failed:", err);
  });
}

async function runTool(
  name: string,
  args: Record<string, unknown>
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
        .map((r) => `- ${r.title} (${r.dueAt.toString()})${r.note ? `: ${r.note}` : ""}`)
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
            `- ${s.startAt.toString()} to ${s.endAt.toString()}` +
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
  return { error: `Unknown tool: ${name}` };
}

export type ChatResult = { reply: string; toolsUsed: string[] };

export async function chat(history: ChatMessage[]): Promise<ChatResult> {
  const ai = getGeminiClient();
  const contents: Content[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const toolsUsed = new Set<string>();

  for (let turn = 0; turn < 5; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: tools }],
      },
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return { reply: response.text ?? "", toolsUsed: [...toolsUsed] };
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
            response: await runTool(name, call.args ?? {}),
          },
        };
      })
    );

    contents.push({ role: "user", parts: responses });
  }

  return {
    reply: "Sorry, I got stuck thinking about that -- try asking again.",
    toolsUsed: [...toolsUsed],
  };
}
