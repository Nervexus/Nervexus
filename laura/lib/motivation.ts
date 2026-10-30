import { getGeminiClient, MODEL } from "@/lib/gemini";

// The morning text's push: two honest sentences built from his real
// numbers, in the tone he picked (Settings > Daily messages).

export type MotivationFacts = {
  weekday: string;
  shift: string | null; // e.g. "8am–6pm", null for a day off
  workBlock: string | null; // e.g. "Outreach, 10 messages"
  outreach: { weekSent: number; weekReplies: number; callsBooked: number; warmLeads: number } | null;
  dates: string[]; // key dates coming up, e.g. "Payday in 2 days"
  moment?: "morning" | "afternoon";
  todaySent?: number | null; // outreach sent so far today (afternoon check-in)
};

const TONES: Record<string, string> = {
  harsh:
    "Harsh but honest, like a coach who rates him and won't let him coast. Call out slacking directly, no sugar-coating, " +
    "but never insult him and never be cruel about things he can't control.",
  firm: "Firm and direct. Straight talk, no fluff, a clear push.",
  gentle: "Encouraging and kind, but still honest about where he's at.",
};

/** Two sentences max. Falls back to a plain line from the numbers if the AI is unavailable. */
export async function motivationLine(facts: MotivationFacts, tone = "harsh"): Promise<string> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents:
        `Write the motivation line for Madoxs's ${facts.moment === "afternoon" ? "afternoon check-in text (a mid-day push to finish today's job, not a pep talk)" : "morning text"}. He's 19, a shift worker in Fawley, Hampshire. His goals: ` +
        "grow his website business (£250 sites for roofers; target 10 outreach messages on Mon/Wed/Fri), pass his driving " +
        "test and get a car, find a 2-bed rental near Waterside, and look his best.\n" +
        `Today's facts: ${JSON.stringify(facts)}\n` +
        `Tone: ${TONES[tone] ?? TONES.harsh}\n` +
        "Rules: at most two short sentences, British English, plain text, no emoji, no quotes, no hashtags. Use the real " +
        "numbers. No clichés ('you got this', 'rise and grind', 'believe in yourself'). Point at the one thing that matters " +
        "most today. Reply with the line only.",
    });
    const line = (response.text ?? "").trim().replace(/^["']|["']$/g, "");
    if (line) return line.slice(0, 300);
  } catch (err) {
    console.error("motivation line failed:", err);
  }
  return fallback(facts);
}

function fallback(f: MotivationFacts): string {
  const o = f.outreach;
  if (o && o.weekSent === 0) return "Nothing's gone out this week. The roofers won't find you on their own, so send the 10 today.";
  if (o && o.warmLeads > 0) return `${o.warmLeads} warm lead${o.warmLeads === 1 ? "" : "s"} waiting on you. Chase them before you do anything else.`;
  if (f.workBlock) return `${f.workBlock} is today's job. Do it before you reward yourself with anything.`;
  return "Day off isn't a day wasted. Pick one thing that moves the car, the flat or the business, and finish it.";
}
