const SLOTS = new Set(["morning", "afternoon", "night"]);

type Clean = { slot?: string; text?: string; product?: string | null; link?: string | null; owned?: boolean; days?: string | null };

/** Validates a routine item from the page; only fields that were sent come back. */
export function cleanItem(data: Record<string, unknown> | null): Clean {
  const out: Clean = {};
  if (!data) return out;
  if (typeof data.slot === "string" && SLOTS.has(data.slot)) out.slot = data.slot;
  if (typeof data.text === "string" && data.text.trim()) out.text = data.text.trim().slice(0, 120);
  if ("product" in data) out.product = typeof data.product === "string" && data.product.trim() ? data.product.trim().slice(0, 120) : null;
  if ("link" in data) {
    const link = typeof data.link === "string" ? data.link.trim() : "";
    out.link = /^https?:\/\//i.test(link) ? link.slice(0, 500) : null;
  }
  if (typeof data.owned === "boolean") out.owned = data.owned;
  if ("days" in data) {
    const days = Array.isArray(data.days) ? [...new Set(data.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort() : [];
    out.days = days.length && days.length < 7 ? days.join(",") : null;
  }
  return out;
}
