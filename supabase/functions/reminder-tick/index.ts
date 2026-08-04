// reminder-tick — the Reminder Engine's out-of-app heartbeat.
// Cron-authenticated (X-Cron-Secret) sweeps every user; a normal user JWT runs
// it for just that one user (used by the in-app Testing Panel's "Run Now").
// Mirrors notification-engine.js's ReminderEngine.tick() server-side so
// checklist reminders still fire when nobody has the app open.
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

const FREQUENCY_MINUTES: Record<string, number> = { '15min': 15, '30min': 30, hourly: 60, '2hour': 120, '4hour': 240, daily: 1440 };

function pickChecklistText(title: string, open: number) {
  if (open === 1) return `Only one task left on ${title} today.`;
  return `You still have ${open} items remaining on ${title}.`;
}

async function sweepUser(admin: any, userId: string, prefs: Record<string, any>) {
  if (prefs.notifsEnabled === false) return { skipped: 'notifications disabled' };
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
    if (prefs.reminderEmailEnabled && prefs.reminderEmailAddr) await sendReminderEmail(prefs.reminderEmailAddr, c.title, body, prefs.emailProvider);

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
