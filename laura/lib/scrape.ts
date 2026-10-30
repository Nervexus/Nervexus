import { getGeminiClient, MODEL } from "@/lib/gemini";

export async function scrapePage(url: string, question?: string): Promise<string> {
  const ai = getGeminiClient();
  const prompt = question
    ? `Read this web page: ${url}\n\nAnswer this question about it: ${question}\n\nBe specific and factual. If the page can't be read or doesn't answer the question, say so.`
    : `Read this web page: ${url}\n\nGive a clear, concise summary of the page's main content. Include key facts, numbers, dates, and names. If it's a product page, include price and availability. If it's an article, summarise the key points. No markdown formatting.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ urlContext: {} }] },
  });
  return (response.text ?? "").trim() || "Couldn't read that page.";
}

export async function scrapeMultiple(urls: string[], question: string): Promise<string> {
  const ai = getGeminiClient();
  const urlList = urls.slice(0, 5).map((u, i) => `${i + 1}. ${u}`).join("\n");
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Read these web pages:\n${urlList}\n\n${question}\n\nCompare and combine information from all pages. Be specific with facts, numbers, prices. No markdown.`,
    config: { tools: [{ urlContext: {} }] },
  });
  return (response.text ?? "").trim() || "Couldn't read those pages.";
}

export async function getWeather(location: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `What is the current weather and forecast for ${location}? Include temperature (Celsius), conditions, wind, and the next few days outlook. Be brief and factual.`,
    config: { tools: [{ googleSearch: {} }] },
  });
  return (response.text ?? "").trim() || "Couldn't get the weather.";
}

export async function getNews(topic?: string): Promise<string> {
  const ai = getGeminiClient();
  const query = topic
    ? `What are the latest news headlines about ${topic}? Give the top 5 most recent stories with a one-line summary each. Include dates where shown.`
    : "What are the top UK news headlines right now? Give 5-8 of the most important current stories with a one-line summary each.";
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: query,
    config: { tools: [{ googleSearch: {} }] },
  });
  return (response.text ?? "").trim() || "Couldn't fetch the news.";
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Translate the following text to ${targetLang}. Give only the translation, nothing else.\n\n${text}`,
  });
  return (response.text ?? "").trim() || "Translation failed.";
}

export type LeadResult = {
  name: string;
  company: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  location: string;
};

export async function findLeads(trade: string, area: string, count = 10): Promise<LeadResult[]> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents:
      `Find ${count} real ${trade} companies in or near ${area}, UK. ` +
      `For each one, find their business name, contact name (owner or director if visible), ` +
      `phone number, email address, and website. Search Google, Yell.com, Checkatrade, ` +
      `MyBuilder, Bark, and company websites to get contact details.\n\n` +
      `Return ONLY a JSON array, no other text. Each object must have these exact keys:\n` +
      `{"name": "contact person or owner name", "company": "business name", "phone": "phone number or null", "email": "email or null", "website": "website URL or null", "location": "town/city"}\n\n` +
      `Only include real businesses you actually found. Never invent details. ` +
      `If you can't find an email, set it to null. Prioritise businesses that have a website ` +
      `(especially poor-quality ones -- they're the best prospects for a website rebuild).`,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = (response.text ?? "").trim();
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as LeadResult[];
    return parsed.filter((l) => l.company);
  } catch {
    return [];
  }
}

export async function enrichLead(company: string, website: string | null): Promise<{
  email: string | null;
  phone: string | null;
  ownerName: string | null;
  hasWebsite: boolean;
  websiteQuality: string | null;
}> {
  const ai = getGeminiClient();
  const prompt = website
    ? `Visit ${website} and find: the owner/director's name, email address, phone number. ` +
      `Also rate the website quality (poor/decent/good) -- is it modern, mobile-friendly, professional? ` +
      `Return ONLY JSON: {"email": "...", "phone": "...", "ownerName": "...", "hasWebsite": true, "websiteQuality": "poor/decent/good"}`
    : `Search for "${company}" UK and find their email, phone, and owner name. ` +
      `Return ONLY JSON: {"email": "...", "phone": "...", "ownerName": "...", "hasWebsite": false, "websiteQuality": null}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }, ...(website ? [{ urlContext: {} }] : [])] },
  });

  const text = (response.text ?? "").trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { email: null, phone: null, ownerName: null, hasWebsite: !!website, websiteQuality: null };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { email: null, phone: null, ownerName: null, hasWebsite: !!website, websiteQuality: null };
  }
}

export async function calculate(expression: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Calculate this and give the answer with brief working if helpful. Be precise with numbers. Expression: ${expression}`,
    config: {
      tools: [{ codeExecution: {} }],
    },
  });
  return (response.text ?? "").trim() || "Couldn't calculate that.";
}
