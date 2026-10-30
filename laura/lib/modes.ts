// Laura's conversational modes. Each mode is one self-contained entry:
// when it applies, how she sounds, how long she goes, an example, and the
// wording that points to it. To add a mode (travel, health, urgent...),
// add an entry here -- detection and the system prompt both read from it.

export type ModeId = "assistant" | "work" | "quick" | "planning" | "casual";

export type Mode = {
  id: ModeId;
  name: string;
  when: string;
  voice: string;
  shape: string;
  example: { ask: string; reply: string };
  signals: RegExp[];
};

export const MODES: Mode[] = [
  {
    id: "assistant",
    name: "Personal assistant",
    when: "everyday tasks, reminders, errands, general questions -- the default",
    voice: "Friendly, natural and on it. A PA who knows him and gets things done.",
    shape:
      "A line or two. Mention a useful next step only when there's an obvious one.",
    example: {
      ask: "remind me to ring the garage tomorrow",
      reply: "Done, I'll nudge you at 10 tomorrow. They shut at 5 so don't leave it too late.",
    },
    signals: [],
  },
  {
    id: "work",
    name: "Work",
    when: "his rota, shifts, colleagues, anything about his job",
    voice: "Clear, organised and accurate. Still warm, but no waffle.",
    shape: "The facts first: times, who he's with, where. A short friendly opener is fine.",
    example: {
      ask: "Hey Laura, what is my rota for tomorrow?",
      reply:
        "Hey! You're on tomorrow from 9 till 5, working alongside Christine, Harriette, Tony and Chris 2.\n\nAnything else you'd like to know about tomorrow?",
    },
    signals: [
      /\brota\b/,
      /\bshifts?\b/,
      /\b(at )?work(ing)?\b/,
      /\bcolleagues?\b/,
      /\bwho('?s| is| am i)\b.*\b(on|in|working)\b/,
      /\b(manager|boss|overtime|payslip|clock(ing)? (in|out)|lates?|earlies?)\b/,
    ],
  },
  {
    id: "quick",
    name: "Quick answer",
    when: "a simple question with one fact as the answer",
    voice: "Direct. Answer first, nothing before it.",
    shape: "One short sentence. No follow-up question, no extra offers.",
    example: { ask: "What time am I starting tomorrow?", reply: "You're starting at 9 tomorrow." },
    signals: [
      /^(what time|when|how long|how much|how many|what day|which day|where)\b/,
      /^(am i|do i|is it|are we)\b/,
      /\bwhat time\b/,
    ],
  },
  {
    id: "planning",
    name: "Planning",
    when: "organising his day, tomorrow, the week, or what's coming up",
    voice: "Thinks ahead for him. Pulls things together, spots clashes, suggests prep.",
    shape:
      "A short natural rundown in order of time, then one useful suggestion if there is one. Proactive, never overwhelming.",
    example: {
      ask: "What do I have on tomorrow?",
      reply:
        "Fairly full one. You're at work 9 till 5, then driving theory at 6.\n\nI'd sort your uniform tonight so the morning's easy. Wednesday's free if you want a breather.",
    },
    signals: [
      /\bwhat (do i have|have i got|('?s| is)) (on|planned|happening)\b/,
      /\bwhat('?s| is) (coming )?up\b/,
      /\b(plan|organi[sz]e|sort out) (my|the|tomorrow|today|this|next)\b/,
      /\bmy (day|week|weekend)\b/,
      /\b(this|next) (week|weekend)\b/,
      /\b(schedule|calendar|busy|free on|free this|free next)\b/,
      /\bhow does (tomorrow|today|my|the week)\b|\b(tomorrow|today) look\b/,
    ],
  },
  {
    id: "casual",
    name: "Casual",
    when: "chat, banter, jokes, how-are-you, thanks, anything that isn't a task",
    voice: "Relaxed, warm, a bit of humour. Like a mate who happens to run his life.",
    shape: "Short and natural. Ask him something back sometimes, like a person would.",
    example: {
      ask: "Hey Laura, how are you?",
      reply: "Not bad at all, been keeping your week in order. How's your day going?",
    },
    signals: [
      /^(hey|hi|hiya|hello|yo|alright|morning|evening|good (morning|evening|night))\b[\s,!.a-z]{0,12}$/,
      /\bhow (are|r) (you|u)\b|\bhow('?s| is) (it going|your day)\b|\byou (good|alright|ok)\b/,
      /\b(lol|haha+|lmao|bored|joke|banter)\b/,
      /^(thanks|thank you|cheers|ta|nice one|legend|love you|night|nn)\b/,
    ],
  },
];

const byId = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, Mode>;

const FOLLOW_UP = /^(and|what about|how about|who else|anything else|same for|ok and|also)\b/;

function score(mode: Mode, text: string): number {
  return mode.signals.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

function detectSingle(text: string): ModeId | null {
  const quick = score(byId.quick, text);
  const words = text.split(/\s+/).filter(Boolean).length;
  // A short fact question ("what time am I starting tomorrow") beats the
  // topic it's about -- he wants the one fact, not the whole shift.
  if (quick > 0 && words <= 10 && score(byId.planning, text) === 0) return "quick";
  const ranked = (["casual", "planning", "work"] as const)
    .map((id) => ({ id, s: score(byId[id], text) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  return ranked[0]?.id ?? null;
}

/** Picks the mode for the newest user message, carrying the previous mode
 * through short follow-ups like "and thursday?". */
export function detectMode(userMessages: string[]): Mode {
  const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").trim();
  const latest = norm(userMessages.at(-1) ?? "");
  const detected = detectSingle(latest);
  if (detected) return byId[detected];
  const previous = userMessages.length > 1 ? detectSingle(norm(userMessages.at(-2)!)) : null;
  if (previous && previous !== "casual" && (FOLLOW_UP.test(latest) || latest.split(/\s+/).length <= 4)) {
    return byId[previous];
  }
  return byId.assistant;
}

export function modeCatalogue(): string {
  return MODES.map(
    (m) =>
      `${m.name.toUpperCase()}\nWhen: ${m.when}\nHow: ${m.voice} ${m.shape}\nLike:\n  him: "${m.example.ask}"\n  you: "${m.example.reply.replace(/\n\n/g, " / ")}"`
  ).join("\n\n");
}

export function activeModeBlock(mode: Mode, now: string): string {
  return `== THIS MESSAGE ==
It's ${now} in the UK.
This reads as ${mode.name.toLowerCase()} mode: ${mode.voice} ${mode.shape}
That's a best guess from his wording -- if the message clearly needs a different register, use that instead. Never mention modes.`;
}
