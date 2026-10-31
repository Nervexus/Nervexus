import { prisma } from "@/lib/db";
import { CONNECTIONS, KEY_SERVICES, loadKeys, mask, nextReset, usableKeys, type KeyService } from "@/lib/api-keys";
import { replyInChat } from "@/lib/telegram";

// Every time a service goes down it's stored with when it started and why.
// It clears itself (resolvedAt) once the service works again and stays in
// the history. The pop-up and Settings both read this.

type Current = {
  ikey: string;
  service: string;
  label: string;
  kind: "down" | "key";
  title: string;
  detail: string;
  needsKey: boolean;
  resetAt: Date | null;
};

function waitText(until: Date | null | undefined): string | null {
  if (!until) return null;
  const mins = (until.getTime() - Date.now()) / 60_000;
  if (mins <= 0) return null;
  if (mins < 90) return `about ${Math.round(mins)} min`;
  if (mins < 48 * 60) return `about ${Math.round(mins / 60)} hours`;
  return `about ${Math.round(mins / 1440)} days`;
}

const REASON: Record<string, string> = { invalid: "rejected", exhausted: "used up", limited: "rate-limited" };

/** What's wrong right now, worked out from the keys and service health. */
async function currentIssues(): Promise<Current[]> {
  const found: Current[] = [];
  for (const service of Object.keys(KEY_SERVICES) as KeyService[]) {
    const meta = KEY_SERVICES[service];
    const keys = await loadKeys(service);
    if (!keys.length) continue;
    const working = await usableKeys(keys);
    if (!working.length) {
      // One "down" issue only; each key's reason goes in its detail.
      const reset = nextReset(keys);
      const wait = waitText(reset);
      const why = keys
        .map((k) => `${k.label} (${k.secret ? mask(k.secret) : "…"}): ${REASON[k.status] ?? "not working"}${k.error ? `, ${k.error}` : ""}`)
        .join("; ")
        .replace(/\.$/, "");
      found.push({
        ikey: `down:${service}`,
        service,
        label: meta.label,
        kind: "down",
        title: `${meta.label} is down: no working key`,
        detail: `${meta.what} Paused until you add a working key${wait ? ` or it resets in ${wait}` : ""}. Keys: ${why}.`,
        needsKey: true,
        resetAt: reset,
      });
      continue;
    }
    for (const k of keys) {
      if (k.status !== "invalid" && k.status !== "exhausted") continue;
      const wait = waitText(k.until);
      const masked = k.secret ? mask(k.secret) : "…";
      found.push({
        ikey: `key:${service}:${k.id}:${k.status}`,
        service,
        label: meta.label,
        kind: "key",
        title: k.status === "invalid" ? `${meta.label} key was rejected` : `${meta.label} key is used up`,
        detail:
          k.status === "invalid"
            ? `${k.label} (${masked}) no longer works. A backup key is being used for now. Add a new key to replace it.`
            : `${k.label} (${masked}) has hit its limit${wait ? ` and resets in ${wait}` : ""}. A backup key is being used for now.`,
        needsKey: true,
        resetAt: k.until,
      });
    }
  }

  const health = await prisma.serviceHealth.findMany({ where: { service: { in: Object.keys(CONNECTIONS) } } });
  for (const h of health) {
    if (h.fails >= 3 && h.error) {
      const c = CONNECTIONS[h.service];
      found.push({
        ikey: `conn:${h.service}`,
        service: h.service,
        label: c.label,
        kind: "down",
        title: `${c.label} isn't working`,
        detail: `${h.error} ${c.fix}`,
        needsKey: false,
        resetAt: h.cooldownUntil,
      });
    }
  }
  return found;
}

/** Stores new problems, refreshes ones still happening, closes ones that cleared. */
export async function syncApiIssues() {
  // Work out the current problems first: if that throws, nothing is wrongly resolved.
  const current = new Map((await currentIssues()).map((i) => [i.ikey, i]));
  const open = await prisma.apiIssue.findMany({ where: { resolvedAt: null }, select: { id: true, ikey: true } });
  const openByKey = new Map(open.map((r) => [r.ikey, r.id]));
  const now = new Date();
  const fresh: Current[] = [];

  for (const [ikey, i] of current) {
    const id = openByKey.get(ikey);
    if (id) {
      await prisma.apiIssue.update({ where: { id }, data: { lastSeen: now, detail: i.detail, resetAt: i.resetAt } });
    } else {
      await prisma.apiIssue.create({ data: { ...i, firstSeen: now, lastSeen: now } });
      fresh.push(i);
    }
  }
  for (const r of open) {
    if (!current.has(r.ikey)) await prisma.apiIssue.update({ where: { id: r.id }, data: { resolvedAt: now } });
  }

  for (const i of fresh) {
    if (i.kind !== "down") continue;
    try {
      await replyInChat(`⚠️ ${i.title}\n\n${i.detail}\n\nOpen Settings → API keys to add a new key.`);
    } catch (err) {
      console.error("Couldn't text about a new outage:", err);
    }
  }
}

export async function listIssues() {
  const rows = await prisma.apiIssue.findMany({ orderBy: { id: "desc" }, take: 60 });
  const now = Date.now();
  const issues = rows.map((r) => ({
    id: r.id,
    service: r.service,
    label: r.label,
    kind: r.kind,
    title: r.title,
    detail: r.detail,
    needsKey: r.needsKey,
    resetAt: r.resetAt?.toISOString() ?? null,
    firstSeen: r.firstSeen.toISOString(),
    lastSeen: r.lastSeen.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    snoozed: !!r.snoozeUntil && r.snoozeUntil.getTime() > now,
  }));
  return { open: issues.filter((i) => !i.resolvedAt), history: issues.filter((i) => i.resolvedAt).slice(0, 30) };
}

/** "Remind me later": hides the pop-up for a while; the problem stays listed. */
export async function snoozeIssues(ids: number[] | undefined, hours = 6) {
  const h = Math.max(0.25, Math.min(Number(hours) || 6, 24 * 7));
  const until = new Date(Date.now() + h * 3600_000);
  await prisma.apiIssue.updateMany({
    where: ids?.length ? { id: { in: ids } } : { resolvedAt: null },
    data: { snoozeUntil: until },
  });
}

export type ApiIssue = Awaited<ReturnType<typeof listIssues>>["open"][number];
