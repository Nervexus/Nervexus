// Shared reminder-email sender — mirrors ai-provider-proxy's inline sendReminderEmail
// action (Resend default, Mailgun optional) so reminder-tick's cron sweep can send
// emails without an internal HTTP round trip to that function.
export async function sendReminderEmail(to: string, subject: string, text: string, emailProvider?: string) {
  if (!to) return { ok: false, error: 'No destination email' };
  if ((emailProvider || 'resend') === 'mailgun') {
    const MG_KEY = Deno.env.get('MAILGUN_API_KEY');
    const MG_DOMAIN = Deno.env.get('MAILGUN_DOMAIN');
    if (!MG_KEY || !MG_DOMAIN) return { ok: false, error: 'MAILGUN_API_KEY / MAILGUN_DOMAIN not set' };
    const form = new URLSearchParams();
    form.set('from', `Nervexus <postmaster@${MG_DOMAIN}>`);
    form.set('to', to); form.set('subject', subject || 'Nervexus reminder'); form.set('text', text || '');
    const r = await fetch(`https://api.mailgun.net/v3/${MG_DOMAIN}/messages`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`api:${MG_KEY}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!r.ok) return { ok: false, error: 'Mailgun rejected (' + r.status + ')' };
    return { ok: true };
  }
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Nervexus <onboarding@resend.dev>', to: [to], subject: subject || 'Nervexus reminder', text: text || '' }),
  });
  if (!r.ok) return { ok: false, error: 'Resend rejected (' + r.status + ')' };
  return { ok: true };
}
