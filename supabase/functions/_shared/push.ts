// Shared Web Push sender — uses the SAME VAPID key pair already live in
// ai-provider-proxy/index.ts (do not change unless you rotate both together
// and update index.html's enablePushNotifications() to match).
import webpush from 'https://esm.sh/web-push@3.6.7?target=deno';

const VAPID_PUBLIC_KEY = 'BINQN4HH0nF9Y2ZNpSFd2T8wiGW0G6wsQmXhvgSPBuCUgYmbVQZdyb7imkZviaAhwWpyX4-R8SE2xx2Ir5HE6w4';
const VAPID_PRIVATE_KEY = 'U3FqluOvOWQ3WgqhDgbdIE97Qhp7gl_5qTiit7rKg04';
webpush.setVapidDetails('mailto:support@nervexus.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function sendPushToUser(admin: any, userId: string, payload: Record<string, unknown>) {
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs || !subs.length) return { ok: false, sent: 0, error: 'No push subscriptions for this user' };
  const body = JSON.stringify(payload);
  const results = await Promise.all(subs.map(async (s: any) => {
    const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } };
    try { await webpush.sendNotification(sub, body); return { ok: true }; }
    catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', s.id);
      return { ok: false, error: String(e.body || e.message || e) };
    }
  }));
  return { ok: true, sent: results.filter((r) => r.ok).length, total: results.length };
}

// Cron sweep helper — every subscription for every user in one pass, grouped so
// reminder-tick doesn't need a per-user round trip just to fetch subscriptions.
export async function sendPushToUsers(admin: any, userIds: string[], payloadFor: (userId: string) => Record<string, unknown>) {
  const out: Record<string, any> = {};
  for (const uid of userIds) out[uid] = await sendPushToUser(admin, uid, payloadFor(uid));
  return out;
}
