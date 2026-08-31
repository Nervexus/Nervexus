/* ============================================================================
   voice-engine.js — Modular AI Voice Assistant for the AI Command Center.

   Built on the Web Speech API (speechSynthesis). Provides:

     • Voice Library ...... 15 distinct voice profiles, each resolved to the best
                            available device voice + tuned pitch/rate/personality
                            so every one sounds noticeably different.
     • Voice Profile Mgr .. resolves profiles → real voices, keeps them distinct,
                            re-resolves on the async 'voiceschanged' event.
     • Voice Preview ...... speaks a per-voice sample sentence.
     • Text Reader ........ parses text into structured chunks (headings /
                            paragraphs / bullets / sentences) with pauses.
     • Speech Generator ... builds utterances with reading intelligence
                            (heading emphasis, number/date/currency/units,
                            conversational bullets, punctuation pauses).
     • File Import Mgr ..... .txt / .md natively; .pdf (pdf.js) & .docx (mammoth)
                            via libraries fetched on demand.
     • Audio Player + Playback Controller — play / pause / resume / stop /
                            skip ±15s / speed 0.5–2× / progress + remaining /
                            restart. Chunk-based so long docs never cut off.
     • Background Playback — the engine is scene-independent; navigation does not
                            stop playback.

   window.VoiceEngine is the class. The app creates one instance and passes an
   onUpdate callback that receives playback state on every change.
   ============================================================================ */
(function (root) {
  'use strict';

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---- 15 voice profiles ---------------------------------------------
     prefer  : ordered device-voice name regexes (macOS / Windows / Chrome / Android)
     gender  : fallback classifier when no prefer match is free
     lang    : preferred BCP-47 prefix
     rate    : inherent pace (multiplied by the user's speed setting)
     pitch   : inherent pitch
     style   : default reading style
     sample  : preview sentence (also shows the voice's personality)             */
  var PROFILES = [
    { id: 'pro_m',  name: 'Professional Male', desc: 'Clear · neutral · anchor', gender: 'm', lang: 'en-US', rate: 0.98, pitch: 0.92, style: 'Professional',
      prefer: ['Microsoft (Guy|Davis|Andrew)', 'Google US English', 'Aaron', 'Tom', 'Alex', 'Fred'],
      sample: 'Good morning. Your briefing is ready — let us get straight to what matters.' },
    { id: 'exec_f', name: 'Executive Female', desc: 'Poised · authoritative', gender: 'f', lang: 'en-US', rate: 0.96, pitch: 0.94, style: 'Executive',
      prefer: ['Karen', 'Victoria', 'Microsoft Aria', 'Serena', 'Samantha'],
      sample: 'Here is where we stand, and here is the decision I recommend you make.' },
    { id: 'concierge', name: 'Luxury Concierge', desc: 'Refined · attentive · British', gender: 'f', lang: 'en-GB', rate: 0.90, pitch: 1.00, style: 'Executive',
      prefer: ['Google UK English Female', 'Kate', 'Serena', 'Stephanie', 'Microsoft (Sonia|Libby)', 'Fiona'],
      sample: 'Good evening. It would be my pleasure to attend to your schedule this evening.' },
    { id: 'brit_m', name: 'British Male', desc: 'Distinguished · English', gender: 'm', lang: 'en-GB', rate: 0.99, pitch: 0.90, style: 'Professional',
      prefer: ['Google UK English Male', 'Daniel', 'Oliver', 'Arthur', 'Microsoft (Ryan|George)'],
      sample: 'Good afternoon. Allow me to take you through today, in proper order.' },

    /* ===================== SWISS FRENCH (fr-CH) FEMALE ============== */
    { id: 'swiss_elegance', name: 'Swiss Élégance', desc: 'Swiss poise · fluent English', gender: 'f', lang: 'en-GB', rate: 0.94, pitch: 1.02, style: 'Executive',
      prefer: ['Google UK English Female', 'Samantha', 'Google US English'],
      sample: 'Good day. It is my pleasure to accompany you today, with precision and elegance.' },

    /* ===================== FRENCH (fr-FR) FEMALE =================== */
    { id: 'fr_pro', name: 'French Professional', desc: 'French clarity · professional English', gender: 'f', lang: 'en-GB', rate: 1.00, pitch: 1.00, style: 'Professional',
      prefer: ['Samantha', 'Google UK English Female', 'Google US English'],
      sample: 'Good day. Here is the essential news, presented clearly and without detour.' },
    { id: 'fr_couture', name: 'French Couture', desc: 'French couture · soft English', gender: 'f', lang: 'en-GB', rate: 0.90, pitch: 1.06, style: 'Conversational',
      prefer: ['Samantha', 'Google UK English Female', 'Google US English'],
      sample: 'Good evening. Take a moment. I am with you, all in finesse and discretion.' }
  ];

  var FEMALE = /female|samantha|victoria|karen|moira|tessa|fiona|serena|kate|susan|allison|ava|zira|hazel|aria|jenny|michelle|zoe|sara|nicky|sonia|libby|stephanie|joanna|salli|kimberly|veena|paulina|daria|amélie|amelie|aurélie|aurelie|audrey|denise|hortense|julie|caroline|ariane|céline|celine|marie|virginie|léa\b|chloé|chloe/i;
  var MALE = /\bmale\b|daniel|alex|tom|aaron|rishi|oliver|arthur|gordon|david|mark|george|guy|davis|andrew|ryan|matthew|justin|thomas|jacques|nicolas|henri|paul|s\u00e9bastien|sebastien|guillaume|mathieu|claude/i;
  // Never read with these — novelty / robotic / low-quality system voices.
  var BANNED = /\b(albert|bahh|bells|boing|bubbles|cellos|organ|jester|superstar|trinoids|whisper|wobble|zarvox|bad news|good news|grandma|grandpa|junior|kathy|ralph|deranged|hysterical|princess|zombie|pipe|flo|sandy|shelley|eddy|reed|rocko|fred)\b/i;
  // Quality tiers — earlier index = better. Anything unmatched is still usable but ranked last.
  var TIERS = [
    /google|neural|natural|premium|enhanced|siri/i,
    /microsoft\s+(aria|jenny|guy|davis|andrew|libby|sonia|ryan|emma|michelle|christopher|nova|denise|ariane|henri|hortense)/i,
    /samantha|ava|allison|daniel|alex|susan|victoria|serena|kate|fiona|tom|karen|amélie|amelie|thomas/i,
    /moira|tessa|rishi|veena|nicky|zoe|oliver|arthur|matthew|aurélie|aurelie|audrey|céline|celine/i
  ];

  var STYLE_MODS = {
    Professional:  { rate: 1.00, pitch: 1.00, headPause: 480, sentPause: 130 },
    Friendly:      { rate: 1.03, pitch: 1.06, headPause: 380, sentPause: 150 },
    Motivational:  { rate: 1.08, pitch: 1.00, headPause: 300, sentPause: 100 },
    Executive:     { rate: 0.95, pitch: 0.95, headPause: 560, sentPause: 170 },
    Conversational:{ rate: 0.98, pitch: 1.02, headPause: 420, sentPause: 190 }
  };

  /* ================================================================== */
  function VoiceEngine(opts) {
    opts = opts || {};
    this.onUpdate = opts.onUpdate || function () {};
    // Optional: async (text) => Promise<boolean> — when supplied, chunked playback
    // (readAloud/briefings) speaks through this instead of the browser's native voice,
    // so the document reader uses the same connected cloud voice (e.g. ElevenLabs) as
    // everywhere else in the app, with the browser voice as its own internal fallback.
    this._speakChunkAdapter = opts.speakChunk || null;
    this._stopChunkAdapter = opts.stopChunk || null;
    // Optional: (text) => void — fired as soon as a chunk STARTS playing, to warm the
    // next chunk's audio ahead of time so cloud TTS has no network gap between sentences.
    this._prefetchAdapter = opts.prefetch || null;
    this.voices = [];
    this.assignment = {};            // profileId -> voiceURI (resolved this session)
    this._locks = this._loadLocks(); // profileId -> device voice NAME (persistent)
    this._migrateLocks();            // one-time: re-resolve Swiss/French to English voices
    this.settings = { speed: 1, pitch: 1, volume: 1, style: 'Professional', autoRate: false };
    this.pb = this._blankPB();
    this._timer = null;
    this._keepalive = null;
    this._scriptCache = {};
    var self = this;
    this._refresh();
    if (root.speechSynthesis) {
      try { root.speechSynthesis.onvoiceschanged = function () { self._refresh(); }; } catch (e) {}
    }
  }

  /* ---- Persistent voice locks ---------------------------------------
     Once a profile resolves to a device voice, we remember that voice BY NAME
     forever (localStorage). On every later load we re-attach the same named
     voice, so a voice you selected never silently changes — even as the browser
     streams in extra voices or reorders getVoices(). resetLocks() re-rolls. */
  VoiceEngine.prototype._LOCK_KEY = 'cc_voice_locks_v2';
  VoiceEngine.prototype._MIGRATION_KEY = 'cc_voice_migrated_en_accent_3';
  VoiceEngine.prototype._loadLocks = function () { try { return JSON.parse(root.localStorage.getItem(this._LOCK_KEY) || '{}') || {}; } catch (e) { return {}; } };
  VoiceEngine.prototype._saveLocks = function () { try { root.localStorage.setItem(this._LOCK_KEY, JSON.stringify(this._locks || {})); } catch (e) {} };
  VoiceEngine.prototype.resetLocks = function () { this._locks = {}; this._saveLocks(); this._assign(); this.onUpdate(this.publicState()); };
  // One-time: the Swiss/French profiles moved from French device voices to clear
  // English voices. Drop ONLY their old locks so they re-resolve, while every
  // English profile keeps its existing lock untouched.
  VoiceEngine.prototype._migrateLocks = function () {
    try {
      if (root.localStorage.getItem(this._MIGRATION_KEY)) return;
      var ids = ['swiss_elegance','swiss_pro','swiss_calm','swiss_concierge','swiss_alpine','paris_chic','fr_pro','fr_warm','fr_exec','fr_couture'];
      for (var i = 0; i < ids.length; i++) { if (this._locks[ids[i]]) delete this._locks[ids[i]]; }
      this._saveLocks();
      root.localStorage.setItem(this._MIGRATION_KEY, '1');
    } catch (e) {}
  };

  VoiceEngine.prototype._blankPB = function () {
    return { loaded: false, title: '', playing: false, paused: false, idx: 0, count: 0,
             elapsedMs: 0, totalMs: 0, pct: 0, timeLabel: '0:00', totalLabel: '0:00',
             remainLabel: '0:00', currentText: '' };
  };

  /* ---- Voice Profile Manager ----------------------------------------- */
  VoiceEngine.prototype._refresh = function () {
    if (!root.speechSynthesis) { this.voices = []; return; }
    var v = [];
    try { v = root.speechSynthesis.getVoices() || []; } catch (e) { v = []; }
    this.voices = v;
    this._assign();
    this.onUpdate(this.publicState());
  };

  // Quality-first, language-aware assignment. Each profile draws from voices in
  // its own language family (English profiles -> English voices, French/Swiss
  // profiles -> French voices), ranked by (tier, gender, exact-locale) with a
  // cumulative reuse penalty so good voices spread rather than repeat. Never a
  // banned novelty voice. If a language has no installed voices, it degrades
  // gracefully to whatever quality voices exist.
  VoiceEngine.prototype._assign = function () {
    var voices = this.voices, used = {}, map = {};
    if (!voices.length) { return; }              // no voices yet — keep existing assignment, don't wipe
    var locks = this._locks || (this._locks = {});
    var byName = function (name) { for (var i = 0; i < voices.length; i++) if (voices[i].name === name) return voices[i]; return null; };
    var base = function (l) { return (l || '').slice(0, 2).toLowerCase(); };
    var gender = function (v) { var n = v.name; if (/google us english/i.test(n)) return 'f'; if (/google français|google fran.ais/i.test(n)) return 'f'; if (FEMALE.test(n)) return 'f'; if (MALE.test(n)) return 'm'; return 'n'; };
    var tierOf = function (v) { for (var i = 0; i < TIERS.length; i++) if (TIERS[i].test(v.name)) return i; return TIERS.length; };
    var allUsable = voices.filter(function (v) { return !BANNED.test(v.name); });
    if (!allUsable.length) allUsable = voices.slice();
    var dirty = false;

    PROFILES.forEach(function (p) {
      // 1) Honor an existing lock whenever that exact named voice is available.
      if (locks[p.id]) {
        var lv = byName(locks[p.id]);
        if (lv) { map[p.id] = lv.voiceURI; used[lv.voiceURI] = (used[lv.voiceURI] || 0) + 1; return; }
        // Locked voice not present this moment (still loading) — pick a temporary
        // below but DO NOT overwrite the lock, so it snaps back once available.
      }
      // 2) Walk THIS profile's own preferred names in order — first installed
      // match wins, full stop. Deterministic per device, and never influenced by
      // what any other profile already picked (no cross-profile competition), so
      // the same machine/browser always resolves the same voice for a profile —
      // the assignment is locked into the app's logic, not learned per session.
      var direct = null;
      if (p.prefer) {
        for (var pi2 = 0; pi2 < p.prefer.length && !direct; pi2++) {
          var re; try { re = new RegExp(p.prefer[pi2], 'i'); } catch (e) { re = null; }
          for (var vi = 0; vi < allUsable.length; vi++) {
            var cand = allUsable[vi];
            if (re ? re.test(cand.name) : cand.name.indexOf(p.prefer[pi2]) >= 0) { direct = cand; break; }
          }
        }
      }
      if (direct) {
        map[p.id] = direct.voiceURI; used[direct.voiceURI] = (used[direct.voiceURI] || 0) + 1;
        if (!locks[p.id]) { locks[p.id] = direct.name; dirty = true; }
        return;
      }
      // 3) Nothing on this profile's preferred list is installed on this device —
      // fall back to the best quality-first candidate in its language/gender family.
      var fam = base(p.lang);
      var langPool = allUsable.filter(function (v) { return base(v.lang) === fam; });
      if (!langPool.length) langPool = allUsable.filter(function (v) { return base(v.lang) === 'en'; });
      if (!langPool.length) langPool = allUsable;
      var pool = langPool.filter(function (v) { var g = gender(v); return g === p.gender || g === 'n'; });
      if (!pool.length) pool = langPool;
      var best = null, bestScore = -Infinity;
      for (var i = 0; i < pool.length; i++) {
        var v = pool[i];
        var g = gender(v);
        var gm = g === p.gender ? 1 : 0.5;
        var lm = (v.lang || '').toLowerCase() === (p.lang || '').toLowerCase() ? 1 : (base(v.lang) === fam ? 0.6 : 0);
        var score = (10 - tierOf(v)) * 1000 + gm * 300 + lm * 160 - (used[v.voiceURI] || 0) * 700;
        if (score > bestScore) { bestScore = score; best = v; }
      }
      if (best) {
        map[p.id] = best.voiceURI; used[best.voiceURI] = (used[best.voiceURI] || 0) + 1;
        if (!locks[p.id]) { locks[p.id] = best.name; dirty = true; }
      }
    });
    if (dirty) this._saveLocks();
    this.assignment = map;
  };

  VoiceEngine.prototype.profiles = function () { return PROFILES; };
  VoiceEngine.prototype.getProfile = function (id) { for (var i = 0; i < PROFILES.length; i++) if (PROFILES[i].id === id) return PROFILES[i]; return PROFILES[0]; };
  VoiceEngine.prototype.isValidId = function (id) { return PROFILES.some(function (p) { return p.id === id; }); };

  VoiceEngine.prototype._voiceFor = function (id) {
    var uri = this.assignment[id];
    if (!uri) return null;
    for (var i = 0; i < this.voices.length; i++) if (this.voices[i].voiceURI === uri) return this.voices[i];
    return null;
  };
  VoiceEngine.prototype.deviceVoiceName = function (id) { var v = this._voiceFor(id); return v ? v.name : 'System default'; };

  VoiceEngine.prototype.setSettings = function (patch) { Object.assign(this.settings, patch || {}); if (this.pb.loaded) this._recompute(); this.onUpdate(this.publicState()); };

  /* ---- Speech Generator ---------------------------------------------- */
  // Light, targeted normalization — never over-processes.
  VoiceEngine.prototype.humanize = function (t) {
    if (!t) return '';
    // Every profile reads English content — the accent comes from the device
    // voice, not the text — so normalization is always English.
    var s = ' ' + t + ' ';
    // 24h times -> 12h spoken
    s = s.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, function (m, h, mn) {
      h = +h; var ap = h < 12 ? ' AM' : ' PM'; var h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ':' + mn + ap;
    });
    // currency with magnitude suffix:  $1.2M  £45K  €3B
    s = s.replace(/([$£€])\s?(\d[\d,]*(?:\.\d+)?)\s?([KMBT])\b/gi, function (m, cur, num, mag) {
      var w = { K: ' thousand', M: ' million', B: ' billion', T: ' trillion' }[mag.toUpperCase()] || '';
      var unit = cur === '£' ? ' pounds' : cur === '€' ? ' euros' : ' dollars';
      return num.replace(/,/g, '') + w + unit;
    });
    // plain currency:  $1,200  £45,000
    s = s.replace(/([$£€])\s?(\d[\d,]*(?:\.\d+)?)/g, function (m, cur, num) {
      var unit = cur === '£' ? ' pounds' : cur === '€' ? ' euros' : ' dollars';
      return num.replace(/,/g, '') + unit;
    });
    // signed percentages read as up/down
    s = s.replace(/([+\-])(\d+(?:\.\d+)?)%/g, function (m, sign, num) { return (sign === '+' ? 'up ' : 'down ') + num + ' percent'; });
    s = s.replace(/(\d+(?:\.\d+)?)%/g, '$1 percent');
    // common units & abbreviations
    s = s.replace(/\bkcal\b/gi, 'calories').replace(/\bkg\b/g, ' kilograms').replace(/\bkm\b/g, ' kilometers')
         .replace(/\bbpm\b/gi, 'beats per minute').replace(/\b1RM\b/g, 'one rep max')
         .replace(/\be\.g\.\b/gi, 'for example').replace(/\bi\.e\.\b/gi, 'that is')
         .replace(/\bvs\.?\b/gi, 'versus').replace(/\bapprox\.?\b/gi, 'approximately')
         .replace(/\bw\/\b/gi, 'with').replace(/&/g, ' and ');
    /* Units the assistant actually emits that were being spelled out letter by letter:
       "177.8 cm" came out as "see em", "2000 ml" as "em el", "30 min" as "min". Anchored to
       a preceding digit rather than a word boundary, so a stray letter in ordinary prose is
       never rewritten — which is the over-processing this function is careful to avoid.
       Runs after the kg/kcal/km pass above so those are already expanded and the bare "g"
       rule cannot chew the "g" off "kg". */
    s = s.replace(/(\d)\s*cm\b/g, '$1 centimetres')
         .replace(/(\d)\s*mm\b/g, '$1 millimetres')
         .replace(/(\d)\s*ml\b/g, '$1 millilitres')
         .replace(/(\d)\s*mins?\b/g, '$1 minutes')
         .replace(/(\d)\s*hrs?\b/g, '$1 hours')
         .replace(/(\d)\s*lbs?\b/g, '$1 pounds')
         .replace(/(\d)\s*g\b/g, '$1 grams');
    return s.replace(/\s{2,}/g, ' ').trim();
  };

  // strip inline markdown emphasis / links for clean speech
  VoiceEngine.prototype._clean = function (t) {
    return (t || '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // [text](url) -> text
      .replace(/[*_`~]{1,3}([^*_`~]+)[*_`~]{1,3}/g, '$1')
      .replace(/[*_`~]/g, '')
      .trim();
  };

  /* ---- Text Reader (parse into chunks) ------------------------------- */
  VoiceEngine.prototype.parse = function (text) {
    var self = this;
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    var blocks = [], para = [];
    var flush = function () { if (para.length) { blocks.push({ kind: 'para', text: para.join(' ') }); para = []; } };
    var bulletRe = /^\s*([-*•‣◦]|\d+[.)])\s+/;
    lines.forEach(function (ln) {
      var t = ln.trim();
      if (!t) { flush(); return; }
      var mdHead = /^#{1,6}\s+/.test(t);
      var looksHead = t.length <= 66 && !/[.!?,;:]$/.test(t) && (/:$/.test(t) || t === t.toUpperCase()) && t.split(' ').length <= 9;
      if (mdHead || looksHead) { flush(); blocks.push({ kind: 'heading', text: t.replace(/^#{1,6}\s+/, '').replace(/:$/, '') }); return; }
      if (bulletRe.test(t)) { flush(); blocks.push({ kind: 'bullet', text: t.replace(bulletRe, '') }); return; }
      para.push(t);
    });
    flush();

    // blocks -> sentence-level chunks
    var chunks = [];
    blocks.forEach(function (b) {
      var clean = self._clean(b.text);
      if (b.kind === 'heading') { chunks.push({ kind: 'heading', text: self.humanize(clean), pauseAfter: 480 }); return; }
      if (b.kind === 'bullet') { chunks.push({ kind: 'bullet', text: self.humanize(clean), pauseAfter: 260 }); return; }
      var sents = clean.split(/(?<=[.!?])\s+(?=[A-Z0-9"'“‘])/);
      sents.forEach(function (sn, i) {
        sn = sn.trim(); if (!sn) return;
        chunks.push({ kind: 'para', text: self.humanize(sn), pauseAfter: i === sents.length - 1 ? 340 : 130 });
      });
    });
    return chunks.filter(function (c) { return c.text; });
  };

  // words -> ms estimate at an effective rate (≈165 wpm at 1.0)
  VoiceEngine.prototype._durMs = function (chunk, effRate) {
    var words = chunk.text.split(/\s+/).filter(Boolean).length;
    var wpm = 165 * (effRate || 1);
    return (words / wpm) * 60000 + (chunk.pauseAfter || 0);
  };
  VoiceEngine.prototype._effRate = function (chunk, profile) {
    var sm = STYLE_MODS[this.settings.style] || STYLE_MODS.Professional;
    var base = (profile.rate || 1) * (this.settings.speed || 1) * sm.rate;
    if (chunk.kind === 'heading') base *= 0.92;         // headings a touch slower
    return clamp(base, 0.1, 3);
  };

  VoiceEngine.prototype._recompute = function () {
    var self = this, prof = this._activeProfile();
    var cum = 0; this._cum = [0];
    this.pb.chunks.forEach(function (c) { cum += self._durMs(c, self._effRate(c, prof)); self._cum.push(cum); });
    this.pb.totalMs = cum;
  };

  VoiceEngine.prototype._activeProfile = function () { return this.getProfile(this._playProfileId || this.settings.voice || 'pro_f'); };

  /* ---- Load / player ------------------------------------------------- */
  VoiceEngine.prototype.loadText = function (text, title, profileId) {
    this.stop();
    this._playProfileId = profileId || this.settings.voice || 'pro_f';
    this._activeLang = this.getProfile(this._playProfileId).lang || 'en';
    var chunks = this.parse(text);
    this.pb = this._blankPB();
    this.pb.chunks = chunks; this.pb.count = chunks.length;
    this.pb.loaded = chunks.length > 0; this.pb.title = title || 'Document';
    this._recompute();
    this.onUpdate(this.publicState());
    return this.pb.loaded;
  };

  VoiceEngine.prototype.play = function (fromIdx) {
    if (!this.pb.loaded || !root.speechSynthesis) return;
    if (typeof fromIdx === 'number') this.pb.idx = clamp(fromIdx, 0, this.pb.count - 1);
    try { root.speechSynthesis.cancel(); } catch (e) {}
    this.pb.playing = true; this.pb.paused = false;
    this._chunkStart = Date.now();
    this._startTimer();
    this._speakCurrent();
    this.onUpdate(this.publicState());
  };

  VoiceEngine.prototype._speakCurrent = function () {
    var self = this, i = this.pb.idx, c = this.pb.chunks[i];
    if (!c) { this._finish(); return; }
    this.pb.currentText = c.text;
    this._chunkStart = Date.now();
    var advance = function () {
      if (!self.pb.playing) return;
      var wait = c.pauseAfter || 0;
      self._advanceTimerBase(i);
      setTimeout(function () {
        if (!self.pb.playing || self.pb.paused) { self._pendingNext = true; return; }
        if (self.pb.idx < self.pb.count - 1) { self.pb.idx++; self._speakCurrent(); }
        else self._finish();
      }, wait);
    };
    if (this._speakChunkAdapter) {
      this._speakChunkAdapter(c.text).then(advance).catch(advance);
      if (this._prefetchAdapter) { var nextC = this.pb.chunks[i + 1]; if (nextC) this._prefetchAdapter(nextC.text); }
      return;
    }
    var prof = this._activeProfile();
    var sm = STYLE_MODS[this.settings.style] || STYLE_MODS.Professional;
    var u = new root.SpeechSynthesisUtterance(c.text);
    var v = this._voiceFor(this._playProfileId); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = this._effRate(c, prof);
    u.pitch = clamp((prof.pitch || 1) * (this.settings.pitch || 1) * sm.pitch * (c.kind === 'heading' ? 0.96 : 1), 0, 2);
    u.volume = clamp(this.settings.volume != null ? this.settings.volume : 1, 0, 1);
    u.onend = advance;
    u.onerror = function () { /* skip broken chunk */ if (self.pb.playing && self.pb.idx < self.pb.count - 1) { self.pb.idx++; self._speakCurrent(); } else self._finish(); };
    try { root.speechSynthesis.speak(u); } catch (e) {}
  };

  VoiceEngine.prototype._advanceTimerBase = function (i) { this._baseElapsed = this._cum[i + 1] || this._baseElapsed; };

  VoiceEngine.prototype._startTimer = function () {
    var self = this;
    clearInterval(this._timer);
    this._baseElapsed = this._cum[this.pb.idx] || 0;
    this._chunkStart = Date.now();
    this._timer = setInterval(function () {
      if (!self.pb.playing || self.pb.paused) return;
      var within = Date.now() - self._chunkStart;
      var capNext = self._cum[self.pb.idx + 1] != null ? self._cum[self.pb.idx + 1] : self.pb.totalMs;
      self.pb.elapsedMs = clamp((self._cum[self.pb.idx] || 0) + within, 0, capNext);
      self.onUpdate(self.publicState());
    }, 250);
    // keepalive against the Chrome ~15s cutoff
    clearInterval(this._keepalive);
    this._keepalive = setInterval(function () {
      try { if (self.pb.playing && !self.pb.paused && root.speechSynthesis.speaking) { root.speechSynthesis.pause(); root.speechSynthesis.resume(); } } catch (e) {}
    }, 9000);
  };

  VoiceEngine.prototype.pause = function () {
    if (!this.pb.playing || this.pb.paused) return;
    this.pb.paused = true;
    if (this._speakChunkAdapter && this._stopChunkAdapter) { try { this._stopChunkAdapter(); } catch (e) {} }
    try { root.speechSynthesis.pause(); } catch (e) {}
    this.onUpdate(this.publicState());
  };
  VoiceEngine.prototype.resume = function () {
    if (!this.pb.playing || !this.pb.paused) return;
    this.pb.paused = false;
    this._chunkStart = Date.now() - ((this.pb.elapsedMs - (this._cum[this.pb.idx] || 0)));
    if (this._speakChunkAdapter) { this._pendingNext = false; this._speakCurrent(); this.onUpdate(this.publicState()); return; }
    try { root.speechSynthesis.resume(); } catch (e) {}
    if (this._pendingNext) { this._pendingNext = false; if (this.pb.idx < this.pb.count - 1) { this.pb.idx++; this._speakCurrent(); } else this._finish(); }
    this.onUpdate(this.publicState());
  };
  VoiceEngine.prototype.toggle = function () { if (!this.pb.loaded) return; if (!this.pb.playing) this.play(); else if (this.pb.paused) this.resume(); else this.pause(); };

  VoiceEngine.prototype.stop = function () {
    this.pb.playing = false; this.pb.paused = false;
    clearInterval(this._timer); clearInterval(this._keepalive);
    if (this._speakChunkAdapter && this._stopChunkAdapter) { try { this._stopChunkAdapter(); } catch (e) {} }
    try { root.speechSynthesis && root.speechSynthesis.cancel(); } catch (e) {}
    if (this.pb.loaded) { this.pb.idx = 0; this.pb.elapsedMs = 0; }
    this.onUpdate(this.publicState());
  };
  VoiceEngine.prototype.restart = function () { if (!this.pb.loaded) return; this.pb.idx = 0; this.pb.elapsedMs = 0; this.play(0); };

  // skip by seconds -> jump to nearest chunk boundary
  VoiceEngine.prototype.skip = function (sec) {
    if (!this.pb.loaded) return;
    var target = clamp(this.pb.elapsedMs + sec * 1000, 0, this.pb.totalMs);
    var idx = 0;
    for (var i = 0; i < this.pb.count; i++) { if (this._cum[i] <= target) idx = i; else break; }
    this.pb.idx = idx; this.pb.elapsedMs = this._cum[idx] || 0;
    if (this.pb.playing) { try { root.speechSynthesis.cancel(); } catch (e) {} this.pb.paused = false; this._startTimer(); this._speakCurrent(); }
    this.onUpdate(this.publicState());
  };

  VoiceEngine.prototype._finish = function () {
    this.pb.playing = false; this.pb.paused = false;
    clearInterval(this._timer); clearInterval(this._keepalive);
    this.pb.idx = this.pb.count - 1; this.pb.elapsedMs = this.pb.totalMs;
    this.onUpdate(this.publicState());
  };

  /* ---- Voice preview & one-off speech (conversations / messages) ----- */
  VoiceEngine.prototype.preview = function (profileId) {
    var p = this.getProfile(profileId);
    this.speakWith(profileId, p.sample);
  };
  // speak a short message immediately with a given profile (used app-wide).
  // onDone (optional) fires once after the last chunk's utterance ends — lets callers
  // await full completion, e.g. to sequence multiple streamed chunks without overlap.
  VoiceEngine.prototype.speakWith = function (profileId, text, onDone) {
    if (!root.speechSynthesis || !text) { if (onDone) onDone(); return; }
    try { root.speechSynthesis.cancel(); } catch (e) {}
    var self = this, prof = this.getProfile(profileId);
    this._activeLang = prof.lang || 'en';
    var sm = STYLE_MODS[this.settings.style] || STYLE_MODS.Professional;
    var chunks = this.parse(text);
    var i = 0;
    var next = function () {
      if (i >= chunks.length) { if (onDone) onDone(); return; }
      var c = chunks[i++];
      var u = new root.SpeechSynthesisUtterance(c.text);
      var v = self._voiceFor(profileId); if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = clamp((prof.rate || 1) * (self.settings.speed || 1) * sm.rate * (c.kind === 'heading' ? 0.92 : 1), 0.1, 3);
      u.pitch = clamp((prof.pitch || 1) * (self.settings.pitch || 1) * sm.pitch, 0, 2);
      u.volume = clamp(self.settings.volume != null ? self.settings.volume : 1, 0, 1);
      u.onend = function () { setTimeout(next, c.pauseAfter || 0); };
      try { root.speechSynthesis.speak(u); } catch (e) { next(); }
    };
    next();
  };

  /* ---- File Import Manager ------------------------------------------- */
  VoiceEngine.prototype._loadScript = function (src, check) {
    var self = this;
    if (this._scriptCache[src]) return this._scriptCache[src];
    this._scriptCache[src] = new Promise(function (res, rej) {
      if (check && check()) { res(); return; }
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error('load failed: ' + src)); };
      document.head.appendChild(s);
    });
    return this._scriptCache[src];
  };

  VoiceEngine.prototype.importFile = function (file) {
    var self = this, name = (file.name || '').toLowerCase();
    if (/\.(txt|md|markdown|text)$/.test(name) || (file.type || '').indexOf('text') === 0) {
      return file.text().then(function (t) { return { text: t, title: file.name }; });
    }
    if (/\.pdf$/.test(name) || file.type === 'application/pdf') {
      var PDF = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      return this._loadScript(PDF, function () { return !!root.pdfjsLib; }).then(function () {
        root.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return file.arrayBuffer();
      }).then(function (buf) {
        return root.pdfjsLib.getDocument({ data: buf }).promise;
      }).then(function (doc) {
        var pages = []; for (var i = 1; i <= doc.numPages; i++) pages.push(i);
        return pages.reduce(function (chain, n) {
          return chain.then(function (acc) {
            return doc.getPage(n).then(function (pg) { return pg.getTextContent(); }).then(function (c) {
              var line = c.items.map(function (it) { return it.str; }).join(' ');
              return acc + line + '\n\n';
            });
          });
        }, Promise.resolve('')).then(function (txt) { return { text: txt, title: file.name }; });
      });
    }
    if (/\.docx$/.test(name) || (file.type || '').indexOf('officedocument.wordprocessing') >= 0) {
      var MAM = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      return this._loadScript(MAM, function () { return !!root.mammoth; }).then(function () {
        return file.arrayBuffer();
      }).then(function (buf) {
        return root.mammoth.extractRawText({ arrayBuffer: buf });
      }).then(function (r) { return { text: r.value || '', title: file.name }; });
    }
    return Promise.reject(new Error('Unsupported file type. Use TXT, MD, PDF or DOCX.'));
  };

  /* ---- state out ------------------------------------------------------ */
  function fmt(ms) { ms = Math.max(0, ms | 0); var s = Math.round(ms / 1000); var m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  VoiceEngine.prototype.publicState = function () {
    var pb = this.pb;
    var pct = pb.totalMs ? clamp(pb.elapsedMs / pb.totalMs * 100, 0, 100) : 0;
    return {
      loaded: pb.loaded, title: pb.title, playing: pb.playing, paused: pb.paused,
      idx: pb.idx, count: pb.count, currentText: pb.currentText,
      elapsedMs: pb.elapsedMs, totalMs: pb.totalMs, pct: pct,
      timeLabel: fmt(pb.elapsedMs), totalLabel: fmt(pb.totalMs), remainLabel: '-' + fmt(pb.totalMs - pb.elapsedMs),
      voicesReady: this.voices.length > 0
    };
  };

  VoiceEngine.PROFILES = PROFILES;
  root.VoiceEngine = VoiceEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = VoiceEngine;
})(typeof window !== 'undefined' ? window : this);
