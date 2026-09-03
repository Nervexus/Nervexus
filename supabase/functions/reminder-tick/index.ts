// reminder-tick — the Reminder Engine's out-of-app heartbeat.
// Cron-authenticated (X-Cron-Secret) sweeps every user; a normal user JWT runs
// it for just that one user (used by the in-app Testing Panel's "Run Now").
// Mirrors notification-engine.js's ReminderEngine.tick() server-side so
// checklist reminders still fire when nobody has the app open.
// Also sweeps calendar events (added so calendar reminders fire out-of-app and
// on mobile too — the client's own _checkEventReminders() only runs while the
// tab is open and foregrounded, which browsers throttle/suspend in the
// background, so it can silently miss the lead-time window).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/push.ts';
import { sendReminderEmail } from '../_shared/email.ts';
import { buildDigest } from '../_shared/digest-template.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

const FREQUENCY_MINUTES: Record<string, number> = { '15min': 15, '30min': 30, hourly: 60, '150min': 150, '2hour': 120, '4hour': 240, daily: 1440 };

// Mirrors the client's own first-name extraction (index.html's firstName/nm helpers) so
// personalized email copy reads the same way the in-app greeting does.
/* The first word of an account name is a title as often as it is a name, and a live run
   proved it: the digest went out addressed "Hey Mr". closeOut() already refuses to use this
   helper for exactly that reason; the email path used it anyway.

   Titles are skipped, and if nothing recognisable is left the caller gets an empty string —
   every greeting here already has a no-name form, and no name at all reads better than the
   wrong one. */
const TITLES = /^(?:mr|mrs|ms|miss|mx|dr|prof|professor|sir|dame|lord|lady|rev|father|capt|captain|major|sgt)\.?$/i;
function firstName(fullName: string) {
  const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (TITLES.test(w)) continue;
    const clean = w.replace(/[^\p{L}\p{M}'-]/gu, '');
    if (clean.length >= 2) return clean;
  }
  return '';
}

// User-customizable email template (Settings → Notifications → Email template). Empty
// fields fall back to '{{title}}' / '{{message}}' — i.e. today's exact plain output —
// so nobody's email changes shape until they actually opt into customizing it.
// EMAIL_SIGNOFF is appended to every outgoing email's body, unconditionally, after the
// template is applied — requested to always close every email the same way. Mirrored in
// index.html's _renderEmailTemplate() for the client-side test-email paths.
const EMAIL_SIGNOFF = '\n\nThank you,\nUltra X Management team';
function applyEmailTemplate(prefs: Record<string, any>, title: string, body: string) {
  const subjTpl = (prefs.emailTemplateSubject || '').trim() || '{{title}}';
  const bodyTpl = (prefs.emailTemplateBody || '').trim() || '{{message}}';
  const fill = (tpl: string) => tpl
    .replace(/\{\{\s*title\s*\}\}/g, title)
    .replace(/\{\{\s*message\s*\}\}/g, body)
    .replace(/\{\{\s*body\s*\}\}/g, body);
  return { subject: fill(subjTpl) || title, text: (fill(bodyTpl) || body) + EMAIL_SIGNOFF };
}

/* ---- one email, not five -----------------------------------------------------------
   Every sweep below used to call sendTemplatedEmail directly, so a user with a pending
   mission, an event tomorrow, an unlogged day and a new version waiting got four separate
   emails within the same minute. The sweeps now COLLECT into a per-user bundle and one
   flush at the end sends a single digest.

   Two rules the collector exists to enforce:

   1. A failed send must not burn the dedupe key. emailOnly() used to write the
      notifications row — the row that says "already sent, never again" — whether or not
      the provider accepted the message. One outage therefore suppressed that reminder
      permanently. Rows are now written only after a confirmed send.

   2. A deadline must not wait for a cadence. The digest is on a 4-hour rhythm, but the
      Performance Terminal nudge fires at 21:30 for a 22:00 cut-off. Anything high or
      critical forces the digest out immediately instead of being batched past the point
      where it was any use. */
type DigestItem = {
  section: 'performance' | 'tasks' | 'calendar' | 'logs' | 'update';
  line: string;
  subject?: string;
  meta?: string;
  priority?: string;
  // Bookkeeping for the notifications table, written only if the send succeeds.
  category: string;
  sourceType: string;
  dedupeKey: string;
};
type Bundle = { items: DigestItem[] };
function newBundle(): Bundle { return { items: [] }; }

async function collect(admin: any, bundle: Bundle, item: DigestItem) {
  if (item.dedupeKey && await alreadySent(admin, item.dedupeKey)) return 0;
  // Two sweeps racing to the same key within one tick would otherwise both add it.
  if (bundle.items.some((i) => i.dedupeKey === item.dedupeKey)) return 0;
  bundle.items.push(item);
  return 1;
}

const DIGEST_FREQ_MIN = 240;
function forcesImmediateSend(items: DigestItem[]) {
  return items.some((i) => i.priority === 'critical' || i.priority === 'high');
}

async function flushDigest(admin: any, userId: string, name: string, prefs: Record<string, any>, bundle: Bundle) {
  const items = bundle.items;
  if (!items.length) return { sent: 0, emailed: 0 };
  if (!(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0, emailed: 0 };

  if (!forcesImmediateSend(items)) {
    const hour = localHour(new Date(), prefs.timezone || UK_TZ);
    if (hour < 6 || hour >= 23) return { sent: 0, emailed: 0, held: 'outside 6am-11pm' };
    const { data: lastNotif } = await admin.from('notifications').select('created_at')
      .eq('user_id', userId).eq('source_type', 'digest-email')
      .order('created_at', { ascending: false }).limit(1);
    const lastTs = (lastNotif && lastNotif[0]) ? new Date(lastNotif[0].created_at).getTime() : 0;
    if (Date.now() - lastTs < DIGEST_FREQ_MIN * 60000 - 30000) return { sent: 0, emailed: 0, held: 'cadence' };
  }

  const digest = buildDigest({
    name,
    items,
    localHour: localHour(new Date(), prefs.timezone || UK_TZ),
    signoff: EMAIL_SIGNOFF,
    appUrl: 'https://nervexus.vercel.app',
    dateLabel: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(),
    signoffLine: 'Best, Ultra X management team',
  });

  /* A customized subject/body template still wraps the digest, so nobody who set one loses
     it — {{message}} is now the whole digest rather than a single reminder. Customizing the
     template deliberately drops the HTML part: their wording is the point, and silently
     sending a designed HTML email that ignores it would be worse than sending plain text. */
  const customized = !!((prefs.emailTemplateSubject || '').trim() || (prefs.emailTemplateBody || '').trim());
  const tpl = customized ? applyEmailTemplate(prefs, digest.subject, digest.text)
                         : { subject: digest.subject, text: digest.text };
  const res = await sendReminderEmail(
    prefs.reminderEmailAddr, tpl.subject, tpl.text, prefs.emailProvider,
    customized ? undefined : digest.html,
  );

  if (!res.ok) {
    /* Loud, not silent. The failure is recorded against the user so the Notification
       Centre can show it, and returned so the cron response says what went wrong instead
       of reporting a cheerful sent:0. */
    await admin.from('notifications').insert({
      user_id: userId, title: 'Reminder email could not be sent', body: res.error || 'Unknown error',
      category: 'system', priority: 'high', status: 'failed',
      source_type: 'digest-email-error', dedupe_key: 'digest-email-error:' + userId + ':' + new Date().toISOString().slice(0, 13),
      channels: ['email'],
    });
    return { sent: 0, emailed: 0, error: res.error };
  }

  // Only now are the dedupe keys burned.
  const rows = items.map((i) => ({
    user_id: userId, title: i.subject || i.line, body: i.line,
    category: i.category, priority: i.priority || 'normal', status: 'sent',
    source_type: i.sourceType, dedupe_key: i.dedupeKey, channels: ['email'],
  }));
  rows.push({
    user_id: userId, title: digest.subject, body: 'Digest of ' + items.length + ' item(s)',
    category: 'system', priority: 'low', status: 'sent',
    source_type: 'digest-email', dedupe_key: 'digest-email:' + userId + ':' + Date.now(), channels: ['email'],
  } as any);
  await admin.from('notifications').insert(rows);
  return { sent: items.length, emailed: 1 };
}

// Checklist reminders (user_checklists) and the Daily Missions digest used to be two
// separate emails that said the same thing in slightly different words — "here's what's
// still open, and how many." Merged into one digest covering both. Per the owner's
// explicit request: fixed to a 6am-11pm send window and a flat 4-hour minimum cadence,
// overriding the configurable notifFrequency setting for this specific email.
/* Daily Checklists and Tasks & Missions were two sections telling you the same thing in
   different words, so they are one count now. */
function pickDigestSubject(name: string, openTotal: number) {
  const who = name ? 'Hey ' + name + ', y' : 'Y';
  return `${who}ou have ${openTotal} task${openTotal === 1 ? '' : 's'} pending completion`;
}
function pickDigestText(openTotal: number, hoursLeft: number) {
  return `You have ${openTotal} task${openTotal === 1 ? '' : 's'} pending, awaiting completion. `
       + `You have ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'} left until the day ends. `
       + `Please log in as soon as possible.`;
}
async function sweepDigest(admin: any, userId: string, name: string, prefs: Record<string, any>, bundle: Bundle) {
  if (prefs.notifsEnabled === false) return { sent: 0 };
  // The 6am-11pm window and 4-hour cadence now live on the digest flush, which is the
  // thing that actually sends. This sweep only gathers.
  const today = new Date().toISOString().slice(0, 10);

  const { data: missions } = await admin
    .from('missions').select('id,name,last_completed,recurring,day_key')
    .eq('user_id', userId).eq('status', 'active').is('deleted_at', null);
  // Non-recurring rows are one-off dailies tied to the day they were created
  // (day_key). Old ones from previous days were never deleted server-side —
  // without this filter they'd stay "active" forever and inflate the count
  // (e.g. reporting 36 tasks left when the app itself shows today's real 4).
  // Recurring missions have no day_key and are always in scope.
  const todaysMissions = (missions || []).filter((m: any) => m.recurring || m.day_key === today);
  const openMissions = todaysMissions.filter((m: any) => m.last_completed !== today);

  const { data: checklists } = await admin
    .from('user_checklists').select('id,title')
    .eq('user_id', userId).is('completed_at', null);
  const checklistSummaries: { title: string; open: number }[] = [];
  for (const c of checklists || []) {
    const { count: openCount } = await admin
      .from('checklist_items').select('id', { count: 'exact', head: true })
      .eq('checklist_id', c.id).eq('done', false);
    if (openCount) checklistSummaries.push({ title: c.title, open: openCount });
  }

  if (!openMissions.length && !checklistSummaries.length) return { sent: 0 };

  const openChecklistItems = checklistSummaries.reduce((a, c) => a + c.open, 0);
  const openTotal = openMissions.length + openChecklistItems;
  const hoursLeft = hoursLeftToday(new Date(), prefs.timezone || UK_TZ);
  const title = pickDigestSubject(name, openTotal);
  const body = pickDigestText(openTotal, hoursLeft);
  const priority = 'normal';

  /* Push stays per-category and immediate — a phone notification is glanceable and batching
     it would only make it late. It is the EMAIL that had to stop arriving five times over.
     Push keeps its own cadence check against the existing 'digest' source_type. */
  if (prefs.pushEnabled) {
    const { data: lastPush } = await admin.from('notifications').select('created_at')
      .eq('user_id', userId).eq('source_type', 'digest')
      .order('created_at', { ascending: false }).limit(1);
    const lastTs = (lastPush && lastPush[0]) ? new Date(lastPush[0].created_at).getTime() : 0;
    const hour = localHour(new Date(), prefs.timezone || UK_TZ);
    if (hour >= 6 && hour < 23 && Date.now() - lastTs >= DIGEST_FREQ_MIN * 60000 - 30000) {
      await sendPushToUser(admin, userId, { title, body, category: 'mission', priority, url: './index.html' });
      await admin.from('notifications').insert({
        user_id: userId, title, body, category: 'mission', priority, status: 'sent',
        source_type: 'digest', dedupe_key: 'digest:' + userId + ':' + Date.now(), channels: ['push'],
      });
    }
  }

  /* Keyed by the day and the actual counts, so the same email is not re-sent every four
     hours while nothing changes, but a newly-completed mission produces a fresh line. */
  const key = 'tasks:' + userId + ':' + today + ':' + openTotal;
  const added = await collect(admin, bundle, {
    section: 'tasks', line: body, subject: title, priority,
    category: 'mission', sourceType: 'digest-tasks', dedupeKey: key,
  });
  return { sent: added };
}

// `events.repeat_days` (a per-weekday array, e.g. ['MON','WED','FRI']) — mirrors the
// client's own _eventOccursOn(): an event occurs today if today IS its original
// event_date, or today is strictly after it and today's weekday is in repeat_days.
function dowCode(ds: string) {
  const d = new Date(ds + 'T00:00:00Z');
  return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][(d.getUTCDay() + 6) % 7];
}
function eventOccursOn(e: { event_date: string; repeat_days?: string[] | null }, ds: string) {
  if (e.event_date === ds) return true;
  if (!e.repeat_days || !e.repeat_days.length) return false;
  return ds > e.event_date && e.repeat_days.indexOf(dowCode(ds)) !== -1;
}
// Push keeps its original near-event-time behaviour (configurable lead time, default 15
// min). Email is now a separate, fixed 24-hours-before heads-up with its own copy and its
// own dedupe key — the owner asked for email specifically to always go out a day ahead,
// not for push to move too.
const EMAIL_LEAD_MIN = 1440;
/* "45" reads badly out loud and "90 minutes" reads worse than "an hour and a half". */
function humanMins(m: number) {
  if (m < 60) return m + ' minutes';
  const h = Math.floor(m / 60), r = m % 60;
  const hs = h === 1 ? 'an hour' : h + ' hours';
  return r ? hs + ' and ' + r + ' minutes' : hs;
}

async function sweepCalendarEvents(admin: any, userId: string, name: string, prefs: Record<string, any>, bundle: Bundle) {
  const canPush = prefs.reminderPushEnabled !== false;
  const canEmail = prefs.reminderEmailEnabled && prefs.reminderEmailAddr;
  if (!canPush && !canEmail) return { sent: 0 };
  const leadMin = prefs.reminderLeadMins || 15;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = addDaysToDateStr(todayStr, 1);
  // Every non-deleted event is fetched, not just ones dated today — a recurring event's
  // own event_date can be any date in the past, so it has to be checked against today's
  // weekday via repeat_days rather than matched by date directly.
  const { data: events } = await admin
    .from('events').select('id,title,event_date,event_time,repeat_days,kind,end_time,attendees,est_minutes')
    .eq('user_id', userId).is('deleted_at', null);
  if (!events || !events.length) return { sent: 0 };

  let sent = 0;
  for (const e of events) {
    if (!e.event_date || !e.event_time) continue;
    /* Push is about today's occurrence; the email is a heads-up about TOMORROW's. They are
       different days, so both are worked out and the event is skipped only if neither
       applies. */
    const occursToday = eventOccursOn(e, todayStr);
    const occursTomorrow = eventOccursOn(e, tomorrowStr);
    if (!occursToday && !occursTomorrow) continue;

    const dt = new Date(todayStr + 'T' + e.event_time + ':00');
    const mins = (dt.getTime() - now.getTime()) / 60000;
    // Cron runs every 15 min, so a window this wide (up to 16 min) guarantees exactly one
    // tick lands inside it without needing extra state on `events` itself.
    const inWindow = (lead: number) => mins <= lead && mins > lead - 16;

    if (canPush && occursToday && inWindow(leadMin)) {
      // Keyed to TODAY's occurrence, not the event's original event_date — a recurring
      // event used to dedupe against its first-ever firing forever and never fire again.
      const dedupeKey = 'calendar:' + e.id + ':' + todayStr;
      const { data: already } = await admin.from('notifications').select('id').eq('dedupe_key', dedupeKey).limit(1);
      if (!already || !already.length) {
        const title = 'Upcoming: ' + e.title;
        const body = 'Starts at ' + e.event_time + ' today.';
        await sendPushToUser(admin, userId, { title, body, category: 'calendar', priority: 'normal', url: './index.html' });
        await admin.from('notifications').insert({
          user_id: userId, title, body, category: 'calendar', priority: 'normal', status: 'sent',
          source_type: 'event', source_id: e.id, dedupe_key: dedupeKey, channels: ['push'],
        });
        sent++;
      }
    }

    /* This used to be inWindow(1440) against today's occurrence — and `mins` is measured
       to a time earlier the SAME day, so it can never exceed about 1439. The window
       (1424, 1440] was therefore reachable only in a fifteen-minute sliver just after
       midnight, for an event at 23:59. In practice the "24 hours ahead" email never fired
       at all, which is its own answer to why calendar reminders were never received.

       It is now what it always claimed to be: a heads-up about tomorrow, sent in the same
       21:00 slot as the performance and logs reminders, so the evening produces one email
       rather than three. The dedupe key is per event per day, so it goes once. */
    if (canEmail && occursTomorrow && localMinuteOfDay(now, prefs.timezone || UK_TZ) >= 21 * 60) {
      /* Three shapes, as asked for. Which one is used depends on what the event actually
         carries, never on a guess: a work event needs an end time or attendees to say
         anything more than a general one, and if a work event has neither it reads exactly
         like a general task, because that is all that is known about it. */
      const isWork = (e.kind || 'general') === 'work';
      const when = e.end_time ? `from ${e.event_time} till ${e.end_time}` : `at ${e.event_time}`;
      const withWho = e.attendees ? ` with ${e.attendees}` : '';
      const takes = e.est_minutes ? ` This should take about ${humanMins(e.est_minutes)}.` : '';
      const line = isWork
        ? `For tomorrow you have ${e.title} ${when}${withWho}.`
        : `For tomorrow you have ${e.title} at ${e.event_time}, which you have set for yourself to do.${takes}`;
      sent += await collect(admin, bundle, {
        section: 'calendar',
        line,
        subject: (name ? 'Hey ' + name + ' — ' : '') + 'tomorrow: ' + e.title,
        meta: (e.end_time ? e.event_time + '\u2013' + e.end_time : e.event_time) + ' tomorrow',
        priority: 'normal',
        category: 'calendar', sourceType: 'event',
        dedupeKey: 'calendar-email:' + e.id + ':' + todayStr,
      });
    }
  }
  return { sent };
}

/* This was a hand-bumped constant, and it had drifted to v9.23 while the app shipped
   v11.x — which is precisely why nobody received a "new version" email any more. The
   announcement fires once per NEW version string; once every user's lastSeenVersion had
   caught up to a value that stopped changing, it could never fire again. A constant that
   must be remembered on every release will always end up here.

   So it is no longer remembered. The live site already publishes its own version in
   NOTIF_BUILD_VERSION; the function reads it and falls back to the constant only if the
   fetch fails. Cached per invocation, so a sweep over every user costs one request. */
const LATEST_VERSION_FALLBACK = 'v11.230';
const APP_URL = 'https://nervexus.vercel.app';
let _versionCache: string | null = null;
async function latestVersion(): Promise<string> {
  if (_versionCache) return _versionCache;
  try {
    const r = await fetch(APP_URL + '/?v=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' } });
    if (r.ok) {
      const html = await r.text();
      // '2026.08.31-227 · v11.227 conversation-fixes' -> 'v11.227'
      const m = /NOTIF_BUILD_VERSION\s*=\s*'[^']*?(v\d+\.\d+)/.exec(html);
      if (m) { _versionCache = m[1]; return _versionCache; }
    }
  } catch { /* offline or blocked — the fallback is the point of having one */ }
  _versionCache = LATEST_VERSION_FALLBACK;
  return _versionCache;
}

function localDateStr(now: Date, tz: string) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC' }).format(now); }
  catch { return now.toISOString().slice(0, 10); }
}
function localHour(now: Date, tz: string) {
  try { return parseInt(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: tz || 'UTC' }).format(now), 10) % 24; }
  catch { return now.getUTCHours(); }
}
// Minutes since local midnight — used where a trigger needs half-hour precision (e.g.
// 21:30) rather than localHour()'s whole-hour granularity.
function localMinuteOfDay(now: Date, tz: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: tz || 'UTC' }).formatToParts(now);
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10) % 24;
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return h * 60 + m;
  } catch { return now.getUTCHours() * 60 + now.getUTCMinutes(); }
}
/* "you have {Hours} left until the day ends" — measured in the reader's own timezone, so
   someone in London and someone in New York are each told their own truth. */
function hoursLeftToday(now: Date, tz: string) {
  const mins = localMinuteOfDay(now, tz);
  return Math.max(0, Math.round((24 * 60 - mins) / 60));
}

async function alreadySent(admin: any, dedupeKey: string) {
  const { data } = await admin.from('notifications').select('id').eq('dedupe_key', dedupeKey).limit(1);
  return !!(data && data.length);
}
// The "performance-tick cron" the client comments referenced as the source of truth for
// miss_streak/banned never actually existed — this is it. Fixed to UK time (Europe/London)
// for every user, deliberately not per-user timezone: this is a uniform policy, not a
// convenience feature. Two independent jobs:
//  1. A same-day nudge at/after 22:00 UK if today isn't logged yet (the "pop up" trigger
//     — the client shows the actual in-app modal; this is its out-of-app echo).
//  2. A once-per-day compliance evaluation of YESTERDAY: holiday -> no change; logged ->
//     streak resets to 0; missed -> streak+1, warning email every miss, and at 7 the
//     account is locked (banned) pending the owner's appeal review.
const UK_TZ = 'Europe/London';
function addDaysToDateStr(ds: string, delta: number) {
  const d = new Date(ds + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
async function sweepPerformanceTerminal(admin: any, userId: string, name: string, prefs: Record<string, any>, bundle: Bundle) {
  const { data: statusRows } = await admin.from('performance_status').select('*').eq('user_id', userId).limit(1);
  const status = (statusRows && statusRows[0]) || { miss_streak: 0, banned: false };
  if (status.banned) return { sent: 0 }; // locked pending appeal — nothing more to nag about

  const now = new Date();
  const ukToday = localDateStr(now, UK_TZ);
  const ukMinuteOfDay = localMinuteOfDay(now, UK_TZ);
  const ukYesterday = addDaysToDateStr(ukToday, -1);

  const { data: holidayRows } = await admin.from('performance_holidays').select('start_date,end_date').eq('user_id', userId);
  const onHoliday = (ds: string) => (holidayRows || []).some((h: any) => ds >= h.start_date && ds <= h.end_date);

  let sent = 0;
  const canEmail = prefs.reminderEmailEnabled && prefs.reminderEmailAddr;

  // Job 1: same-day nudge at 21:00 UK — a full hour before the 22:00 deadline, because the
  // copy says "in one hour" and copy that lies about the clock is worse than no copy.
  if (ukMinuteOfDay >= 21 * 60 && !onHoliday(ukToday)) {
    const { data: todayLog } = await admin.from('performance_logs').select('id').eq('user_id', userId).eq('log_date', ukToday).maybeSingle();
    if (!todayLog && canEmail) {
      // 'high' — this forces the digest out now rather than waiting for the 4-hour
      // cadence, because the deadline it is warning about is an hour away.
      sent += await collect(admin, bundle, {
        section: 'performance',
        line: 'It’s 9pm UK time — in one hour you will need to fill out a mandatory Daily Performance log. '
            + 'This ensures that you are keeping yourself to a high standard. Failing this will lead to a strike on your account.',
        subject: name ? 'Good evening ' + name + ' — your Daily Performance log is due' : 'Your Daily Performance log is due',
        priority: 'high',
        category: 'system', sourceType: 'performance',
        dedupeKey: 'perf-nudge:' + userId + ':' + ukToday,
      });
    }
  }

  // Job 2: once-per-day evaluation of yesterday, gated via last_eval_date on the status
  // row itself — NOT the notifications table, which is the user-visible history list;
  // an internal marker row there would show up as a junk "Performance eval" entry.
  if (status.last_eval_date !== ukToday) {
    await admin.from('performance_status').upsert({ user_id: userId, last_eval_date: ukToday }, { onConflict: 'user_id' });
    if (onHoliday(ukYesterday)) {
      // holiday day — streak untouched either way
    } else {
      const { data: yestLog } = await admin.from('performance_logs').select('id').eq('user_id', userId).eq('log_date', ukYesterday).maybeSingle();
      if (yestLog) {
        if (status.miss_streak > 0 || status.warned_at) await admin.from('performance_status').upsert({ user_id: userId, miss_streak: 0, warned_at: null }, { onConflict: 'user_id' });
      } else {
        const newStreak = (status.miss_streak || 0) + 1;
        if (newStreak >= 7) {
          await admin.from('performance_status').upsert({ user_id: userId, miss_streak: newStreak, banned: true, banned_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (canEmail) sent += await collect(admin, bundle, {
            section: 'performance',
            line: 'Your account has been locked after 7 strikes. Log in to submit an appeal for the owner to review.',
            subject: 'Performance Terminal — account locked',
            priority: 'critical',
            category: 'system', sourceType: 'performance',
            dedupeKey: 'perf-banned:' + userId + ':' + ukToday,
          });
        } else {
          await admin.from('performance_status').upsert({ user_id: userId, miss_streak: newStreak, warned_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (canEmail) sent += await collect(admin, bundle, {
            section: 'performance',
            line: 'Yesterday’s mandatory Daily Performance log wasn’t filled out, so a strike has been added to your account. '
                + 'This is strike ' + newStreak + ' of 7 — the account locks at 7, pending appeal. Log today’s to clear the strikes.',
            subject: 'Performance Terminal — strike ' + newStreak + ' of 7',
            priority: 'high',
            category: 'system', sourceType: 'performance',
            dedupeKey: 'perf-warn:' + userId + ':' + ukToday,
          });
        }
      }
    }
  }
  return { sent };
}

// One-time "new version" email — fires once per release, not on a recurring cadence.
async function sweepVersionUpdate(admin: any, userId: string, name: string, prefs: Record<string, any>, bundle: Bundle) {
  if (!(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0 };
  const LATEST_VERSION = await latestVersion();
  if ((prefs.lastSeenVersion || '') === LATEST_VERSION) return { sent: 0 };
  // 'low' on purpose: a release note is never a reason to interrupt someone's evening. It
  // rides along with whatever else is outstanding.
  const sent = await collect(admin, bundle, {
    section: 'update',
    line: 'A new version is live. Open the app and check What’s New in Settings for details.',
    subject: name ? 'Hey ' + name + ' — Nervexus ' + LATEST_VERSION + ' is out' : 'Nervexus ' + LATEST_VERSION + ' is out',
    meta: LATEST_VERSION,
    priority: 'low',
    category: 'system', sourceType: 'version',
    dedupeKey: 'vupdate:' + userId + ':' + LATEST_VERSION,
  });
  return { sent };
}

/* ---- the Logs sweep -----------------------------------------------------------------
   "Logs this should be around the same time as performance log" — so it runs on the same
   21:00 UK trigger, and because both are collected into one bundle they arrive as one
   email rather than two a minute apart.

   It names only the logs that are actually MISSING today. A list that includes things you
   already did is a list you stop reading. */
/* What can actually be checked, verified against how the app writes each table rather
   than assumed from its name — the first draft of this guessed 'log_date' everywhere and
   would have reported Training as missing every single day, because workouts are stamped
   with an occurred_at timestamp, not a date.

   Two kinds are deliberately absent:
   * Nutrition. The `meals` table has no date column at all — id, user_id, name, kcal,
     protein and nothing else — so there is no way to ask whether one was logged today.
     Nagging about it would be guessing.
   * Energy. It is not a separate log; it is a column on the sleep row, filled in by the
     same form. It is covered by 'Sleep & energy' below rather than counted twice. */
/* Every daily-loggable thing the app has, checked against how each table is really keyed
   rather than what its name suggests. The first draft assumed log_date everywhere and
   would have reported Training missing every single day, because workouts carry an
   occurred_at timestamp.

   Nutrition asks meals.logged_date. That column was there all along, defaulting to
   CURRENT_DATE — I had read the client's insert, seen no date in it, and concluded the
   table had none. The client sets it explicitly now rather than leaning on the default.

   Energy is still absent as a line of its own — it is a column on the sleep row, filled in
   by the same form, so it is counted once under Sleep & energy rather than nagged for
   twice. */
type LogSource = { table: string; col: string; kind: 'date' | 'stamp' };
const LOG_KINDS: { label: string; any: LogSource[] }[] = [
  { label: 'Training',       any: [{ table: 'workouts',       col: 'occurred_at', kind: 'stamp' }] },
  // Either side of the ledger counts: a day with income logged and no spending is logged.
  { label: 'Finance',        any: [{ table: 'expenses',       col: 'occurred_at', kind: 'stamp' },
                                   { table: 'income',         col: 'occurred_at', kind: 'stamp' }] },
  { label: 'Sleep & energy', any: [{ table: 'sleep_logs',     col: 'log_date',    kind: 'date'  }] },
  { label: 'Hydration',      any: [{ table: 'hydration_logs', col: 'log_date',    kind: 'date'  }] },
  { label: 'Nutrition',      any: [{ table: 'meals',          col: 'logged_date', kind: 'date'  }] },
  { label: 'Body metrics',   any: [{ table: 'body_metrics',   col: 'log_date',    kind: 'date'  }] },
  { label: 'Work log',       any: [{ table: 'activities',     col: 'occurred_at', kind: 'stamp' }] },
];

async function sourceHasRow(admin: any, userId: string, k: LogSource, day: string) {
  try {
    let q = admin.from(k.table).select('id', { count: 'exact', head: true }).eq('user_id', userId);
    if (k.kind === 'date') q = q.eq(k.col, day);
    else q = q.gte(k.col, day + 'T00:00:00.000Z').lte(k.col, day + 'T23:59:59.999Z');
    const { count } = await q;
    return !!count;
  } catch {
    /* A table this deployment does not have must not make the email claim the log is
       missing — silence beats nagging someone about a feature they do not have. */
    return true;
  }
}
async function loggedToday(admin: any, userId: string, kind: { any: LogSource[] }, day: string) {
  for (const src of kind.any) if (await sourceHasRow(admin, userId, src, day)) return true;
  return false;
}

async function sweepLogs(admin: any, userId: string, name: string, prefs: Record<string, any>, bundle: Bundle) {
  if (!(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0 };
  const now = new Date();
  if (localMinuteOfDay(now, UK_TZ) < 21 * 60) return { sent: 0 };
  const day = localDateStr(now, prefs.timezone || UK_TZ);

  const missing: string[] = [];
  for (const k of LOG_KINDS) if (!(await loggedToday(admin, userId, k, day))) missing.push(k.label);
  if (!missing.length) return { sent: 0 };

  const sent = await collect(admin, bundle, {
    section: 'logs',
    line: 'Your logs are pending. You have ' + missing.join(', ') + ' still to fill in. '
        + 'You can do all of them in one place — open the app and tap "Log everything".',
    subject: name ? 'Good evening ' + name + ' — your logs are pending' : 'Your logs are pending',
    meta: missing.length + ' of ' + LOG_KINDS.length + ' outstanding',
    priority: 'normal',
    category: 'system', sourceType: 'logs',
    dedupeKey: 'logs:' + userId + ':' + day,
  });
  return { sent };
}

// General wellness check — mirrors the in-app coaching "haven't seen you in a while"
// nudge, but reaches you even if you never open the tab to see the in-app version.
async function sweepWellnessCheckin(admin: any, userId: string, prefs: Record<string, any>, bundle: Bundle) {
  if (!(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0 };
  const { data: profile } = await admin.from('profiles').select('last_login_date').eq('id', userId).maybeSingle();
  if (!profile || !profile.last_login_date) return { sent: 0 };
  const daysSince = Math.floor((Date.now() - new Date(profile.last_login_date + 'T00:00:00Z').getTime()) / 86400000);
  if (daysSince < 3) return { sent: 0 };
  const todayStr = new Date().toISOString().slice(0, 10);
  const sent = await collect(admin, bundle, {
    section: 'logs',
    line: 'It’s been ' + daysSince + ' days since you last opened Nervexus. Nothing has been logged in that time.',
    subject: 'Haven’t seen you in a few days',
    priority: 'normal',
    category: 'system', sourceType: 'checkin',
    dedupeKey: 'checkin:' + userId + ':' + todayStr,
  });
  return { sent };
}

/* Collect from every sweep, then send once. The sweeps still do their own immediate work —
   push notifications, streak arithmetic, account locking — because none of that belongs in
   an email cadence. Only the email is batched. */
async function sweepUser(admin: any, userId: string, fullName: string, prefs: Record<string, any>) {
  const name = firstName(fullName);
  const bundle = newBundle();
  const digestResult = await sweepDigest(admin, userId, name, prefs, bundle);
  const calendarResult = await sweepCalendarEvents(admin, userId, name, prefs, bundle);
  const perfResult = await sweepPerformanceTerminal(admin, userId, name, prefs, bundle);
  const versionResult = await sweepVersionUpdate(admin, userId, name, prefs, bundle);
  const logsResult = await sweepLogs(admin, userId, name, prefs, bundle);
  const checkinResult = await sweepWellnessCheckin(admin, userId, prefs, bundle);
  const flush = await flushDigest(admin, userId, name, prefs, bundle);
  return {
    sent: (digestResult.sent || 0) + (calendarResult.sent || 0) + (perfResult.sent || 0) + (versionResult.sent || 0) + (logsResult.sent || 0) + (checkinResult.sent || 0),
    digest: digestResult.sent || 0, calendar: calendarResult.sent || 0,
    performance: perfResult.sent || 0, version: versionResult.sent || 0,
    logs: logsResult.sent || 0, checkin: checkinResult.sent || 0,
    // What actually left the building, and why it did not if it did not.
    emails: flush.emailed || 0, collected: bundle.items.length,
    ...(flush.held ? { held: flush.held } : {}),
    ...(flush.error ? { emailError: flush.error } : {}),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const cronSecret = req.headers.get('X-Cron-Secret');
    if (cronSecret) {
      if (cronSecret !== Deno.env.get('CRON_SECRET')) return json({ error: 'Bad cron secret' }, 401);
      const { data: profiles } = await admin.from('profiles').select('id,name,prefs');
      const results: Record<string, any> = {};
      for (const p of profiles || []) results[p.id] = await sweepUser(admin, p.id, p.name || '', p.prefs || {});
      return json({ ok: true, users: Object.keys(results).length, results });
    }

    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'Not authenticated' }, 401);
    const { data: profile } = await admin.from('profiles').select('name,prefs').eq('id', userData.user.id).maybeSingle();
    const result = await sweepUser(admin, userData.user.id, profile?.name || '', profile?.prefs || {});
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
