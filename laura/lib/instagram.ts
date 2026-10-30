import { prisma } from "@/lib/db";
import { getGeminiClient, MODEL } from "@/lib/gemini";

/** Researches a public Instagram account via Gemini's Google Search
 * grounding -- the same mechanism web_search, commute planning, and
 * booking search use. There's no Instagram Graph API connected yet (see
 * README's "Accounts needed" section), so this can only surface what's
 * publicly findable on the web, not real follower counts, engagement
 * metrics, or private insights -- it's competitor/inspiration research,
 * not analytics. */
export async function researchInstagramAccount(handle: string): Promise<string> {
  const ai = getGeminiClient();
  const cleanHandle = handle.replace(/^@/, "");
  const prompt =
    `Research the public Instagram account @${cleanHandle}. Search for what's ` +
    "publicly known about it: what kind of content they post, their general " +
    "niche/aesthetic, posting style, and anything notable about their audience or " +
    "engagement if it's publicly reported anywhere (e.g. in articles). Be upfront " +
    "that you can't see private analytics (exact follower count, engagement rate) " +
    "unless you find a specific public source stating it -- never estimate or " +
    "invent numbers.";

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk) => chunk.web?.uri)
    .filter((uri): uri is string => Boolean(uri))
    .slice(0, 5);

  const answer = response.text ?? "Couldn't find anything public about that account.";
  return sources?.length ? `${answer}\n\nSources: ${sources.join(", ")}` : answer;
}

/** Content ideas still worth tracking (not posted or discarded), soonest
 * scheduled first -- undated ones sort last. */
export async function listContentIdeas() {
  const ideas = await prisma.contentIdea.findMany({
    where: { status: { notIn: ["posted", "discarded"] } },
  });
  return ideas.sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return 0;
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return a.scheduledAt.getTime() - b.scheduledAt.getTime();
  });
}
