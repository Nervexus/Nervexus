/* THE FORGE — training, mental and health protocol data.
   =====================================================================================
   Not a fitness plan. A standard to be met.

   Three centres, one purpose: bigger, stronger, faster, healthier, with hormones working
   the way they should. The programme is deliberately hard and deliberately complete —
   it covers the ten regions most training misses, not the five that look good in a mirror.

   Design rules this file follows, so it stays honest under pressure:

   * Every standard is a NUMBER someone can pass or fail. "Improve your neck" is not a
     standard; "90 seconds of prone hold with 10kg" is. Assessments read these directly.
   * Tiers are named and ordered: Baseline -> Hardened -> Forged -> Unit. Unit is meant to
     be genuinely rare, not the fourth participation trophy.
   * `risk` is not a disclaimer, it is loading information. Neck and spine work has an
     order of operations; ignoring it is how people get hurt, and someone injured trains
     nothing. Harsh and reckless are different things.
   * Health claims carry `evidence` — 'strong', 'moderate' or 'weak'. A file about
     testosterone that treats sleep and a supplement as equally proven is lying to the
     reader, and lying makes the hard advice easier to dismiss too.

   Pure data plus small pure helpers: no DOM, no network, no state. index.html renders it
   and forge-engine.test.mjs checks it. */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every script. See engine-guards.test.mjs.
  if (root.Forge) return;

  var TIERS = ['Baseline', 'Hardened', 'Forged', 'Unit'];

  /* ---- TRAINING CENTRE -------------------------------------------------------------
     Ten regions, head to feet. Order is deliberate: the neglected ones are not an
     appendix at the bottom, they are numbered the same as the chest. */
  var REGIONS = [
    {
      key: 'head', name: 'Head', neglected: true,
      why: 'The jaw, the eyes and the breath are trainable tissue that almost nobody trains. '
         + 'A jaw that works, eyes that track and a nose that carries the whole breath change '
         + 'how you hold your head, how you look, and how hard you can go before you gasp.',
      standards: [
        { id: 'nasal-walk',  name: 'Nasal-only walk',      unit: 'minutes', tiers: [20, 45, 60, 90] },
        { id: 'co2-hold',    name: 'CO2 tolerance hold',   unit: 'seconds', tiers: [30, 60, 90, 120],
          how: 'Exhale normally, then hold. Measures tolerance, not lung size.' },
        { id: 'eye-track',   name: 'Smooth pursuit, no head movement', unit: 'seconds', tiers: [30, 60, 90, 120] }
      ],
      work: [
        { name: 'Nasal breathing, all day', dose: 'Every waking hour', cue: 'Mouth shut. If you cannot, you are going too hard — slow down until you can.' },
        { name: 'CO2 tolerance holds',      dose: '5 rounds, daily',   cue: 'Exhale first. Hold to discomfort, never to panic.' },
        { name: 'Hard chewing',             dose: 'Daily',             cue: 'Tough cuts of meat, raw carrot, mastic gum. Both sides evenly or you build a crooked jaw.',
          risk: 'Stop at any jaw clicking or pain. TMJ damage is slow to heal and ends the whole programme.' },
        { name: 'Eye pursuits and near-far', dose: '3 min, daily',     cue: 'Head still, eyes move. Near-far at arm’s length and across the room.' }
      ]
    },
    {
      key: 'neck', name: 'Neck', neglected: true,
      why: 'A neck carries the head, protects the spine and is the single clearest signal '
         + 'of a body that trains for capability rather than appearance. It is also the '
         + 'first thing to fail under impact.',
      standards: [
        { id: 'neck-prone',  name: 'Prone hold (added load)', unit: 'kg for 60s',  tiers: [0, 5, 10, 20] },
        { id: 'neck-supine', name: 'Supine hold (added load)',unit: 'kg for 60s',  tiers: [0, 5, 10, 15] },
        { id: 'neck-circ',   name: 'Neck circumference',      unit: 'cm',          tiers: [36, 40, 43, 46] }
      ],
      work: [
        { name: 'Isometric holds — 4 directions', dose: '4 x 45s, 3x/week', cue: 'Front, back, both sides. Build the holds for a month before any movement.',
          risk: 'ISOMETRICS FIRST. Weeks 1-4 are holds only. Loaded movement before the tissue adapts is how necks get injured.' },
        { name: 'Prone neck extension',  dose: '3 x 15, 2x/week', cue: 'Face down, head off the bench, chin tucked. Slow. Plate on the back of the head once bodyweight is easy.',
          risk: 'Never bounce. Never take it to end range under load.' },
        { name: 'Supine neck flexion',   dose: '3 x 15, 2x/week', cue: 'Face up, chin to chest, no jutting.' },
        { name: 'Lateral neck raises',   dose: '3 x 12 each side', cue: 'Ear toward shoulder. Both sides equal, always.' },
        { name: 'Loaded carries',        dose: 'Weekly',           cue: 'Heavy carries build the neck and traps together under real load.' }
      ]
    },
    {
      key: 'shoulders', name: 'Shoulders',
      why: 'The most mobile joint in the body, and the most commonly wrecked. Built properly '
         + 'it means overhead strength that lasts decades; built badly it means impingement by forty.',
      standards: [
        { id: 'ohp',        name: 'Strict overhead press', unit: '% bodyweight', tiers: [50, 75, 100, 125] },
        { id: 'handstand',  name: 'Wall handstand hold',   unit: 'seconds',      tiers: [20, 60, 120, 180] },
        { id: 'ext-rot',    name: 'External rotation',     unit: '% of press 1RM', tiers: [8, 12, 15, 20] }
      ],
      work: [
        { name: 'Strict overhead press', dose: '5 x 5, 2x/week', cue: 'No leg drive. Ribs down, glutes tight, head through at the top.' },
        { name: 'Wall handstand holds',  dose: 'Accumulate 3 min', cue: 'Chest to wall, not back to wall. Fingers gripping the floor.' },
        { name: 'Lateral raises',        dose: '4 x 15-20',       cue: 'Light, slow, no swing. The side delt responds to volume, not ego.' },
        { name: 'Face pulls / rear delt', dose: '4 x 20, 3x/week', cue: 'The insurance policy. Twice the volume of your pressing.' },
        { name: 'External rotation',     dose: '3 x 15 each',     cue: 'Elbow pinned to the side. This is what keeps the shoulder in its socket at 50.' }
      ]
    },
    {
      key: 'chest', name: 'Chest',
      why: 'Pressing strength is real strength — but only when the shoulder can survive it. '
         + 'Pressed hard and pulled twice as hard.',
      standards: [
        { id: 'bench',      name: 'Bench press',      unit: '% bodyweight', tiers: [75, 100, 140, 175] },
        { id: 'dips',       name: 'Weighted dip',     unit: '% bodyweight added', tiers: [0, 25, 50, 75] },
        { id: 'pushups',    name: 'Push-ups, unbroken', unit: 'reps',       tiers: [25, 50, 75, 100] }
      ],
      work: [
        { name: 'Bench press',   dose: '5 x 5, 2x/week', cue: 'Shoulder blades pinned, feet driving, bar to the sternum. Full range or it does not count.' },
        { name: 'Weighted dips', dose: '4 x 6-8',        cue: 'Lean forward for chest, upright for triceps. Full depth.',
          risk: 'Stop short of the shoulder-forward position if you feel a pinch at the bottom.' },
        { name: 'Incline press', dose: '4 x 8',          cue: 'Upper chest is what makes a chest look built rather than inflated.' },
        { name: 'Deficit push-ups', dose: '3 x max',     cue: 'Hands elevated on blocks, chest below hand level.' }
      ]
    },
    {
      key: 'abs', name: 'Abs & Core',
      why: 'The core is not for showing. It is what stops the spine folding under a heavy bar '
         + 'and what transfers force from legs to hands. Visible abs are a body-fat outcome, '
         + 'not a training one.',
      standards: [
        { id: 'hollow',   name: 'Hollow body hold',  unit: 'seconds', tiers: [30, 60, 120, 180] },
        { id: 'l-sit',    name: 'L-sit',             unit: 'seconds', tiers: [5, 20, 45, 60] },
        { id: 'carry',    name: 'Farmer carry',      unit: '% bodyweight for 60m', tiers: [50, 100, 150, 200] }
      ],
      work: [
        { name: 'Hollow body holds',  dose: '5 x max, daily', cue: 'Lower back flat to the floor. If it lifts, shorten the levers.' },
        { name: 'Ab wheel / rollout', dose: '4 x 8-12',       cue: 'Anti-extension. Do not let the lower back arch — that is the whole exercise.' },
        { name: 'Pallof press',       dose: '3 x 12 each',    cue: 'Anti-rotation. Resist the pull, do not produce it.' },
        { name: 'Loaded carries',     dose: '4 x 60m, weekly',cue: 'Farmer, suitcase, front rack. Built the whole trunk and the grip at once.' },
        { name: 'Hanging leg raises', dose: '4 x 10-15',      cue: 'No swing. Curl the pelvis at the top or it is only hip flexors.' }
      ]
    },
    {
      key: 'back', name: 'Back',
      why: 'The largest muscle group and the one that decides whether you are strong or just '
         + 'look strong. It also decides whether your spine survives the next forty years.',
      standards: [
        { id: 'deadlift',  name: 'Deadlift',        unit: '% bodyweight', tiers: [150, 200, 250, 300] },
        { id: 'pullups',   name: 'Strict pull-ups', unit: 'reps',         tiers: [8, 15, 25, 35] },
        { id: 'wpullup',   name: 'Weighted pull-up',unit: '% bodyweight added', tiers: [0, 25, 50, 80] }
      ],
      work: [
        { name: 'Deadlift',        dose: '5 x 3, 1-2x/week', cue: 'Neutral spine, bar against the shins, push the floor away.',
          risk: 'Form breaks before the muscle does. The set ends at the first rounded rep, not the failed one.' },
        { name: 'Weighted pull-ups', dose: '5 x 5',          cue: 'Dead hang to chin over bar. No kip.' },
        { name: 'Barbell row',     dose: '4 x 8',            cue: 'Torso near parallel, bar to the navel, no jerking.' },
        { name: 'Face pulls',      dose: '4 x 20',           cue: 'Every session. Non-negotiable.' },
        { name: 'Back extensions', dose: '3 x 15',           cue: 'Erectors trained directly, not just as deadlift collateral.' }
      ]
    },
    {
      key: 'upper-legs', name: 'Upper Legs',
      why: 'Squat and hinge strength drives everything: sprint speed, hormonal response, '
         + 'and the ability to still stand up unaided at eighty.',
      standards: [
        { id: 'squat',     name: 'Back squat',        unit: '% bodyweight', tiers: [100, 150, 200, 250] },
        { id: 'pistol',    name: 'Pistol squat',      unit: 'reps each leg', tiers: [1, 5, 10, 15] },
        { id: 'nordic',    name: 'Nordic curl',       unit: 'reps',          tiers: [1, 3, 6, 10] }
      ],
      work: [
        { name: 'Back squat',      dose: '5 x 5, 2x/week', cue: 'Below parallel. Half squats build half legs.' },
        { name: 'Romanian deadlift', dose: '4 x 8',        cue: 'Hamstrings under stretch. Hips back, not knees forward.' },
        { name: 'Bulgarian split squat', dose: '3 x 10 each', cue: 'The single hardest thing you can do with light dumbbells.' },
        { name: 'Nordic curls',    dose: '3 x max',        cue: 'The best hamstring insurance there is. Lower as slowly as you can.',
          risk: 'Brutal on untrained hamstrings. Start with a band or a high box.' },
        { name: 'Sled push / hill sprints', dose: 'Weekly', cue: 'Where leg strength becomes speed.' }
      ]
    },
    {
      key: 'lower-legs', name: 'Lower Legs', neglected: true,
      why: 'Calves take bodyweight thousands of times a day and almost everyone trains them '
         + 'as an afterthought. The tibialis at the front — the muscle nobody trains at all — '
         + 'is what stops shin splints and knee pain.',
      standards: [
        { id: 'calf-raise', name: 'Single-leg calf raise', unit: 'reps',    tiers: [15, 25, 40, 60] },
        { id: 'tib-raise',  name: 'Tibialis raise',        unit: 'reps',    tiers: [20, 35, 50, 75] },
        { id: 'calf-circ',  name: 'Calf circumference',    unit: 'cm',      tiers: [35, 38, 41, 44] }
      ],
      work: [
        { name: 'Standing calf raise', dose: '4 x 15, 3x/week', cue: 'Full stretch at the bottom, 2s hold at the top. Gastroc needs a straight knee.' },
        { name: 'Seated calf raise',   dose: '4 x 20',          cue: 'Bent knee hits the soleus — the endurance half, and the half that gets skipped.' },
        { name: 'Tibialis raises',     dose: '3 x 25, 3x/week', cue: 'Heels against a wall, toes lifting. Burns like nothing else.' },
        { name: 'Jump rope',           dose: '10 min',          cue: 'Elastic strength through the whole lower leg.' }
      ]
    },
    {
      key: 'feet', name: 'Feet', neglected: true,
      why: 'Twenty-six bones and thirty-three joints, spent a lifetime in a padded cast. '
         + 'Weak feet collapse arches, rotate knees inward and end up as hip pain. This is '
         + 'the base everything else stands on.',
      standards: [
        { id: 'toe-spread', name: 'Toe splay, no hands',   unit: 'pass/fail', tiers: [0, 1, 1, 1], binary: true },
        { id: 'sl-balance', name: 'Single-leg balance, eyes shut', unit: 'seconds', tiers: [10, 30, 60, 90] },
        { id: 'barefoot-walk', name: 'Barefoot walking',   unit: 'minutes/day', tiers: [10, 30, 60, 90] }
      ],
      work: [
        { name: 'Short foot exercise', dose: '3 x 10 each, daily', cue: 'Draw the ball of the foot toward the heel without curling the toes. Builds the arch.' },
        { name: 'Toe splay and lifts', dose: 'Daily',              cue: 'Big toe up alone, then the other four alone. Hard at first — that is the point.' },
        { name: 'Barefoot walking',    dose: 'Daily',              cue: 'On grass, gravel, sand. Varied ground is the training stimulus.',
          risk: 'Build up slowly. Going from cushioned shoes to barefoot mileage overnight causes stress fractures.' },
        { name: 'Toe spacers',         dose: 'Evenings',           cue: 'Undo the shape the shoes made.' }
      ]
    },
    {
      key: 'hands', name: 'Hands & Grip', neglected: true,
      why: 'Grip is the bottleneck on every pull you will ever do, and grip strength is one of '
         + 'the strongest single predictors of all-cause mortality that exists. Train the '
         + 'extensors too, or you build an imbalance straight into your elbows.',
      standards: [
        { id: 'deadhang',  name: 'Dead hang',         unit: 'seconds', tiers: [30, 60, 120, 180] },
        { id: 'pinch',     name: 'Two-hand pinch',    unit: '% bodyweight', tiers: [25, 40, 55, 70] },
        { id: 'dynamo',    name: 'Grip dynamometer',  unit: 'kg', tiers: [40, 55, 65, 80] }
      ],
      work: [
        { name: 'Dead hangs',        dose: 'Accumulate 3 min daily', cue: 'Also decompresses the spine and the shoulder.' },
        { name: 'Farmer carries',    dose: '4 x 60m',                cue: 'Support grip and the whole body at once.' },
        { name: 'Pinch grip holds',  dose: '3 x 30s',                cue: 'Two plates, smooth sides out. Thumb strength nothing else builds.' },
        { name: 'Finger extensions', dose: '3 x 20, daily',          cue: 'Rubber band around the fingers, open against it. The half everyone skips, and the reason elbows hurt.' },
        { name: 'Wrist roller',      dose: '3 x to failure',         cue: 'Both directions. Forearms are built by time under tension.' }
      ]
    }
  ];

  /* ---- MENTAL CENTRE ---------------------------------------------------------------
     Six domains, each with drills that have a measurable standard attached. A "focus
     exercise" you cannot score is a hobby. */
  var MENTAL = [
    {
      key: 'focus', name: 'Focus',
      why: 'Attention is the one resource everything else is bought with. It is trainable, '
         + 'and it is being actively degraded by design every day you do not train it.',
      standards: [
        { id: 'deep-block',   name: 'Unbroken deep work', unit: 'minutes', tiers: [25, 60, 120, 240] },
        { id: 'phone-free',   name: 'First hour phone-free', unit: 'days/week', tiers: [3, 5, 7, 7] },
        { id: 'boredom',      name: 'Sitting with nothing', unit: 'minutes', tiers: [5, 15, 30, 60] }
      ],
      drills: [
        { name: 'Single-task blocks', dose: 'Daily', how: 'One task, timer running, phone in another room. Not silenced — another room.' },
        { name: 'Boredom tolerance',  dose: 'Daily', how: 'Sit with no input. No music, no phone, no book. This is withdrawal, and it passes.' },
        { name: 'Attention residue check', dose: 'Between tasks', how: 'Two minutes of nothing between tasks instead of a scroll. Stops the last task bleeding into the next.' },
        { name: 'Kill the pull', dose: 'Once', how: 'Notifications off. Feeds off the home screen. You cannot out-discipline a system designed by thousands of engineers to beat you.' }
      ]
    },
    {
      key: 'memory', name: 'Memory',
      why: 'Memory is a skill with known technique, not a fixed trait. The methods are old, '
         + 'unglamorous and they work.',
      standards: [
        { id: 'digit-span',  name: 'Digit span',        unit: 'digits', tiers: [7, 9, 12, 16] },
        { id: 'recall-24h',  name: '24h recall of 20 items', unit: 'items', tiers: [10, 15, 18, 20] },
        { id: 'loci',        name: 'Memory palace, items placed', unit: 'items', tiers: [10, 25, 50, 100] }
      ],
      drills: [
        { name: 'Spaced repetition', dose: 'Daily', how: 'Review at increasing intervals. The app already does this for weak topics — use it.' },
        { name: 'Memory palace',     dose: '3x/week', how: 'A route you know. Place vivid, absurd images at fixed points. Absurd is what makes it stick.' },
        { name: 'Active recall',     dose: 'Every study session', how: 'Close the book and write what you remember. Re-reading feels like learning and is not.' },
        { name: 'Name discipline',   dose: 'Every introduction', how: 'Repeat it aloud, link it to an image, use it once before the conversation ends.' }
      ]
    },
    {
      key: 'creativity', name: 'Creativity',
      why: 'Output volume, not inspiration. Creativity is a numbers game played by people who '
         + 'show up whether or not they feel like it.',
      standards: [
        { id: 'ideas-day',   name: 'Ideas written per day', unit: 'ideas', tiers: [5, 10, 20, 30] },
        { id: 'ship-rate',   name: 'Things finished per month', unit: 'count', tiers: [1, 2, 4, 8] },
        { id: 'input-diet',  name: 'Long-form reading', unit: 'minutes/day', tiers: [15, 30, 60, 90] }
      ],
      drills: [
        { name: 'Ten ideas a day',  dose: 'Daily', how: 'Written, bad ones included. The bad ones are the price of the good ones.' },
        { name: 'Constraint work',  dose: 'Weekly', how: 'Deliberately limit tools, time or materials. Constraint forces invention.' },
        { name: 'Cross-domain input', dose: 'Weekly', how: 'Read outside your field. Every original idea is two old ideas from different places.' },
        { name: 'Ship something',   dose: 'Weekly', how: 'Finished and released beats perfect and hidden, every time.' }
      ]
    },
    {
      key: 'motivation', name: 'Motivation',
      why: 'Motivation is a consequence of action, not a prerequisite for it. Waiting to feel '
         + 'like it is the single most common reason people never start.',
      standards: [
        { id: 'streak',      name: 'Longest unbroken streak', unit: 'days', tiers: [14, 60, 180, 365] },
        { id: 'zero-days',   name: 'Zero days in a month', unit: 'days', tiers: [8, 4, 2, 0], lowerIsBetter: true },
        { id: 'start-lag',   name: 'Time from waking to first work', unit: 'minutes', tiers: [120, 60, 30, 15], lowerIsBetter: true }
      ],
      drills: [
        { name: 'Two-minute start', dose: 'Whenever stalled', how: 'Commit to two minutes only. Starting is the hard part; continuing rarely is.' },
        { name: 'No zero days',     dose: 'Daily', how: 'Something every day, however small. The streak is the asset.' },
        { name: 'Environment first', dose: 'Once', how: 'Make the right thing the easy thing. Willpower loses to convenience over months.' },
        { name: 'Identity, not goals', dose: 'Ongoing', how: '"I am someone who trains" survives a bad week. "I want to get fit" does not.' }
      ]
    },
    {
      key: 'discipline', name: 'Discipline',
      why: 'The ability to do the thing when every part of you does not want to. Built the '
         + 'only way it can be: by repeatedly doing exactly that.',
      standards: [
        { id: 'cold',        name: 'Cold exposure',      unit: 'minutes', tiers: [1, 3, 5, 10] },
        { id: 'kept-word',   name: 'Promises kept to yourself', unit: '%', tiers: [70, 85, 95, 100] },
        { id: 'hard-first',  name: 'Hardest task done first', unit: 'days/week', tiers: [3, 5, 6, 7] }
      ],
      drills: [
        { name: 'Cold exposure',      dose: 'Daily', how: 'Cold shower, finish on cold. Voluntary discomfort with a defined end.',
          risk: 'Not for anyone with a heart condition. Never in open water alone — cold shock kills strong swimmers.' },
        { name: 'Hardest thing first', dose: 'Daily', how: 'Before email, before phone. The day is won or lost in the first hour.' },
        { name: 'Keep small promises', dose: 'Daily', how: 'Discipline is trust in yourself, and trust is built from small kept promises.' },
        { name: 'Deliberate hard thing', dose: 'Weekly', how: 'One thing you would rather not do. Chosen, not stumbled into.' }
      ]
    },
    {
      key: 'addiction', name: 'Overcoming Addictions',
      why: 'Every addiction runs the same loop: cue, craving, response, reward. You break it '
         + 'at the cue, because that is where it is weakest.',
      standards: [
        { id: 'clean-days',  name: 'Consecutive clean days', unit: 'days', tiers: [7, 30, 90, 365] },
        { id: 'cue-removed', name: 'Triggers removed from environment', unit: '%', tiers: [50, 75, 90, 100] },
        { id: 'urge-ride',   name: 'Urge ridden without acting', unit: 'minutes', tiers: [5, 10, 20, 30] }
      ],
      drills: [
        { name: 'Remove the cue',   dose: 'Once, ruthlessly', how: 'Delete, block, throw out, change the route. Do not rely on resisting something in arm’s reach.' },
        { name: 'Urge surfing',     dose: 'Every craving', how: 'Cravings peak and fall in about 20 minutes. Watch it rise and pass without acting. It always passes.' },
        { name: 'Replacement behaviour', dose: 'Every trigger', how: 'A vacuum gets filled by the old thing. Decide in advance what fills it instead.' },
        { name: 'Tell someone',     dose: 'Once', how: 'Private commitments are easy to renegotiate at 2am.' },
        { name: 'Relapse protocol', dose: 'Written in advance', how: 'One lapse is a data point, not an identity. Written beforehand, because you will not think clearly afterwards.',
          risk: 'Alcohol, benzodiazepine and opioid withdrawal can be medically dangerous. Those need a doctor, not willpower.' }
      ]
    }
  ];

  /* ---- HEALTH CENTRE ----------------------------------------------------------------
     Testosterone first, because it is the lever that moves the others — but graded by
     evidence, because a list that ranks sleep alongside a supplement is not information.

     'strong'   = consistent controlled evidence, large effect
     'moderate' = real evidence, smaller or less consistent effect
     'weak'     = plausible, popular, thin support. Listed so it can be recognised as thin. */
  var T_LEVERS = [
    { name: 'Sleep 7-9 hours', evidence: 'strong', effect: 'Large',
      detail: 'One week at five hours drops testosterone by 10-15% in healthy young men. Nothing else on this list is undone as fast, and nothing else is as free.' },
    { name: 'Get body fat to 10-15%', evidence: 'strong', effect: 'Large',
      detail: 'Fat tissue converts testosterone to oestrogen via aromatase. Excess fat is not neutral — it is actively working against you.' },
    { name: 'Heavy compound lifting', evidence: 'strong', effect: 'Moderate',
      detail: 'Squats, deadlifts, presses. Acute post-training rises are small and short-lived; the real mechanism is body composition and insulin sensitivity over months.' },
    { name: 'Do not run a calorie deficit forever', evidence: 'strong', effect: 'Large',
      detail: 'Prolonged aggressive deficits suppress the whole HPG axis. Cut in blocks, then eat at maintenance.' },
    { name: 'Cut alcohol', evidence: 'strong', effect: 'Moderate',
      detail: 'Directly toxic to Leydig cells. Heavy drinking measurably lowers testosterone; occasional drinking much less so. This is the easiest large win most people refuse.' },
    { name: 'Fix vitamin D', evidence: 'moderate', effect: 'Moderate',
      detail: 'Correcting a deficiency helps. Supplementing when already replete does nothing. Test before dosing — this is the one worth an actual blood test.' },
    { name: 'Enough zinc and magnesium', evidence: 'moderate', effect: 'Moderate',
      detail: 'Deficiency lowers testosterone; correcting it restores. Excess does not push it higher. Food first: oysters, red meat, pumpkin seeds.' },
    { name: 'Manage chronic stress', evidence: 'moderate', effect: 'Moderate',
      detail: 'Cortisol and testosterone move against each other. Chronic stress keeps cortisol elevated and testosterone suppressed.' },
    { name: 'Enough dietary fat', evidence: 'moderate', effect: 'Moderate',
      detail: 'Very low fat diets lower testosterone. Roughly 20-30% of calories from fat, with saturated and monounsaturated included.' },
    { name: 'Morning sunlight', evidence: 'weak', effect: 'Small',
      detail: 'Good for circadian rhythm, which is good for sleep, which genuinely matters. The direct hormonal claims are thin.' },
    { name: 'Testosterone-boosting supplements', evidence: 'weak', effect: 'Negligible',
      detail: 'Tribulus, D-aspartic acid, most "T-boosters": no meaningful effect in men who are not deficient. Money better spent on food.' }
  ];

  var LIFESTYLE = [
    { name: 'Sleep discipline',  detail: 'Same times daily. Dark, cold, no screens for the last hour. The whole programme is built on this.' },
    { name: 'Daily sunlight',    detail: 'Within an hour of waking, outdoors, no sunglasses. Sets the clock that sets everything else.' },
    { name: 'Walk 10,000 steps', detail: 'Not training — the baseline underneath training. Non-negotiable on rest days.' },
    { name: 'Cold exposure',     detail: 'Daily. Recovery and discipline in the same two minutes.' },
    { name: 'No phone in bed',   detail: 'The single highest-return rule on this page.' },
    { name: 'Sauna or heat',     detail: 'Where available. Good evidence for cardiovascular health and recovery.' },
    { name: 'Alcohol: as close to zero as you will accept', detail: 'It costs sleep, recovery, hormones and body composition at once. Nothing else on the list is that expensive.' }
  ];

  /* Whole foods only, priced per typical UK serving so "eat well" stops being an abstraction.
     Cost is what makes a nutrition plan survive contact with a real week. */
  var FOODS = [
    { name: 'Eggs',            per: '£0.30/egg',   gives: 'Complete protein, choline, cholesterol for hormone synthesis', note: 'Whole. The yolk is the nutritious part.' },
    { name: 'Beef liver',      per: '£0.60/100g',  gives: 'The most nutrient-dense food there is — vitamin A, B12, copper, iron', note: 'Once a week is plenty. Cheap because nobody wants it.' },
    { name: 'Sardines (tinned)', per: '£0.90/tin', gives: 'Omega-3, calcium from the bones, vitamin D, protein', note: 'Cheapest real omega-3 available.' },
    { name: 'Whole milk',      per: '£1.30/litre', gives: 'Protein, calcium, fat-soluble vitamins', note: 'Skimmed removes the fat-soluble vitamins.' },
    { name: 'Oats',            per: '£0.15/serving', gives: 'Slow carbohydrate, fibre, magnesium', note: 'Bulk bags. Cheapest quality carbohydrate there is.' },
    { name: 'Potatoes',        per: '£0.20/500g',  gives: 'Carbohydrate, potassium, vitamin C', note: 'Whole and cooked simply, not processed into chips.' },
    { name: 'Frozen vegetables', per: '£1.00/kg',  gives: 'Micronutrients, fibre', note: 'Frozen at harvest — often higher in nutrients than fresh that has travelled.' },
    { name: 'Beef mince (higher fat)', per: '£1.50/250g', gives: 'Protein, zinc, iron, creatine, B12', note: 'Cheaper than lean and better for hormones.' },
    { name: 'Pumpkin seeds',   per: '£0.40/30g',   gives: 'Zinc, magnesium', note: 'The two minerals most often short in men who train.' },
    { name: 'Brazil nuts',     per: '£0.25/2 nuts',gives: 'Selenium', note: 'Two a day. More is genuinely harmful — selenium is toxic in excess.' },
    { name: 'Olive oil',       per: '£0.25/tbsp',  gives: 'Monounsaturated fat, polyphenols', note: 'Extra virgin, not for high heat.' },
    { name: 'Greek yoghurt',   per: '£0.60/150g',  gives: 'Protein, calcium, live cultures', note: 'Plain. Flavoured is a dessert.' }
  ];

  var NUTRITION_RULES = [
    { rule: 'Nothing ultra-processed', why: 'If it has an ingredient list you would not find in a kitchen, it is not food for this programme. This is the whole diet in one line.' },
    { rule: 'Protein: 1.6-2.2g per kg bodyweight', why: 'Enough to build on. More than this is not better, it is just more expensive.' },
    { rule: 'Eat the whole animal', why: 'Liver, eggs, oily fish, bone broth. Muscle meat alone misses most of the nutrition.' },
    { rule: 'Carbohydrate around training', why: 'Fuel when it is used. Chronic low-carb dieting alongside hard training suppresses hormones.' },
    { rule: 'Fat at 20-30% of calories', why: 'Below that, testosterone falls. This is not a low-fat programme.' },
    { rule: 'Cook it yourself', why: 'The single biggest determinant of diet quality, ahead of every macro argument.' },
    { rule: 'Water first', why: 'Before coffee, before food. Most people are mildly dehydrated by default.' }
  ];

  /* ---- helpers ---------------------------------------------------------------------- */

  /* Which tier a score meets. Returns 0-4: 0 is below Baseline, 4 is Unit.
     Some standards are better when lower (time to start work, zero days), so the
     comparison flips rather than being written twice. */
  function tierOf(standard, score) {
    if (score == null || isNaN(score)) return 0;
    var t = standard.tiers, lower = !!standard.lowerIsBetter, met = 0;
    for (var i = 0; i < t.length; i++) {
      if (lower ? (score <= t[i]) : (score >= t[i])) met = i + 1;
    }
    return met;
  }

  /* One number for the whole programme: the mean tier across every standard that has been
     assessed, as a percentage of Unit. Unassessed standards are ignored rather than counted
     as zero — a score that drops because you have not measured something yet is noise. */
  function unitScore(scores) {
    var all = [], s = scores || {};
    REGIONS.forEach(function (r) { r.standards.forEach(function (st) { all.push(st); }); });
    MENTAL.forEach(function (m) { m.standards.forEach(function (st) { all.push(st); }); });
    var done = all.filter(function (st) { return s[st.id] != null && !isNaN(s[st.id]); });
    if (!done.length) return { score: 0, assessed: 0, total: all.length, tier: TIERS[0] };
    var sum = done.reduce(function (n, st) { return n + tierOf(st, +s[st.id]); }, 0);
    var mean = sum / done.length;
    return {
      score: Math.round((mean / 4) * 100),
      assessed: done.length,
      total: all.length,
      tier: TIERS[Math.max(0, Math.min(3, Math.ceil(mean) - 1))]
    };
  }

  /* The weakest links, so the programme can point somewhere specific rather than at
     everything at once. */
  function weakest(scores, n) {
    var out = [], s = scores || {};
    function scan(group, area) {
      group.forEach(function (g) {
        g.standards.forEach(function (st) {
          if (s[st.id] == null || isNaN(s[st.id])) return;
          out.push({ area: area, group: g.name, id: st.id, name: st.name, tier: tierOf(st, +s[st.id]) });
        });
      });
    }
    scan(REGIONS, 'Training');
    scan(MENTAL, 'Mental');
    out.sort(function (a, b) { return a.tier - b.tier; });
    return out.slice(0, n || 5);
  }

  /* Every standard in one flat index, so a saved score can be turned back into the
     standard it came from. Built once, on first use. */
  var INDEX = null;
  function index() {
    if (INDEX) return INDEX;
    INDEX = {};
    function add(groups, area) {
      groups.forEach(function (g) {
        g.standards.forEach(function (st) {
          INDEX[st.id] = { standard: st, group: g.name, area: area };
        });
      });
    }
    add(REGIONS, 'Training');
    add(MENTAL, 'Mental');
    return INDEX;
  }
  function standardById(id) { var e = index()[id]; return e ? e.standard : null; }

  /* One point per recorded assessment, so progress can be drawn as a line rather than
     asserted. Each stored entry holds the full picture as it stood that day, so the
     score is computed the same way the header computes today's. */
  function series(history) {
    return (history || []).map(function (h) {
      var u = unitScore(h.scores);
      return { date: h.date, score: u.score, tier: u.tier, assessed: u.assessed };
    });
  }

  /* What actually changed between two assessments. Tier movement, not raw numbers: a
     number creeping up inside the same tier has not moved the thing being measured, and
     a page that congratulates you for it is teaching you to ignore it.
     Regressions sort first. They are the ones worth reading. */
  function movement(before, after) {
    var b = before || {}, a = after || {}, ix = index(), out = [];
    Object.keys(a).forEach(function (id) {
      var e = ix[id];
      if (!e || a[id] == null || isNaN(a[id])) return;
      var to = tierOf(e.standard, +a[id]);
      var had = !(b[id] == null || isNaN(b[id]));
      var from = had ? tierOf(e.standard, +b[id]) : null;
      if (had && from === to) return;
      out.push({
        id: id, name: e.standard.name, group: e.group, area: e.area,
        from: from, to: to,
        dir: !had ? 'new' : (to > from ? 'up' : 'down')
      });
    });
    var rank = { down: 0, up: 1, new: 2 };
    out.sort(function (x, y) { return rank[x.dir] - rank[y.dir]; });
    return out;
  }

  root.Forge = {
    TIERS: TIERS, REGIONS: REGIONS, MENTAL: MENTAL,
    T_LEVERS: T_LEVERS, LIFESTYLE: LIFESTYLE, FOODS: FOODS, NUTRITION_RULES: NUTRITION_RULES,
    tierOf: tierOf, unitScore: unitScore, weakest: weakest,
    standardById: standardById, series: series, movement: movement
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Forge;
})(typeof window !== 'undefined' ? window : this);
