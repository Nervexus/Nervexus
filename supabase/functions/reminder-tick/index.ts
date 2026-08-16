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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

const FREQUENCY_MINUTES: Record<string, number> = { '15min': 15, '30min': 30, hourly: 60, '150min': 150, '2hour': 120, '4hour': 240, daily: 1440 };

// User-customizable email template (Settings → Notifications → Email template). Empty
// fields fall back to '{{title}}' / '{{message}}' — i.e. today's exact plain output —
// so nobody's email changes shape until they actually opt into customizing it.
function applyEmailTemplate(prefs: Record<string, any>, title: string, body: string) {
  const subjTpl = (prefs.emailTemplateSubject || '').trim() || '{{title}}';
  const bodyTpl = (prefs.emailTemplateBody || '').trim() || '{{message}}';
  const fill = (tpl: string) => tpl
    .replace(/\{\{\s*title\s*\}\}/g, title)
    .replace(/\{\{\s*message\s*\}\}/g, body)
    .replace(/\{\{\s*body\s*\}\}/g, body);
  return { subject: fill(subjTpl) || title, text: fill(bodyTpl) || body };
}
async function sendTemplatedEmail(prefs: Record<string, any>, title: string, body: string) {
  const tpl = applyEmailTemplate(prefs, title, body);
  return sendReminderEmail(prefs.reminderEmailAddr, tpl.subject, tpl.text, prefs.emailProvider);
}

function pickChecklistText(title: string, open: number) {
  if (open === 1) return `Only one task left on ${title} today.`;
  return `You still have ${open} items remaining on ${title}.`;
}

async function sweepChecklists(admin: any, userId: string, prefs: Record<string, any>) {
  if (prefs.notifsEnabled === false) return { sent: 0 };
  const freqMin = FREQUENCY_MINUTES[prefs.notifFrequency || 'hourly'] || 60;

  const { data: checklists } = await admin
    .from('user_checklists').select('id,title,category,priority,last_reminded_at')
    .eq('user_id', userId).is('completed_at', null);
  if (!checklists || !checklists.length) return { sent: 0 };

  let sent = 0;
  for (const c of checklists) {
    const last = c.last_reminded_at ? new Date(c.last_reminded_at).getTime() : 0;
    if (Date.now() - last < freqMin * 60000 - 30000) continue; // not due yet

    const { count: openCount } = await admin
      .from('checklist_items').select('id', { count: 'exact', head: true })
      .eq('checklist_id', c.id).eq('done', false);
    if (!openCount) continue;

    const body = pickChecklistText(c.title, openCount);
    const priority = c.priority || 'normal';

    if (prefs.pushEnabled) await sendPushToUser(admin, userId, { title: c.title, body, category: c.category, priority, url: './index.html' });
    if (prefs.reminderEmailEnabled && prefs.reminderEmailAddr) await sendTemplatedEmail(prefs, c.title, body);

    await admin.from('notifications').insert({
      user_id: userId, title: c.title, body, category: c.category || 'checklist',
      priority, status: 'sent', source_type: 'checklist', source_id: c.id,
      dedupe_key: 'checklist:' + c.id, channels: ['push'],
    });
    await admin.from('user_checklists').update({ last_reminder_text: body, last_reminded_at: new Date().toISOString() }).eq('id', c.id);
    sent++;
  }
  return { sent };
}

// Daily Missions (the dashboard's actual recurring-task feature — separate table from
// the Checklist Engine above, and the one users actually see day to day). Sends ONE
// digest per due window listing how many are left and their names, rather than a
// separate email per mission — matches what was actually asked for: "confirm how many
// tasks are left and what they are." No last_reminded_at column here, so recency is
// derived from the most recent digest notification instead of a dedicated field.
function pickMissionsText(names: string[]) {
  if (names.length === 1) return 'You have 1 mission left today: ' + names[0] + '.';
  return 'You have ' + names.length + ' missions left today: ' + names.join(', ') + '.';
}
async function sweepMissions(admin: any, userId: string, prefs: Record<string, any>) {
  if (prefs.notifsEnabled === false) return { sent: 0 };
  const freqMin = FREQUENCY_MINUTES[prefs.notifFrequency || 'hourly'] || 60;
  const today = new Date().toISOString().slice(0, 10);

  const { data: missions } = await admin
    .from('missions').select('id,name,last_completed,recurring,day_key')
    .eq('user_id', userId).eq('status', 'active').is('deleted_at', null);
  if (!missions || !missions.length) return { sent: 0 };

  // Non-recurring rows are one-off dailies tied to the day they were created
  // (day_key). Old ones from previous days were never deleted server-side —
  // without this filter they'd stay "active" forever and inflate the count
  // (e.g. reporting 36 tasks left when the app itself shows today's real 4).
  // Recurring missions have no day_key and are always in scope.
  const todaysMissions = missions.filter((m: any) => m.recurring || m.day_key === today);
  const open = todaysMissions.filter((m: any) => m.last_completed !== today);
  if (!open.length) return { sent: 0 };

  const { data: lastNotif } = await admin.from('notifications').select('created_at')
    .eq('user_id', userId).eq('source_type', 'missions_digest')
    .order('created_at', { ascending: false }).limit(1);
  const lastTs = (lastNotif && lastNotif[0]) ? new Date(lastNotif[0].created_at).getTime() : 0;
  if (Date.now() - lastTs < freqMin * 60000 - 30000) return { sent: 0 };

  const title = open.length === 1 ? 'Daily Missions — 1 task left' : 'Daily Missions — ' + open.length + ' tasks left';
  const body = pickMissionsText(open.map((m: any) => m.name));
  const priority = 'normal';

  if (prefs.pushEnabled) await sendPushToUser(admin, userId, { title, body, category: 'mission', priority, url: './index.html' });
  if (prefs.reminderEmailEnabled && prefs.reminderEmailAddr) await sendTemplatedEmail(prefs, title, body);

  await admin.from('notifications').insert({
    user_id: userId, title, body, category: 'mission', priority, status: 'sent',
    source_type: 'missions_digest', dedupe_key: 'missions_digest:' + userId + ':' + Date.now(), channels: ['push'],
  });
  return { sent: 1 };
}

// `events` has no repeat_days column server-side — recurrence is currently a
// client-only field that never actually gets persisted (the insert call sends
// it, but the live table doesn't have it, so it's silently dropped by
// PostgREST's column filtering on read). Only one-off events (matched by
// event_date) can be swept reliably until that's added.
async function sweepCalendarEvents(admin: any, userId: string, prefs: Record<string, any>) {
  if (prefs.reminderPushEnabled === false && !(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0 };
  const leadMin = prefs.reminderLeadMins || 15;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const { data: events } = await admin
    .from('events').select('id,title,event_date,event_time')
    .eq('user_id', userId).eq('event_date', todayStr).is('deleted_at', null);
  if (!events || !events.length) return { sent: 0 };

  let sent = 0;
  for (const e of events) {
    if (!e.event_date || !e.event_time) continue;
    const occ = e.event_date;

    const dt = new Date(occ + 'T' + e.event_time + ':00');
    const mins = (dt.getTime() - now.getTime()) / 60000;
    // Cron runs every 15 min, so a lead-time window this wide (up to 16 min) guarantees
    // exactly one tick lands inside it without needing extra state on `events` itself.
    if (mins > leadMin || mins <= leadMin - 16) continue;

    const dedupeKey = 'calendar:' + e.id + ':' + occ;
    const { data: already } = await admin.from('notifications').select('id').eq('dedupe_key', dedupeKey).limit(1);
    if (already && already.length) continue;

    const title = 'Upcoming: ' + e.title;
    const body = 'Starts at ' + e.event_time + ' today.';
    const priority = 'normal';

    if (prefs.reminderPushEnabled !== false) await sendPushToUser(admin, userId, { title, body, category: 'calendar', priority, url: './index.html' });
    if (prefs.reminderEmailEnabled && prefs.reminderEmailAddr) await sendTemplatedEmail(prefs, title, body);

    await admin.from('notifications').insert({
      user_id: userId, title, body, category: 'calendar', priority, status: 'sent',
      source_type: 'event', source_id: e.id, dedupe_key: dedupeKey, channels: ['push'],
    });
    sent++;
  }
  return { sent };
}

// Bump this whenever index.html's _changelog()[0].version changes — there's no shared
// source of truth between the client changelog and this function, so it's a manual sync
// (same pattern as the Testing Panel's NOTIF_BUILD_VERSION indicator).
const LATEST_VERSION = 'v9.23';

function localDateStr(now: Date, tz: string) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC' }).format(now); }
  catch { return now.toISOString().slice(0, 10); }
}
function localHour(now: Date, tz: string) {
  try { return parseInt(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: tz || 'UTC' }).format(now), 10) % 24; }
  catch { return now.getUTCHours(); }
}
async function alreadySent(admin: any, dedupeKey: string) {
  const { data } = await admin.from('notifications').select('id').eq('dedupe_key', dedupeKey).limit(1);
  return !!(data && data.length);
}
async function emailOnly(admin: any, userId: string, prefs: Record<string, any>, category: string, sourceType: string, dedupeKey: string, title: string, body: string, priority = 'normal') {
  if (await alreadySent(admin, dedupeKey)) return 0;
  await sendTemplatedEmail(prefs, title, body);
  await admin.from('notifications').insert({
    user_id: userId, title, body, category, priority, status: 'sent',
    source_type: sourceType, dedupe_key: dedupeKey, channels: ['email'],
  });
  return 1;
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
async function sweepPerformanceTerminal(admin: any, userId: string, prefs: Record<string, any>) {
  const { data: statusRows } = await admin.from('performance_status').select('*').eq('user_id', userId).limit(1);
  const status = (statusRows && statusRows[0]) || { miss_streak: 0, banned: false };
  if (status.banned) return { sent: 0 }; // locked pending appeal — nothing more to nag about

  const now = new Date();
  const ukToday = localDateStr(now, UK_TZ);
  const ukHour = localHour(now, UK_TZ);
  const ukYesterday = addDaysToDateStr(ukToday, -1);

  const { data: holidayRows } = await admin.from('performance_holidays').select('start_date,end_date').eq('user_id', userId);
  const onHoliday = (ds: string) => (holidayRows || []).some((h: any) => ds >= h.start_date && ds <= h.end_date);

  let sent = 0;
  const canEmail = prefs.reminderEmailEnabled && prefs.reminderEmailAddr;

  // Job 1: same-day 22:00 UK nudge, not yet a miss.
  if (ukHour >= 22 && !onHoliday(ukToday)) {
    const { data: todayLog } = await admin.from('performance_logs').select('id').eq('user_id', userId).eq('log_date', ukToday).maybeSingle();
    if (!todayLog && canEmail) {
      sent += await emailOnly(admin, userId, prefs, 'system', 'performance',
        'perf-nudge:' + userId + ':' + ukToday,
        'Performance Terminal — today’s check-in is still open',
        'It’s past 10pm UK and today’s mandatory Performance Terminal check-in hasn’t been done yet. Log it before the day ends to keep your streak clean.',
        'high');
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
          if (canEmail) sent += await emailOnly(admin, userId, prefs, 'system', 'performance',
            'perf-banned:' + userId + ':' + ukToday,
            'Performance Terminal — account locked',
            'Your account has been locked after 7 consecutive missed daily check-ins. Log in to submit an appeal for the owner to review.',
            'critical');
        } else {
          await admin.from('performance_status').upsert({ user_id: userId, miss_streak: newStreak, warned_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (canEmail) sent += await emailOnly(admin, userId, prefs, 'system', 'performance',
            'perf-warn:' + userId + ':' + ukToday,
            'Performance Terminal — missed check-in (' + newStreak + '/7)',
            'Yesterday’s mandatory check-in wasn’t logged. This is ' + newStreak + ' of 7 consecutive misses — the account locks at 7, pending appeal. Log today’s to reset the streak.',
            'high');
        }
      }
    }
  }
  return { sent };
}

// One-time "new version" email — fires once per release, not on a recurring cadence.
async function sweepVersionUpdate(admin: any, userId: string, prefs: Record<string, any>) {
  if (!(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0 };
  if ((prefs.lastSeenVersion || '') === LATEST_VERSION) return { sent: 0 };
  const sent = await emailOnly(admin, userId, prefs, 'system', 'version',
    'vupdate:' + userId + ':' + LATEST_VERSION,
    'Nervexus ' + LATEST_VERSION + ' is out',
    'A new version is live. Open the app and check What’s New in Settings for details.',
    'low');
  return { sent };
}

// General wellness check — mirrors the in-app coaching "haven't seen you in a while"
// nudge, but reaches you even if you never open the tab to see the in-app version.
async function sweepWellnessCheckin(admin: any, userId: string, prefs: Record<string, any>) {
  if (!(prefs.reminderEmailEnabled && prefs.reminderEmailAddr)) return { sent: 0 };
  const { data: profile } = await admin.from('profiles').select('last_login_date').eq('id', userId).maybeSingle();
  if (!profile || !profile.last_login_date) return { sent: 0 };
  const daysSince = Math.floor((Date.now() - new Date(profile.last_login_date + 'T00:00:00Z').getTime()) / 86400000);
  if (daysSince < 3) return { sent: 0 };
  const todayStr = new Date().toISOString().slice(0, 10);
  const sent = await emailOnly(admin, userId, prefs, 'system', 'checkin',
    'checkin:' + userId + ':' + todayStr,
    'Haven’t seen you in a few days',
    'It’s been ' + daysSince + ' days since you last opened Nervexus. Just checking in — everything OK?',
    'normal');
  return { sent };
}

async function sweepUser(admin: any, userId: string, prefs: Record<string, any>) {
  const checklistResult = await sweepChecklists(admin, userId, prefs);
  const missionResult = await sweepMissions(admin, userId, prefs);
  const calendarResult = await sweepCalendarEvents(admin, userId, prefs);
  const perfResult = await sweepPerformanceTerminal(admin, userId, prefs);
  const versionResult = await sweepVersionUpdate(admin, userId, prefs);
  const checkinResult = await sweepWellnessCheckin(admin, userId, prefs);
  return {
    sent: (checklistResult.sent || 0) + (missionResult.sent || 0) + (calendarResult.sent || 0) + (perfResult.sent || 0) + (versionResult.sent || 0) + (checkinResult.sent || 0),
    checklists: checklistResult.sent || 0, missions: missionResult.sent || 0, calendar: calendarResult.sent || 0,
    performance: perfResult.sent || 0, version: versionResult.sent || 0, checkin: checkinResult.sent || 0,
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
      const { data: profiles } = await admin.from('profiles').select('id,prefs');
      const results: Record<string, any> = {};
      for (const p of profiles || []) results[p.id] = await sweepUser(admin, p.id, p.prefs || {});
      return json({ ok: true, users: Object.keys(results).length, results });
    }

    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'Not authenticated' }, 401);
    const { data: profile } = await admin.from('profiles').select('prefs').eq('id', userData.user.id).maybeSingle();
    const result = await sweepUser(admin, userData.user.id, profile?.prefs || {});
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
