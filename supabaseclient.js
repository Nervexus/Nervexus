// Supabase client bootstrap — plain script, no build step (loaded like the app's other engines).
// Fill in your project's URL + anon public key (Project Settings -> API in Supabase), or send
// them in chat and they'll be added here for you. See supabase/README.md for full setup steps.
window.SUPABASE_CONFIG = {
  url: 'https://qftwjotvasprldcngier.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHdqb3R2YXNwcmxkY25naWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNDE0NjAsImV4cCI6MjEwMDYxNzQ2MH0.CVdvQ9Yw5yA0jFyJpHNdIn2PVruJjATNngIukjGbjwA'
};

(function initSupabase(){
  if (!window.supabase || !window.supabase.createClient) { return; }
  if (!window.SUPABASE_CONFIG.url || window.SUPABASE_CONFIG.url === 'YOUR_SUPABASE_PROJECT_URL') {
    console.warn('[supabase-client] Add your project URL + anon key to supabase-client.js to go live.');
    return;
  }
  window.sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
})();

// Thin helpers the app's logic class will call. Every function resolves to {data, error}.
window.SB = {
  ready(){ return !!window.sb; },

  async signUp(email, password, meta){ return window.sb.auth.signUp({ email, password, options:{ data: meta||{} } }); },
  async signIn(email, password){ return window.sb.auth.signInWithPassword({ email, password }); },
  async signOut(){ return window.sb.auth.signOut(); },
  async getSession(){ const { data } = await window.sb.auth.getSession(); return data.session; },
  onAuthChange(cb){ return window.sb.auth.onAuthStateChange(cb); },
  async resetPasswordForEmail(email, redirectTo){ return window.sb.auth.resetPasswordForEmail(email, redirectTo?{redirectTo}:undefined); },
  async updatePassword(newPassword){ return window.sb.auth.updateUser({ password:newPassword }); },

  async list(table, { match={}, order=null, limit=null } = {}){
    let q = window.sb.from(table).select('*');
    Object.entries(match).forEach(([k,v])=>{ q = q.eq(k, v); });
    if (order) q = q.order(order.column, { ascending: !!order.ascending });
    if (limit) q = q.limit(limit);
    return q;
  },
  async insert(table, row){ return window.sb.from(table).insert(row).select().single(); },
  async update(table, id, patch){ return window.sb.from(table).update(patch).eq('id', id).select().single(); },
  async remove(table, id){ return window.sb.from(table).delete().eq('id', id); },
  async upsert(table, row, conflict){ return window.sb.from(table).upsert(row, conflict?{onConflict:conflict}:undefined).select(); },

  subscribe(table, userId, onChange){
    return window.sb.channel('rt:'+table+':'+userId)
      .on('postgres_changes', { event:'*', schema:'public', table, filter:'user_id=eq.'+userId }, onChange)
      .subscribe();
  },

  async upload(bucket, path, file){ return window.sb.storage.from(bucket).upload(path, file, { upsert:true }); },
  publicUrl(bucket, path){ return window.sb.storage.from(bucket).getPublicUrl(path).data.publicUrl; },
  async signedUrl(bucket, path, expiresIn){ const { data } = await window.sb.storage.from(bucket).createSignedUrl(path, expiresIn||3600); return data && data.signedUrl; },
  async signedUrls(bucket, paths, expiresIn){ if(!paths || !paths.length) return {}; const { data } = await window.sb.storage.from(bucket).createSignedUrls(paths, expiresIn||3600); const out={}; (data||[]).forEach(d=>{ if(d && d.path) out[d.path]=d.signedUrl; }); return out; },
  async removeFile(bucket, path){ return window.sb.storage.from(bucket).remove([path]); },

  // Calls the ai-provider-proxy Edge Function — real secret keys stay server-side.
  // action: 'call' (default, run a completion), 'save'/'remove' (store or delete the
  // user's own provider key), 'status' (which providers have a saved key), 'test'
  // (reachability check). The raw key is only ever in this request body in transit —
  // it's never written back to the client or to localStorage.
  async _providerFn(body){
    const { data } = await window.sb.auth.getSession();
    const token = data.session && data.session.access_token;
    if (!token) return { error: 'Not signed in' };
    const res = await fetch(window.SUPABASE_CONFIG.url + '/functions/v1/ai-provider-proxy', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async callAI(provider, prompt){ return window.SB._providerFn({ action:'call', provider, prompt }); },
  // Streaming counterpart of callAI — reads the proxy's SSE body as it arrives so the
  // caller (voice assistant) can act on partial text before the full reply is done.
  // onDelta(deltaText) fires per chunk. Resolves {result, citations} or {error}, same
  // shape as callAI, once the stream ends. Falls back cleanly: any non-OK response or
  // missing streaming body resolves {error:...} so callers can retry non-streamed.
  async callAIStream(provider, prompt, onDelta){
    const { data } = await window.sb.auth.getSession();
    const token = data.session && data.session.access_token;
    if (!token) return { error: 'Not signed in' };
    let res;
    try{
      res = await fetch(window.SUPABASE_CONFIG.url + '/functions/v1/ai-provider-proxy', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action:'call', provider, prompt, stream:true })
      });
    }catch(e){ return { error: (e&&e.message)||'Request failed' }; }
    if (!res.ok || !res.body){
      const errBody = await res.json().catch(()=>({}));
      return { error: errBody.error || ('HTTP '+res.status) };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', full = '', citations;
    while (true){
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream:true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0){
        const raw = buf.slice(0, idx); buf = buf.slice(idx+2);
        const line = raw.replace(/^data:\s*/, '').trim();
        if (!line) continue;
        let obj; try{ obj = JSON.parse(line); }catch(e){ continue; }
        if (obj.error) return { error: obj.error };
        if (obj.delta){ full += obj.delta; if (onDelta) onDelta(obj.delta); }
        if (obj.done){ citations = obj.citations; }
      }
    }
    return { result: full, citations };
  },
  async saveProviderKey(provider, apiKey){ return window.SB._providerFn({ action:'save', provider, apiKey }); },
  async removeProviderKey(provider){ return window.SB._providerFn({ action:'remove', provider }); },
  async providerStatus(){ return window.SB._providerFn({ action:'status' }); },
  async testProviderKey(provider){ return window.SB._providerFn({ action:'test', provider }); },
  async fetchNewsData(provider, query){ return window.SB._providerFn({ action:'fetchNews', provider, query }); },
  async ttsSpeak(provider, text, voiceId){ return window.SB._providerFn({ action:'ttsSpeak', provider, text, voiceId }); }
};
