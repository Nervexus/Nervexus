// Shared reminder-email sender — mirrors ai-provider-proxy's inline sendReminderEmail
// action (Resend default, Mailgun optional) so reminder-tick's cron sweep can send
// emails without an internal HTTP round trip to that function.
//
// Two things this used to get wrong, both of which made a broken mailbox look like a
// quiet one:
//   * "Resend rejected (403)" is not a diagnosis. The provider says WHY in the response
//     body — an unverified sender, a sandbox address that may only mail its own owner, a
//     dead key — and that sentence is the whole answer. It is now read and returned.
//   * Nothing upstream ever checked the returned {ok:false}. That is fixed at the call
//     sites; this file's job is to make sure the reason is worth reading when they do.
export type SendResult = { ok: boolean; error?: string; id?: string };

// Resend's onboarding@resend.dev is a SANDBOX sender: it is allowed to deliver only to the
// address that owns the Resend account, so every other recipient is silently useless.
// RESEND_FROM should be set to a from-address on a domain verified in Resend as soon as
// there is one; until then this default keeps today's behaviour rather than changing it
// under anyone's feet.
const DEFAULT_FROM = 'Nervexus <onboarding@resend.dev>';

async function reason(r: Response, provider: string): Promise<string> {
  let detail = '';
  try {
    const body = await r.text();
    if (body) {
      try {
        const j = JSON.parse(body);
        detail = j?.message || j?.error?.message || j?.error || j?.name || body;
      } catch { detail = body; }
    }
  } catch { /* body already consumed or unreadable — the status still says something */ }
  return provider + ' rejected (' + r.status + ')' + (detail ? ': ' + String(detail).slice(0, 300) : '');
}

export async function sendReminderEmail(
  to: string,
  subject: string,
  text: string,
  emailProvider?: string,
  html?: string,
): Promise<SendResult> {
  if (!to) return { ok: false, error: 'No destination email' };
  if ((emailProvider || 'resend') === 'mailgun') {
    const MG_KEY = Deno.env.get('MAILGUN_API_KEY');
    const MG_DOMAIN = Deno.env.get('MAILGUN_DOMAIN');
    if (!MG_KEY || !MG_DOMAIN) return { ok: false, error: 'MAILGUN_API_KEY / MAILGUN_DOMAIN not set' };
    const form = new URLSearchParams();
    form.set('from', Deno.env.get('MAILGUN_FROM') || `Nervexus <postmaster@${MG_DOMAIN}>`);
    form.set('to', to); form.set('subject', subject || 'Nervexus reminder'); form.set('text', text || '');
    if (html) form.set('html', html);
    const r = await fetch(`https://api.mailgun.net/v3/${MG_DOMAIN}/messages`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`api:${MG_KEY}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!r.ok) return { ok: false, error: await reason(r, 'Mailgun') };
    return { ok: true };
  }
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  const payload: Record<string, unknown> = {
    from: Deno.env.get('RESEND_FROM') || DEFAULT_FROM,
    to: [to],
    subject: subject || 'Nervexus reminder',
    text: text || '',
  };
  if (html) payload.html = html;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) return { ok: false, error: await reason(r, 'Resend') };
  let id: string | undefined;
  try { id = (await r.json())?.id; } catch { /* delivered but no body — still a success */ }
  return { ok: true, id };
}
