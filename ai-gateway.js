/* ai-gateway.js — the single door between the app and any AI provider.

   Before this existed there were three independent routing paths:

     _pickAutoProvider   used by the voice assistant only — honoured default/backup,
                         failover and provider health
     window.claude       the compatibility shim behind nine other AI features — its own
                         simpler picker, no failover, no health, no capability filter
     _pickLiveProvider   used by the safety lookup and news digest

   They disagreed. A provider that had failed three times in a row was benched for the
   voice assistant and still hammered by everything else, and the AI centre's eight
   per-feature Routing controls were read by no call path at all — you could set
   "Briefings -> Gemini" and the briefing would still go to your default provider while
   the label underneath claimed otherwise.

   Everything now goes through here, and every control in the AI centre is load-bearing.

   ---- Host contract -------------------------------------------------------------
   configure() takes the app's accessors rather than reaching into app state, so this
   file has no opinion about how config is stored and can be tested standalone:

     providers()      -> array of provider descriptors (PROVIDERS_DATA.AI_PROVIDERS)
     cfg(id)          -> { on, saved, model } for one provider
     model(id)        -> the model string to send for that provider
     routing()        -> { <roleId>: <providerId> }
     defaultId()      -> preferred provider id, or ''
     backupId()       -> second-choice provider id, or ''
     failover()       -> bool, whether to try further providers after a failure
     online()         -> bool, whether the backend is reachable at all
     call(id, prompt, model)              -> Promise<{result, error, citations}>
     stream(id, prompt, onDelta, model)   -> Promise<{result, error, citations}> or null
                                             if streaming is unavailable

   ---- Selection ------------------------------------------------------------------
   Candidates are ordered: the role's own provider, then the default, then the backup,
   then everything else in registry order. Each must be connected (saved) and enabled
   (on). A `live: true` request additionally requires a provider that can actually
   search the web, since answering a "what happened today" question from a model's
   training data is worse than saying we cannot.

   Unhealthy providers are skipped when a healthy alternative exists, and used anyway
   when none does — being benched should never turn into "no provider connected" when
   the user plainly has one. This is deliberately unlike the old behaviour, which only
   applied health checks when failover happened to be switched on.
*/
(function (root) {
  /* Idempotent on purpose. Every engine <script> in index.html lives inside <helmet>, which
     the framework relocates into <head> at runtime — and moving a script element makes the
     browser run it a second time. Without this guard the second pass rebuilt AIGateway with
     a fresh closure whose H was undefined, silently throwing away the host the app had
     already installed via configure(). isConfigured() then answered false forever, so
     _providerVals() returned its empty fallback and the AI Command Center rendered with no
     provider cards at all — and therefore no way to connect a first key, and no error to
     explain any of it. Keep the first instance; it is the configured one. */
  if (root.AIGateway) return;

  'use strict';

  var H = null;                      // host accessors, set by configure()
  var HEALTH = {};                   // id -> { okStreak, errStreak, lastLatencyMs, lastErr, lastTs }
  var BENCH_MS = 10 * 60 * 1000;     // how long three consecutive failures sideline a provider
  var BENCH_AFTER = 3;
  var MAX_TRIES = 3;                 // with failover on; 1 without

  function noHost() { return { error: 'AI gateway is not configured yet.', code: 'unconfigured' }; }

  // ---- health ------------------------------------------------------------------
  function record(id, ok, latencyMs, err) {
    var h = HEALTH[id] || (HEALTH[id] = { okStreak: 0, errStreak: 0 });
    if (ok) { h.okStreak++; h.errStreak = 0; h.lastLatencyMs = latencyMs; h.lastErr = ''; }
    else { h.errStreak++; h.okStreak = 0; h.lastErr = err || 'error'; }
    h.lastTs = Date.now();
  }
  function healthy(id) {
    var h = HEALTH[id];
    if (!h) return true;
    return !(h.errStreak >= BENCH_AFTER && Date.now() - h.lastTs < BENCH_MS);
  }

  // ---- selection ---------------------------------------------------------------
  function connected(id) {
    var c = (H.cfg(id) || {});
    return !!(c.saved && c.on !== false);
  }

  /* Ordered candidate ids for a role. `live` narrows to providers that can search the
     web. Returns [] when nothing qualifies — the caller decides what to say about it. */
  /* Preference order for a role, before any connected/healthy filtering. */
  function order(role, live) {
    if (!H) return [];
    var all = H.providers() || [];
    var pool = live ? all.filter(function (p) { return !!p.live; }) : all;
    var has = function (id) { return !!id && pool.some(function (p) { return p.id === id; }); };

    var out = [];
    var roleId = (H.routing() || {})[role];
    if (has(roleId)) out.push(roleId);
    var def = H.defaultId();
    if (has(def) && out.indexOf(def) < 0) out.push(def);
    var bk = H.backupId();
    if (has(bk) && out.indexOf(bk) < 0) out.push(bk);
    pool.forEach(function (p) { if (out.indexOf(p.id) < 0) out.push(p.id); });
    return out;
  }

  function candidates(role, live) {
    if (!H) return [];
    var open = order(role, live).filter(connected);
    var fit = open.filter(healthy);
    // Benched providers are a last resort, never a reason to report nothing connected.
    return fit.length ? fit : open;
  }

  function noneError(live) {
    return live
      ? { error: 'That needs a provider that can search the web. Connect Google Gemini in the AI centre — it is the only one here with live search — then ask again.',
          code: 'no-live-provider' }
      : { error: 'No AI provider is connected yet. Add one in the AI centre and this will start working.',
          code: 'no-provider' };
  }

  // ---- calling -----------------------------------------------------------------
  /* One request, walking the candidate list. onDelta present means streaming.

     The streaming path will not switch providers once tokens have arrived: a silent
     swap mid-answer splices two different completions into one reply, which reads as
     the assistant contradicting itself. A provider that fails before its first token
     is still safe to replace. */
  function run(role, prompt, opts, onDelta) {
    opts = opts || {};
    if (!H) return Promise.resolve(noHost());
    if (!H.online()) {
      return Promise.resolve({ error: 'Not connected to the server, so I cannot reach an AI provider right now.', code: 'offline' });
    }

    var live = !!opts.live;
    var list = candidates(role, live);
    if (!list.length) return Promise.resolve(noneError(live));

    var tries = H.failover() ? Math.min(MAX_TRIES, list.length) : 1;
    var i = 0, lastErr = '', lastId = '';

    function attempt() {
      if (i >= tries) {
        return { error: 'That request did not go through — ' + (lastErr || 'unknown error') + '.',
                 code: 'failed', detail: lastErr, provider: lastId };
      }
      var id = list[i++];
      lastId = id;
      var t0 = Date.now();
      var started = false;
      var wrap = onDelta ? function (d) { started = true; onDelta(d); } : null;

      var streaming = !!(wrap && H.stream);
      var p;
      try {
        p = streaming ? H.stream(id, prompt, wrap, H.model(id))
                      : H.call(id, prompt, H.model(id));
      } catch (e) {
        p = Promise.resolve({ error: (e && e.message) || 'Request failed' });
      }
      if (!p || !p.then) p = Promise.resolve(p);

      return p.catch(function (e) {
        return { error: (e && e.message) || 'Request failed' };
      }).then(function (res) {
        // A host with a stream transport that resolves null is telling us streaming
        // is unavailable for this call — retry it whole on the same provider rather
        // than burning a candidate.
        if (streaming && res == null) {
          streaming = false;
          return H.call(id, prompt, H.model(id)).catch(function (e) {
            return { error: (e && e.message) || 'Request failed' };
          });
        }
        return res;
      }).then(function (res) {
        // Whenever the answer did not arrive as deltas but the caller asked for them,
        // hand over the whole thing as one delta. Callers that render only from
        // onDelta would otherwise show an empty reply beside a successful result.
        if (wrap && !streaming && res && !res.error && res.result) wrap(res.result);
        return res;
      }).then(function (res) {
        if (res && !res.error) {
          record(id, true, Date.now() - t0);
          return { text: res.result || '', citations: res.citations || [], provider: id };
        }
        lastErr = (res && res.error) || 'unknown error';
        record(id, false, Date.now() - t0, lastErr);
        if (started) {
          // Mid-stream failure: the user has already heard part of an answer.
          return { error: 'That answer was cut short — ' + lastErr + '.', code: 'interrupted', detail: lastErr, provider: id };
        }
        return attempt();
      });
    }

    return Promise.resolve().then(attempt);
  }

  root.AIGateway = {
    configure: function (host) { H = host; },
    isConfigured: function () { return !!H; },

    /* ask(role, prompt, opts) -> { text, citations, provider } | { error, code }
       opts.live    require a web-searching provider
       Roles are PROVIDERS_DATA.AI_FEATURES ids. An unknown role is not an error — it
       simply has no routing preference and falls through to default/backup. */
    ask: function (role, prompt, opts) { return run(role, prompt, opts, null); },

    /* Same, but onDelta(textChunk) fires as tokens arrive. Resolves once complete. */
    stream: function (role, prompt, onDelta, opts) { return run(role, prompt, opts, onDelta); },

    /* Which provider a role would use right now, or null. Lets the UI label a feature
       with the provider that will actually serve it rather than guessing. */
    resolve: function (role, opts) {
      var list = candidates(role, !!(opts && opts.live));
      return list.length ? list[0] : null;
    },

    /* The ordered fallback chain for a role — what the AI centre's failover panel shows.
       Without this the panel could only guess from default/backup, which is how it came
       to display an order the router did not actually use.

       opts.includeBenched keeps providers that are currently sidelined for repeated
       failures, so the panel can show them greyed and labelled rather than having them
       silently disappear from the list with no explanation. Display only — it does not
       change what ask() will try. */
    chain: function (role, opts) {
      var live = !!(opts && opts.live);
      if (!(opts && opts.includeBenched)) return candidates(role, live).slice();
      var fit = candidates(role, live);
      var all = order(role, live).filter(connected);
      // Healthy ones first, in routing order, then the benched ones behind them.
      return fit.concat(all.filter(function (id) { return fit.indexOf(id) < 0; }));
    },
    available: function (opts) { return candidates('', !!(opts && opts.live)).length > 0; },

    health: function (id) {
      if (id) return { id: id, healthy: healthy(id), stats: HEALTH[id] || null };
      return Object.keys(HEALTH).map(function (k) {
        return { id: k, healthy: healthy(k), stats: HEALTH[k] };
      });
    },
    clearHealth: function () { HEALTH = {}; }
  };

}(window));
