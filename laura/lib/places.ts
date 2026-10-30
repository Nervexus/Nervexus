import { getGeminiClient, MODEL } from "@/lib/gemini";

export type PlaceCard = {
  name: string;
  location: string | null;
  rating: string | null;
  price: string | null;
  vibe: string | null;
  verdict: string | null;
  website: string | null;
  images: string[];
};

type Field = "RATING" | "PRICE" | "VIBE" | "VERDICT" | "WEBSITE";

/** Live facts about one venue via Gemini's Google Search grounding, asked
 * for as labelled lines (structured JSON output isn't available alongside
 * the search tool), then photos from the venue's own website. No paid
 * places API needed. */
export async function lookupPlace(name: string, location: string | null): Promise<PlaceCard> {
  const ai = getGeminiClient();
  const where = location ? ` in ${location}` : "";
  const response = await ai.models.generateContent({
    model: MODEL,
    contents:
      `Look up the venue "${name}"${where} using current reviews. Reply with exactly these five ` +
      "lines and nothing else:\n" +
      "RATING: the Google or main review-site rating and review count, e.g. '4.6 on Google (1,200 reviews)'\n" +
      "PRICE: typical spend per person or price level, e.g. '£35-50 a head'\n" +
      "VIBE: a few words on atmosphere, e.g. 'dark, intimate, candlelit'\n" +
      "VERDICT: one honest sentence on whether it's actually good and what people praise or complain about\n" +
      "WEBSITE: the venue's own website URL (not a review site), or 'none'\n" +
      "Write 'unknown' for anything you can't verify -- never invent a rating.",
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = response.text ?? "";
  const field = (label: Field) => {
    const m = text.match(new RegExp(`^\\s*\\**${label}\\**:\\s*(.+)$`, "im"));
    const v = m?.[1].replace(/\*+/g, "").trim();
    return v && !/^(unknown|none|n\/a)$/i.test(v) ? v : null;
  };
  const rawSite = field("WEBSITE");
  const website = rawSite && /^https?:\/\//i.test(rawSite) ? rawSite.replace(/[).,]+$/, "") : null;

  return {
    name,
    location,
    rating: field("RATING"),
    price: field("PRICE"),
    vibe: field("VIBE"),
    verdict: field("VERDICT"),
    website,
    images: website ? await fetchSiteImages(website) : [],
  };
}

const SKIP_IMAGE = /logo|icon|sprite|favicon|avatar|badge|payment|placeholder|1x1|pixel|\.svg($|\?)/i;

/** Up to four photos from a venue's website: its og:image / twitter:image
 * first (the picture it chose to represent itself), then large-looking
 * <img> sources. Best-effort -- any failure just means no photos. */
export async function fetchSiteImages(url: string, max = 4): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LauraAssistant/1.0)" },
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return [];
    const html = (await res.text()).slice(0, 600_000);
    const base = res.url || url;
    const found: string[] = [];
    const add = (src: string | undefined) => {
      if (!src) return;
      try {
        const abs = new URL(src.replace(/&amp;/g, "&"), base).toString();
        if (!/^https:/.test(abs) || SKIP_IMAGE.test(abs) || found.includes(abs)) return;
        found.push(abs);
      } catch {
        // malformed src -- skip it
      }
    };
    for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/gi)) {
      add(m[0].match(/content=["']([^"']+)["']/i)?.[1]);
    }
    for (const m of html.matchAll(/<img[^>]+>/gi)) {
      if (found.length >= max) break;
      const tag = m[0];
      const src = tag.match(/\s(?:data-src|src)=["']([^"']+\.(?:jpe?g|webp|png)(?:\?[^"']*)?)["']/i)?.[1];
      const width = Number(tag.match(/\swidth=["']?(\d+)/i)?.[1] ?? 0);
      if (src && (width === 0 || width >= 400)) add(src);
    }
    return found.slice(0, max);
  } catch {
    return [];
  }
}

/** The card as plain text, for a Telegram caption or a no-photo fallback. */
export function placeCaption(p: PlaceCard): string {
  return [
    p.name + (p.location ? ` · ${p.location}` : ""),
    p.rating ? `★ ${p.rating}` : null,
    [p.price, p.vibe].filter(Boolean).join(" · ") || null,
    p.verdict,
    p.website,
  ]
    .filter(Boolean)
    .join("\n");
}
