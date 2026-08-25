// Supabase Edge Function — per-user AI-provider API keys, held server-side only.
// Deploy:  supabase functions deploy ai-provider-proxy
// Optional shared fallback secrets (used only if a user hasn't saved their own key):
//   supabase secrets set OPENAI_API_KEY=sk-...  ANTHROPIC_API_KEY=sk-ant-...
// The browser NEVER receives a saved key back — only a masked preview it already
// computed itself, or (for 'call') the completion result. Raw keys are stored in
// public.provider_settings, a table with RLS enabled and ZERO client-facing
// policies — only this function's service-role connection can read/write it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7?target=deno';

const VAPID_PUBLIC_KEY = 'BINQN4HH0nF9Y2ZNpSFd2T8wiGW0G6wsQmXhvgSPBuCUgYmbVQZdyb7imkZviaAhwWpyX4-R8SE2xx2Ir5HE6w4';
const VAPID_PRIVATE_KEY = 'U3FqluOvOWQ3WgqhDgbdIE97Qhp7gl_5qTiit7rKg04';
webpush.setVapidDetails('mailto:support@nervexus.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const PROVIDER_ENV: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  xai: 'XAI_API_KEY',
  google: 'GOOGLE_API_KEY',
};

// Model selection — only the three providers exposed in the Settings -> AI Providers picker
// (anthropic, google, openai) accept a client-chosen model; everything else stays on its
// fixed model since the UI never offers a choice for those. Requests are validated against
// this allow-list rather than trusted verbatim, so a client can't smuggle an arbitrary model id.
// google: 2.5-line retired for new API keys Aug 2026 ("no longer available to new users",
// live error from Google's own API) -- moved to the Gemini 3 stable Flash tier.
const DEFAULT_MODEL: Record<string, string> = {
  anthropic: 'claude-sonnet-5',
  google: 'gemini-3.6-flash',
  openai: 'gpt-5.6-luna',
};
const ALLOWED_MODELS: Record<string, string[]> = {
  anthropic: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001'],
  google: ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'],
  openai: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'],
};
function resolveModel(provider: string, requested?: string): string {
  const fallback = DEFAULT_MODEL[provider];
  if (!fallback) return requested || '';
  if (requested && (ALLOWED_MODELS[provider] || []).includes(requested)) return requested;
  return fallback;
}

// Real usage logging, replacing what used to be a client-side seeded-random "USAGE · LAST 24H"
// panel that fabricated request/token/cost numbers regardless of actual use. Best-effort: a
// logging failure never fails the underlying AI call, and unreported tokens are logged as 0
// rather than guessed — an honest 0 beats a plausible-looking fake number.
async function logUsage(admin: any, uid: string, provider: string, model: string | undefined, inputTokens: number, outputTokens: number) {
  try {
    await admin.from('ai_usage_log').insert({ user_id: uid, provider, model: model || null, input_tokens: inputTokens || 0, output_tokens: outputTokens || 0 });
  } catch (_e) { /* best-effort only */ }
}

// Fallback key pool — lets a user save more than one key per provider (e.g. three separate
// Gemini keys to spread across Google's per-key free-tier limits). The primary key in
// provider_settings is always tried first; pool keys follow in saved order; any key currently
// cooling down from a recent rate-limit gets skipped automatically. All server-side and
// transparent to the client — a 'call' either succeeds on some key or exhausts the whole pool.
type KeyEntry = { key: string; poolId: string | null };
async function resolveApiKeys(admin: any, uid: string, provider: string): Promise<KeyEntry[]> {
  const keys: KeyEntry[] = [];
  const { data: row } = await admin.from('provider_settings').select('api_key_encrypted').eq('user_id', uid).eq('provider', provider).maybeSingle();
  if (row?.api_key_encrypted) keys.push({ key: row.api_key_encrypted, poolId: null });
  const { data: pool } = await admin.from('provider_key_pool').select('id,api_key_encrypted,cooldown_until')
    .eq('user_id', uid).eq('provider', provider).order('position', { ascending: true });
  const now = Date.now();
  (pool || []).forEach((p: any) => {
    if (p.cooldown_until && new Date(p.cooldown_until).getTime() > now) return; // still cooling down, skip
    keys.push({ key: p.api_key_encrypted, poolId: p.id });
  });
  if (!keys.length && PROVIDER_ENV[provider]) {
    const envKey = Deno.env.get(PROVIDER_ENV[provider]);
    if (envKey) keys.push({ key: envKey, poolId: null });
  }
  return keys;
}
// Only pool keys get cooled down (skipped for a while) on a 429 — there's nothing further to
// fall back to for the single primary key, so leave it eligible for the next request instead
// of locking the user out entirely if the cooldown estimate is wrong.
async function markCooldown(admin: any, poolId: string | null, seconds: number) {
  if (!poolId) return;
  try { await admin.from('provider_key_pool').update({ cooldown_until: new Date(Date.now() + seconds * 1000).toISOString() }).eq('id', poolId); } catch (_e) { /* best-effort */ }
}
function retryAfterSeconds(r: Response): number {
  const h = r.headers.get('retry-after');
  const n = h ? parseInt(h, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 300) : 60;
}

// Reachability check only — never spends real tokens. Shared by the 'test' action (testing
// the primary key) and 'poolAdd' (testing a new fallback key before it's saved), so both
// paths catch a bad paste the same way instead of silently saving something unusable.
async function testProviderKey(provider: string, apiKey: string): Promise<{ error?: string }> {
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
    return r.ok ? {} : { error: 'Key rejected by OpenAI (' + r.status + ')' };
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } });
    return r.ok ? {} : { error: 'Key rejected by Anthropic (' + r.status + ')' };
  }
  if (provider === 'google') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    return r.ok ? {} : { error: 'Key rejected by Google (' + r.status + ')' };
  }
  if (provider === 'elevenlabs') {
    const r = await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': apiKey } });
    return r.ok ? {} : { error: 'Key rejected by ElevenLabs (' + r.status + ')' };
  }
  if (provider === 'newsdataio') {
    const r = await fetch(`https://newsdata.io/api/1/news?apikey=${apiKey}&q=test`);
    return r.ok ? {} : { error: 'Key rejected by NewsData.io (' + r.status + ')' };
  }
  if (provider === 'guardianapi') {
    const r = await fetch(`https://content.guardianapis.com/search?api-key=${apiKey}`);
    return r.ok ? {} : { error: 'Key rejected by The Guardian (' + r.status + ')' };
  }
  if (provider === 'currentsapi') {
    const r = await fetch(`https://api.currentsapi.services/v1/latest-news?apiKey=${apiKey}`);
    return r.ok ? {} : { error: 'Key rejected by Currents API (' + r.status + ')' };
  }
  if (provider === 'gnews') {
    const r = await fetch(`https://gnews.io/api/v4/top-headlines?token=${apiKey}`);
    return r.ok ? {} : { error: 'Key rejected by GNews (' + r.status + ')' };
  }
  if (provider === 'alphavantage') {
    const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`);
    const j = await r.json().catch(() => ({}));
    return (!r.ok || j.Note || j['Error Message']) ? { error: 'Key rejected by Alpha Vantage' } : {};
  }
  if (provider === 'finnhub') {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`);
    return r.ok ? {} : { error: 'Key rejected by Finnhub (' + r.status + ')' };
  }
  return {};
}

// Every response — success, error, and the OPTIONS preflight — must carry these or the
// browser's fetch() rejects the whole call before JS ever sees a status code or body
// (this was previously missing entirely, silently breaking every action from the client).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function mask(v: string) {
  const s = (v || '').trim();
  const dash = s.indexOf('-');
  const head = s.slice(0, dash >= 0 && dash < 8 ? dash + 1 : 3);
  return head + '\u2022\u2022\u2022\u2022\u2022\u2022' + s.slice(-4);
}

const RSS_FEEDS: Record<string, string> = {
  theverge: 'https://www.theverge.com/rss/index.xml',
  techcrunch: 'https://techcrunch.com/feed/',
  arstechnica: 'https://feeds.arstechnica.com/arstechnica/index',
  wired: 'https://www.wired.com/feed/rss',
};

// Multi-feed bundles powering the Command Center's two news cards. Each is a blend of real
// publisher RSS feeds (free, no key, no rate limit — unlike GDELT, which caps at one request
// per 5s per IP and would be throttled behind this function's shared egress address).
// Results are interleaved so every publisher is represented, then sorted newest-first.
const FEED_BUNDLES: Record<string, { name: string; url: string }[]> = {
  moneynews: [
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'Guardian Business', url: 'https://www.theguardian.com/uk/business/rss' },
    { name: 'Sky News Business', url: 'https://feeds.skynews.com/feeds/rss/business.xml' },
  ],
  lawnews: [
    { name: 'Guardian Law', url: 'https://www.theguardian.com/law/rss' },
    { name: 'JURIST', url: 'https://www.jurist.org/news/feed/' },
    { name: 'Courthouse News', url: 'https://www.courthousenews.com/feed/' },
  ],
  worldnews: [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Guardian World', url: 'https://www.theguardian.com/world/rss' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
    { name: 'France 24', url: 'https://www.france24.com/en/rss' },
  ],
};

// Publisher feeds routinely double-escape punctuation (&#8217;, &amp;, &quot;), which showed
// up raw in headlines. Decode the numeric forms plus the handful of named ones that matter.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  ndash: '–', mdash: '—', hellip: '…', pound: '£', euro: '€',
};
function decodeEntities(s: string) {
  return (s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _m; } })
    .replace(/&#(\d+);/g, (_m, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _m; } })
    .replace(/&([a-z]+);/gi, (_m, n) => NAMED_ENTITIES[String(n).toLowerCase()] ?? _m);
}
function stripTags(s: string) {
  return decodeEntities((s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')).trim();
}

// Handles RSS 2.0 (<item>) and Atom (<entry>) — The Verge's feed is Atom, so the old
// item-only parser silently returned nothing for it. Also captures the publish date so
// bundled feeds can be merged in true recency order rather than per-feed order.
async function parseRss(url: string) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; NervexusBot/1.0)' } });
  const xml = await r.text();
  const items: { title: string; link: string; ts: number }[] = [];
  const dateOf = (s: string) => { const t = Date.parse(s || ''); return isNaN(t) ? 0 : t; };
  const reItem = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = reItem.exec(xml)) && items.length < 12) {
    const block = m[1];
    const title = stripTags((block.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/) || [])[1] || '');
    const link = stripTags((block.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/) || [])[1] || '');
    const date = stripTags((block.match(/<(?:pubDate|dc:date|published|updated)(?:\s[^>]*)?>([\s\S]*?)<\/(?:pubDate|dc:date|published|updated)>/) || [])[1] || '');
    if (title) items.push({ title, link, ts: dateOf(date) });
  }
  if (!items.length) {
    const reEntry = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g;
    while ((m = reEntry.exec(xml)) && items.length < 12) {
      const block = m[1];
      const title = stripTags((block.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/) || [])[1] || '');
      const link = (block.match(/<link[^>]*href=["']([^"']+)["']/) || [])[1] || '';
      const date = stripTags((block.match(/<(?:published|updated)(?:\s[^>]*)?>([\s\S]*?)<\/(?:published|updated)>/) || [])[1] || '');
      if (title) items.push({ title, link, ts: dateOf(date) });
    }
  }
  return items;
}

// Pulls every feed in a bundle in parallel, tolerating individual feed failures, then
// interleaves one story per publisher per round so a single prolific feed cannot crowd
// the others out, and finally sorts the result newest-first.
async function fetchFeedBundle(bundle: { name: string; url: string }[], limit = 12) {
  const per = await Promise.all(bundle.map(async (f) => {
    try {
      const items = await parseRss(f.url);
      return items.slice(0, Math.max(6, Math.ceil(limit / bundle.length))).map((i) => ({ title: i.title, source: f.name, url: i.link, ts: i.ts }));
    } catch { return []; }
  }));
  const merged: { title: string; source: string; url: string; ts: number }[] = [];
  const depth = Math.max(0, ...per.map((p) => p.length));
  for (let i = 0; i < depth; i++) for (const p of per) if (p[i]) merged.push(p[i]);
  const seen = new Set<string>();
  const unique = merged.filter((h) => { const k = h.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  unique.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return { headlines: unique.slice(0, limit) };
}

// Returns { headlines: [{title, source, url}] } or { data: string } for market/price sources.
// Returns null for sources with no public API (premium/licensed — enterprise only).
async function fetchNewsSource(provider: string, key: string | undefined, q: string) {
  if (FEED_BUNDLES[provider]) return await fetchFeedBundle(FEED_BUNDLES[provider], provider === 'worldnews' ? 120 : 12);
  if (RSS_FEEDS[provider]) {
    const items = await parseRss(RSS_FEEDS[provider]);
    return { headlines: items.slice(0, 8).map((i) => ({ title: i.title, source: provider, url: i.link, ts: i.ts })) };
  }
  switch (provider) {
    case 'hackernews': {
      const ids = await (await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')).json();
      const top = await Promise.all(ids.slice(0, 8).map((id: number) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())));
      return { headlines: top.map((t: any) => ({ title: t?.title, source: 'Hacker News', url: t?.url })) };
    }
    case 'coingecko': {
      const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1');
      const j = await r.json();
      return { data: (j || []).map((c: any) => `${c.name} (${c.symbol.toUpperCase()}): $${c.current_price} (${c.price_change_percentage_24h?.toFixed(2)}% 24h)`).join('\n') };
    }
    case 'gdelt': {
      const r = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q || 'top news')}&mode=artlist&maxrecords=8&format=json`);
      const j = await r.json();
      return { headlines: (j.articles || []).map((a: any) => ({ title: a.title, source: a.domain, url: a.url })) };
    }
    case 'guardianapi': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch(`https://content.guardianapis.com/search?q=${encodeURIComponent(q || 'news')}&api-key=${key}&page-size=8`);
      const j = await r.json();
      return { headlines: (j.response?.results || []).map((a: any) => ({ title: a.webTitle, source: 'The Guardian', url: a.webUrl })) };
    }
    case 'newsdataio': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch(`https://newsdata.io/api/1/news?apikey=${key}&q=${encodeURIComponent(q || 'news')}`);
      const j = await r.json();
      return { headlines: (j.results || []).slice(0, 8).map((a: any) => ({ title: a.title, source: a.source_id, url: a.link })) };
    }
    case 'currentsapi': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch(`https://api.currentsapi.services/v1/search?apiKey=${key}&keywords=${encodeURIComponent(q || 'news')}`);
      const j = await r.json();
      return { headlines: (j.news || []).slice(0, 8).map((a: any) => ({ title: a.title, source: a.author, url: a.url })) };
    }
    case 'gnews': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q || 'news')}&token=${key}`);
      const j = await r.json();
      return { headlines: (j.articles || []).slice(0, 8).map((a: any) => ({ title: a.title, source: a.source?.name, url: a.url })) };
    }
    case 'mediastack': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch(`http://api.mediastack.com/v1/news?access_key=${key}&keywords=${encodeURIComponent(q || 'news')}`);
      const j = await r.json();
      return { headlines: (j.data || []).slice(0, 8).map((a: any) => ({ title: a.title, source: a.source, url: a.url })) };
    }
    case 'newsapiorg': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q || 'news')}&apiKey=${key}`);
      const j = await r.json();
      return { headlines: (j.articles || []).slice(0, 8).map((a: any) => ({ title: a.title, source: a.source?.name, url: a.url })) };
    }
    case 'alphavantage': {
      if (!key) return { error: 'No API key saved' };
      const sym = (q || 'AAPL').toUpperCase().split(/\s+/)[0];
      const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${key}`);
      const j = await r.json();
      const quote = j['Global Quote'];
      return { data: quote ? `${sym}: $${quote['05. price']} (${quote['10. change percent']})` : 'No data returned' };
    }
    case 'finnhub': {
      if (!key) return { error: 'No API key saved' };
      const sym = (q || 'AAPL').toUpperCase().split(/\s+/)[0];
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${key}`);
      const j = await r.json();
      return { data: `${sym}: $${j.c} (${j.dp}% today)` };
    }
    case 'twelvedata': {
      if (!key) return { error: 'No API key saved' };
      const sym = (q || 'AAPL').toUpperCase().split(/\s+/)[0];
      const r = await fetch(`https://api.twelvedata.com/price?symbol=${sym}&apikey=${key}`);
      const j = await r.json();
      return { data: `${sym}: $${j.price}` };
    }
    case 'polygon': {
      if (!key) return { error: 'No API key saved' };
      const sym = (q || 'AAPL').toUpperCase().split(/\s+/)[0];
      const r = await fetch(`https://api.polygon.io/v2/aggs/ticker/${sym}/prev?apiKey=${key}`);
      const j = await r.json();
      const c = j.results?.[0];
      return { data: c ? `${sym}: close $${c.c}, open $${c.o}` : 'No data returned' };
    }
    case 'coinmarketcap': {
      if (!key) return { error: 'No API key saved' };
      const r = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=10', { headers: { 'X-CMC_PRO_API_KEY': key } });
      const j = await r.json();
      return { data: (j.data || []).map((c: any) => `${c.name} (${c.symbol}): $${c.quote.USD.price.toFixed(2)}`).join('\n') };
    }
    case 'cryptocompare': {
      const r = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,SOL&tsyms=USD${key ? '&api_key=' + key : ''}`);
      const j = await r.json();
      return { data: Object.entries(j || {}).map(([k, v]: any) => `${k}: $${v.USD}`).join('\n') };
    }
    default:
      return null;
  }
}

function sseFrame(obj: unknown): string { return 'data: ' + JSON.stringify(obj) + '\n\n'; }

// Real SSE token streaming for 'call' — one ReadableStream per request, proxying the
// provider's own stream and normalizing each provider's delta shape into {delta:string}.
// Ends with {done:true, citations?} or {error:string}. Added so the voice assistant can
// start speaking a finished sentence before the full reply finishes generating.
// keys: ordered candidates from resolveApiKeys() — primary key first, then pool keys. A 429
// from one key marks it cooling down and moves on to the next before giving up; any other
// error status returns immediately rather than burning through the whole pool pointlessly.
function streamCall(provider: string, keys: KeyEntry[], prompt: string, model: string | undefined, admin: any, uid: string): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => { try { controller.enqueue(enc.encode(sseFrame(obj))); } catch { /* client closed */ } };
      let usageIn = 0, usageOut = 0;
      try {
        if (!keys.length) { send({ error: 'Provider not configured yet' }); controller.close(); return; }

        function buildRequest(apiKey: string) {
          let url = '', headers: Record<string, string> = {}, reqBody: unknown;
          let extractDelta: (obj: any) => string = () => '';
          let extractUsage: (obj: any) => void = () => {};
          let citations: string[] | undefined;

          if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
            reqBody = { model: resolveModel('openai', model), stream: true, messages: [{ role: 'user', content: prompt }] };
            extractDelta = (obj) => obj.choices?.[0]?.delta?.content || '';
          } else if (provider === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
            reqBody = { model: resolveModel('anthropic', model), max_tokens: 1024, stream: true, messages: [{ role: 'user', content: prompt }] };
            extractDelta = (obj) => (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta') ? (obj.delta.text || '') : '';
            extractUsage = (obj) => {
              if (obj.type === 'message_start' && obj.message?.usage) usageIn = obj.message.usage.input_tokens || usageIn;
              if (obj.type === 'message_delta' && obj.usage) usageOut = obj.usage.output_tokens || usageOut;
            };
          } else if (provider === 'perplexity') {
            url = 'https://api.perplexity.ai/chat/completions';
            headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
            reqBody = { model: 'sonar-pro', stream: true, messages: [
              { role: 'system', content: 'Answer concisely and factually using current, real information. Cite sources briefly by name.' },
              { role: 'user', content: prompt },
            ] };
            extractDelta = (obj) => { if (obj.citations) citations = obj.citations; return obj.choices?.[0]?.delta?.content || ''; };
          } else if (provider === 'xai') {
            url = 'https://api.x.ai/v1/chat/completions';
            headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
            reqBody = { model: 'grok-4', stream: true, messages: [{ role: 'user', content: prompt }], search_parameters: { mode: 'auto' } };
            extractDelta = (obj) => obj.choices?.[0]?.delta?.content || '';
          } else if (provider === 'google') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${resolveModel('google', model)}:streamGenerateContent?alt=sse&key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            reqBody = { contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] };
            extractDelta = (obj) => {
              const cand = obj.candidates?.[0];
              const chunks = cand?.groundingMetadata?.groundingChunks;
              if (chunks) citations = chunks.map((c: any) => c.web?.title || c.web?.uri).filter(Boolean);
              return (cand?.content?.parts || []).map((p: any) => p.text || '').join('');
            };
            extractUsage = (obj) => {
              if (obj.usageMetadata) { usageIn = obj.usageMetadata.promptTokenCount || usageIn; usageOut = obj.usageMetadata.candidatesTokenCount || usageOut; }
            };
          }
          return { url, headers, reqBody, extractDelta, extractUsage, getCitations: () => citations };
        }

        let upstream: Response | null = null;
        let req: ReturnType<typeof buildRequest> | null = null;
        let lastErrText = '';
        for (let i = 0; i < keys.length; i++) {
          req = buildRequest(keys[i].key);
          const r = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.reqBody) });
          if (r.status === 429) {
            await markCooldown(admin, keys[i].poolId, retryAfterSeconds(r));
            lastErrText = 'Rate limited (429)';
            continue; // try the next key in the pool
          }
          upstream = r;
          break;
        }
        if (!upstream || !req) { send({ error: lastErrText || 'All keys for this provider are rate-limited right now — try again shortly.' }); controller.close(); return; }
        if (!upstream.ok || !upstream.body) {
          const errData = await upstream.json().catch(() => ({}));
          send({ error: (errData.error?.message || errData.error || errData.message || ('HTTP ' + upstream.status)) });
          controller.close();
          return;
        }
        const { extractDelta, extractUsage, getCitations } = req;
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf('\n\n')) >= 0) {
            const raw = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const line = (raw.split('\n').find((l) => l.startsWith('data:')) || '').replace(/^data:\s*/, '').trim();
            if (!line || line === '[DONE]') continue;
            let obj: any;
            try { obj = JSON.parse(line); } catch { continue; }
            const delta = extractDelta(obj);
            if (delta) send({ delta });
            extractUsage(obj);
          }
        }
        send({ done: true, citations: getCitations() });
      } catch (e) {
        send({ error: (e as Error)?.message || 'Stream failed' });
      } finally {
        if (usageIn || usageOut) await logUsage(admin, uid, provider, model, usageIn, usageOut);
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return json({ error: 'Not authenticated' }, 401);
    }
    const uid = userData.user.id;

    const body = await req.json();
    const action = body.action || 'call';
    const provider = body.provider;

    if (action === 'sendReminderEmail') {
      const provider2 = body.emailProvider || 'resend';
      const to = (body.to || '').trim();
      if (!to) return json({ ok: false, error: 'No destination email' });
      const subject = body.subject || 'Nervexus reminder';
      const text = body.body || '';
      if (provider2 === 'mailgun') {
        const MG_KEY = Deno.env.get('MAILGUN_API_KEY');
        const MG_DOMAIN = Deno.env.get('MAILGUN_DOMAIN'); // e.g. sandboxXXXX.mailgun.org
        if (!MG_KEY || !MG_DOMAIN) return json({ ok: false, error: 'MAILGUN_API_KEY / MAILGUN_DOMAIN not set on the Edge Function' });
        try {
          const form = new URLSearchParams();
          form.set('from', `Nervexus <postmaster@${MG_DOMAIN}>`);
          form.set('to', to);
          form.set('subject', subject);
          form.set('text', text);
          const r = await fetch(`https://api.mailgun.net/v3/${MG_DOMAIN}/messages`, {
            method: 'POST',
            headers: { Authorization: 'Basic ' + btoa(`api:${MG_KEY}`), 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          });
          if (!r.ok) { const t = await r.text(); return json({ ok: false, error: 'Mailgun rejected (' + r.status + '): ' + t.slice(0, 200) }); }
          return json({ ok: true });
        } catch (e) {
          return json({ ok: false, error: String(e) });
        }
      }
      // default: resend
      const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_KEY) return json({ ok: false, error: 'RESEND_API_KEY not set on the Edge Function' });
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Nervexus <onboarding@resend.dev>',
            to: [to],
            subject,
            text,
          }),
        });
        if (!r.ok) return json({ ok: false, error: 'Resend rejected (' + r.status + ')' });
        return json({ ok: true });
      } catch (e) {
        return json({ ok: false, error: String(e) });
      }
    }

    if (action === 'sendPush') {
      const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', uid);
      if (!subs || !subs.length) return json({ ok: false, error: 'No push subscriptions for this user' });
      const payload = JSON.stringify({ title: body.title || 'Nervexus', body: body.body || '', url: body.url || './index.html' });
      const results = await Promise.all(subs.map(async (s: any) => {
        const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } };
        try { await webpush.sendNotification(sub, payload); return { ok: true }; }
        catch (e: any) {
          if (e.statusCode === 404 || e.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', s.id);
          return { ok: false, error: String(e.body || e.message || e) };
        }
      }));
      return json({ ok: true, sent: results.filter((r) => r.ok).length, total: results.length, errors: results.filter((r) => !r.ok).map((r: any) => r.error) });
    }

    if (action === 'status') {
      const { data } = await admin.from('provider_settings').select('provider,api_key_encrypted,enabled').eq('user_id', uid);
      const out: Record<string, any> = {};
      (data || []).forEach((r: any) => { out[r.provider] = { saved: true, masked: mask(r.api_key_encrypted), enabled: r.enabled !== false }; });
      const { data: poolRows } = await admin.from('provider_key_pool').select('id,provider,api_key_encrypted,label,cooldown_until').eq('user_id', uid).order('position', { ascending: true });
      const pools: Record<string, any[]> = {};
      (poolRows || []).forEach((r: any) => {
        (pools[r.provider] = pools[r.provider] || []).push({ id: r.id, masked: mask(r.api_key_encrypted), label: r.label || '', cooling: !!(r.cooldown_until && new Date(r.cooldown_until).getTime() > Date.now()) });
      });
      return json({ providers: out, pools });
    }

    if (!provider) return json({ error: 'Missing provider' }, 400);

    if (action === 'save') {
      const apiKey = (body.apiKey || '').trim();
      if (!apiKey) return json({ error: 'Missing apiKey' }, 400);
      const { error } = await admin.from('provider_settings').upsert(
        { user_id: uid, provider, api_key_encrypted: apiKey, enabled: true },
        { onConflict: 'user_id,provider' }
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, masked: mask(apiKey) });
    }

    if (action === 'remove') {
      const { error } = await admin.from('provider_settings').delete().eq('user_id', uid).eq('provider', provider);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // Fallback key pool — extra keys for a provider beyond the primary one, e.g. two more
    // Gemini keys. poolAdd both saves and reachability-tests the key in one step, same as the
    // primary "paste key -> Connect" flow, so a bad paste is caught immediately rather than
    // silently sitting unused in the pool.
    if (action === 'poolAdd') {
      const apiKey = (body.apiKey || '').trim();
      if (!apiKey) return json({ error: 'Missing apiKey' }, 400);
      const testResult = await testProviderKey(provider, apiKey);
      if (testResult.error) return json({ error: testResult.error }, 400);
      const { count } = await admin.from('provider_key_pool').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('provider', provider);
      const { error } = await admin.from('provider_key_pool').insert({ user_id: uid, provider, api_key_encrypted: apiKey, label: (body.label || '').trim() || null, position: count || 0 });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, masked: mask(apiKey) });
    }

    if (action === 'poolRemove') {
      const poolId = body.poolId;
      if (!poolId) return json({ error: 'Missing poolId' }, 400);
      const { error } = await admin.from('provider_key_pool').delete().eq('user_id', uid).eq('id', poolId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // 'fetchNews' pulls real, structured data from a connected News/Data source — this is
    // the actual automatic data pull (headlines, prices), separate from the LLM 'call' path.
    // No-key sources (coingecko, hackernews, gdelt, RSS feeds) work even if never "saved".
    if (action === 'fetchNews') {
      const q = (body.query || '').trim();
      try {
        const { data: nrow } = await admin.from('provider_settings').select('api_key_encrypted').eq('user_id', uid).eq('provider', provider).maybeSingle();
        const key = nrow?.api_key_encrypted;
        const out = await fetchNewsSource(provider, key, q);
        if (!out) return json({ error: 'This source has no public data API — licensing/enterprise contract required.' }, 400);
        return json(out);
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // 'test' and 'call' both need the resolved key: the user's own saved key first,
    // falling back to a shared server secret if the provider supports one.
    const { data: row } = await admin.from('provider_settings').select('api_key_encrypted').eq('user_id', uid).eq('provider', provider).maybeSingle();
    const apiKey = (row && row.api_key_encrypted) || (PROVIDER_ENV[provider] ? Deno.env.get(PROVIDER_ENV[provider]) : undefined);
    if (!apiKey) return json({ error: action === 'test' ? 'No API key saved' : 'Provider not configured yet' }, action === 'test' ? 400 : 500);

    if (action === 'test') {
      const result = await testProviderKey(provider, apiKey);
      return result.error ? json({ error: result.error }, 400) : json({ ok: true });
    }

    if (action === 'ttsSpeak') {
      if (provider === 'elevenlabs') {
        const text = (body.text || '').slice(0, 2000);
        const voiceId = body.voiceId || '21m00Tcm4TlvDq8ikWAM';
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        });
        if (!r.ok) {
          const errText = await r.text();
          return json({ error: 'ElevenLabs TTS failed (' + r.status + '): ' + errText.slice(0, 200) }, 400);
        }
        const buf = await r.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        return json({ audioBase64: b64, mime: 'audio/mpeg' });
      }
      return json({ error: 'TTS not implemented for this provider' }, 400);
    }

    const prompt = body.prompt;
    const model = typeof body.model === 'string' ? body.model : undefined;
    // openai/anthropic/google are the three connectable-from-the-UI providers, so they're the
    // only ones that can have a fallback key pool — resolve the full ordered candidate list for
    // them; everything else keeps using the single apiKey already resolved above.
    const poolProviders = ['openai', 'anthropic', 'google'];
    const candidateKeys: KeyEntry[] = poolProviders.includes(provider)
      ? await resolveApiKeys(admin, uid, provider)
      : (apiKey ? [{ key: apiKey, poolId: null }] : []);

    // Streaming: proxy the provider's own SSE and re-emit a normalized shape so the
    // client (supabase-client.js callAIStream) doesn't need per-provider parsing —
    // {delta} chunks, one final {done, citations} frame, or {error}. Only for the
    // providers 'call' already supports below; falls through to the non-streamed
    // path for everything else (unchanged).
    if (body.stream && ['openai', 'anthropic', 'perplexity', 'xai', 'google'].includes(provider)) {
      return streamCall(provider, candidateKeys, prompt, model, admin, uid);
    }

    let result = '';
    if (provider === 'openai' || provider === 'anthropic' || provider === 'google') {
      if (!candidateKeys.length) return json({ error: 'Provider not configured yet' }, 500);
      const usedModel = resolveModel(provider, model);
      let lastErr = '';
      for (let i = 0; i < candidateKeys.length; i++) {
        const k = candidateKeys[i].key;
        if (provider === 'openai') {
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: usedModel, messages: [{ role: 'user', content: prompt }] }),
          });
          if (r.status === 429) { await markCooldown(admin, candidateKeys[i].poolId, retryAfterSeconds(r)); lastErr = 'Rate limited (429)'; continue; }
          const j = await r.json();
          if (!r.ok) return json({ error: j.error?.message || 'OpenAI request failed (' + r.status + ')' }, 400);
          result = j.choices?.[0]?.message?.content || '';
          if (j.usage) await logUsage(admin, uid, provider, usedModel, j.usage.prompt_tokens, j.usage.completion_tokens);
          lastErr = ''; break;
        } else if (provider === 'anthropic') {
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: usedModel, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
          });
          if (r.status === 429) { await markCooldown(admin, candidateKeys[i].poolId, retryAfterSeconds(r)); lastErr = 'Rate limited (429)'; continue; }
          const j = await r.json();
          if (!r.ok) return json({ error: j.error?.message || 'Anthropic request failed (' + r.status + ')' }, 400);
          result = j.content?.[0]?.text || '';
          if (j.usage) await logUsage(admin, uid, provider, usedModel, j.usage.input_tokens, j.usage.output_tokens);
          lastErr = ''; break;
        } else {
          // google — genuinely current via "Grounding with Google Search", and free within
          // Google's daily rate limits, which is exactly why a key pool matters most here:
          // three free keys effectively triple the daily quota before anything needs paying for.
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${usedModel}:generateContent?key=${k}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
          });
          if (r.status === 429) { await markCooldown(admin, candidateKeys[i].poolId, retryAfterSeconds(r)); lastErr = 'Rate limited (429)'; continue; }
          const j = await r.json();
          if (!r.ok) return json({ error: j.error?.message || 'Gemini request failed (' + r.status + ')' }, 400);
          const cand = j.candidates?.[0];
          const text = cand?.content?.parts?.map((p: any) => p.text).join('') || '';
          const chunks = cand?.groundingMetadata?.groundingChunks || [];
          const citations = chunks.map((c: any) => c.web?.title || c.web?.uri).filter(Boolean);
          if (j.usageMetadata) await logUsage(admin, uid, provider, usedModel, j.usageMetadata.promptTokenCount, j.usageMetadata.candidatesTokenCount);
          return json({ result: text, citations });
        }
      }
      if (lastErr) return json({ error: lastErr === 'Rate limited (429)' ? 'All keys for this provider are rate-limited right now — try again shortly, or add another fallback key in Settings.' : lastErr }, 429);
    } else if (provider === 'perplexity') {
      // Perplexity's sonar models do a real live web search per request — this is the
      // only provider here that can answer "what's happening today" style questions.
      const r = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            { role: 'system', content: 'Answer concisely and factually using current, real information. Cite sources briefly by name.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const j = await r.json();
      if (!r.ok) return json({ error: j.error?.message || 'Perplexity request failed (' + r.status + ')' }, 400);
      result = j.choices?.[0]?.message?.content || '';
      const citations = j.citations || [];
      if (j.usage) await logUsage(admin, uid, provider, 'sonar-pro', j.usage.prompt_tokens, j.usage.completion_tokens);
      return json({ result, citations });
    } else if (provider === 'xai') {
      // Grok (live search enabled) — also genuinely current, OpenAI-compatible shape.
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'grok-4', messages: [{ role: 'user', content: prompt }], search_parameters: { mode: 'auto' } }),
      });
      const j = await r.json();
      if (!r.ok) return json({ error: j.error?.message || 'xAI request failed (' + r.status + ')' }, 400);
      result = j.choices?.[0]?.message?.content || '';
      if (j.usage) await logUsage(admin, uid, provider, 'grok-4', j.usage.prompt_tokens, j.usage.completion_tokens);
    } else {
      return json({ error: 'Provider not implemented yet' }, 400);
    }

    return json({ result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
