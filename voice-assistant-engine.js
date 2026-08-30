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
  /* Reads the FIRST number in the text. The old version stripped every non-digit from the
     whole string and parsed what was left, so "7 hours 30" came back as 730 and any text
     carrying two figures silently produced a third one that was in neither. Thousands
     separators are dropped first so "1,250" still reads as 1250 rather than 1. */
  function num(v, dflt) {
    var m = /\d+(?:\.\d+)?/.exec(String(v == null ? '' : v).replace(/,(?=\d{3}(?!\d))/g, ''));
    return m ? parseFloat(m[0]) : (dflt || 0);
  }
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
  /* Caught in real use: "Loura, log an expense of £1" came back as "Logan expense of £1".
     The wake word and the verb collapse into a name, and no amount of widening the money
     rule helps because the verb is simply not there any more.

     Rewritten ONLY in front of a word a rule is already waiting for, so someone genuinely
     called Logan can still be a task, a note or a calendar entry. Same for the "log on" /
     "log in" / "login" family, which is what the recogniser does with "log an" the rest of
     the time — and which the trailing-request handler already has to cope with. */
  var MISHEARD_LOGAN = /^(?:logan|logon|login|log\s+(?:on|in))\b(?=\s+(?:an?\s+)?(?:expense|income|payment|spend|cost|entry|amount)\b)/i;
  function fixVerb(t) {
    return t.replace(MISHEARD_LOGAN, 'log an').replace(MISHEARD_LOG, 'log').replace(MISHEARD_ADD, 'add');
  }

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
  /* ---- spoken numbers -------------------------------------------------------------
     People say numbers as words at least as often as they say digits, and the old version
     substituted each word independently against a table that was missing seventy and
     eighty entirely. "Log my weight at eighty two kilos" became "eighty 2 kilos", and the
     weight went into the body log as 2 kg — not a refusal you would notice, a wrong number
     you would not. "Seven and a half hours of sleep" logged 30 minutes. Its 'a couple' and
     'a few' entries could never fire at all, being two words behind a single-word regex.

     So numbers are accumulated properly here: tens plus units, N hundred/thousand with an
     optional "and", a trailing "and a half", and the quantity words people actually use
     ("a couple of", "a few", "a dozen").

     A bare "a"/"an" becomes 1 ONLY in front of a unit of measurement. That is what makes
     "a litre of water" mean a litre while "add a task to call the accountant" is left
     completely alone — and it is why MEASURE below lists no one-letter words except the
     unambiguous ones: a bare "g" or "p" would turn ordinary sentences into numbers. */
  var UNITS = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8,
    nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
    seventeen:17, eighteen:18, nineteen:19 };
  var TENS = { twenty:20, thirty:30, forty:40, fourty:40, fifty:50, sixty:60, seventy:70,
    eighty:80, ninety:90 };
  var SCALE = { hundred:100, thousand:1000 };
  var FRACTION = { half:0.5, quarter:0.25 };
  var MEASURE = /^(?:ml|mls|l|litres?|liters?|glass|glasses|cups?|pints?|hours?|hrs?|hr|minutes?|mins?|seconds?|secs?|kilos?|kilograms?|kgs?|kg|pounds?|lbs?|lb|stones?|grams?|calories?|kcals?|cals?|sets?|reps?|miles?|kilometres?|kilometers?|kms?|km|quid|dollars?|euros?|dozen|couple)$/i;

  /* Recogniser substitutions that ONLY get applied on a retry — after a rule has matched
     its shape and come up with no figure at all, where a number is definitely what was
     meant. "Three" comes back as "free" constantly, and rewriting it everywhere would turn
     "log a free coffee" into "log a 3 coffee"; on the retry path there is nothing to lose,
     because the alternative is dropping the command.

     Deliberately NOT here: "for" -> "four" and "too" -> "two". They would invent an amount
     out of an ordinary preposition, and a wrong figure is worse than a refusal. */
  var NUM_MISHEARD = [[/\bfree\b/gi, 'three'], [/\bfree\b/gi, 'three']];
  function fixNums(t) {
    var o = String(t == null ? '' : t);
    for (var i = 0; i < NUM_MISHEARD.length; i++) o = o.replace(NUM_MISHEARD[i][0], NUM_MISHEARD[i][1]);
    return o;
  }

  /* ---- money slots ---------------------------------------------------------------------
     Direction is a word, not a sentence position. Two lists, and whichever appears first in
     the utterance wins, so "I spent my salary" is money going out. */
  var MONEY_OUT = /\b(?:spent|spend|spending|paid|pay|paying|bought|buy|buying|cost|costs|charged|expense|expenses|outgoing|outgoings|withdrew|withdrawn|bill|bills)\b/i;
  var MONEY_IN  = /\b(?:earned|earn|earning|earnings|made|make|making|income|salary|wages?|invoiced?|received|receive|takings?|revenue|refund|refunded|dividend|bonus|got\s+paid|came\s+in)\b/i;
  var MONEY_ANY = new RegExp('(?:' + MONEY_OUT.source + '|' + MONEY_IN.source + ')', 'i');
  /* Only the words that name the RECORD come out of the label. Some direction words are the
     label — "the phone BILL", "income from SALARY", "a REFUND from Amazon" — and stripping
     those left entries called "Phone" and "Unlabelled". */
  var MONEY_META = /\b(?:spent|spend|spending|paid|pay|paying|bought|buy|buying|cost|costs|charged|expense|expenses|outgoings?|withdrew|withdrawn|earned|earn|earning|earnings|made|make|making|income|received|receive|got\s+paid|came\s+in)\b/gi;

  /* Units that make a figure a MEASUREMENT rather than money. Without this, "I spent 30
     minutes running" logs a £30 expense — "spent" is a direction word and 30 is a number.
     Deliberately omits "pounds" AND "lbs", which in a money sentence are currency, not
     weight — the recogniser writes "45 pounds" as "45 lbs", and the figure was being thrown
     away as a measurement. A body weight in pounds is claimed by the weight rule, which runs
     before this one. */
  var NOT_MONEY_UNIT = /^(?:mins?|minutes?|hours?|hrs?|h|secs?|seconds?|kgs?|kg|kilos?|kilograms?|stones?|ml|mls|l|litres?|liters?|kms?|km|miles?|mi|cals?|kcals?|calories|reps?|sets?|steps?|percent|degrees?|times?|days?|weeks?|months?|years?)$/i;
  var MONEY_MULT = /^(?:k|grand|thousand)$/i;

  /* Returns the first figure in the text that reads as money, with the exact substring it
     came from so the label can have it removed. The trailing word is only swallowed when it
     is a currency or a multiplier — otherwise "spent 40 on petrol" would lose "petrol". */
  function moneyAmount(text) {
    var re = /([£$€])?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-z]+)?/gi, m;
    while ((m = re.exec(String(text || '')))) {
      var cur = m[1] || '', v = parseFloat(m[2].replace(/,/g, '')), word = (m[3] || '');
      if (!(v > 0)) continue;
      var consumed = (cur ? cur : '') + m[2];
      if (MONEY_MULT.test(word)) { v *= 1000; consumed = m[0]; }
      else if (word && NOT_MONEY_UNIT.test(word) && !cur) continue;   // a measurement
      else if (/^(?:pounds?|quid|dollars?|euros?|pence|gbp|usd|eur)$/i.test(word)) consumed = m[0];
      return { value: Math.round(v * 100) / 100, text: consumed };
    }
    return null;
  }

  /* One breath can carry several transactions: "I charged 120 for the job, paid £950 in rent,
     a coffee for £3.50 and got paid 2,400 today". That was read as ONE entry — £120, labelled
     "job 950 rent but coffee 3.50 2,400" — the first figure kept and every other figure swept
     into the label. Silent, partial and wrong, which is the worst of the three.

     So the utterance is cut into pieces carrying one figure each: first at the conjunctions,
     then, for a piece still holding two, immediately before the direction word that introduces
     the later one — falling back to the figure itself when there is no such word. */
  function moneyChunks(text) {
    var AMT_G = /([£$€])?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/g;
    var count = function (x) { AMT_G.lastIndex = 0; var n = 0; while (AMT_G.exec(x)) n++; return n; };
    var parts = String(text || '').split(/\b(?:and|but|then|also|plus)\b|,(?=\s)/i)
                  .filter(function (x) { return x && x.trim(); });
    var out = [], guard = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      while (count(p) > 1 && guard++ < 20) {
        AMT_G.lastIndex = 0; var first = AMT_G.exec(p);
        var after = first.index + first[0].length;
        var anyRe = new RegExp(MONEY_ANY.source, 'ig'); anyRe.lastIndex = after;
        var nxt = anyRe.exec(p);
        if (nxt && nxt.index > after) { out.push(p.slice(0, nxt.index)); p = p.slice(nxt.index); continue; }
        /* Two figures and no direction word between them is not two transactions — it is one
           transaction whose LABEL contains a number. "An expense of 1 pound for demo 1" was
           being cut into "…for demo" plus a phantom second entry of 1. Leave it whole. */
        break;
      }
      out.push(p);
    }
    return out.map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function spoken(t) {
    var parts = String(t == null ? '' : t).split(/(\s+)/);   // words at even indices, gaps at odd
    var idx = []; for (var i = 0; i < parts.length; i += 2) idx.push(i);
    var W = function (n) { return (parts[idx[n]] || '').toLowerCase().replace(/[^a-z]/g, ''); };
    var TAIL = function (n) { var m = /[^A-Za-z]*$/.exec(parts[idx[n]] || ''); return m ? m[0] : ''; };

    // "seven and a half", "an hour and a half"
    function withHalf(val, used, n) {
      if (W(n + used) === 'and' && (W(n + used + 1) === 'a' || W(n + used + 1) === 'an')
          && FRACTION[W(n + used + 2)] != null) return { val: val + FRACTION[W(n + used + 2)], used: used + 3 };
      return { val: val, used: used };
    }

    /* The standard accumulator: units and tens add into the current group, "hundred"
       multiplies that group, "thousand" banks it and starts a new one. A single lookahead
       could not do this — "one thousand two hundred" came out as 1002. */
    function readNumber(n) {
      var result = 0, current = 0, sawAny = false, k = n, w0 = W(n);

      if (w0 === 'a' || w0 === 'an') {
        if (W(n + 1) === 'couple')     return { val: 2,  used: W(n + 2) === 'of' ? 3 : 2 };
        if (W(n + 1) === 'few')        return { val: 3,  used: 2 };
        if (W(n + 1) === 'dozen')      return { val: 12, used: 2 };
        if (SCALE[W(n + 1)] != null)   { current = 1; sawAny = true; k = n + 1; }
        else if (MEASURE.test(W(n + 1))) return withHalf(1, 1, n);
        else return null;
      } else if (FRACTION[w0] != null) {
        if ((W(n + 1) === 'a' || W(n + 1) === 'an') && MEASURE.test(W(n + 2))) return { val: FRACTION[w0], used: 2 };
        if (MEASURE.test(W(n + 1))) return { val: FRACTION[w0], used: 1 };
        return null;
      }

      while (k < idx.length) {
        var w = W(k);
        if (UNITS[w] != null) { current += UNITS[w]; sawAny = true; k++; continue; }
        if (TENS[w]  != null) { current += TENS[w];  sawAny = true; k++; continue; }
        if (SCALE[w] != null) {
          if (!sawAny) { current = 1; sawAny = true; }
          if (SCALE[w] >= 1000) { result += current * SCALE[w]; current = 0; }
          else current *= SCALE[w];
          k++; continue;
        }
        // "and" only continues the number when another number word follows it
        if (w === 'and' && sawAny) {
          var nx = W(k + 1);
          if (UNITS[nx] != null || TENS[nx] != null || SCALE[nx] != null) { k++; continue; }
        }
        break;
      }
      if (!sawAny) return null;
      return withHalf(result + current, k - n, n);
    }

    var n = 0;
    while (n < idx.length) {
      var r = readNumber(n);
      if (!r) { n++; continue; }
      parts[idx[n]] = String(r.val) + TAIL(n + r.used - 1);
      for (var d = 1; d < r.used; d++) { parts[idx[n + d]] = ''; parts[idx[n + d] - 1] = ''; }
      n += r.used;
    }
    return parts.join('').replace(/\s+/g, ' ').trim();
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

  /* ---- workout parsing, shared ----------------------------------------------------
     Pulled out of the rule so the confirmation path can reuse it. It has to work on text
     with no command verb at all ("3 minutes run"), because that is exactly the case where
     the recogniser has dropped the verb and Loura needs to ask rather than give up.

     `quantified` is the honest signal: true only when a duration, set count or weight was
     actually found. The rule requires it; the confirmation path uses its absence to decide
     whether to ask "how long?" instead of "shall I log this?". */
  /* Is this string plausibly the name of an exercise, or is it the wreckage the recogniser
     leaves behind? "I now weigh 82 kilos" came through as "I know where 82 kilos", and the
     old test — any unknown name of four words or fewer — happily accepted "I know where" as
     an exercise and logged a chest set.

     The test is not a dictionary of exercises; the app already has one of those, and an
     exercise it does not know still has to be loggable. It is the opposite: a name whose
     every word is a pronoun, an auxiliary or a filler word is not the name of anything. */
  var NOT_EXERCISE = /^(?:i|im|me|my|mine|you|your|we|us|he|she|it|is|was|were|am|are|be|been|being|now|know|knows|known|no|not|where|wear|here|there|hello|hey|hi|can|could|would|will|shall|do|does|did|done|have|has|had|get|got|gets|going|go|went|weigh|weighs|weighed|weighing|weight|and|or|but|so|then|than|that|this|these|those|the|a|an|of|to|in|on|at|for|from|with|about|please|thanks|thank|ok|okay|yes|yeah|yep|today|tonight|yesterday|morning|evening|just|still|really|very|like|want|need|log|logged|logging|add|added|put|record|recorded|kg|kgs|kilo|kilos|kilogram|kilograms|lb|lbs|pound|pounds)$/i;
  function looksLikeExercise(name) {
    var ws = String(name || '').toLowerCase().split(/\s+/).filter(Boolean);
    // Apostrophes go too, or "i'm" never matches the "im" in the list — which is exactly
    // how "I'm now weigh 82 kilos" survived the first version of this guard.
    return ws.length > 0 && ws.some(function (w) { return !NOT_EXERCISE.test(w.replace(/[^a-z]/g, '')); });
  }
  // A figure that could be a person rather than a barbell.
  function bodyWeightish(w) { return !!w.wt && !w.sets && !w.reps && !w.mins && w.wt > 20 && w.wt < 400; }

  function parseWorkout(raw, host) {
    var t = spoken(String(raw || '').trim());
    if (!t) return null;
    var sets = /(\d+(?:\.\d+)?)\s*(?:sets?|x)\b/i.exec(t);
    var reps = /(?:of|x)\s*(\d+(?:\.\d+)?)\s*(?:reps?)?\b/i.exec(t);
    /* The unit alone identifies a weight, so no preposition is required: "I did 100 kg
       bench press" is as valid as "bench press at 100 kg". Requiring at/with/@ meant the
       first form parsed as having no weight at all, and Loura asked for sets she had
       already been given. Nothing else in an utterance is measured in kg or lbs, so this
       cannot be confused with a duration or a rep count. */
    var wt   = /(?:(?:at|with|@)\s*)?(\d+(?:\.\d+)?)\s*(kgs?|kilos?|kilograms?|lbs?|pounds?)\b/i.exec(t);
    var mins = /(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?)\b/i.exec(t);
    /* Hours count as a duration too. Without this "an hour of running" found no quantity
       at all and the rule declined, sending a perfectly clear log to the model instead. */
    var hrs  = /(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/i.exec(t);
    /* "A 5k run" is how people log a run, and it carries no duration, no sets and no weight —
       so the rule declined it and a perfectly clear instruction went to the model. Distance is
       a quantity in its own right. "5k" and "5 km" are the same thing; miles are kept as miles
       rather than silently converted, because the log should say what you said. */
    var dist = /(\d+(?:\.\d+)?)\s*(k|km|kms|kilometres?|kilometers?|mi|miles?)\b/i.exec(t);
    var name = t
      .replace(/(\d+(?:\.\d+)?)\s*(?:sets?|x)\b/ig,'')
      .replace(/(?:of|x)\s*(\d+(?:\.\d+)?)\s*(?:reps?)?\b/ig,'')
      .replace(/(?:(?:at|with|@)\s*)?(\d+(?:\.\d+)?)\s*(?:kgs?|kilos?|kilograms?|lbs?|pounds?)\b/ig,'')
      .replace(/(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?)\b/ig,'')
      .replace(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/ig,'')
      .replace(/(\d+(?:\.\d+)?)\s*(?:k|km|kms|kilometres?|kilometers?|mi|miles?)\b/ig,'')
      .replace(/\b(?:of|doing|did)\b/ig,' ')
      .replace(/\s+/g,' ').trim();
    /* stripDest FIRST — it matches on "on my training", so removing "on"/"my" as filler
       beforehand leaves it nothing to find and the destination survives into the name. */
    name = stripDest(name);
    /* The command verb has to come out of the NAME too, not just be matched by the rule.
       proposeWorkout is handed the whole utterance — no rule claimed it — so "log a 5k run"
       arrived here as an exercise called "log a run", which resolves to nothing. Stripped, it
       is "run", which is Running, and she can ask how long it took instead of giving up.
       "and" is deliberately NOT in this list: it separates two exercises and the host splits
       on it. */
    /* The pronoun is matched WITH its contraction. A bare \bi\b splits "i'm" and leaves "'m"
       behind, which reads as a real word to looksLikeExercise — and "I'm now weigh 82 kilos"
       went back to being logged as an exercise. Caught by the suite, not by hand. */
    name = name.replace(/\bi(?:['\u2019](?:m|ve|d|ll))?\b|\b(?:log|logged|logging|add|added|record|recorded|track|tracked|enter|put|down|went|spent|spend|spending|a|an|for|on|in|the|my|today|tonight|this morning|this evening|just now|earlier)\b/ig,' ')
               .replace(/\s+/g,' ').trim();
    if (!name) return null;
    var known = host.tools.exerciseName ? host.tools.exerciseName(name) : null;
    return {
      name: known || cap(name), known: !!known,
      mins: mins ? num(mins[1]) : (hrs ? Math.round(num(hrs[1]) * 60) : 0),
      sets: sets ? num(sets[1]) : 0,
      reps: reps ? num(reps[1]) : 0,
      wt:   wt ? num(wt[1]) : 0,
      unit: wt && /lb|pound/i.test(wt[2]) ? 'lb' : 'kg',
      namey: looksLikeExercise(name),
      dist: dist ? num(dist[1]) : 0,
      distUnit: dist && /^mi/i.test(dist[2]) ? 'mi' : 'km',
      /* Distance is parsed but does NOT count as quantified yet, and that is deliberate.
         addWorkout() stores minutes, weight, sets and reps — it has no distance column, and
         it drops any entry carrying none of those, so treating a distance as a quantity would
         mean "log a 5k run" parsed cleanly, called the host, and vanished without a word.
         Recognising the distance still earns its keep: stripping "5k" out of the name leaves
         "run", which resolves to Running, so instead of a dead end she now asks how long it
         took and logs a real session. Fold `dist` into this line the day the record can hold
         it — the parse is already here. */
      quantified: !!(sets || mins || hrs || wt)
    };
  }

  /* Read it back as a sentence, not as fields. "running — 30 min" is how the data is
     shaped; "30 minutes of running" is how it was said to us. */
  function describeWorkout(w) {
    if (w.mins && !w.sets) return plural(w.mins, 'minute') + ' of ' + w.name.toLowerCase();
    if (w.sets) {
      return w.name + ', ' + w.sets + ' set' + (w.sets === 1 ? '' : 's')
           + (w.reps ? ' of ' + w.reps : '')
           + (w.wt ? ' at ' + w.wt + ' ' + w.unit : '')
           + (w.mins ? ' over ' + plural(w.mins, 'minute') : '');
    }
    return w.name + (w.wt ? ' at ' + w.wt + ' ' + w.unit : '');
  }

  function logWorkout(w, host) {
    host.tools.logWorkout(w.name, w.mins, w.wt, w.sets, w.reps);
    return 'I’ve logged ' + describeWorkout(w) + ' on your fitness log for you.';
  }

  // ORDER IS LOAD-BEARING — first match wins. Every rule whose trigger word is shared
  // with a broader one must sit above it. In particular the workout rule opens with a
  // bare `log <anything>`, so water, weight, sleep, money and meals all precede it or it
  // swallows them: "log my weight at 82 kilos" parsed as a workout called "weight"
  // lifting 82kg. The test suite pins each of those collisions.
  /* Conversation enders, from a list of fifty real sign-offs. Grouped by shape rather than
     written as one unreadable alternation, and compiled once. Every fragment is either
     multi-word or a distinctive idiom: the rule is the LAST thing tried, but that is a
     backstop, not a licence to match "good" or "done" on their own.

     Shared by the sign-off rule and by the raw-text fallback in handle(), which has to match
     what was actually said rather than what tidy() left behind. */
  var SIGN_OFF_PARTS = [
    // plain refusals — "no", "no thanks", "nope", "nah", "not right now"
    'no(?:pe)?', 'nah', 'not (?:right )?now',
    // that's-all family — "that's everything for today", "that'll do", "that's me done"
    // "that.?s" covers thats and that's but is one character short of "that is".
    'that(?:.?s|\\s+is) (?:all|it|everything|the lot|enough|fine|great|lovely|perfect)',
    'that.?(?:s|.?ll| will) do', 'that.?s me (?:done|off)',
    'nothing(?: else| more| for now)?',
    // covered-it family — "I think that covers everything", "we've covered it"
    '(?:that|this) covers (?:it|everything)', '(?:we.?ve|i.?ve) covered (?:it|everything|that)',
    // sorted / good / done — "all good", "we're all sorted", "glad we got that sorted"
    'i.?m (?:good|fine|done|okay|ok|off|set|sorted)',
    'all (?:good|done|set|sorted)', 'we.?re (?:all )?(?:done|good|finished|sorted|set)',
    '(?:got|get) (?:that|it) sorted', 'sounds good', 'we.?re good for now',
    '(?:done|finished) for (?:today|now|the day)', 'signing off', 'logging off',
    // leaving — "I'm gonna head off", "I should probably get going", "right, I'm off"
    'i.?m (?:gonna|going to|gunna) (?:go|head off|shoot off|get going|call it)',
    'i.?(?:ve| have)? ?(?:got|need) to (?:go|get going|head off|shoot)',
    'i should (?:probably )?(?:go|get going|head off)',
    '(?:gonna|going to) call it (?:here|a day|a night)',
    // leave-it — "I'll leave it there", "I'll leave you to it for now"
    'leave (?:it|things|that) (?:there|at that|here)', 'leave you to it',
    // let-you-get-on — "I'll let you crack on", "I'll let you get back to your day"
    'let you (?:get on|crack on|go|get back to (?:it|your day|work))',
    'won.?t keep you', 'stop bothering you',
    // farewells — "see you around", "until next time", "catch you next time"
    'good ?night', 'night night', 'goodbye', 'bye(?: bye)?',
    'see (?:you|ya)(?: later| around| soon| tomorrow| next time)?',
    'catch (?:you|ya)(?: up with (?:you|ya))?(?: later| soon| next time| tomorrow)',
    'catch up with (?:you|ya)(?: later| soon)?',
    '(?:speak|talk|chat)(?: to you)? (?:later|soon|tomorrow|next time)',
    'until next time', 'take care', 'take it easy',
    'have a good (?:one|day|evening|night)', 'enjoy the rest of your (?:day|evening)',
    // pleasantries that end a conversation
    'good (?:chat|chatting)(?: with you)?', 'was good (?:chat|chatting|talking)',
    'thanks for the (?:chat|help)',
    // gratitude
    'thanks?(?: you)?', 'cheers', 'ta', 'much appreciated', 'appreciate (?:it|that)',
    'nice one', 'well done', 'good (?:job|work)'
  ];
  /* "later" on its own is only an ender when it IS the utterance ("alright, later") —
     anywhere else it is a time, as in "remind me later". Kept apart from the list above,
     which matches mid-sentence by design. */
  var SIGN_OFF_BARE = /^(?:alright|ok(?:ay)?|cool|right|sweet|nice|awesome|perfect|yep|yeah)?[,\s]*(?:later|laters)[.!]*$/i;
  var SIGN_OFF_RE = new RegExp('(?:^|\\b)(?:' + SIGN_OFF_PARTS.join('|') + ')\\b', 'i');
  function signOffMatch(text) {
    var t = String(text || '').trim();
    var m = SIGN_OFF_RE.exec(t);
    if (m) return m[0];
    return SIGN_OFF_BARE.test(t) ? t : null;
  }

  var LOCAL = [
    { id:'nav', acts:true, label:'Open a page', say:'"Open my fitness centre"',
      re:/^(?:open|go to|show me|show|take me to|switch to|bring up|jump to)\s+(?:the\s+|my\s+)?(.+?)[.?!]*$/i,
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
      /* "Remind me to X" is how people actually add a to-do out loud. It lands here rather
         than on the calendar because it names no time — an utterance that carries one
         ("remind me at 3pm") is claimed by the schedule rule, which sits above this. */
      re:/^(?:(?:add|create|make)\s+)?(?:a\s+)?(?:new\s+)?task(?:\s+(?:to|for|called|named))?\s+(.+?)[.?!]*$|^remind\s+me\s+(?:to\s+)?(.+?)[.?!]*$/i,
      run:function (m, host) { var t = stripDest(m[1] || m[2]); if (!t) return null; host.tools.addTask(cap(t)); return 'I’ve added “' + t + '” to your tasks.'; } },

    { id:'openTasks', label:'What is still open', say:'"What tasks do I have left?"',
      re:/^(?:what|which)?\s*(?:tasks?|to.?dos?)\s*(?:do i have|are)?\s*(?:left|open|outstanding|remaining|still)?[.?!]*$|^what(?:(?:’|')s| is)?\s+still\s+(?:on\s+my\s+list|to\s+do|outstanding|open)[.?!]*$|^(?:is\s+there\s+)?anything\s+(?:left\s+)?(?:to\s+do|on\s+my\s+list)[.?!]*$/i,
      run:function (m, host) {
        var open = host.tools.openTasks();
        return open.length ? 'You have ' + plural(open.length, 'task') + ' left: ' + list(open) + '.'
                           : 'Nothing left — your task list is clear.';
      } },

    { id:'doneToday', label:'What you finished today', say:'"What have I done today?"',
      re:/^(?:what|how much)\s+(?:have\s+|did\s+)?i\s+(?:done|do|finished|finish|completed|complete|got\s+done|get\s+done)\s*(?:today|so far)?[.?!]*$/i,
      run:function (m, host) {
        var d = host.tools.doneToday(), parts = [];
        if (d.tasks.length) parts.push(plural(d.tasks.length, 'task') + ' done: ' + list(d.tasks));
        if (d.missions.length) parts.push(plural(d.missions.length, 'mission') + ' complete: ' + list(d.missions));
        return parts.length ? parts.join('. ') + '.' : 'Nothing marked complete yet today.';
      } },

    { id:'trainingToday', label:'Training logged today', say:'"What did I train today?"',
      re:/^(?:what|how much)\s+(?:did\s+|have\s+)?i\s+(?:train|lift|work ?out|exercise)\w*\s*(?:today)?[.?!]*$|^did\s+i\s+(?:train|lift|work ?out|exercise)\w*\s*(?:today)?[.?!]*$/i,
      run:function (m, host) {
        var d = host.tools.trainingToday();
        return d.length ? 'Today: ' + list(d) + '.' : 'No training logged today yet.';
      } },

    { id:'addMission', acts:true, label:'Add a mission', say:'"Add a mission called cold shower"',
      re:/^(?:(?:add|create|start)\s+)?(?:a\s+)?(?:new\s+)?mission(?:\s+(?:called|named|for|to))?\s+(.+?)[.?!]*$/i,
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
      /* "put" alone is NOT a scheduling verb, however tempting: this rule sits above the money
         rule and a bare "put" swallowed "put 45 quid down for the phone bill". The split form
         has to carry its own "in" — "put a meeting IN for tomorrow" — which no expense does. */
      re:/^(?:schedule|book|put in|add)\s+(?:a\s+|an\s+)?(.+?)\s+(?:on|for|at)\s+(.+?)[.?!]*$|^put\s+(?:a\s+|an\s+)?(.+?)\s+in\s+(?:on|for|at)\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var what = (m[1] || m[3] || '').trim(), when = (m[2] || m[4] || '').trim();
        if (!what || !when) return null;
        var r = host.tools.scheduleEvent(cap(what), when);
        return 'I’ve scheduled “' + what + '” for ' + r.date + (r.time ? ' at ' + r.time : '') + '.';
      } },

    { id:'completeTask', acts:true, label:'Tick a task off', say:'"Mark call the accountant as done"',
      re:/^(?:mark|tick|check)\s+(?:off\s+)?(?:the\s+)?(?:task\s+)?(.+?)(?:\s+(?:as\s+)?(?:done|off|complete[d]?))?[.?!]*$|^(?:i\s*(?:’|')?ve\s+|i\s+)?(?:just\s+)?(?:done|finished|completed)\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var want = stripDest(m[1] || m[2] || ''); if (!want) return null;
        var hit = host.tools.completeTask(want);
        if (hit === null) return null;                 // no such open task — let the AI tier try
        return 'I’ve ticked off “' + hit + '” for you.';
      } },

    { id:'completeMission', acts:true, label:'Complete a mission', say:'"Complete my cold shower mission"',
      re:/^(?:i\s+)?(?:complete|completed|finish|finished|did|done)\s+(?:my\s+|the\s+)?(.+?)\s*mission[.?!]*$|^(?:complete|finish)\s+mission\s+(.+?)[.?!]*$|^i\s+did\s+my\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var want = (m[1] || m[2] || m[3] || '').trim(); if (!want) return null;
        var hit = host.tools.completeMission(want);
        return hit === null ? 'I couldn’t find an open mission matching “' + want + '”.' : 'I’ve marked “' + hit + '” complete for you.';
      } },

    { id:'askWater', label:'Water so far today', say:'"How much water have I had?"',
      re:/^how\s+much\s+water\s*(?:have\s+|did\s+|do\s+)?(?:i\s+)?(?:had|have|drunk|drank|got)?\s*(?:today|so far)?[.?!]*$|^water\s+(?:today|so far|count)?[.?!]*$|^am\s+i\s+drinking\s+enough[.?!]*$|^how(?:'|’)?s\s+my\s+(?:water|hydration)(?:\s+today)?[.?!]*$/i,
      run:function (m, host) {
        var w = host.tools.waterToday(); if (!w) return 'I can’t read your hydration log right now.';
        if (!w.ml) return 'No water logged yet today.';
        var pct = w.goalMl ? Math.round(w.ml / w.goalMl * 100) : 0;
        return w.ml + ' ml so far' + (w.goalMl ? ' — ' + pct + '% of your ' + w.goalMl + ' ml goal.' : '.');
      } },

    { id:'askWeight', label:'Latest body weight', say:'"What is my weight?"',
      re:/^(?:what(?:’|')?s|what is)\s*(?:my\s+)?(?:current\s+|latest\s+)?(?:body\s*)?weight[.?!]*$|^how\s+much\s+do\s+i\s+weigh(?:\s+now)?[.?!]*$|^what\s+did\s+i\s+weigh(?:\s+(?:last|last time|recently))?[.?!]*$|^my\s+weight[.?!]*$/i,
      run:function (m, host) {
        var w = host.tools.latestWeight();
        return w ? 'Your last logged weight is ' + w.kg + ' kg.' : 'You haven’t logged a weight yet.';
      } },

    { id:'askSleep', label:'Last night’s sleep', say:'"How did I sleep?"',
      re:/^how\s+(?:did\s+i\s+sleep|much\s+sleep\s+did\s+i\s+get|was\s+my\s+sleep)\s*(?:last night|last nite)?[.?!]*$|^what\s+was\s+my\s+sleep\s*(?:last night|last nite)?[.?!]*$|^how(?:'|’)?s\s+my\s+sleep(?:\s+been)?[.?!]*$/i,
      run:function (m, host) {
        var sl = host.tools.lastSleep(); if (!sl) return 'No sleep logged yet.';
        var bits = [];
        if (sl.hours) bits.push(plural(sl.hours, 'hour'));
        if (sl.minutes) bits.push(sl.minutes + ' min');
        return bits.length ? 'You logged ' + bits.join(' ') + '.' : 'No sleep logged yet.';
      } },

    { id:'askFood', label:'Calories and protein logged', say:'"How many calories have I had?"',
      re:/^how\s+(?:many|much)\s+(?:calories|kcal|protein)\s*(?:have\s+|did\s+)?(?:i\s+)?(?:had|have|eaten|got)?\s*(?:today|so far)?[.?!]*$|^what\s+have\s+i\s+eaten\s*(?:today)?[.?!]*$/i,
      run:function (m, host) {
        // Deliberately says "on your meal list" rather than "today": meal entries carry no
        // date, so a daily figure would be invented.
        var f = host.tools.foodLogged();
        if (!f.count) return 'Nothing on your meal list yet.';
        return plural(f.count, 'meal') + ' on your list — ' + f.kcal + ' kcal and ' + f.protein + ' g of protein.';
      } },

    { id:'askMoney', label:'Money in and out today', say:'"How much have I spent today?"',
      re:/^how\s+much\s+(?:have\s+|did\s+)?i\s+(spent|spend|earned|earn|made|make)\s*(?:today|so far)?[.?!]*$|^what\s+did\s+i\s+(spend|spent|earn|earned|make|made)\s*(?:today|so far)?[.?!]*$|^how\s+much\s+(came|went)\s+(?:in|out)\s*(?:today)?[.?!]*$|^show\s+me\s+(?:what\s+)?i\s+(spent|spend|earned|earn|made|make)\s*(?:today|so far)?[.?!]*$/i,
      run:function (m, host) {
        var mo = host.tools.moneyToday();
        /* The verb decides the direction, and it can be captured by any of the alternatives —
           reading m[1] alone made "what did I spend today" answer with the day's INCOME,
           because that shape captures into a later group and m[1] came back undefined. */
        var verb = m[1] || m[2] || m[3] || m[4] || '';
        var out = /spent|spend|went/i.test(verb);
        if (out) return mo.expenses ? 'You’ve logged ' + mo.expenses + ' in expenses today.' : 'No expenses logged today.';
        return mo.income ? 'You’ve logged ' + mo.income + ' in income today.' : 'No income logged today.';
      } },

    { id:'askAgenda', label:'What is on today or tomorrow', say:'"What is on tomorrow?"',
      re:/^what(?:(?:’|')s| is)?\s+(?:on|happening|scheduled)\s*(today|tomorrow)?[.?!]*$|^(?:what(?:(?:’|')s| is)\s+)?(?:in\s+)?(?:my\s+|the\s+)?(?:agenda|schedule|diary)\s*(?:for\s+)?(today|tomorrow)?[.?!]*$|^what\s+(?:have\s+i\s+got|do\s+i\s+have)\s+on\s*(today|tomorrow)?[.?!]*$/i,
      run:function (m, host) {
        var when = (m[1] || m[2] || m[3] || 'today').toLowerCase();
        var date = when === 'tomorrow' ? host.tools.dateStrIn(1) : host.tools.todayStr();
        var ev = host.tools.eventsOn(date);
        return ev.length ? cap(when) + ': ' + list(ev) + '.' : 'Nothing in the calendar for ' + when + '.';
      } },

    { id:'askMissions', label:'Missions left today', say:'"What missions do I have left?"',
      re:/^(?:what|which|how many)\s+missions?\s*(?:do\s+i\s+have\s+|are\s+)?(?:left|open|remaining|outstanding)?[.?!]*$|^any\s+missions?\s*(?:left|open|remaining|outstanding)?[.?!]*$/i,
      run:function (m, host) {
        var left = host.tools.missionsLeft();
        return left.length ? plural(left.length, 'mission') + ' left: ' + list(left) + '.' : 'All missions done for today.';
      } },

    { id:'logWater', acts:true, label:'Log water', say:'"Log 500 ml of water"',
      re:/^(?:i(?:\s*[’']ve|\s+have)?\s+)?(?:just\s+)?(?:log|add|drank|drunk|drink|had|have)\s+(?:my\s+)?(.+?)\s*(?:of\s+)?water[.?!]*$|^(?:log|add)\s+water\s*(.*)$/i,
      run:function (m, host) {
        var amt = /(\d+(?:\.\d+)?)\s*(ml|l|litres?|liters?|glass|glasses|cups?|pints?)?/i.exec(spoken(m[1] || m[2] || ''));
        var ml = 250;
        if (amt) {
          var v = num(amt[1], 1), u = (amt[2] || 'ml').toLowerCase();
          ml = /^(l|litre|liter)/.test(u) ? v * 1000 : /pint/.test(u) ? Math.round(v * 568)
             : /glass|cup/.test(u) ? v * 250 : v;
        }
        host.tools.logHydration(ml);
        return 'I’ve logged ' + ml + ' ml of water for you.';
      } },

    /* "My weight is 82 kilos" used to miss this rule entirely and fall through to the workout
       parser, which found "82 kg", could not find an exercise, and logged a chest set called
       "Weight is". So the rule no longer insists on a command verb: a sentence that names your
       weight and a figure IS the instruction. "I weighed in at 82.5" is the same statement in
       the past tense and lands here too. */
    { id:'logWeight', acts:true, label:'Log body weight', say:'"Log my weight at 82 kilos" · "My weight is 82 kilos"',
      re:/^(?:log|record|set|update)\s+(?:my\s+)?(?:body\s*)?weight\s*(?:at|as|to|is)?\s*(.+?)[.?!]*$|^(?:my\s+)?(?:body\s*)?weight(?:\s+today)?\s+(?:is|was)\s+(.+?)[.?!]*$|^i\s+(?:weigh|weighed)(?:\s+in)?(?:\s+at)?\s+(.+?)[.?!]*$/i,
      run:function (m, host) {
        var t = spoken(m[1] || m[2] || m[3] || '');
        var kg = num(t);
        /* Stone and pounds are converted, not taken at face value. The store is kilos, so
           "13 stone" used to go in as 13 — and once the plausibility guard below arrived it
           was refused outright instead, which is safer but still not the number you said.
           Stone may carry pounds after it, the way it is actually spoken: "13 stone 2". */
        var st = /(\d+(?:\.\d+)?)\s*(?:st|stone|stones)\b(?:\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)?)?/i.exec(t);
        var lb = /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\b/i.exec(t);
        if (st)      kg = Math.round((num(st[1]) * 6.35029 + (st[2] ? num(st[2]) * 0.453592 : 0)) * 10) / 10;
        else if (lb) kg = Math.round(num(lb[1]) * 0.453592 * 10) / 10;
        /* A body weight, not any number that happened to be in the sentence. Outside this
           range it is a misheard word, and a wrong weight is worse than no weight. */
        if (!(kg > 20 && kg < 400)) return null;
        host.tools.logWeight(kg); return 'I’ve logged your weight at ' + kg + ' kg in your body metrics.';
      } },

    { id:'logSleep', acts:true, label:'Log sleep', say:'"Log 7 hours 30 minutes of sleep"',
      re:/^(?:i(?:\s*[’']ve|\s+have)?\s+)?(?:log|record|got|had|get)\s+(?:my\s+)?(.*?)\s*(?:of\s+)?sleep(?:\s+(?:last night|last nite|tonight|yesterday|today))?[.?!]*$|^(?:i\s+)?slept\s+(?:for\s+)?(.+?)[.?!]*$/i,
      run:function (m, host) {
        var t = spoken(m[1] || m[2] || '');
        var h = /(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)/i.exec(t);
        var mi = /(\d+)\s*(?:m|mins?|minutes?)/i.exec(t);
        if (!h && !mi) return null;
        /* "Seven and a half hours" arrives as 7.5 — carry the remainder into minutes rather
           than storing a fractional hour and reading it back as "7.5 hours". */
        var hv = h ? num(h[1]) : 0, mv = mi ? num(mi[1]) : 0;
        if (hv % 1) { mv += Math.round((hv % 1) * 60); hv = Math.floor(hv); }
        host.tools.logSleep(hv, mv);
        return 'I’ve logged ' + (hv ? plural(hv, 'hour') : '') + (mv ? (hv ? ' ' : '') + mv + ' min' : '') + ' of sleep for you.';
      } },

    /* ---- money, by slots rather than by sentence shape ---------------------------------
       This rule used to be four fixed sentence shapes, and that was a dead end. Every new way
       of saying it — "just spent 100 as a demo", "made 5k", "that cost me 20 quid", "spent 40
       on petrol" — needed another alternative, and the list is never finished because there is
       no finite list of English sentences.

       So it stops matching sentences and looks for three things anywhere in the utterance:
       a DIRECTION word, an AMOUNT that is money rather than a measurement, and whatever is
       left over as the label. Word order stops mattering, and one rule covers the shapes that
       used to need five.

       It still declines rather than guesses. No direction word at all means this is not a
       money sentence. And a figure carrying a real unit is a measurement, not money, which is
       what keeps "I spent 30 minutes running" a workout rather than a £30 expense. */
    { id:'logMoney', acts:true, label:'Log income or an expense',
      say:'"Log an expense of 40 pounds for fuel" · "I spent 12.99 on Netflix" · "Just made 5k"',
      re:MONEY_ANY,
      run:function (m, host) {
        /* This rule's pattern is a WORD, not a sentence, so m[0] is just the direction word.
           The slots are read from the whole utterance, which exec puts on .input. */
        var raw = m.input || m[0];

        /* One reading of one chunk: a figure, a direction, and whatever is left as a label.
           Direction is inherited from the previous chunk when this one names none — "a coffee
           for £3.50" carries no verb, but it follows "paid £950 in rent" and means the same. */
        function read(chunk, inherit) {
          var t = spoken(chunk);
          var money = moneyAmount(t);
          if (!money) { t = spoken(fixNums(chunk)); money = moneyAmount(t); }
          if (!money) return null;
          var iOut = t.search(MONEY_OUT), iIn = t.search(MONEY_IN);
          var income;
          if (iOut < 0 && iIn < 0) { if (inherit === null) return null; income = inherit; }
          else income = iOut < 0 ? true : (iIn < 0 ? false : iIn < iOut);
          var label = t.replace(money.text, ' ')
                       .replace(MONEY_META, ' ')
                       .replace(/[£$€]/g, ' ')
                       .replace(/\b(?:pounds?|lbs?|quid|dollars?|euros?|pence|gbp|usd|eur)\b/gi, ' ')
                       .replace(/\bi(?:['’]ve|ve)?\b/gi, ' ')
                       .replace(/\b(?:just|have|has|had|as|a|an|the|on|for|from|to|of|in|out|me|my|that|this|it|and|log|logged|record|put|down|today|yesterday|please|was|were|been|about|around)\b/gi, ' ')
                       .replace(/\s+/g, ' ').trim() || 'Unlabelled';
          return { income: income, value: money.value, label: label };
        }

        var chunks = moneyChunks(spoken(raw));
        var entries = [], inherit = null;
        for (var i = 0; i < chunks.length; i++) {
          var e = read(chunks[i], inherit);
          if (e) { entries.push(e); inherit = e.income; }
        }
        // A single figure never needed cutting up — read the whole utterance as one.
        if (!entries.length) { var one = read(raw, null); if (one) entries.push(one); }
        if (!entries.length) return null;

        entries.forEach(function (e) {
          if (e.income) host.tools.logIncome(cap(e.label), e.value);
          else host.tools.logExpense(cap(e.label), e.value);
        });
        if (entries.length === 1) {
          var o = entries[0];
          return 'I’ve logged that ' + (o.income ? 'income' : 'expense') + ' — ' + o.label + ', ' + o.value + '.';
        }
        return 'I’ve logged ' + entries.length + ' entries — ' + entries.map(function (e) {
          return cap(e.label) + ' ' + e.value + ' ' + (e.income ? 'in' : 'out');
        }).join(', ') + '.';
      } },

    { id:'logMeal', acts:true, label:'Log a meal', say:'"Log chicken and rice at 600 calories"',
      re:/^(?:i(?:\s*[’']ve|\s+have)?\s+)?(?:just\s+)?(?:log|ate|had|have)\s+(?:a\s+|an\s+|some\s+)?(.+?)(?:(?:\s*[,\u2013-]\s*|\s+(?:at|with|about|around|approx(?:imately)?|roughly|thats?|it\s+was)\s+)(.+))?[.?!]*$/i,
      run:function (m, host) {
        var extra = spoken(m[2] || '');
        var kcal = /(\d+(?:\.\d+)?)\s*(?:k?cal|calories)/i.exec(extra);
        var pro  = /(\d+(?:\.\d+)?)\s*g?\s*(?:of\s+)?protein/i.exec(extra);
        if (!kcal && !pro) return null;                // no nutrition figures — not a meal log
        host.tools.logMeal(cap(m[1].trim()), kcal ? num(kcal[1]) : 0, pro ? num(pro[1]) : 0);
        return 'I’ve logged ' + m[1].trim() + (kcal ? ' at ' + num(kcal[1]) + ' kcal' : '') + ' for you.';
      } },

    { id:'logWorkout', acts:true, label:'Log a workout', say:'"Log 30 minutes of running" · "Add bench press 3 sets of 8 at 60 kilos"',
      /* Every way of saying "record this" that people actually use. Started as "log" only,
         which missed "add 30 minutes of cycling" entirely.

         Safe despite the breadth, for two reasons. Every specific rule — add a task, add a
         mission, add a note, log water — sits above this one and claims its own utterance
         first. And this rule declines unless parseWorkout finds a duration, a set count or
         a weight, so "put the kettle on" falls through rather than logging nonsense.

         The past-tense forms overlap with completeTask ("finished the shopping"), which is
         also above this rule and declines when no such task exists — so "finished 30
         minutes of cycling" tries the task list, misses, and lands here. */
      re:/^(?:log|logged|logging|add|added|record|recorded|put down|put in|put|track|tracked|enter|mark|note down|chuck in|stick in|bang in|(?:i(?:\s+have|\s*[’']ve)?\s+)?(?:just\s+)?(?:did|done|finished|completed)|i(?:\s+have|\s*[’']ve)?\s+(?:just\s+)?do|i\s+(?:just\s+)?went\s+for|i\s+(?:just\s+)?spent)\s+(?:my\s+)?(.+?)[.?!]*$/i,
      run:function (m, host) {
        var w = parseWorkout(m[1], host);
        if (!w || !w.quantified) return null;          // not a workout shape — fall through
        /* Same guard as the proposal path: an explicit "log" in front of it does not make
           "I know where 82 kilos" an exercise. With a plausible bodyweight figure it is a
           body weight; without one it falls through rather than inventing a lift. */
        if (!w.known && !w.namey) {
          if (bodyWeightish(w)) {
            host.tools.logWeight(w.wt);
            return 'I\u2019ve logged your weight at ' + w.wt + ' kg in your body metrics.';
          }
          return null;
        }
        return logWorkout(w, host);
      } },

    { id:'addNote', acts:true, label:'Save a note', say:'"Make a note called ideas — buy the domain"',
      re:/^(?:make|add|save|write)\s+(?:a\s+)?note(?:\s+(?:called|titled|named))?\s+(.+?)(?:\s*[—–:-]\s*(.+))?[.?!]*$/i,
      run:function (m, host) { var t = stripDest(m[1]); if (!t) return null; host.tools.addNote(cap(t), (m[2] || '').trim()); return 'I’ve saved that note for you.'; } },

    { id:'time', label:'Time and date', say:'"What is the date?"',
      re:/^(?:what(?:’s| is)?\s+(?:the\s+)?)?(time|date|day)(?:\s+is\s+it)?(?:\s+today)?[.?!]*$/i,
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
      re:/^(?:what\s+can\s+you\s+do|help|what\s+are\s+you\s+able\s+to\s+do|what\s+are\s+your\s+(?:commands|abilities))[.?!]*$/i,
      run:function (m, host) {
        var n = LOCAL.length;
        return 'I can handle about ' + n + ' things on my own — logging training, food, sleep, money and notes, '
             + 'adding tasks and missions, scheduling, and telling you what you’ve done. '
             + (host.hasAI() ? 'Anything else I’ll think through with your connected AI provider.'
                             : 'Open questions need an AI provider connected in the AI centre.');
      } },

    { id:'stop', acts:true, label:'Turn the assistant off', say:'"That will be all"',
      re:/^(?:that(?:’|')?(?:ll| will) be all|stop listening|go to sleep|shut (?:up|down)|turn (?:yourself\s+)?off|switch (?:yourself\s+)?off|switch off the assistant|turn off the assistant)[.?!]*$/i,
      run:function (m, host) { host.tools.disableAssistant(); return 'Going quiet. Tap Hold to talk when you need me.'; } },

    /* Conversation enders. These used to be recognised only in the one beat straight after
       "is that all I can do for you today?", and only anchored at the start of the
       utterance — so "I said thanks", "that's everything for today" and "no that's
       everything for today" all landed on "Sorry, I didn't catch that", which is a rude way
       to end a conversation she started herself. They are a standing rule now: matched
       anywhere in the utterance, at any point in the conversation.

       It is deliberately the LAST rule in the list. Every ender is a common English word
       that can appear inside a real instruction ("log 8 hours of sleep last night", "note
       down that we're done with the flat"), so it only ever gets the utterances no actual
       command wanted.

       Ending the conversation closes the mic: leaving it open after "goodbye" means she
       carries on listening to a room that has finished talking to her. This is lighter than
       'stop' — that flips the assistant's master switch, this only stops the current listen,
       so the mic button brings her straight back. */
    { id:'signOff', acts:false, label:'End the conversation', say:'"No, that\u2019s everything" \u00b7 "Thanks, goodbye"',
      re:new RegExp('(?:^|\\b)(?:' + SIGN_OFF_PARTS.join('|') + ')\\b|' + SIGN_OFF_BARE.source, 'i'),
      run:function (m, host) {
        if (host.tools.stopListening) host.tools.stopListening();
        return signOffReply(m[0]);
      } }

  ];

  /* Gratitude on its own is not the end of a conversation — "thanks" mid-flow deserves
     "any time", not "I'll leave you to it". Night gets its own line because "I'm here
     whenever you need me" at bedtime reads as a machine that missed the point. */
  var THANKS_ONLY = /^(?:thanks?(?: you)?|cheers|ta|much appreciated|appreciate (?:it|that)|nice one|well done|good (?:job|work))$/i;
  var NIGHT = /^(?:good ?night|night night)$/i;
  var WELL_WISH = /^(?:take care|take it easy|have a good (?:one|day|evening|night)|enjoy the rest of your (?:day|evening))$/i;
  var SIGN_OFFS = [
    'Alright \u2014 I\u2019m here whenever you need me.',
    'Of course, sir. I\u2019ll be here.',
    'Understood \u2014 I\u2019ll leave you to it.',
    'Any time. Just say the word.'
  ];
  var signOffAt = 0;
  function signOffReply(matched) {
    var m = String(matched || '').trim();
    if (NIGHT.test(m)) return 'Good night, sir.';
    if (WELL_WISH.test(m)) return 'You too, sir.';
    if (THANKS_ONLY.test(m)) return 'Any time, sir.';
    var out = SIGN_OFFS[signOffAt % SIGN_OFFS.length]; signOffAt++; return out;
  }

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

  /* After a confirmed action Loura asks whether there is anything else, by name. That turns
     the next utterance into an answer to a question, not a fresh command — so a bare "no"
     has to close the conversation politely instead of falling through to "I didn't catch
     that". Anything that isn't a yes/no is treated as the next command, which is what
     someone who ignores the question and just keeps going actually means. */
  var AWAIT_CLOSE = false;
  var CLOSE_YES = /^(?:yes|yeah|yep|yup|sure|ok(?:ay)?|please|actually|one more|there is|hold on|wait)\b/i;
  function closeOut(host) {
    if (!host.followUp) return;
    // Deliberately not firstName(): it takes the first word of the account name, which is
    // a title ("Mr") as often as it is a name, and hearing your own name said wrong is worse
    // than not hearing it at all. A fixed address can't be got wrong.
    AWAIT_CLOSE = true;
    host.followUp('Is that all I can do for you today, sir?');
  }
  var ackAt = 0;
  function nextAck() { var a = ACKS[ackAt % ACKS.length]; ackAt++; return a; }

  /* ---- asking instead of guessing --------------------------------------------------
     A noisy room drops words. "Log 3 minutes of running" comes back as "3 minutes run" —
     everything needed is there except the verb, and the old behaviour was to give up with
     "Sorry, I didn't catch that", which throws away a perfectly good utterance.

     So: before falling through, see whether the text still looks like something loggable.
     If it does, propose it and wait. Nothing is written until you say yes.

     Two shapes of pending question:
       confirm   we have the whole thing, just not the instruction — "Did you want me to
                 log 3 minutes of running?" -> yes/no
       quantity  we have the exercise but no numbers — "How long, or how many sets?"
                 -> the next utterance is read for a quantity and the log completes

     Pending state lives for exactly one utterance. Anything that is not a yes, a no, or
     the missing quantity is treated as a fresh command and the question is dropped — so a
     forgotten question can never swallow the next real thing you say. */
  var PENDING = null;

  var YES = /^(?:yes|yeah|yep|yup|yup|sure|ok(?:ay)?|go on|go ahead|do it|please do|please|correct|that.?s right|right|confirm|log it|save it|add it|affirmative)\b/i;
  var NO  = /^(?:no|nope|nah|cancel|forget it|don.?t|do not|stop|wrong|leave it|never ?mind|scrap that)\b/i;

  /* Does this look like a workout even though no rule claimed it? Only proposes when
     there is something real to propose: a quantity, or an exercise the app actually
     knows. Random noise — "soil" — produces nothing and still gets an honest miss. */
  function proposeBodyWeight(kg, host) {
    return { kind:'confirm',
      question: 'Did you want me to log ' + kg + ' kg as your body weight?',
      run: function () {
        host.tools.logWeight(kg);
        return 'I\u2019ve logged your weight at ' + kg + ' kg in your body metrics.';
      } };
  }

  function proposeWorkout(text, host) {
    var w = parseWorkout(text, host);
    if (!w) return null;
    /* A name that is not a name, carrying nothing but a plausible bodyweight figure, is
       someone telling you what they weigh through an imperfect microphone. Offer that
       rather than an exercise called "I know where". */
    if (!w.known && !w.namey) {
      if (bodyWeightish(w)) return proposeBodyWeight(w.wt, host);
      return null;                                  // not a name and not a weight — honest miss
    }
    if (w.quantified && (w.known || w.name.split(' ').length <= 4)) {
      return { kind:'confirm',
        question: 'Did you want me to log ' + describeWorkout(w) + ' for you?',
        run: function () { return logWorkout(w, host); } };
    }
    // A known exercise with no numbers attached is worth finishing rather than refusing.
    if (!w.quantified && w.known) {
      return { kind:'quantity', base: w,
        question: 'How long was that, or how many sets? I\u2019ll log ' + w.name + ' once you tell me.',
        run: function () { return logWorkout(w, host); } };
    }
    return null;
  }

  /* The reply to a "how many?" question — "30 minutes", "3 sets of 8 at 60 kilos". Parsed
     against the exercise we already have rather than as a fresh command. */
  function applyQuantity(text, pending, host) {
    var w = parseWorkout(pending.base.name + ' ' + text, host);
    if (!w || !w.quantified) return null;
    return logWorkout(w, host);
  }

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

  /* People put the instruction at the END as often as the start: "I did 30 minutes of cardio
     today, can you log it". That tail is a request, not part of what was done — left in place
     it became the exercise name, and the fitness log ended up with an entry called "Cardio can
     you log". Recognition also hears "log it" as "log in", "log on" and "log out", so the
     particles are all accepted.

     Two shapes only: an explicit "can you log…", or a log-verb with an object after it
     ("…of running, log it"). A bare trailing verb is deliberately NOT stripped, so a genuine
     "add a task to log" keeps its last word. */
  var TRAIL_REQ = /[,\s]*(?:(?:can|could|would|will)\s+(?:you|u)\s+(?:please\s+)?(?:log|lock|add|save|record|put|note)(?:\s+(?:it|that|this|them|in|on|out|up|down))*|(?:log|add|save|record|put)\s+(?:it|that|this|them|in|on|out|up|down)(?:\s+(?:in|on|down|for me))?)[.?!]*$/i;

  function tidy(t) {
    var prev;
    do {
      prev = t;
      t = t.replace(LEAD, '').replace(TRAIL, '');
      // Never strip the whole utterance: "log it" on its own is an answer, not a tail.
      var cut = t.replace(TRAIL_REQ, '').trim();
      if (cut) t = cut;
    } while (t !== prev);
    return t.replace(POLITE, '').trim();
  }

  function handle(text, host) {
    var raw = String(text || '').trim();
    var t = fixVerb(tidy(raw));

    /* tidy() strips trailing politeness so rule patterns can stay about the command — but
       for an ender the politeness IS the utterance. "thanks" tidies to nothing at all and
       "I said thanks" to "I said", so both fell straight through to "Sorry, I didn't catch
       that". Enders are therefore matched against what was actually said. This runs before
       the empty-text guard for exactly that reason, and after nothing else, so a real
       command never reaches it. */
    if (!t) {
      var bare = signOffMatch(raw);
      if (bare) { AWAIT_CLOSE = false; host.speak(signOffReply(bare)); if (host.tools.stopListening) host.tools.stopListening(); }
      return Promise.resolve();
    }

    // "Is that all I can do for you today?" is outstanding. A short yes hands the turn back;
    // a no or any other ender is caught by the sign-off rule further down, and anything else
    // is simply the next command. The flag is NOT burned here — clearing it on a miss was
    // what left her answering "Sorry, I didn't catch that" to every attempt to end the
    // conversation after the first one.
    /* A pending question wins. She asks "Is that all?" after every log, so the flag is
       usually still set when the next command arrives — and if that command needs
       confirming, the "yes" was being taken as "yes, that's all" and the log was dropped
       on the floor without a word. Whichever question was asked most recently is the one
       a bare yes is answering. */
    if (!PENDING && AWAIT_CLOSE && CLOSE_YES.test(t) && t.split(/\s+/).length <= 3) {
      AWAIT_CLOSE = false;
      host.speak('Go ahead, I’m listening.');
      return Promise.resolve();
    }

    // A question is outstanding. Take it or leave it, then clear it either way.
    if (PENDING) {
      var q = PENDING; PENDING = null;
      if (YES.test(t)) { var done = q.run(); host.speak(done); closeOut(host); return Promise.resolve(done); }
      if (NO.test(t))  { host.speak('Okay, I’ve left it.'); return Promise.resolve(); }
      if (q.kind === 'quantity') {
        var filled = applyQuantity(t, q, host);
        if (filled) { host.speak(filled); closeOut(host); return Promise.resolve(filled); }
      }
      // Neither — fall through and treat this as a new command.
    }

    // Peek first so the acknowledgement lands BEFORE the work, not after it.
    var rule = matchRule(t);
    if (rule && rule.acts && host.ack) host.ack(nextAck());

    var local = runLocal(t, host);
    if (local.handled) {
      AWAIT_CLOSE = false;
      host.speak(local.reply);
      // Only after something was actually saved, and never on the way out of the conversation.
      if (local.acts && local.id !== 'stop') closeOut(host);
      return Promise.resolve(local.reply);
    }

    // Nothing matched the tidied text — but tidy() strips politeness, and "I said thanks"
    // tidies down to "I said". Give the enders one more look at what was actually said,
    // ahead of the workout guess so an ender is never turned into "shall I log that?".
    var off = signOffMatch(raw);
    if (off) {
      AWAIT_CLOSE = false;
      host.speak(signOffReply(off));
      if (host.tools.stopListening) host.tools.stopListening();
      return Promise.resolve();
    }

    // Before giving up — or spending a provider call — see whether this
    // is a workout with a word missing, and ask.
    var proposal = proposeWorkout(t, host);
    if (proposal) { PENDING = proposal; host.speak(proposal.question); return Promise.resolve(); }

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
    _matchLocal: function (text) { var r = matchRule(text); return r ? r.id : null; },
    _pending: function () { return PENDING ? PENDING.kind : null; },
    _clearPending: function () { PENDING = null; AWAIT_CLOSE = false; },
    _awaitingClose: function () { return AWAIT_CLOSE; }
  };

}(window));
