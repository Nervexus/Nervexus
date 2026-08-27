/* voice-assistant-engine.js — Loura's command layer.

   Loura is the app's voice assistant. Her name is also a wake word: LEAD strips it, so
   "Loura, log 500 ml of water" runs the same rule as the bare command. Common
   mis-hearings (Laura, Lora) are stripped too — the browser recogniser gets it wrong
   often enough that not covering them would swallow real commands.

   Two tiers, declared explicitly rather than discovered at runtime:

     LOCAL   Deterministic. Pattern match, extract slots, call a host tool. No provider,
             no key, no network beyond the app's own sync. Works when you are offline,
             out of credit, or have never connected anything.

     AI      Needs a model. Anything open-ended: questions, drafting, summarising, live
             lookups. Routed through host.ask/askStream, which the app points at the AI
             gateway (role 'voice').

   Local always wins. "Log 20 minutes of running" is a parse, not a prompt — sending it
   to a model would be slower, cost money, and could come back wrong. The AI tier is the
   fallback for what the rules genuinely cannot answer.

   That ordering is also what makes the no-key state honest: with nothing connected the
   assistant still does everything in the LOCAL tier, and says plainly which half of its
   abilities are asleep instead of failing at everything.

   ---- Host contract ------------------------------------------------------------
     firstName()                     -> string
     say(text)                       push an assistant line into the transcript
     speak(text)                     push AND speak it
     replaceLast(text)               swap the last assistant line (for streamed replies)
     hasAI()                         -> bool, is a provider connected right now
     ask(prompt)                     -> Promise<{text}|{error}>
     askStreamAndSpeak(prompt)       -> Promise<string>, speaks as it generates (optional)
     tools.<name>(...)               the LOCAL actions; see TOOLS below

   window.VoiceAssistant.handle(text, host)   run one utterance
   window.VoiceAssistant.manifest()           the two tiers, for the UI to render
*/
(function (root) {
  'use strict';

  // ---- helpers ----------------------------------------------------------------
  function num(v, dflt) { var n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? (dflt || 0) : n; }
  function list(a) { return a && a.length ? a.join(', ') : ''; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* Browser speech recognition mishears "log" more than any other word in these
     commands — "look", "lock", "logged", "blog", "vlog" all come back for it. Every one
     of those silently loses a real command, so they are normalised to "log" before any
     rule sees the text. Only at the very start of an utterance, where it can only be the
     verb: "look at my log" must stay a question, not become "log at my log". */
  var QTY = '(?:\\d|my\\s|a\\s|an\\s|some\\s|twenty|thirty|forty|fifty|ten|five|two|three|four|six|seven|eight|nine|half)';
  var MISHEARD_LOG = new RegExp('^(?:look|lock|logged|blog|vlog|lo|dog)\\b(?=\\s+' + QTY + ')', 'i');
  /* "add" comes back as "at" or "ad" constantly. Deliberately excludes "had", which is a
     real meal verb — "had chicken and rice at 600 calories" must stay a meal. */
  var MISHEARD_ADD = new RegExp('^(?:at|ad|and)\\b(?=\\s+' + QTY + ')', 'i');
  function fixVerb(t) { return t.replace(MISHEARD_LOG, 'log').replace(MISHEARD_ADD, 'add'); }

  /* People name the destination as well as the thing: "log 30 minutes of running ON MY
     TRAINING", "add a task to call the accountant TO MY LIST". The destination is already
     implied by the command, so in the extracted name it is noise — and left in, it comes
     straight back out of her mouth: "I've logged running on my training", which is not
     English. Stripped from every name a rule pulls out, not just the workout one. */
  // (?:^|\s+) not just \s+ — a name that is ONLY a destination ("log 20 minutes to my
  // log") has nothing before it to match, and would otherwise log an unnamed workout.
  // (?:my|the|your)\s* not \s+ — the recogniser returns "to myfitness log" as one token.
  var DEST = /(?:^|\s+)(?:on|in|to|into|onto|from|for)\s+(?:my|the|your)\s*(?:training|fitness|workout|exercise|gym|health|log|logs|tracker|diary|journal|list|checklist|task|tasks|note|notes|calendar|schedule|mission|missions|record|records|app|account)(?:\s+(?:log|list|tracker|diary|journal|centre|center))?$/i;
  function stripDest(t) {
    var prev; t = String(t || '').trim();
    do { prev = t; t = t.replace(DEST, '').trim(); } while (t !== prev);
    return t;
  }

  /* Spoken numbers show up constantly in dictation ("log twenty minutes"), and the
     browser's recogniser is inconsistent about which it returns. Cheap to cover. */
  var WORDS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
    eleven:11, twelve:12, fifteen:15, twenty:20, thirty:30, forty:40, fifty:50, sixty:60,
    ninety:90, hundred:100, 'a couple':2, 'a few':3, half:0.5 };
  function spoken(t) {
    return String(t).replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety|hundred|half)\b/gi,
      function (m) { return WORDS[m.toLowerCase()]; });
  }

  // ---- LOCAL tier ---------------------------------------------------------------
  // Each rule: { id, label, say (what the UI shows as an example), re, run(m, host) }.
  // `run` returns the spoken reply, or a Promise of one. Order matters — first match wins,
  // so put the specific patterns above the greedy ones.
  var SCENES = {
    home:'home', dashboard:'home', command:'home', 'command center':'home', 'command centre':'home',
    voice:'voice', assistant:'voice', fitness:'health', health:'health', training:'health',
    money:'biz', finance:'biz', business:'biz', learning:'learning', study:'learning',
    notes:'notes', calendar:'calendar', diary:'calendar', settings:'settings',
    providers:'providers', 'ai centre':'providers', 'ai center':'providers', intel:'intel',
    news:'intel', world:'intel', productivity:'productivity', tasks:'productivity'
  };

  // ORDER IS LOAD-BEARING — first match wins. Every rule whose trigger word is shared
  // with a broader one must sit above it. In particular the workout rule opens with a
  // bare `log <anything>`, so water, weight, sleep, money and meals all precede it or it
  // swallows them: "log my weight at 82 kilos" parsed as a workout called "weight"
  // lifting 82kg. The test suite pins each of those collisions.
  var LOCAL = [
    { id:'nav', acts:true, label:'Open a page', say:'"Open my fitness centre"',
      re:/^(?:open|go to|show|take me to|switch to)\s+(?:the\s+|my\s+)?(.+?)[.?!]*$/i,
      run:function (m, host) {
        // People name pages loosely — "fitness", "fitness centre", "the fitness page". Strip
        // the furniture words, try the whole phrase, then fall back to its head word.
        var want = m[1].toLowerCase()
          .replace(/\s+(page|screen|section|tab|centre|center|hub|terminal|assistant)$/,'').trim();
        var scene = SCENES[want] || SCENES[want.split(/\s+/)[0]];
        if (!scene) return null;                       // not a page — let another rule or the AI tier take it
        host.tools.nav(scene);
        return 'Opening your ' + want + ' now.';
      } },

    { id:'addTask', acts:true, label:'Add a task', say:'"Add a task to call the accountant"',
      re:/^(?:add|create|make)\s+(?:a\s+)?(?:new\s+)?task(?:\s+(?:to|for|called|named))?\s+(.+?)[.?!]*$/i,
      run:function (m, host) { var t = stripDest(m[1]); if (!t) return null; host.tools.addTask(cap(t)); return 'I’ve added “' + t + '” to your tasks.'; } },

    { id:'openTasks', label:'What is still open', say:'"What tasks do I have left?"',
      re:/^(?:what|which)?\s*(?:tasks?|to.?dos?)\s*(?:do i have|are)?\s*(?:left|open|outstanding|remaining|still)?[.?!]*$/i,
      run:function (m, host) {
        var open = host.tools.openTasks();
        return open.length ? 'You have ' + plural(open.length, 'task') + ' left: ' + list(open) + '.'
                           : 'Nothing left — your task list is clear.';
      } },

    { id:'doneToday', label:'What you finished today', say:'"What have I done today?"',
      re:/^(?:what|how much)\s+(?:have\s+)?i\s+(?:done|finished|completed|got done)\s*(?:today|so far)?[.?!]*$/i,
      run:function (m, host) {
        var d = host.tools.doneToday(), parts = [];
        if (d.tasks.length) parts.push(plural(d.tasks.length, 'task') + ' done: ' + list(d.tasks));
        if (d.missions.length) parts.push(plural(d.missions.length, 'mission') + ' complete: ' + list(d.missions));
        return parts.length ? parts.join('. ') + '.' : 'Nothing marked complete yet today.';
      } },

    { id:'trainingToday', label:'Training logged today', say:'"What did I train today?"',
      re:/^(?:what|how much)\s+(?:did\s+)?i\s+(?:train|lift|work ?out|exercise)\w*\s*(?:today)?[.?!]*$/i,
      run:function (m, host) {
        var d = host.tools.trainingToday();
        return d.length ? 'Today: ' + list(d) + '.' : 'No training logged today yet.';
      } },

    { id:'addMission', acts:true, label:'Add a mission', say:'"Add a mission called cold shower"',
      re:/^(?:add|create|start)\s+(?:a\s+)?(?:new\s+)?mission(?:\s+(?:called|named|for|to))?\s+(.+?)[.?!]*$/i,
      run:function (m, host) { var t = stripDest(m[1]); if (!t) return null; host.tools.addMission(cap(t)); return 'I’ve added the mission “' + t + '” for you.'; } },

    { id:'remember', acts:true, label:'Remember a fact', say:'"Remember that my gym closes at ten"',
      /* "down" is part of the verb — without it "note down my thoughts" stored the fact as
         "down my thoughts". */
      re:/^(?:remember|note down|note|jot down|write down|keep in mind)\s+(?:that\s+)?(.+?)[.?!]*$/i,
      run:function (m, host) {
        var fact = m[1].trim(); if (!fact) return null;
        /* This rule sits above the workout one, so "note down 30 minutes of cycling" was
           being filed as a memory rather than logged. A quantity with a unit attached is a
           log, not a fact worth remembering — decline and let the right rule have it. */
        if (/\d+\s*(?:mins?|minutes?|hrs?|hours?|kgs?|kilos?|kilograms?|lbs?|pounds?|ml|l\b|litres?|liters?|sets?|reps?|k?cals?|calories)\b/i.test(fact)) return null;
        host.tools.addMemory(fact);
        // Colon, not "remember that" — the latter only reads correctly for facts phrased as
        // a clause, and comes out as "I'll remember that my thoughts" for anything else.
        return 'Noted — I’ll remember: ' + fact + '.';
      } },

    { id:'schedule', acts:true, label:'Schedule an event', say:'"Schedule a dentist appointment on Friday at 3pm"',
      re:/^(?:schedule|book|put in|add)\s+(?:a\s+|an\s+)?(.+?)\s+(?:on|for|at)\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var r = host.tools.scheduleEvent(cap(m[1].trim()), m[2].trim());
        return 'I’ve scheduled “' + m[1].trim() + '” for ' + r.date + (r.time ? ' at ' + r.time : '') + '.';
      } },

    { id:'completeTask', acts:true, label:'Tick a task off', say:'"Mark call the accountant as done"',
      re:/^(?:mark|tick|check)\s+(?:off\s+)?(?:the\s+)?(?:task\s+)?(.+?)(?:\s+(?:as\s+)?(?:done|off|complete[d]?))?[.?!]*$|^(?:i(?:’|')?ve\s+)?(?:done|finished|completed)\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var want = stripDest(m[1] || m[2] || ''); if (!want) return null;
        var hit = host.tools.completeTask(want);
        if (hit === null) return null;                 // no such open task — let the AI tier try
        return 'I’ve ticked off “' + hit + '” for you.';
      } },

    { id:'completeMission', acts:true, label:'Complete a mission', say:'"Complete my cold shower mission"',
      re:/^(?:complete|finish|did)\s+(?:my\s+|the\s+)?(.+?)\s*mission[.?!]*$|^(?:complete|finish)\s+mission\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var want = (m[1] || m[2] || '').trim(); if (!want) return null;
        var hit = host.tools.completeMission(want);
        return hit === null ? 'I couldn’t find an open mission matching “' + want + '”.' : 'I’ve marked “' + hit + '” complete for you.';
      } },

    { id:'askWater', label:'Water so far today', say:'"How much water have I had?"',
      re:/^how\s+much\s+water\s+(?:have\s+)?i\s+(?:had|drunk|drank)\s*(?:today)?[.?!]*$|^water\s+(?:today|so far)[.?!]*$/i,
      run:function (m, host) {
        var w = host.tools.waterToday(); if (!w) return 'I can’t read your hydration log right now.';
        if (!w.ml) return 'No water logged yet today.';
        var pct = w.goalMl ? Math.round(w.ml / w.goalMl * 100) : 0;
        return w.ml + ' ml so far' + (w.goalMl ? ' — ' + pct + '% of your ' + w.goalMl + ' ml goal.' : '.');
      } },

    { id:'askWeight', label:'Latest body weight', say:'"What is my weight?"',
      re:/^(?:what(?:’|')?s|what is|how much do i weigh)\s*(?:my\s+)?(?:current\s+|latest\s+)?(?:body\s*)?weight[.?!]*$|^how much do i weigh[.?!]*$/i,
      run:function (m, host) {
        var w = host.tools.latestWeight();
        return w ? 'Your last logged weight is ' + w.kg + ' kg.' : 'You haven’t logged a weight yet.';
      } },

    { id:'askSleep', label:'Last night’s sleep', say:'"How did I sleep?"',
      re:/^how\s+(?:did\s+i\s+sleep|much\s+sleep\s+did\s+i\s+get)\s*(?:last night)?[.?!]*$/i,
      run:function (m, host) {
        var sl = host.tools.lastSleep(); if (!sl) return 'No sleep logged yet.';
        var bits = [];
        if (sl.hours) bits.push(plural(sl.hours, 'hour'));
        if (sl.minutes) bits.push(sl.minutes + ' min');
        return bits.length ? 'You logged ' + bits.join(' ') + '.' : 'No sleep logged yet.';
      } },

    { id:'askFood', label:'Calories and protein logged', say:'"How many calories have I had?"',
      re:/^how\s+many\s+(?:calories|kcal)\s+(?:have\s+)?i\s+(?:had|eaten)\s*(?:today)?[.?!]*$|^what\s+have\s+i\s+eaten\s*(?:today)?[.?!]*$/i,
      run:function (m, host) {
        // Deliberately says "on your meal list" rather than "today": meal entries carry no
        // date, so a daily figure would be invented.
        var f = host.tools.foodLogged();
        if (!f.count) return 'Nothing on your meal list yet.';
        return plural(f.count, 'meal') + ' on your list — ' + f.kcal + ' kcal and ' + f.protein + ' g of protein.';
      } },

    { id:'askMoney', label:'Money in and out today', say:'"How much have I spent today?"',
      re:/^how\s+much\s+(?:have\s+)?i\s+(spent|earned|made)\s*(?:today)?[.?!]*$/i,
      run:function (m, host) {
        var mo = host.tools.moneyToday();
        if (/spent/i.test(m[1])) return mo.expenses ? 'You’ve logged ' + mo.expenses + ' in expenses today.' : 'No expenses logged today.';
        return mo.income ? 'You’ve logged ' + mo.income + ' in income today.' : 'No income logged today.';
      } },

    { id:'askAgenda', label:'What is on today or tomorrow', say:'"What is on tomorrow?"',
      re:/^what(?:(?:’|')s| is)?\s+(?:on|happening|scheduled)\s*(today|tomorrow)?[.?!]*$|^(?:what(?:(?:’|')s| is)\s+)?(?:my\s+)?(?:agenda|schedule|diary)\s*(?:for\s+)?(today|tomorrow)?[.?!]*$/i,
      run:function (m, host) {
        var when = (m[1] || m[2] || 'today').toLowerCase();
        var date = when === 'tomorrow' ? host.tools.dateStrIn(1) : host.tools.todayStr();
        var ev = host.tools.eventsOn(date);
        return ev.length ? cap(when) + ': ' + list(ev) + '.' : 'Nothing in the calendar for ' + when + '.';
      } },

    { id:'askMissions', label:'Missions left today', say:'"What missions do I have left?"',
      re:/^(?:what|which|how many)\s+missions?\s*(?:do\s+i\s+have\s+)?(?:left|open|remaining|outstanding)?[.?!]*$/i,
      run:function (m, host) {
        var left = host.tools.missionsLeft();
        return left.length ? plural(left.length, 'mission') + ' left: ' + list(left) + '.' : 'All missions done for today.';
      } },

    { id:'logWater', acts:true, label:'Log water', say:'"Log 500 ml of water"',
      re:/^(?:log|add|drank|had)\s+(?:my\s+)?(.+?)\s*(?:of\s+)?water[.?!]*$|^(?:log|add)\s+water\s*(.*)$/i,
      run:function (m, host) {
        var amt = /(\d+(?:\.\d+)?)\s*(ml|l|litres?|liters?|glass|glasses|cups?)?/i.exec(spoken(m[1] || m[2] || ''));
        var ml = 250;
        if (amt) {
          var v = num(amt[1], 1), u = (amt[2] || 'ml').toLowerCase();
          ml = /^(l|litre|liter)/.test(u) ? v * 1000 : /glass|cup/.test(u) ? v * 250 : v;
        }
        host.tools.logHydration(ml);
        return 'I’ve logged ' + ml + ' ml of water for you.';
      } },

    { id:'logWeight', acts:true, label:'Log body weight', say:'"Log my weight at 82 kilos"',
      re:/^(?:log|record|set)\s+(?:my\s+)?(?:body\s*)?weight\s*(?:at|as|to|is)?\s*(.+?)[.?!]*$/i,
      run:function (m, host) {
        var kg = num(spoken(m[1])); if (!kg) return null;
        host.tools.logWeight(kg); return 'I’ve logged your weight at ' + kg + ' kg.';
      } },

    { id:'logSleep', acts:true, label:'Log sleep', say:'"Log 7 hours 30 minutes of sleep"',
      re:/^(?:log|record)\s+(?:my\s+)?(.*?)\s*(?:of\s+)?sleep[.?!]*$|^(?:i\s+)?slept\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var t = spoken(m[1] || m[2] || '');
        var h = /(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)/i.exec(t);
        var mi = /(\d+)\s*(?:m|mins?|minutes?)/i.exec(t);
        if (!h && !mi) return null;
        host.tools.logSleep(h ? num(h[1]) : 0, mi ? num(mi[1]) : 0);
        return 'I’ve logged ' + (h ? plural(num(h[1]), 'hour') : '') + (mi ? (h ? ' ' : '') + mi[1] + ' min' : '') + ' of sleep for you.';
      } },

    { id:'logMoney', acts:true, label:'Log income or an expense', say:'"Log an expense of 40 pounds for fuel"',
      re:/^(?:log|record|add)\s+(?:an?\s+)?(income|expense|payment|spend|cost)\s*(?:of\s*)?(.+?)[.?!]*$/i,
      run:function (m, host) {
        var t = spoken(m[2]);
        var amt = /(\d+(?:\.\d+)?)/.exec(t); if (!amt) return null;
        var label = t.replace(/[£$€]?\d+(?:\.\d+)?/,'').replace(/^\s*(?:for|on|from)\s+/i,'').trim() || 'Unlabelled';
        var isIncome = /income|payment/i.test(m[1]);
        if (isIncome) host.tools.logIncome(cap(label), num(amt[1]));
        else host.tools.logExpense(cap(label), num(amt[1]));
        return 'I’ve logged that ' + (isIncome ? 'income' : 'expense') + ' — ' + label + ', ' + num(amt[1]) + '.';
      } },

    { id:'logMeal', acts:true, label:'Log a meal', say:'"Log chicken and rice at 600 calories"',
      re:/^(?:log|ate|had)\s+(?:a\s+|some\s+)?(.+?)(?:\s+(?:at|with)\s+(.+))?[.?!]*$/i,
      run:function (m, host) {
        var extra = spoken(m[2] || '');
        var kcal = /(\d+(?:\.\d+)?)\s*(?:k?cal|calories)/i.exec(extra);
        var pro  = /(\d+(?:\.\d+)?)\s*g?\s*(?:of\s+)?protein/i.exec(extra);
        if (!kcal && !pro) return null;                // no nutrition figures — not a meal log
        host.tools.logMeal(cap(m[1].trim()), kcal ? num(kcal[1]) : 0, pro ? num(pro[1]) : 0);
        return 'I’ve logged ' + m[1].trim() + (kcal ? ' at ' + num(kcal[1]) + ' kcal' : '') + ' for you.';
      } },

    { id:'logWorkout', acts:true, label:'Log a workout', say:'"Log 30 minutes of running" · "Add bench press 3 sets of 8 at 60 kilos"',
      /* "add"/"record"/"put down" as well as "log" — people say "add 30 minutes of cycling
         to my fitness log" at least as often, and it matched nothing at all. Safe here
         because every specific "add X" rule (task, mission, note, water) sits above this
         one and claims its own utterance first. */
      /* Every way of saying "record this" that people actually use. Started as "log" only,
         which missed "add 30 minutes of cycling" entirely.

         Safe despite the breadth, for two reasons. Every specific rule — add a task, add a
         mission, add a note, log water — sits above this one and claims its own utterance
         first. And this rule declines unless it finds a duration, a set count or a weight,
         so "put the kettle on" falls through rather than logging nonsense.

         The past-tense forms overlap with completeTask ("finished the shopping"), which is
         also above this rule and declines when no such task exists — so "finished 30
         minutes of cycling" tries the task list, misses, and lands here. */
      re:/^(?:log|logged|logging|add|added|record|recorded|put down|put in|put|track|tracked|enter|mark|note down|chuck in|stick in|bang in|(?:i\s+)?(?:just\s+)?(?:did|done|finished|completed))\s+(?:my\s+)?(.+?)[.?!]*$/i,
      run:function (m, host) {
        var t = spoken(m[1]);
        // "<exercise> N sets of M at W kg" | "N minutes of <exercise>" | "<exercise> for N minutes"
        var sets = /(\d+(?:\.\d+)?)\s*(?:sets?|x)\b/i.exec(t);
        var reps = /(?:of|x)\s*(\d+(?:\.\d+)?)\s*(?:reps?)?\b/i.exec(t);
        var wt   = /(?:at|with|@)\s*(\d+(?:\.\d+)?)\s*(kg|kilos?|kilograms?|lbs?|pounds?)\b/i.exec(t);
        var mins = /(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?)\b/i.exec(t);
        if (!sets && !mins && !wt) return null;        // not a workout shape — fall through
        var name = t
          .replace(/(\d+(?:\.\d+)?)\s*(?:sets?|x)\b/ig,'')
          .replace(/(?:of|x)\s*(\d+(?:\.\d+)?)\s*(?:reps?)?\b/ig,'')
          .replace(/(?:at|with|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?|lbs?|pounds?)\b/ig,'')
          .replace(/(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?)\b/ig,'')
          .replace(/\b(?:of|for|doing|did)\b/ig,' ')
          .replace(/\s+/g,' ').trim();
        name = stripDest(name);
        if (!name) return null;
        /* If the exercise is one the app knows, use its proper name rather than whatever
           survived the parse. Turns "on the stairmaster" into "Stairmaster" and
           "hammer curls" into "Hammer Curl", so the log reads consistently however it was
           said, and so does the reply. */
        if (host.tools.exerciseName) name = host.tools.exerciseName(name) || name;
        host.tools.logWorkout(cap(name), mins ? num(mins[1]) : 0, wt ? num(wt[1]) : 0,
                              sets ? num(sets[1]) : 0, reps ? num(reps[1]) : 0);
        /* Read it back as a sentence, not as fields. "running — 30 min" is how the data
           is shaped; "30 minutes of running" is how it was said to us. */
        var unit = wt && /lb|pound/i.test(wt[2]) ? 'lb' : 'kg';
        var what;
        if (mins && !sets) {
          what = plural(num(mins[1]), 'minute') + ' of ' + name.toLowerCase();
        } else if (sets) {
          what = name + ', ' + sets[1] + ' set' + (num(sets[1]) === 1 ? '' : 's')
               + (reps ? ' of ' + reps[1] : '')
               + (wt ? ' at ' + wt[1] + ' ' + unit : '')
               + (mins ? ' over ' + plural(num(mins[1]), 'minute') : '');
        } else {
          what = name + (wt ? ' at ' + wt[1] + ' ' + unit : '');
        }
        return 'I’ve logged ' + what + ' on your fitness log for you.';
      } },

    { id:'addNote', acts:true, label:'Save a note', say:'"Make a note called ideas — buy the domain"',
      re:/^(?:make|add|save|write)\s+(?:a\s+)?note(?:\s+(?:called|titled|named))?\s+(.+?)(?:\s*[—–:-]\s*(.+))?[.?!]*$/i,
      run:function (m, host) { var t = stripDest(m[1]); if (!t) return null; host.tools.addNote(cap(t), (m[2] || '').trim()); return 'I’ve saved that note for you.'; } },

    { id:'time', label:'Time and date', say:'"What is the date?"',
      re:/^(?:what(?:’s| is)?\s+(?:the\s+)?)?(time|date|day)(?:\s+is\s+it)?[.?!]*$/i,
      run:function (m) {
        var d = new Date();
        if (/time/i.test(m[1])) return 'It’s ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) + '.';
        return 'It’s ' + d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }) + '.';
      } },

    { id:'whoAreYou', label:'Ask who she is', say:'"What is your name?"',
      re:/^(?:what(?:(?:’|')s| is)\s+your\s+name|who\s+are\s+you|what\s+(?:are\s+you\s+)?called)[.?!]*$/i,
      run:function (m, host) {
        return 'I’m Loura, ' + host.firstName() + ' — your assistant in here.';
      } },

    { id:'capabilities', label:'Ask what she can do', say:'"What can you do?"',
      re:/^(?:what\s+can\s+you\s+do|help|what\s+are\s+your\s+(?:commands|abilities))[.?!]*$/i,
      run:function (m, host) {
        var n = LOCAL.length;
        return 'I can handle about ' + n + ' things on my own — logging training, food, sleep, money and notes, '
             + 'adding tasks and missions, scheduling, and telling you what you’ve done. '
             + (host.hasAI() ? 'Anything else I’ll think through with your connected AI provider.'
                             : 'Open questions need an AI provider connected in the AI centre.');
      } },

    { id:'stop', acts:true, label:'Turn the assistant off', say:'"That will be all"',
      re:/^(?:that(?:’|')?(?:ll| will) be all|stop listening|go to sleep|shut (?:up|down)|turn off)[.?!]*$/i,
      run:function (m, host) { host.tools.disableAssistant(); return 'Going quiet. Tap Hold to talk when you need me.'; } }

  ];

  // ---- AI tier ------------------------------------------------------------------
  var AI_TASKS = [
    { id:'question', label:'Answer a question', say:'"Why do my knees hurt after squats?"' },
    { id:'advice',   label:'Talk something through', say:'"Help me plan next week’s training"' },
    { id:'draft',    label:'Draft or rewrite text', say:'"Draft a message postponing Friday"' },
    { id:'summary',  label:'Summarise your data', say:'"How has my training gone this month?"' }
  ];

  /* Two-beat replies for anything that changes something: acknowledge first, act, then
     confirm what actually happened. The gap is real work — a Supabase write and a state
     update — and silence across it reads as the assistant having missed you.

     Queries are single-beat on purpose: "let me check" in front of an answer we already
     have is theatre. */
  var ACKS = ['Okay, doing that now.', 'Sure — one moment.', 'On it.', 'Right, let me get that.'];
  var ackAt = 0;
  function nextAck() { var a = ACKS[ackAt % ACKS.length]; ackAt++; return a; }

  /* An utterance that opens like a question is genuinely something only a model can
     answer; anything else that failed to match is far more likely to be a command she
     misheard or a phrasing she does not know. Telling someone to go and buy an API key
     because their microphone dropped a consonant is the wrong answer to the wrong
     problem — and it was what she said to everything she could not parse. */
  var QUESTIONY = /^(?:why|how|what|when|who|where|which|should|could|can|do|does|is|are|explain|tell me|help me|draft|write|summar|plan)\b/i;

  function unmatchedReply(text, host) {
    if (QUESTIONY.test(text)) {
      return host.hasAI()
        ? 'I couldn’t get an answer to that one just now.'
        : 'That one needs an AI provider — there isn’t one connected yet. Everything I do on my own still works.';
    }
    return 'Sorry, I didn’t catch that. Say it again?';
  }

  // ---- dispatch -----------------------------------------------------------------
  /* Which rule would claim this utterance, without running it. Only the regex is
     consulted — a rule that matches but then declines (returns null) is still reported
     here, which is why the acknowledgement can occasionally precede a fall-through to
     the AI tier. That is the right trade: a stray "one moment" is far cheaper than
     silence on every real command. */
  function matchRule(text) {
    for (var i = 0; i < LOCAL.length; i++) if (LOCAL[i].re.test(text)) return LOCAL[i];
    return null;
  }

  function runLocal(text, host) {
    for (var i = 0; i < LOCAL.length; i++) {
      var m = LOCAL[i].re.exec(text);
      if (!m) continue;
      var out;
      try { out = LOCAL[i].run(m, host); }
      catch (e) { return { handled:true, reply:'I understood that but couldn’t save it — ' + ((e && e.message) || 'something went wrong') + '.' }; }
      if (out === null || out === undefined) continue;   // rule declined — keep looking
      return { handled:true, reply:out, id:LOCAL[i].id, acts:!!LOCAL[i].acts };
    }
    return { handled:false };
  }

  /* Dictated speech arrives wrapped in politeness and wake words. Stripping it here means
     every rule's pattern stays about the command itself rather than each one having to
     tolerate "hey, could you please ... for me, thanks". */
  var LEAD = /^(?:hey|ok(?:ay)?|hi|hello|yo|loura|laura|lora|nervexus|assistant|please|now)\b[,\s]*/i;
  var POLITE = /^(?:(?:can|could|would|will)\s+you\s+)?(?:please\s+)?/i;
  var TRAIL = /[,\s]*(?:please|for me|thanks|thank you|mate|now)[.?!]*$/i;
  function tidy(t) {
    var prev;
    do { prev = t; t = t.replace(LEAD, '').replace(TRAIL, ''); } while (t !== prev);
    return t.replace(POLITE, '').trim();
  }

  function handle(text, host) {
    var t = fixVerb(tidy(String(text || '').trim()));
    if (!t) return Promise.resolve();

    // Peek first so the acknowledgement lands BEFORE the work, not after it.
    var rule = matchRule(t);
    if (rule && rule.acts && host.ack) host.ack(nextAck());

    var local = runLocal(t, host);
    if (local.handled) { host.speak(local.reply); return Promise.resolve(local.reply); }

    if (!host.hasAI()) { host.speak(unmatchedReply(t, host)); return Promise.resolve(); }

    if (host.askStreamAndSpeak) return host.askStreamAndSpeak(t);
    host.say('…');
    return host.ask(t).then(function (res) {
      var reply = res && res.text ? res.text : ((res && res.error) || 'I couldn’t get an answer just then.');
      host.replaceLast(reply);
      if (res && res.text) host.speak2 ? host.speak2(reply) : host.speak(reply);
      return reply;
    });
  }

  root.VoiceAssistant = {
    handle: handle,
    /* The two tiers, for the voice page to render. `needsKey` is the whole point: the
       app can show exactly what still works with nothing connected. */
    manifest: function () {
      return {
        local: LOCAL.map(function (r) { return { id:r.id, label:r.label, example:r.say, needsKey:false }; }),
        ai: AI_TASKS.map(function (r) { return { id:r.id, label:r.label, example:r.say, needsKey:true }; })
      };
    },
    /* Exposed for tests: run the rules without a host doing any speaking. */
    _matchLocal: function (text) { var r = matchRule(text); return r ? r.id : null; }
  };

}(window));
