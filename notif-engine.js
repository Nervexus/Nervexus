/* ============================================================================
   notif-engine.js — Coaching notification engine for the AI Command Center.

   A generative, NON-REPEATING, context-aware notification generator. It never
   emits the exact same title+body twice (tracked via a `seen` set), composes
   fresh copy from a large combinatorial library, and adapts to the user's live
   data — streaks, hydration, recovery, sleep, workouts, schedule, open tasks —
   plus a world-intel layer (crypto, sales, government, conflict, capital flows,
   security watch).

   Voice: an elite, disciplined performance coach. Sharp, commanding, premium —
   motivational without being aggressive or spammy.

   Exposes window.NotifEngine = { generate, buildContext, CATS, PALETTE }.
   ============================================================================ */
(function (root) {
  'use strict';

  var PALETTE = {
    hot:   '#ff2b3d', // discipline / alerts / conflict
    hotL:  '#ff6b76', // training / streak / comeback
    cool:  '#5bb8e8', // recovery / hydration / sleep / schedule
    gold:  '#e8b45a', // wins — PB / progress / capital / crypto
    white: '#eef0f2', // neutral progress / policy
    grey:  '#9a9aa2'  // system
  };

  /* ---- small helpers -------------------------------------------------- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rf(a, b, d) { var v = a + Math.random() * (b - a); return v.toFixed(d == null ? 1 : d); }
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function todayStr() { try { return new Date().toLocaleDateString('en-CA'); } catch (e) { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); } }
  function shiftStr(days) { var d = new Date(); d.setDate(d.getDate() + days); try { return d.toLocaleDateString('en-CA'); } catch (e) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); } }

  // Resolve a template string: first inline alternations {a|b|c}, then {tokens}.
  function fill(tpl, ctx) {
    if (tpl == null) return '';
    var out = String(tpl).replace(/\{([^{}]*\|[^{}]*)\}/g, function (_, g) { return pick(g.split('|')); });
    out = out.replace(/\{(\w+)\}/g, function (_, k) { return (ctx[k] != null && ctx[k] !== '') ? ctx[k] : ''; });
    return out.replace(/\s{2,}/g, ' ').replace(/\s+([.,;!?%])/g, '$1').trim();
  }

  /* ---- intel flavour pools -------------------------------------------- */
  var REGIONS = ['the Taiwan Strait', 'Eastern Europe', 'the South China Sea', 'the Persian Gulf', 'the Baltic corridor', 'the Red Sea', 'the Sahel', 'the Korean peninsula', 'the Caucasus'];
  var POLICY_REGIONS = ['Washington', 'Brussels', 'Beijing', 'Westminster', 'Tokyo', 'New Delhi', 'the EU', 'Riyadh'];
  var SECTORS = ['semiconductor', 'defense', 'energy', 'AI-infrastructure', 'rare-earth', 'logistics', 'fintech', 'biotech'];
  var CITIES = ['London', 'Los Angeles', 'Paris', 'São Paulo', 'Cape Town', 'Chicago', 'Barcelona', 'Manila', 'Naples', 'Johannesburg', 'Marseille'];
  var INCIDENTS = ['vehicle break-ins', 'pickpocketing', 'phone-snatching', 'ATM skimming', 'package theft', 'transit scams', 'card fraud'];
  var CRYPTO_REASONS = ['record ETF inflows', 'a short squeeze', 'easing rate expectations', 'a supply shock at halving', 'renewed institutional demand', 'a risk-on rotation'];

  /* ---- category library ------------------------------------------------
     Each category: { label, color, glyph, family, weight(ctx), when(ctx),
     prep(ctx)->extraTokens, titles[], bodies[], contexts[] }.               */
  var LIB = {

    /* ===================== FITNESS / COACHING ======================= */
    discipline: {
      label: 'DISCIPLINE', color: PALETTE.hot, glyph: '▲', family: 'coaching', weight: function () { return 3; },
      titles: ['Discipline over motivation.', 'Standards, not feelings.', 'Nobody is coming. Go.', 'Comfort is the enemy.', 'Earn it today, {name}.', 'The hard way is the way.', 'Own the next hour.'],
      bodies: [
        'Motivation is weather, {name}. Discipline is climate. Move regardless.',
        'The version of you that wins is built on the days you did not feel like it.',
        'You do not rise to your goals — you fall to your standards. Raise them.',
        'Comfort is a slow tax on your potential. Refuse to pay it today.',
        'Decide once, execute daily. That is the entire game, {name}.',
        'No one is coming to save the session. That is the job — and it is yours.'
      ],
      contexts: ['Daily discipline · elite protocol', 'Mindset directive', 'Because standards compound']
    },

    training: {
      label: 'TRAINING', color: PALETTE.hotL, glyph: '+', family: 'coaching', weight: function (c) { return c.didWorkoutToday ? 0 : 3; }, when: function (c) { return !c.didWorkoutToday; },
      titles: ['Time to train, {name}.', 'Session window is open.', 'Suit up.', 'Green light.', 'Your body is ready.'],
      bodies: [
        'Recovery reads {recovery}%, {name} — your system is primed. Load the bar.',
        'No session logged yet today. One hour, zero negotiation. Go.',
        'Prime readiness window detected. Train now while the tank is full.',
        '{lastPart} was your last focus — balance it and hit the opposite chain today.',
        'The gap between intention and result is one warm-up set. Start it.'
      ],
      contexts: ['Recovery {recovery}% · optimal load', 'Training window open', 'Because readiness is high']
    },

    recovery: {
      label: 'RECOVERY', color: PALETTE.cool, glyph: '~', family: 'coaching', weight: function (c) { return c.didWorkoutToday ? 3 : 1; }, when: function (c) { return c.didWorkoutToday || c.recovery < 72; },
      titles: ['Recover like a pro.', 'Protect the gains.', 'Down-shift, {name}.', 'Recovery is training.'],
      bodies: [
        'Session banked. Now win recovery: protein, water, and {sleepAvg}h of sleep tonight.',
        'Soreness is {soreness}. Ten minutes of mobility and hydrate — grow from the work.',
        'Muscle is built at rest, {name}. Guard tonight\u2019s sleep window like it matters. It does.',
        'Readiness sits at {recovery}%. Respect the signal — a smart deload protects momentum.'
      ],
      contexts: ['Post-session · recovery', 'Because you trained today', 'Recovery {recovery}%']
    },

    streak: {
      label: 'STREAK', color: PALETTE.hotL, glyph: '✦', family: 'coaching', weight: function (c) { return c.gymStreak >= 5 ? 3 : 2; }, when: function (c) { return c.gymStreak >= 2 || c.moveStreak >= 3; },
      titles: ['{gymStreak}-day streak is alive.', 'Do not break the chain.', 'Momentum is yours.', 'The streak is on the line.'],
      bodies: [
        '{gymDaysPhrase} straight, {name}. The chain is heavy now — do not be the one who drops it.',
        'Gym streak stands at {gymStreak}. Your record is {gymLongest}. Go take it.',
        'Consistency is your edge — {moveDaysPhrase} of movement. Extend it before midnight.',
        'Every unbroken day makes tomorrow easier to win. Keep the {gymDaysPhrase} intact.'
      ],
      contexts: ['Gym streak · {gymDaysPhrase}', 'Longest ever {gymLongest} days', 'Because momentum compounds']
    },

    progress: {
      label: 'PROGRESS', color: PALETTE.gold, glyph: '↗', family: 'coaching', weight: function () { return 2; },
      titles: ['Trending up, {name}.', 'The data agrees.', 'Progress, logged.', 'Level up.'],
      bodies: [
        'Bodyweight is {weightNow}kg — trend {weightDelta}. The plan is working. Stay the course.',
        'You banked {xpToday} XP today, {name}. Small deposits compound into rank.',
        '{workoutsWeekPhrase} this week. That is not luck — that is a system.',
        'Quiet progress is still progress. The scoreboard rewards the patient.'
      ],
      contexts: ['Weekly progress', 'XP +{xpToday} today', 'Because the trend is your friend']
    },

    pb: {
      label: 'PERSONAL BEST', color: PALETTE.gold, glyph: '★', family: 'coaching', weight: function () { return 2; }, when: function (c) { return c.best1RM > 0; },
      titles: ['New personal best.', 'Record broken, {name}.', 'Ceiling raised.', 'That is a PR.'],
      bodies: [
        'Estimated 1RM is now {best1RM}kg — a new high. Strength is a skill, and you are compounding it.',
        'You just redefined your baseline, {name}. Yesterday\u2019s ceiling is today\u2019s floor.',
        'A {best1RM}kg estimate puts you in rare air. Rest, refuel, and come back hungrier.'
      ],
      contexts: ['Personal best · strength', 'New 1RM {best1RM}kg', 'Because you earned it']
    },

    hydration: {
      label: 'HYDRATION', color: PALETTE.cool, glyph: '◉', family: 'coaching', weight: function (c) { return c.waterLeft >= 3 ? 3 : 2; }, when: function (c) { return c.waterLeft > 0; },
      titles: ['Hydrate, {name}.', 'Water check.', 'Top up.', 'Fuel the machine.'],
      bodies: [
        'You are at {waterPhrase} of {waterGoal}. {waterLeft} to go — performance drops before thirst does.',
        'Hydration is free performance, {name}. Reach {waterGoal} glasses before the day closes.',
        'Two percent dehydration costs you focus and power. Close the {waterLeft}-glass gap now.'
      ],
      contexts: ['Water {water}/{waterGoal} glasses', 'Because output follows hydration']
    },

    sleep: {
      label: 'SLEEP', color: PALETTE.cool, glyph: '☾', family: 'coaching', weight: function () { return 2; },
      titles: ['Guard your sleep.', 'Wind down, {name}.', 'Sleep is a weapon.', 'Recovery starts tonight.'],
      bodies: [
        'You have averaged {sleepAvg}h this week. Aim for 8 tonight — muscle and focus are built there.',
        'Screens down soon, {name}. Elite recovery is engineered, not hoped for.',
        'The best pre-workout is a full night\u2019s sleep. Protect the window tonight.'
      ],
      contexts: ['Sleep avg {sleepAvg}h', 'Because rest is performance']
    },

    nutrition: {
      label: 'NUTRITION', color: PALETTE.white, glyph: '◆', family: 'coaching', weight: function () { return 2; },
      titles: ['Fuel with intent.', 'Protein check.', 'Eat for the goal, {name}.', 'Nutrition is the other 80%.'],
      bodies: [
        'Target {proteinGoal}g of protein today — muscle cannot be built from willpower alone.',
        'Every meal is a vote, {name}. Cast it for the athlete you are becoming.',
        'Whole foods, enough protein, honest portions. Unsexy, undefeated.'
      ],
      contexts: ['Protein goal {proteinGoal}g', 'Because you cannot out-train the fork']
    },

    mindset: {
      label: 'MINDSET', color: PALETTE.white, glyph: '◇', family: 'coaching', weight: function () { return 2; },
      titles: ['Mind right, {name}.', 'Sharpen the blade.', 'Control the controllables.', 'Win the morning.'],
      bodies: [
        'You will not always feel ready. Ready is a decision, {name} — make it.',
        'Guard your inputs. What you feed your mind becomes the story you live.',
        'Pressure is a privilege. It means you are doing something that matters.'
      ],
      contexts: ['Mindset · focus', 'Because clarity is a choice']
    },

    focus: {
      label: 'FOCUS', color: PALETTE.white, glyph: '⊙', family: 'coaching', weight: function () { return 2; },
      titles: ['Focus protocol.', 'Single-task it.', 'Kill the noise.', 'Deep-work window.'],
      bodies: [
        'Pick one target for the next 90 minutes, {name}. Phone away, doors closed, execute.',
        'Attention is your rarest asset. Spend it on the one thing that moves the needle.',
        'Depth beats noise. Close ten tabs and open one — the one that matters.'
      ],
      contexts: ['Focus tip', 'Because scattered effort is wasted effort']
    },

    missed: {
      label: 'COMEBACK', color: PALETTE.hot, glyph: '↺', family: 'coaching', weight: function () { return 4; }, when: function (c) { return c.missedYesterday; },
      titles: ['Reset, {name}.', 'One day does not define you.', 'Back on the horse.', 'The comeback starts now.'],
      bodies: [
        'You missed yesterday. Champions do not miss twice — today is the rep that counts.',
        'Streaks break; character does not, {name}. Log one honest session and restart the clock.',
        'Do not negotiate with the miss. Show up small, show up now, and rebuild the momentum.'
      ],
      contexts: ['Because you missed yesterday', 'Comeback protocol']
    },

    health: {
      label: 'HEALTH', color: PALETTE.hotL, glyph: '✚', family: 'coaching', weight: function () { return 1; },
      titles: ['Health check, {name}.', 'Marginal gains.', 'Small habit, big return.'],
      bodies: [
        'Recovery {recovery}% and resting well. Add a 10-minute walk today — base wins compound.',
        'Posture, breath, sunlight, {name}. The unglamorous habits build the durable body.',
        'Stand up, roll the shoulders, take five deep breaths. Reset the nervous system.'
      ],
      contexts: ['Health tip', 'Because the basics win']
    },

    /* ===================== SCHEDULE / DIRECTIVES ==================== */
    event: {
      label: 'SCHEDULE', color: PALETTE.cool, glyph: '◷', family: 'schedule', weight: function () { return 3; }, when: function (c) { return c.eventsToday && c.eventsToday.length > 0; },
      prep: function (c) { var e = pick(c.eventsToday); return { event: e.title, eventTime: e.time }; },
      titles: ['On your schedule.', 'Up next, {name}.', 'Incoming.', 'Block secured.'],
      bodies: [
        '{event} at {eventTime}. Show up sharp — preparation is a form of respect.',
        '{eventTime}: {event}. Ten minutes early is on time, {name}.',
        'Do not just attend {event} — arrive decided. Know your one outcome for it.'
      ],
      contexts: ['Today · {eventTime}', 'Scheduled event']
    },

    directive: {
      label: 'DIRECTIVE', color: PALETTE.hot, glyph: '!', family: 'schedule', weight: function (c) { return c.tasksLeft >= 3 ? 3 : 2; }, when: function (c) { return c.tasksLeft > 0; },
      prep: function (c) { return { task: pick(c.taskNames) }; },
      titles: ['Open loops, {name}.', 'Close it out.', 'Unfinished business.', 'One rep from done.'],
      bodies: [
        '{tasksLeftPhrase} still open today. Momentum loves a clean board — clear one now.',
        '\u201C{task}\u201D is still on your list, {name}. Two minutes of action beats an hour of intention.',
        'You have {tasksLeftPhrase} between you and a closed day. Attack the smallest one first.'
      ],
      contexts: ['{tasksLeft} open · today', 'Because open loops drain focus']
    },

    /* ===================== WORLD INTEL ============================= */
    crypto: {
      label: 'CRYPTO', color: PALETTE.gold, glyph: '\u20BF', family: 'markets', weight: function () { return 1; },
      prep: function () { return { btc: ri(58, 92), eth: ri(2200, 4400), pct: rf(0.6, 7.4, 1), dir: pick(['up', 'up', 'down']), reason: pick(CRYPTO_REASONS) }; },
      titles: ['Crypto desk.', 'BTC on the move.', 'Digital assets.', 'Market pulse.'],
      bodies: [
        'BTC {reclaims|tests|breaks} ${btc}K, {dir} {pct}% on the day on {reason}.',
        'ETH {holds|clears} ${eth} as {reason} builds. Positioning beats prediction, {name}.',
        'Digital assets {dir} {pct}% into the close — {reason}. Note it; do not chase it.'
      ],
      contexts: ['Markets · crypto', 'Because capital never sleeps']
    },

    sales: {
      label: 'SALES', color: PALETTE.hotL, glyph: '$', family: 'markets', weight: function () { return 1; },
      prep: function () { return { pct: ri(4, 22), figure: '$' + rf(0.4, 3.8, 1) + 'M', count: ri(2, 9) }; },
      titles: ['Sales signal.', 'Pipeline moved.', 'Revenue in motion.', 'Deal desk.'],
      bodies: [
        'Pipeline up {pct}% this week — {figure} in new opportunity. Follow the momentum, {name}.',
        '{count} deals advanced a stage today. Close velocity is your leading indicator.',
        '{figure} sits one conversation from closing. Make the call before the day ends.'
      ],
      contexts: ['Business · sales', 'Because revenue is oxygen']
    },

    government: {
      label: 'GOVERNMENT', color: PALETTE.white, glyph: '⬡', family: 'intel', weight: function () { return 1; },
      prep: function () { return { region: pick(POLICY_REGIONS), sector: pick(SECTORS), figure: '$' + ri(2, 90) + 'B' }; },
      titles: ['Policy watch.', 'Government desk.', 'Regulatory pulse.', 'State of play.'],
      bodies: [
        'New {sector} directive out of {region} — {figure} allocated. Watch the second-order effects.',
        '{region} advances {sector} legislation, {name}. Rules reshape markets before prices do.',
        'A {figure} {sector} package is moving through {region}. Position ahead of the headline.'
      ],
      contexts: ['World intel · policy', 'Because policy moves capital']
    },

    conflict: {
      label: 'CONFLICT WATCH', color: PALETTE.hot, glyph: '⚑', family: 'intel', weight: function () { return 1; },
      prep: function () { return { region: pick(REGIONS), sector: pick(SECTORS) }; },
      titles: ['Conflict watch.', 'Defense desk.', 'Strategic brief.', 'Global tension.'],
      bodies: [
        'Elevated activity reported near {region}; {sector} supply lines under review. Stay informed, stay steady.',
        'Defense posture is rising around {region}. Volatility favors the prepared, {name}.',
        'Tensions tick up near {region}. Discipline in the noise is its own edge.'
      ],
      contexts: ['World intel · security', 'Because the prepared do not panic']
    },

    capital: {
      label: 'CAPITAL FLOW', color: PALETTE.gold, glyph: '⇅', family: 'markets', weight: function () { return 1; },
      prep: function () { return { figure: '$' + rf(0.8, 9.4, 1) + 'B', sector: pick(SECTORS), dir: pick(['inflows', 'inflows', 'outflows']), th: ordinal(ri(2, 6)) }; },
      titles: ['Capital flow.', 'Money in motion.', 'Liquidity alert.', 'Flows desk.'],
      bodies: [
        '{figure} rotated into {sector} this session — net {dir} for a {th} straight day.',
        'Institutional money is moving toward {sector}, {name}. Follow the flow, not the noise.',
        'Smart money leaves tracks: {figure} in {sector} {dir}. Read the footprints.'
      ],
      contexts: ['Markets · flows', 'Because smart money leaves tracks']
    },

    watch: {
      label: 'SECURITY WATCH', color: PALETTE.hot, glyph: '◈', family: 'intel', weight: function () { return 1; },
      prep: function () { return { city: pick(CITIES), incident: pick(INCIDENTS) }; },
      titles: ['Security watch.', 'Situational brief.', 'Location alert.', 'Stay sharp.'],
      bodies: [
        'Advisory for {city}: heightened {incident} reports in the central district. Route smart, {name}.',
        '{city} flagged for elevated {incident} tonight. Awareness is a discipline, not a mood.',
        'Keep your head up in {city} — {incident} trending upward this week. Situational awareness on.'
      ],
      contexts: ['Security · {city}', 'Because awareness is armor']
    }
  };

  // Map category family -> settings preference key (so toggles gate the engine).
  var FAMILY_PREF = { coaching: 'nFitness', schedule: 'nReminders', markets: 'nFinance', intel: 'nNews' };

  /* ---- context builder ------------------------------------------------ */
  function buildContext(state) {
    var s = state || {};
    var health = s.health || {};
    var acct = s.account || {};
    var today = todayStr(), yest = shiftStr(-1);

    var name = ((acct.name || '') + '').trim().split(/\s+/)[0] || 'Operator';

    var water = health.water != null ? health.water : 5;
    var waterGoal = health.waterGoal != null ? health.waterGoal : 8;
    var waterLeft = Math.max(0, waterGoal - water);

    var recovery = health.recovery != null ? health.recovery : 78;
    var soreness = (health.soreness || 'Low').toLowerCase();

    var sleepArr = health.sleepH || [];
    var sleepAvg = sleepArr.length ? (sleepArr.reduce(function (a, b) { return a + b; }, 0) / sleepArr.length).toFixed(1) : '7.4';

    var weights = health.weights || [];
    var weightNow = weights.length ? (+weights[weights.length - 1]).toFixed(1) : '82.0';
    var weightDelta = 'holding steady';
    if (weights.length >= 2) {
      var d = weights[weights.length - 1] - weights[0];
      weightDelta = Math.abs(d) < 0.05 ? 'holding steady' : (d > 0 ? '+' : '') + d.toFixed(1) + 'kg';
    }

    var missions = s.missions || [];
    var gym = missions.filter(function (m) { return m.id === 'r_gym'; })[0] || {};
    var gymStreak = gym.streak || 0, gymLongest = gym.longest || Math.max(gymStreak, 12);
    var move = s.move || {}; var moveStreak = move.streak || 0, moveLongest = move.longest || 0;

    function oneRM(w) { return (w && w.weight && w.reps) ? Math.round((+w.weight) * (1 + (+w.reps) / 30)) : 0; }
    var workouts = s.workouts || [];
    var best1RM = workouts.reduce(function (m, w) { return Math.max(m, oneRM(w)); }, 0) || 0;
    var wkAgo = Date.now() - 7 * 864e5;
    var workoutsWeek = workouts.filter(function (w) { return (w.ts || Date.now()) >= wkAgo; }).length || workouts.length;
    var lastPart = (workouts[0] && workouts[0].part) || 'your last session';

    var xpToday = (s.missionHistory || []).filter(function (h) { return h.date === today; }).reduce(function (a, h) { return a + (h.xp || 0); }, 0);
    if (!xpToday) xpToday = 40;

    function eventOccursOn(e, ds) {
      if (e.date === ds) return true;
      if (!e.repeat || !e.repeat.length) return false;
      if (!(ds > e.date)) return false;
      var d = new Date(ds + 'T00:00:00');
      var code = ['MON','TUE','WED','THU','FRI','SAT','SUN'][(d.getDay() + 6) % 7];
      return e.repeat.indexOf(code) !== -1;
    }
    var eventsToday = (s.events || []).filter(function (e) { return eventOccursOn(e, today); }).map(function (e) { return { time: e.time, title: e.title }; });

    var ckOpen = (s.checklist || []).filter(function (c) { return !c.done; }).map(function (c) { return c.text || c.name || c.label; }).filter(Boolean);
    var todayMissions = missions.filter(function (m) { return m.recurring || m.dayKey === today; });
    var openMissions = todayMissions.filter(function (m) { return m.lastCompleted !== today; }).map(function (m) { return m.name; });
    var taskNames = ckOpen.concat(openMissions).filter(Boolean);
    var tasksLeft = taskNames.length;

    var didWorkoutToday = gym.lastCompleted === today || workouts.some(function (w) { try { return w.ts && new Date(w.ts).toLocaleDateString('en-CA') === today; } catch (e) { return false; } });
    var missedYesterday = !!gym.lastCompleted && gym.lastCompleted !== today && gym.lastCompleted !== yest;

    return {
      name: name,
      water: water, waterGoal: waterGoal, waterLeft: waterLeft,
      waterPhrase: water + ' glass' + (water === 1 ? '' : 'es'),
      recovery: recovery, soreness: soreness, sleepAvg: sleepAvg,
      weightNow: weightNow, weightDelta: weightDelta,
      gymStreak: gymStreak, gymLongest: gymLongest, moveStreak: moveStreak, moveLongest: moveLongest,
      best1RM: best1RM, workoutsWeek: workoutsWeek,
      workoutsWeekPhrase: workoutsWeek + ' session' + (workoutsWeek === 1 ? '' : 's'),
      gymDaysPhrase: gymStreak + ' day' + (gymStreak === 1 ? '' : 's'),
      moveDaysPhrase: moveStreak + ' day' + (moveStreak === 1 ? '' : 's'),
      lastPart: lastPart,
      proteinGoal: health.proteinGoal != null ? health.proteinGoal : 180,
      kcalGoal: health.kcalGoal != null ? health.kcalGoal : 2400,
      xpToday: xpToday,
      eventsToday: eventsToday,
      taskNames: taskNames, tasksLeft: tasksLeft,
      tasksLeftPhrase: tasksLeft + ' task' + (tasksLeft === 1 ? '' : 's'),
      didWorkoutToday: didWorkoutToday, missedYesterday: missedYesterday
    };
  }

  /* ---- generator ------------------------------------------------------
     ctx    : object from buildContext (required)
     seen   : a Set of fingerprints already emitted (required — mutated)
     opts   : { prefs, only } — prefs gates families via toggles;
              only = array of catKeys to restrict to (used by the Lab filter). */
  function generate(ctx, seen, opts) {
    ctx = ctx || {};
    seen = seen || new Set();
    opts = opts || {};
    var prefs = opts.prefs || null;
    var only = opts.only && opts.only.length ? opts.only : null;

    // Build a weighted pool of eligible category keys.
    var pool = [];
    Object.keys(LIB).forEach(function (key) {
      if (only && only.indexOf(key) === -1) return;
      var c = LIB[key];
      if (c.when && !c.when(ctx)) return;
      if (prefs && FAMILY_PREF[c.family] && prefs[FAMILY_PREF[c.family]] === false) return;
      var w = typeof c.weight === 'function' ? c.weight(ctx) : (c.weight || 1);
      for (var i = 0; i < w; i++) pool.push(key);
    });
    if (!pool.length) return null;

    // Try repeatedly to compose a notification whose text has not been seen.
    var last = null;
    for (var t = 0; t < 60; t++) {
      var key = pick(pool);
      var c = LIB[key];
      var extra = c.prep ? c.prep(ctx) : null;
      var cc = extra ? Object.assign({}, ctx, extra) : ctx;
      var title = fill(pick(c.titles), cc);
      var body = fill(pick(c.bodies), cc);
      var context = c.contexts ? fill(pick(c.contexts), cc) : '';
      var fp = key + '::' + title + '::' + body;
      var out = { catKey: key, cat: c.label, label: c.label, color: c.color, glyph: c.glyph, family: c.family, title: title, body: body, context: context, fp: fp };
      last = out;
      if (!seen.has(fp)) { seen.add(fp); return out; }
    }
    // Space effectively exhausted for this context — allow the last composition.
    if (last) seen.add(last.fp);
    return last;
  }

  var api = { generate: generate, buildContext: buildContext, CATS: LIB, PALETTE: PALETTE, FAMILY_PREF: FAMILY_PREF };
  root.NotifEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
