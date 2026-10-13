/* THE HARDENING — static reference data + AI prompt builders.
   Mirrors the forge-training.js / gentlemen-etiquette.js convention: this file holds the
   data, index.html only renders and binds it. Two jobs:
     1. The DEFAULT_PROGRAM (the seven days exactly as specified) is both the reference the
        AI prompt is built from AND the fallback program shown when no AI provider is
        connected, so the page is never a dead end.
     2. buildProgramPrompt()/buildReframeQuestionsPrompt()/buildReframeSummaryPrompt() build
        the exact system+user strings sent to window.claude.complete({role:'workout'/'writing', ...}),
        matching the app's existing "system says return ONLY JSON matching this shape" pattern
        (see generateBriefingAI in index.html) so the response can be parsed the same way.
*/
(function (root) {
  'use strict';

  var HARDENING_LEVELS = [
    { key: 1, name: 'FOUNDATION', line: 'I want to become stronger and healthier without making training dominate my life.',
      focus: ['Technique', 'Consistency', 'General strength', 'Basic conditioning', 'Recovery'] },
    { key: 2, name: 'HARDEN', line: 'I want training to be difficult and I am willing to make lifestyle changes.',
      focus: ['Serious strength', 'Conditioning', 'Grip', 'Carries', 'Discipline', 'Better recovery'] },
    { key: 3, name: 'HARDENING', line: 'I want this to become a major part of my life.',
      focus: ['High consistency', 'Serious strength development', 'Conditioning', 'Mental training', 'Structured lifestyle', 'Recovery discipline'] },
    { key: 4, name: 'IRON', line: 'I am willing to structure my lifestyle around becoming significantly stronger and more capable.',
      focus: ['Advanced progression', 'High work capacity', 'Serious strength', 'Strict habits', 'Deliberate recovery', 'Long-term commitment'] },
    { key: 5, name: 'UNBREAKABLE', line: 'I want THE HARDENING to become one of the central projects of my life.',
      focus: ['Exceptional consistency', 'Serious strength development', 'High work capacity', 'Strong recovery', 'Excellent sleep', 'Structured nutrition', 'Minimal lifestyle chaos', 'Mental discipline', 'Long-term patience'],
      note: 'Level 5 does not mean maximum intensity every day. The goal is not to destroy the user — it is to build someone who can sustain the standard for years.' }
  ];

  var EXPERIENCE_LEVELS = [
    { key: 'beginner', name: 'BEGINNER', desc: 'Little or no consistent resistance training.' },
    { key: 'intermediate', name: 'INTERMEDIATE', desc: 'Consistent training experience and familiarity with major exercises.' },
    { key: 'advanced', name: 'ADVANCED', desc: 'Several years of consistent training with substantial experience in resistance training and conditioning.' }
  ];

  var EQUIPMENT_MODES = [
    { key: 'full_gym', name: 'FULL GYM', items: ['Rack', 'Barbell', 'Plates', 'Bench', 'Dumbbells', 'Kettlebells', 'Cable machines', 'Pull-up bar', 'Sled', 'Landmine', 'Cardio equipment'] },
    { key: 'home_gym', name: 'HOME GYM', items: [] /* user picks individually from ALL_EQUIPMENT below */ },
    { key: 'minimal', name: 'MINIMAL EQUIPMENT', items: ['Bodyweight', 'Backpack', 'Dumbbells', 'Kettlebell', 'Resistance bands', 'Pull-up bar'] },
    { key: 'outdoor', name: 'OUTDOOR', items: ['Hills', 'Stairs', 'Track', 'Open space', 'Sled', 'Sandbag'] }
  ];

  var ALL_EQUIPMENT = ['Rack', 'Barbell', 'Plates', 'Bench', 'Dumbbells', 'Kettlebells', 'Sandbag', 'Sled',
    'Landmine', 'Pull-up bar', 'Ropes', 'Resistance bands', 'Backpack', 'Cable machines', 'Cardio equipment',
    'Hills', 'Stairs', 'Track', 'Open space', 'Bodyweight only'];

  var LIMITATION_AREAS = ['Feet', 'Ankles', 'Calves', 'Knees', 'Hips', 'Lower back', 'Upper back',
    'Shoulders', 'Elbows', 'Wrists', 'Neck'];

  var GOALS = ['Maximum strength', 'Muscle', 'Conditioning', 'Athleticism', 'Grip strength', 'Durability',
    'Fat loss', 'Mental discipline', 'Physical capability', 'Confidence', 'Appearance', 'Work capacity',
    'Mobility', 'Explosiveness'];

  // The daily 4-movement wake-up sequence — a signal, not a workout (spec §18).
  var MORNING_MOVE_SEQUENCE = ['Squats × 10', 'Hip hinges × 10', 'Calf raises × 10',
    'Push-ups or regression × 10', 'Dead hang or alternative', 'Controlled breathing'];

  var MORNING_HABITS = [
    { key: 'getUp', label: 'GET UP', desc: 'Get out of bed when the alarm goes. Do not immediately start scrolling.' },
    { key: 'light', label: 'MORNING LIGHT', desc: 'Get outside and obtain natural daylight when practical.' },
    { key: 'hydration', label: 'HYDRATION', desc: 'Start the day hydrated.' },
    { key: 'move', label: 'MOVE', desc: 'The short wake-up sequence — a signal that the machine is awake, not a workout.' }
  ];

  var EVENING_AUDIT_QUESTIONS = ['Did I train?', 'Did I complete my habits?', 'Did I eat properly?',
    'Did I sleep properly?', 'Did I keep my promises to myself?'];

  // Mental Hardening drills (spec §23) — rotated one per day.
  var MENTAL_DRILLS = [
    { key: 'stillness', name: 'STILLNESS', desc: '5–10 minutes without stimulation.' },
    { key: 'breathing', name: 'BREATHING', desc: '5 minutes of controlled breathing.' },
    { key: 'focus', name: 'FOCUS', desc: '20–30 minutes of uninterrupted work. Phone away.' },
    { key: 'discomfort', name: 'DISCOMFORT', desc: 'Complete one safe task you have been avoiding.' },
    { key: 'journal', name: 'JOURNAL', desc: 'What matters today? What must get done? What am I avoiding?' },
    { key: 'reflection', name: 'REFLECTION', desc: 'One thing I did well. One thing I need to fix.' }
  ];

  // Testosterone-supporting lifestyle fundamentals (spec §24) — static reference content, no tracking.
  var LIFESTYLE_FUNDAMENTALS = [
    { key: 'sleep', name: 'SLEEP', desc: '7–9 hours for most adults.' },
    { key: 'training', name: 'RESISTANCE TRAINING', desc: 'Progressive resistance training.' },
    { key: 'nutrition', name: 'NUTRITION', desc: 'Adequate protein, energy, micronutrients and dietary fats.' },
    { key: 'composition', name: 'HEALTHY BODY COMPOSITION', desc: 'Avoid extreme dieting or extreme leanness as a measure of masculinity.' },
    { key: 'outdoor', name: 'OUTDOOR ACTIVITY', desc: 'Regular daylight and outdoor movement.' },
    { key: 'stress', name: 'STRESS MANAGEMENT', desc: 'Walking, breathing, social connection, structured work and recovery.' },
    { key: 'alcohol', name: 'ALCOHOL', desc: 'Keep alcohol low or avoid it.' }
  ];

  // Fallback REFRAME YOURSELF questions — used only when no AI provider is connected, so the
  // section still works offline. Fixed rather than daily-adaptive in that case.
  var FALLBACK_REFRAME_QUESTIONS = [
    'What did you knowingly avoid today?',
    'What excuse did you use today that you know is not completely true?',
    'Where did you choose comfort over the person you say you want to become?',
    'What did you say you would do but failed to do?',
    'What are you repeatedly promising yourself that you still have not done?',
    'What did you use today to escape from something you should have confronted?',
    'Where are you lying to yourself?',
    'If your actions were the only evidence available, what would they say you actually value?',
    'What do you already know needs to change?',
    'What is one thing you will do tomorrow that your current self has been avoiding?'
  ];

  // Offline fallback for the Coach's Summary — used when no AI provider is connected, or the
  // model's response doesn't parse, so a finished Reframe deck always ends in something
  // rather than a dead-end error. Grounded in what was actually written rather than invented:
  // the spec always makes the 10th question the action-question (true for both an
  // AI-generated day and the static fallback set above), so its answer IS the action, quoted
  // verbatim; "truth" points back at whichever answer got the most words rather than
  // synthesizing a claim this heuristic has no way to actually judge.
  function buildFallbackReframeSummary(questions, answers) {
    var qs = questions || [], as = answers || [];
    var lastIdx = qs.length - 1;
    var action = (as[lastIdx] || '').trim() || 'Pick the smallest concrete fix from what you wrote above and do it before the day ends.';
    var longestIdx = -1, longestLen = -1;
    for (var i = 0; i < lastIdx; i++) { var len = (as[i] || '').trim().length; if (len > longestLen) { longestLen = len; longestIdx = i; } }
    var truth = (longestIdx >= 0 && longestLen > 0)
      ? 'Look again at what you wrote for "' + qs[longestIdx] + '" — that is the one you spent the most words on.'
      : 'Only you know which answer above you did not fully commit to.';
    return {
      pattern: 'Read back over your own answers above and look for the one thing that repeats.',
      truth: truth,
      action: action,
      standard: 'Answer honestly again tomorrow, then do what you told yourself you would do today.'
    };
  }

  // Why each staple movement exists — spec §29, shown as a short line under any exercise card.
  var EXERCISE_WHY = {
    'Farmer Carry': 'Stronger hands, traps, core and carrying ability.',
    'Farmer Carries': 'Stronger hands, traps, core and carrying ability.',
    'Suitcase Carry': 'Unilateral loading — stronger core and grip on one side at a time.',
    'Sled Push': 'Strong legs and conditioning with simple movement.',
    'Sled Drag': 'Strong legs and conditioning with simple movement.',
    'Landmine Press': 'Strong pressing and rotational ability.',
    'Landmine Row': 'Strong pressing and rotational ability.',
    'Grave Diggers': 'Rotational strength and coordination.',
    'Standing Calf Raise': 'Stronger lower legs and better force production.',
    'Tibialis Raise': 'Stronger lower legs and better force production.',
    'Neck': 'Controlled neck strength.',
    'Loaded March': 'Full-body bracing and work capacity.'
  };

  /* ===== THE SIX-DAY HARDENING SYSTEM — the default/reference program (spec §11) =====
     Used verbatim as the fallback program when no AI provider is connected, and passed to
     the AI as the base structure to personalize (scale load/volume/variation) rather than
     reinvent from nothing. */
  var DEFAULT_PROGRAM = {
    level: 2,
    generatedAt: null,
    source: 'default',
    days: [
      { key: 'anvil', name: 'THE ANVIL', focus: 'Heavy Lower Body + Core',
        warmup: { minutes: 10, items: ['Easy movement', 'Bodyweight squats × 20', 'Walking lunges × 10/leg', 'Hip hinges × 15', 'Calf raises × 20', 'Tibialis raises × 20', 'Dead bugs × 10/side', 'Progressive squat warm-up'] },
        blocks: [
          { exercise: 'Back Squat', sets: 5, reps: '5', rest: '3 min' },
          { exercise: 'Romanian Deadlift', sets: 4, reps: '8', rest: '2 min' },
          { exercise: 'Walking Lunges', sets: 4, reps: '12/leg', rest: '90 sec' },
          { exercise: 'Heavy Step-Ups', sets: 3, reps: '10/leg', rest: '90 sec' },
          { exercise: 'Standing Calf Raise', sets: 4, reps: '15–20', rest: '60 sec' },
          { exercise: 'Tibialis Raise', sets: 4, reps: '15–25', rest: '45 sec' },
          { exercise: 'Ab Wheel', sets: 4, reps: '8–12', rest: '' },
          { exercise: 'Suitcase Carry', sets: 4, reps: '30–40 m/side', rest: '' }
        ],
        finisher: { exercise: 'Sled Push', sets: 6, reps: '20–30 m', rest: '60–90 sec' } },
      { key: 'iron_back', name: 'THE IRON BACK', focus: 'Back + Grip + Neck',
        warmup: { minutes: 8, items: ['Easy movement', 'Band pull-aparts × 20', 'Scap pull-ups × 10', 'Wrist circles', 'Neck: controlled flexion/extension × 10'] },
        blocks: [
          { exercise: 'Pull-Ups', sets: 5, reps: '5–10', rest: '2 min' },
          { exercise: 'Barbell Row', sets: 4, reps: '6–8', rest: '2 min' },
          { exercise: 'Landmine Row', sets: 3, reps: '10/side', rest: '90 sec' },
          { exercise: 'Farmer Carry', sets: 5, reps: '30–50 m', rest: '90 sec' },
          { exercise: 'Shrugs', sets: 4, reps: '10–15', rest: '' },
          { exercise: 'Towel Hang', sets: 4, reps: '20–45 sec', rest: '' },
          { exercise: 'Wrist Curl', sets: 3, reps: '15–20', rest: '' },
          { exercise: 'Reverse Wrist Curl', sets: 3, reps: '15–20', rest: '' },
          { exercise: 'Plate Pinch', sets: 4, reps: '20–40 sec', rest: '' },
          { exercise: 'Neck (flexion/extension/lateral, controlled)', sets: 3, reps: '15 each direction', rest: '' }
        ],
        finisher: { exercise: 'Sled Drag', sets: 6, reps: '30 m', rest: '' } },
      { key: 'hammer', name: 'THE HAMMER', focus: 'Chest + Shoulders + Arms + Grip',
        warmup: { minutes: 8, items: ['Easy movement', 'Band shoulder dislocates × 15', 'Push-up × 10', 'Wrist circles'] },
        blocks: [
          { exercise: 'Bench Press', sets: 5, reps: '5', rest: '3 min' },
          { exercise: 'Overhead Press', sets: 4, reps: '6', rest: '2 min' },
          { exercise: 'Weighted or Difficult Push-Ups', sets: 4, reps: '10–20', rest: '' },
          { exercise: 'Dips', sets: 3, reps: '8–15', rest: '' },
          { exercise: 'Hammer Curls', sets: 3, reps: '10–15', rest: '' },
          { exercise: 'Farmer Hold', sets: 4, reps: '30–60 sec', rest: '' },
          { exercise: 'Landmine Press', sets: 4, reps: '8/side', rest: '' },
          { exercise: 'Hanging Knee Raise', sets: 4, reps: '10–15', rest: '' },
          { exercise: 'Pallof Press', sets: 3, reps: '12/side', rest: '' }
        ],
        finisher: { exercise: 'Sandbag Bear-Hug Carry', sets: 5, reps: '30–40 m', rest: '' } },
      { key: 'grinder', name: 'THE GRINDER', focus: 'Full-Body Work Capacity',
        warmup: { minutes: 8, items: ['Easy movement', 'Bodyweight squats × 15', 'Arm circles', 'Light kettlebell swings × 10'] },
        blocks: [
          { exercise: '5 rounds: Sandbag Clean × 8, Goblet Squat × 15, Push-Ups × 15, Kettlebell Swings × 20, Walking Lunges × 10/leg, Farmer Carry × 30 m', sets: 5, reps: 'round', rest: '2 min between rounds' },
          { exercise: 'Grave Diggers', sets: 3, reps: '10/side', rest: '' }
        ],
        finisher: { exercise: 'Sled — alternate Push/Drag/Push/Drag', sets: 8, reps: '20 m', rest: '60–90 sec' } },
      { key: 'hunter', name: 'THE HUNTER', focus: 'Power + Athleticism + Legs',
        warmup: { minutes: 10, items: ['Easy movement', 'Skips × 20 m', 'Bodyweight squats × 15', 'Ankle bounces × 20'] },
        blocks: [
          { exercise: 'Broad Jump', sets: 5, reps: '3', rest: 'Full recovery' },
          { exercise: 'Front Squat', sets: 4, reps: '6', rest: '' },
          { exercise: 'Trap-Bar Deadlift', sets: 4, reps: '5', rest: '' },
          { exercise: 'Reverse Lunge', sets: 3, reps: '10/leg', rest: '' },
          { exercise: 'Hill Sprints', sets: 6, reps: '10–20 sec', rest: 'Walk back and fully recover' },
          { exercise: 'Loaded March', sets: 4, reps: '100–200 m', rest: '' },
          { exercise: 'Single-Leg Calf Raise', sets: 4, reps: '15/leg', rest: '' },
          { exercise: 'Foot Strength (controlled foot-strength and balance work)', sets: 1, reps: '5 min', rest: '' }
        ],
        finisher: null },
      { key: 'hardening', name: 'THE HARDENING', focus: 'Full-Body Strength + Conditioning',
        warmup: { minutes: 10, items: ['Easy movement', 'Bodyweight squats × 15', 'Band pull-aparts × 15', 'Hip hinges × 15'] },
        blocks: [
          { exercise: 'Deadlift', sets: 5, reps: '3', rest: '3 min' },
          { exercise: 'Overhead Press', sets: 4, reps: '5', rest: '' },
          { exercise: 'Pull-Ups', sets: 4, reps: '6–10', rest: '' },
          { exercise: 'Front Rack Carry', sets: 4, reps: '30 m', rest: '' },
          { exercise: '4 rounds: Sandbag Carry 40 m, Sled Push 20 m, Sled Drag 20 m, Push-Ups 20, Goblet Squats 15, Kettlebell Swings 20, Farmer Carry 30 m', sets: 4, reps: 'round', rest: '2 min' }
        ],
        finisher: { exercise: 'Loaded Walk', sets: 1, reps: '10–20 min', rest: '' } },
      { key: 'reset', name: 'THE RESET', focus: 'Recovery — no hard training', rest: true,
        warmup: null, blocks: [], finisher: null,
        items: ['Walking', 'Easy mobility', 'Recovery', 'Food', 'Hydration', 'Sleep', 'Outdoor time', 'Reflection'] }
    ]
  };

  /* ===== AI prompt builders =====
     Match the app's established pattern exactly (see generateBriefingAI in index.html):
     a system string demanding raw JSON in a literal shape, a user prompt with the actual
     request + context, sent via window.claude.complete({role, system, messages, max_tokens}),
     parsed with this._extractJSON(raw). */

  function buildProgramPrompt(profile) {
    var system = "You are a serious, old-school strength and conditioning coach building a program called THE HARDENING. "
      + "Central philosophy: BUILD THE BODY. HARDEN THE MIND. BECOME DIFFICULT TO BREAK. This is not bodybuilding — it is about "
      + "becoming physically useful: carrying, dragging, pushing, pulling, lifting, running, climbing, bracing, gripping, crawling, "
      + "moving under fatigue. Favor old-school tools and transferable-strength movements (barbells, dumbbells, kettlebells, "
      + "sandbags, sleds, landmines, pull-up bars, bodyweight, hills, stairs, loaded carries) over machines, novelty exercises or "
      + "complicated movement patterns. Language is simple, direct, serious — no corporate wellness tone, no fake motivation. "
      + "The training should be hard RELATIVE TO THE USER'S CURRENT ABILITY: a beginner never gets an advanced lifter's workload "
      + "just because they picked a high Hardening Level, and an advanced lifter never gets a beginner's workout just because they "
      + "are new here. Personalize sets, reps, load guidance and exercise selection to the profile given — do not give everyone the "
      + "same workout. If equipment is limited, substitute equivalent movements the user can actually do. Never include a movement "
      + "that would aggravate a stated physical limitation. Return ONLY valid minified JSON, no markdown fences, no commentary.";

    var shape = '{"level":1-5,"days":[{"key":"anvil|iron_back|hammer|grinder|hunter|hardening|reset","name":"THE ANVIL",'
      + '"focus":"short focus line","rest":false,"personalizationNote":"one sentence on what was adjusted for this user and why",'
      + '"warmup":{"minutes":10,"items":["..."]},'
      + '"blocks":[{"exercise":"Back Squat","sets":5,"reps":"5","rest":"3 min","why":"one short plain-language sentence on why this movement is here"}],'
      + '"finisher":{"exercise":"Sled Push","sets":6,"reps":"20-30 m","rest":"60-90 sec"} or null,'
      + '"items":["Walking","Easy mobility", "..."] (only present when rest is true, and blocks/warmup/finisher are then empty/null)}]}';

    var p = profile || {};
    var lines = [];
    lines.push('Build this user\'s personalized seven-day HARDENING program (six training days + one reset day, in this fixed order: '
      + 'THE ANVIL (heavy lower body + core), THE IRON BACK (back + grip + neck), THE HAMMER (chest + shoulders + arms + grip), '
      + 'THE GRINDER (full-body work capacity), THE HUNTER (power + athleticism + legs), THE HARDENING (full-body strength + '
      + 'conditioning), THE RESET (recovery, no hard training)).');
    lines.push('USER PROFILE:');
    lines.push('- Age: ' + (p.age || 'not given') + ', Sex: ' + (p.sex || 'not given') + ', Height: ' + (p.height || 'not given') + ', Weight: ' + (p.weight || 'not given'));
    lines.push('- Occupation: ' + (p.occupation || 'not given') + ', daily activity: ' + (p.activity || 'not given') + ', approx. daily steps: ' + (p.steps || 'unknown'));
    lines.push('- Available training days/week: ' + (p.days || 'not given') + ', session time available: ' + (p.sessionTime || 'not given'));
    lines.push('- Training experience: ' + (p.experience || 'not given') + ' (' + (p.years || 'unknown') + ' consistent training)');
    lines.push('- Previous sports/strength training: ' + (p.prevSports || 'none stated') + ' / ' + (p.prevStrength || 'none stated'));
    lines.push('- Current conditioning/running/carrying/bodyweight-training ability (self-described): ' + (p.conditioning || 'unknown') + ' / ' + (p.running || 'unknown') + ' / ' + (p.carrying || 'unknown') + ' / ' + (p.bodyweight || 'unknown'));
    lines.push('- Known current numbers (use "I don\'t know" as no data, use conservative estimates when missing): squat ' + (p.squat || '?') + ', deadlift ' + (p.deadlift || '?') + ', bench ' + (p.bench || '?') + ', overhead press ' + (p.ohp || '?') + ', pull-ups ' + (p.pullups || '?') + ', push-ups ' + (p.pushups || '?') + ', plank ' + (p.plank || '?') + ', farmer carry ' + (p.farmerCarry || '?') + ', running performance ' + (p.runPerf || '?') + ', sprint performance ' + (p.sprintPerf || '?'));
    lines.push('- Physical limitations (avoid aggravating movements here): ' + ((p.limitations || []).join(', ') || 'none stated') + (p.medicalNote ? ('; medical note: ' + p.medicalNote) : ''));
    lines.push('- Equipment available: ' + (p.equipmentMode || 'not given') + ' — specific items: ' + ((p.equipment || []).join(', ') || 'not specified'));
    lines.push('- Hardening Level: ' + (p.level || 2) + ' (1=Foundation, 2=Harden, 3=Hardening, 4=Iron, 5=Unbreakable)');
    lines.push('- Priority goals: ' + ((p.goals || []).join(', ') || 'general capability'));
    lines.push('Use the six-day templates below as the base structure and movement pool. Scale volume/load/variation to the profile above; substitute equivalent movements for missing equipment; simplify or reduce for beginners; add load/volume/harder variations for advanced users. Keep the same day names, order and general focus.');
    lines.push('REFERENCE TEMPLATES: ' + JSON.stringify(DEFAULT_PROGRAM.days));
    lines.push('Return JSON exactly matching this shape: ' + shape);
    return { system: system, prompt: lines.join('\n') };
  }

  // "Make It Harder" / "Too Much" (spec §13-14) as a real AI call rather than a fixed
  // heuristic: the model sees the day's actual current blocks and is told to move the WHOLE
  // day one clear notch in one direction, choosing whichever variable(s) — load, volume,
  // rest, tempo — actually make sense for that specific exercise, rather than a single
  // hardcoded rule applied everywhere. It must keep the same exercises in the same order
  // (no swapping movements, no adding/removing blocks) so this stays a dial, not a rewrite.
  function buildAdjustDayPrompt(day, harder, profile) {
    var dir = harder ? 'HARDER' : 'EASIER';
    var system = "You are the same programming coach for THE HARDENING ('BUILD THE BODY. HARDEN THE MIND. BECOME DIFFICULT TO "
      + "BREAK.'). The user tapped '" + (harder ? 'MAKE IT HARDER' : 'TOO MUCH') + "' on today's session. Adjust this ONE day " + dir
      + " by one clear, sensible notch — pick whichever variable(s) (sets, reps, rest, or the finisher's reps/distance) actually make "
      + "sense per exercise; you do not have to change every block the same way. Keep the exact same exercises in the exact same "
      + "order — do not add, remove, or swap movements, this is a dial on the existing day, not a rewrite. Never push a beginner "
      + "into an unsafe jump; a harder notch is meaningfully more, not extreme, and an easier notch stays a real session, not nothing. "
      + "Return ONLY valid minified JSON, no markdown fences, no commentary.";
    var shape = '{"blocks":[{"sets":"same or new value","reps":"same or new value","rest":"same or new value"}, '
      + '... one entry per block, same order as given ...],"finisher":{"reps":"same or new value"} or null}';
    var p = profile || {};
    var lines = [];
    lines.push('Day: ' + (day.name || '') + ' — ' + (day.focus || ''));
    lines.push('Direction: ' + dir);
    lines.push('Experience: ' + (p.experience || 'unknown') + ', Hardening level: ' + (p.level || 2));
    lines.push('Current blocks (same order, adjust in place): ' + JSON.stringify((day.blocks || []).map(function (b) {
      return { exercise: b.exercise, sets: b.sets, reps: b.reps, rest: b.rest };
    })));
    lines.push('Current finisher: ' + (day.finisher ? JSON.stringify({ exercise: day.finisher.exercise, reps: day.finisher.reps }) : 'none'));
    lines.push('Return JSON exactly matching this shape, same number of blocks in the same order: ' + shape);
    return { system: system, prompt: lines.join('\n') };
  }

  function buildReframeQuestionsPrompt(context) {
    var system = "You are a serious, direct coach — not a therapist, not a motivational speaker, not a friend trying to make the "
      + "user feel better. Your job is REFRAME YOURSELF: ten short, specific, uncomfortable questions per day that force honest "
      + "self-confrontation about accountability, discipline, comfort-seeking, distraction/avoidance and self-deception. Pull from "
      + "multiple of those five areas each day, not just training. Prefer specific questions ('What did you waste time on today that "
      + "you knew you should not have?') over generic ones ('How did you feel today?'). At least one question should be a mirror "
      + "question about identity vs behavior, and at least one an uncomfortable-truth question about something the user already "
      + "knows but avoids. The final (10th) question should convert reflection into one small, concrete action for tomorrow. Never "
      + "encourage self-hatred, self-punishment, shame, or ignoring real medical/mental-health concerns — the standard is honesty, "
      + "responsibility, action, change, never shame. Do not repeat the same ten questions verbatim day to day; use the user's "
      + "recent history to make them progressively more specific. Return ONLY valid minified JSON, no markdown fences, no commentary.";

    var shape = '{"questions":["question 1","question 2","...", "question 10 (the action question)"]}';
    var c = context || {};
    var lines = [];
    lines.push('Generate today\'s 10 REFRAME YOURSELF questions for this user.');
    lines.push('Recent training consistency: ' + (c.trainingConsistency || 'unknown'));
    lines.push('Recent habit completion: ' + (c.habitCompletion || 'unknown'));
    lines.push('Recent patterns noticed (missed sessions, late nights, phone use, broken commitments, etc.): ' + (c.patterns || 'none recorded yet'));
    lines.push('Previous days\' coach summaries (most recent last): ' + (c.pastSummaries || 'none yet — this is the first day'));
    lines.push('If there is little or no history yet, ask broader foundational questions across the five areas rather than inventing false specifics.');
    lines.push('Return JSON exactly matching this shape: ' + shape);
    return { system: system, prompt: lines.join('\n') };
  }

  function buildReframeSummaryPrompt(questions, answers) {
    var system = "You are the same direct, serious REFRAME YOURSELF coach. You have just read the user's honest answers to today's "
      + "ten questions. Identify one pattern, one truth, one action and one standard — concise, specific, grounded only in what they "
      + "actually wrote. Never shame, never insult, never manufacture drama. The tone is firm, not cruel. Return ONLY valid minified "
      + "JSON, no markdown fences, no commentary.";
    var shape = '{"pattern":"one sentence","truth":"one sentence","action":"one specific concrete action for tomorrow","standard":"one behavior to maintain tomorrow"}';
    var qa = (questions || []).map(function (q, i) { return (i + 1) + '. ' + q + '\nAnswer: ' + ((answers || [])[i] || '(no answer)'); }).join('\n\n');
    var prompt = "Today's questions and the user's answers:\n\n" + qa + '\n\nReturn JSON exactly matching this shape: ' + shape;
    return { system: system, prompt: prompt };
  }

  root.HardeningEngine = {
    HARDENING_LEVELS: HARDENING_LEVELS,
    EXPERIENCE_LEVELS: EXPERIENCE_LEVELS,
    EQUIPMENT_MODES: EQUIPMENT_MODES,
    ALL_EQUIPMENT: ALL_EQUIPMENT,
    LIMITATION_AREAS: LIMITATION_AREAS,
    GOALS: GOALS,
    MORNING_MOVE_SEQUENCE: MORNING_MOVE_SEQUENCE,
    MORNING_HABITS: MORNING_HABITS,
    EVENING_AUDIT_QUESTIONS: EVENING_AUDIT_QUESTIONS,
    MENTAL_DRILLS: MENTAL_DRILLS,
    LIFESTYLE_FUNDAMENTALS: LIFESTYLE_FUNDAMENTALS,
    EXERCISE_WHY: EXERCISE_WHY,
    FALLBACK_REFRAME_QUESTIONS: FALLBACK_REFRAME_QUESTIONS,
    buildFallbackReframeSummary: buildFallbackReframeSummary,
    DEFAULT_PROGRAM: DEFAULT_PROGRAM,
    buildProgramPrompt: buildProgramPrompt,
    buildAdjustDayPrompt: buildAdjustDayPrompt,
    buildReframeQuestionsPrompt: buildReframeQuestionsPrompt,
    buildReframeSummaryPrompt: buildReframeSummaryPrompt
  };
})(typeof window !== 'undefined' ? window : this);
