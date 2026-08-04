/* ============================================================================
   voice-assistant-engine.js — Orb conversation/command backend.

   Independent module. Owns tool definitions, LLM-driven planning, and a fast
   offline fallback. It never talks to an AI provider directly — every AI call
   goes through host.ask()/host.askLive(), which the app wires to its central
   API Manager (Settings → AI Providers, with Auto-mode health/failover).

   Pipeline per utterance:
     1. If a provider is connected: ask it to PLAN — return one tool call (or
        none, for plain conversation) as JSON. This is real NLU: no phrasing
        list to maintain, any of the tools below can be triggered by however
        the user actually talks.
     2. Execute the chosen tool against the host bridge (app services only —
        this file never mutates app state itself).
     3. If no provider is connected, or the plan can't be parsed, fall back to
        a small set of instant local patterns (greeting/time/date/remember)
        so the assistant still responds with zero setup.

   Host contract — see TOOLS below for the app-service calls a host must
   provide (host.tools.*), plus:
     firstName()            -> string
     say(text)              push an interim AI bubble (no speech)
     replaceLast(text)       replace the most recent AI bubble's text
     speak(text)             speak + record as the final reply + push bubble
     ask(prompt)             -> Promise<{text}|{error}>   general AI question, via API Manager
     askLive(query)          -> Promise<{text}|{error}>   live/web-grounded question, via API Manager
     hasGeneralProvider()    -> boolean
   ============================================================================ */
(function (root) {
  'use strict';

  // ---- Tool registry -------------------------------------------------------
  // Each tool's `run` only ever calls host.tools.<fn> — real mutations live in
  // the app's existing services (tasks, health, notes, finance, calendar).
  var TOOLS = [
    { name: 'navigate', desc: 'Open a screen in the app.', params: 'scene (one of: home, finance, health, fitness, business, globe, briefing, power, calendar, productivity, voice, settings)',
      run: async function (a, host) { host.tools.nav(a.scene); return 'Opening ' + a.scene + '.'; } },
    { name: 'add_task', desc: 'Add a to-do / task / reminder-to-do to the checklist.', params: 'label (string)',
      run: async function (a, host) { host.tools.addTask(a.label); return 'Added \u201c' + a.label + '\u201d to your task list.'; } },
    { name: 'add_mission', desc: 'Add a daily mission/habit goal.', params: 'name (string)',
      run: async function (a, host) { host.tools.addMission(a.name); return 'Added mission \u201c' + a.name + '\u201d.'; } },
    { name: 'remember_fact', desc: 'Store a fact/preference about the user for future conversations.', params: 'fact (string)',
      run: async function (a, host) { host.tools.addMemory(a.fact); return 'Got it — I\u2019ll remember that ' + a.fact + '.'; } },
    { name: 'schedule_event', desc: 'Create a calendar event.', params: 'title (string), when (free text date/time description, e.g. "tomorrow at 3pm")',
      run: async function (a, host) { var r = host.tools.scheduleEvent(a.title, a.when || ''); return 'Scheduled \u201c' + a.title + '\u201d for ' + r.date + ' at ' + r.time + '.'; } },
    { name: 'tasks_left', desc: 'Report open/incomplete tasks.', params: 'none',
      run: async function (a, host) { var open = host.tools.openTasks(); return open.length ? ('You have ' + open.length + ' task' + (open.length === 1 ? '' : 's') + ' left: ' + open.join(', ') + '.') : 'Nothing left — your checklist is clear.'; } },
    { name: 'work_done_today', desc: 'Report tasks/missions completed today.', params: 'none',
      run: async function (a, host) { var d = host.tools.doneToday(); var parts = []; if (d.tasks.length) parts.push(d.tasks.length + ' task' + (d.tasks.length === 1 ? '' : 's') + ' completed: ' + d.tasks.join(', ')); if (d.missions.length) parts.push(d.missions.length + ' mission' + (d.missions.length === 1 ? '' : 's') + ' completed today: ' + d.missions.join(', ')); return parts.length ? parts.join('. ') + '.' : 'Nothing marked complete yet.'; } },
    { name: 'training_done_today', desc: 'Report workouts/training logged today.', params: 'none',
      run: async function (a, host) { var done = host.tools.trainingToday(); return done.length ? ('Training completed today: ' + done.join(', ') + '.') : 'No training logged today yet.'; } },
    { name: 'read_source', desc: 'Read a report aloud.', params: 'id (one of: exec, brief, notif, schedule, fitness, money, business)',
      run: async function (a, host) {
        var titles = { exec: 'Executive Briefing', brief: 'Daily Briefing', notif: 'Notifications', schedule: 'Schedule & Reminders', fitness: 'Fitness & Recovery', money: 'Markets & Money', business: 'Business Report' };
        host.say('Reading your ' + (titles[a.id] || a.id) + '\u2026');
        host.tools.readSource(a.id, titles[a.id] || a.id);
        return null; // readSource speaks the source itself
      } },
    { name: 'log_workout', desc: 'Log a workout/exercise.', params: 'exercise (string), minutes (number, optional), weight (number, optional), sets (number, optional), reps (number, optional)',
      run: async function (a, host) { host.tools.logWorkout(a.exercise, a.minutes || 0, a.weight || 0, a.sets || 0, a.reps || 0); return 'Logged ' + a.exercise + '.'; } },
    { name: 'log_hydration', desc: 'Log water intake.', params: 'ml (number) — convert glasses (~250ml) or oz (~30ml) to ml',
      run: async function (a, host) { host.tools.logHydration(+a.ml || 250); return 'Logged your water.'; } },
    { name: 'log_weight', desc: 'Log body weight.', params: 'kg (number)',
      run: async function (a, host) { host.tools.logWeight(+a.kg); return 'Logged your weight.'; } },
    { name: 'log_sleep', desc: 'Log last night\u2019s sleep.', params: 'hours (number), minutes (number, optional)',
      run: async function (a, host) { host.tools.logSleep(+a.hours || 0, +a.minutes || 0); return 'Logged last night\u2019s sleep.'; } },
    { name: 'log_meal', desc: 'Log a meal/nutrition entry.', params: 'name (string), kcal (number), protein (number, optional)',
      run: async function (a, host) { host.tools.logMeal(a.name, +a.kcal || 0, +a.protein || 0); return 'Logged ' + a.name + '.'; } },
    { name: 'add_note', desc: 'Create a note.', params: 'title (string, optional), body (string)',
      run: async function (a, host) { host.tools.addNote(a.title || '', a.body || ''); return 'Note saved.'; } },
    { name: 'log_income', desc: 'Log income.', params: 'label (string), amount (number)',
      run: async function (a, host) { host.tools.logIncome(a.label, +a.amount || 0); return 'Logged income: ' + a.label + '.'; } },
    { name: 'log_expense', desc: 'Log an expense.', params: 'label (string), amount (number)',
      run: async function (a, host) { host.tools.logExpense(a.label, +a.amount || 0); return 'Logged expense: ' + a.label + '.'; } },
    { name: 'travel_brief', desc: 'Give a live travel brief for a city (weather, safety, customs, currency, transport).', params: 'city (string)',
      run: async function (a, host) {
        var prompt = 'Give a concise spoken travel brief for a trip to ' + a.city + ': current weather, local safety notes (balanced, not alarmist), customs/etiquette, currency, and typical transport options. Keep it tight for speech, a few sentences per topic.';
        // Streaming lets the brief start playing as soon as the first sentence is ready,
        // instead of the usual multi-second wait for a full multi-topic answer.
        if (host.askLiveStreamAndSpeak) return await host.askLiveStreamAndSpeak(prompt);
        host.say('Pulling live travel data for ' + a.city + '\u2026');
        var res = await host.askLive(prompt);
        var text = res.error || res.text;
        host.replaceLast(text);
        return text;
      } },
    { name: 'safety_check', desc: 'Live safety/crime assessment for a place or situation.', params: 'query (string)',
      run: async function (a, host) {
        host.say('Running a live safety check\u2026');
        var text = await host.tools.safety(a.query);
        if (text) host.replaceLast(text);
        return text;
      } },
    { name: 'live_question', desc: 'Answer a real-world question needing current/live data (news, prices, weather, "what/who/when/where").', params: 'query (string)',
      run: async function (a, host) {
        if (host.askLiveStreamAndSpeak) return await host.askLiveStreamAndSpeak(a.query);
        host.say('Pulling live data\u2026');
        var res = await host.askLive(a.query);
        var text = res.error || res.text;
        host.replaceLast(text);
        return text;
      } },
    { name: 'chat', desc: 'Plain conversation, opinion, or general knowledge question — no tool needed.', params: 'reply (string) — if you can answer directly, put the full spoken reply here; otherwise leave empty to fall through to a general AI answer',
      run: async function (a, host) {
        if (a.reply) return a.reply;
        if (host.askStreamAndSpeak) return await host.askStreamAndSpeak(a.query || '');
        host.say('Thinking\u2026');
        var res = await host.ask(a.query || '');
        var text = res.error || res.text;
        host.replaceLast(text);
        return text;
      } }
  ];

  function toolByName(name) { return TOOLS.find(function (x) { return x.name === name; }); }

  // ---- LLM planner -----------------------------------------------------------
  function buildPlanPrompt(text, host) {
    var lines = TOOLS.map(function (t) { return '- ' + t.name + '(' + t.params + '): ' + t.desc; });
    return [
      'You are the tool router for a voice assistant. Read the user\u2019s spoken utterance and choose exactly ONE tool from this list, or "chat" for plain conversation:',
      lines.join('\n'),
      '',
      'User (' + host.firstName() + ') said: "' + text + '"',
      '',
      'Reply with ONLY a JSON object, no other text: {"tool":"<tool name>","args":{...}}',
      'For "chat", if you can fully answer in one short spoken reply yourself, put it in args.reply. Otherwise set args.reply to "" and args.query to the user\u2019s question so it can be looked up.'
    ].join('\n');
  }

  function parsePlan(raw) {
    if (!raw) return null;
    var a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    if (a < 0 || b < 0) return null;
    try {
      var obj = JSON.parse(raw.slice(a, b + 1));
      if (!obj || !obj.tool || !toolByName(obj.tool)) return null;
      obj.args = obj.args || {};
      return obj;
    } catch (e) { return null; }
  }

  async function planWithLLM(text, host) {
    var res = await host.ask(buildPlanPrompt(text, host), { raw: true });
    if (!res || res.error) return null;
    return parsePlan(res.text);
  }

  // ---- Fast offline fallback (no provider connected, or LLM planning failed) -------------
  // Covers every tool that needs NO AI call at all — navigation, tasks, missions, memory,
  // logging, reports — so those always work with zero setup. Only tools that genuinely need
  // an AI provider (travel_brief/safety_check/live_question/chat) fall through to the caller.
  var NAV_FALLBACK = [
    { re: /\bfinance|market|portfolio|stock|crypto\b/, scene: 'finance' },
    { re: /health|nutrition|calorie|hydrat|recovery/, scene: 'health' },
    { re: /fitness|workout|gym|training|muscle/, scene: 'fitness' },
    { re: /business|revenue|sales|competitor/, scene: 'business' },
    { re: /world|intel|globe|geopolit|country/, scene: 'globe' },
    { re: /brief/, scene: 'briefing' },
    { re: /power level|\bxp\b|rank|progress score/, scene: 'power' },
    { re: /calendar|schedule/, scene: 'calendar' },
    { re: /productivity|tracker/, scene: 'productivity' },
    { re: /settings/, scene: 'settings' },
    { re: /\bhome\b/, scene: 'home' },
  ];
  var FALLBACK_INTENTS = [
    { re: /^(?:please )?remember(?: that)?\s+(.+)/i, tool: 'remember_fact', args: function (m) { return { fact: m[1].trim() }; } },
    { re: /what.?s? (the )?time|current time|time is it/i, reply: function () { return 'It\u2019s ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '.'; } },
    { re: /what.?s? (today.?s |the )?date|what day is it/i, reply: function () { return 'Today is ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '.'; } },
    { re: /\bhello|\bhi\b|\bhey\b|good morning|good evening/i, reply: function () { return 'Hello. I\u2019m your command assistant. Ask me to open a section, add a task, or brief you.'; } },
    { re: /^(?:add|create)\s+(?:a\s+)?(?:task|to.?do)\s*(?:to (?:my )?(?:list|checklist))?[:,]?\s+(.+)/i, tool: 'add_task', args: function (m) { return { label: m[1].trim().replace(/[.!?]+$/, '') }; } },
    { re: /^remind me to\s+(.+)/i, tool: 'add_task', args: function (m) { return { label: m[1].trim().replace(/[.!?]+$/, '') }; } },
    { re: /^(?:add|create)\s+(?:a\s+)?mission[:,]?\s+(.+)/i, tool: 'add_mission', args: function (m) { return { name: m[1].trim().replace(/[.!?]+$/, '') }; } },
    { re: /^(?:schedule|book)\s+(.+?)(?:\s+(?:on|for)\s+(.+))?$/i, tool: 'schedule_event', args: function (m) { return { title: (m[1] || '').trim(), when: m[2] || '' }; } },
    { re: /add\s+(.+?)\s+to\s+(?:my\s+)?calendar(?:\s+(?:on|for)\s+(.+))?/i, tool: 'schedule_event', args: function (m) { return { title: (m[1] || '').trim(), when: m[2] || '' }; } },
    { re: /\b(tasks?|to-?dos?|checklist)\b.*\b(left|remaining|open|outstanding)\b|what do i (still )?have (left|to do)|read (out )?(my )?(open |remaining )?tasks/i, tool: 'tasks_left', args: function () { return {}; } },
    { re: /what have i (completed|finished|done)( today| so far)?\b(?!.*(training|workout))|read (out )?(my )?completed (work|tasks)/i, tool: 'work_done_today', args: function () { return {}; } },
    { re: /have i (done|completed) (any )?training|what training.*(complete|done|finished)/i, tool: 'training_done_today', args: function () { return {}; } },
    { re: /read (?:me |out )?(?:my |the )?executive briefing/i, tool: 'read_source', args: function () { return { id: 'exec' }; } },
    { re: /read (?:me |out )?(?:my |today.?s )?(?:daily )?briefing/i, tool: 'read_source', args: function () { return { id: 'brief' }; } },
    { re: /read (?:me |out )?(?:my )?notifications/i, tool: 'read_source', args: function () { return { id: 'notif' }; } },
    { re: /read (?:me |out )?(?:my |today.?s )?(?:schedule|reminders|events)/i, tool: 'read_source', args: function () { return { id: 'schedule' }; } },
    // navigation — checked after the more specific patterns above so e.g. "read my briefing"
    // (a report) isn't swallowed by the bare "brief" nav keyword.
    { re: /open|go to|show|switch to|navigate to/i, tool: 'navigate', args: function (m, low) { var hit = NAV_FALLBACK.filter(function (n) { return n.re.test(low); })[0]; return hit ? { scene: hit.scene } : null; } },
  ];

  async function fallback(text, host) {
    var low = text.toLowerCase();
    for (var i = 0; i < FALLBACK_INTENTS.length; i++) {
      var f = FALLBACK_INTENTS[i];
      var m = text.match(f.re);
      if (!m) continue;
      if (f.reply) return f.reply();
      var args = f.args(m, low);
      if (!args) continue; // e.g. "open" matched but no known destination — keep looking
      return await toolByName(f.tool).run(args, host);
    }
    // bare nav keyword with no "open/go to" verb, e.g. "finance" or "my calendar"
    var navHit = NAV_FALLBACK.filter(function (n) { return n.re.test(low); })[0];
    if (navHit) return await toolByName('navigate').run({ scene: navHit.scene }, host);
    return host.hasGeneralProvider()
      ? null // let caller try live/general ask instead of a dead end
      : 'I need an AI provider connected to help with that — add one in Settings \u2192 AI Providers.';
  }

  // ---- entry point -----------------------------------------------------------
  async function handle(raw, host) {
    var t = (raw || '').trim();
    if (!t) return;
    if (host.hasGeneralProvider()) {
      var plan = await planWithLLM(t, host);
      if (plan) {
        var tool = toolByName(plan.tool);
        var out = await tool.run(plan.args || {}, host);
        if (out) host.speak(out);
        return;
      }
    }
    var out2 = await fallback(t, host);
    if (out2) { host.speak(out2); return; }
    // no local match and a provider exists — treat as a live/general question
    var isLive = /^(what|who|when|where|why|how|which|is|are|does|do|can)\b/i.test(t) || /\?\s*$/.test(t) || /\b(news|latest|today.?s|current|price of|weather|happening|score)\b/i.test(t);
    out2 = await (isLive ? toolByName('live_question') : toolByName('chat')).run(isLive ? { query: t } : { query: t, reply: '' }, host);
    if (out2) host.speak(out2);
  }

  root.VoiceAssistant = { handle: handle, TOOLS: TOOLS };
})(typeof window !== 'undefined' ? window : this);
