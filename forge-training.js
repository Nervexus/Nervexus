/* THE FORGE — TRAINING CENTRE, section data.
   =====================================================================================
   The Training centre is built from sections. The page renders whatever is in SECTIONS, so
   a new section is a data change rather than a page rewrite.

   A section will carry a chart of ways to train it and the tools that do the job. None of
   them do yet — every entry here is a stub, and the page renders it as an empty page. When
   the first chart lands: every exercise needs a dose, because an exercise without one is a
   suggestion rather than training, and `risk` is loading information rather than a
   disclaimer. */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every script. See engine-guards.test.mjs.
  if (root.ForgeTraining) return;

  var LEVELS = ['easy', 'hard', 'brutal'];

  /* Full Body is a session rather than a subject: a checklist you build and tick, which
     writes each set to the same training log Fitness HQ uses. The exercises are the user's
     own — a prescribed ten was shipped here once and it was fiction, however sensible it
     looked, so the list starts empty and is edited on the page. */

  /* A section's exercise pool. Split by where you are, because half a gym list is useless at
     home and the home list is what you fall back on. Each entry carries what the log needs —
     a body part and a real quantity — so adding one to the session is a straight copy rather
     than something the page has to invent defaults for.

     Sets and reps are a sensible starting point, not a prescription: they land in the session
     where they can be changed, and nothing is added until you press the button. */
  function ex(name, sets, reps) { return { name: name, sets: sets, reps: reps }; }
  /* Nothing to load: press-ups, holds and band work have no weight to dial, so the block
     shows reps only rather than a stepper that would sit at BW forever. */
  function nl(name, sets, reps) { var e = ex(name, sets, reps); e.noLoad = true; return e; }

  /* Ranges rather than fixed numbers, ordered by priority: this is a fighter's chest
     session, not a bodybuilding split. Strength first, then explosiveness, then unilateral
     stability, then endurance — the order of the list is the order of the priority. */
  function rng(name, setsLo, setsHi, repsLo, repsHi, opt) {
    var e = { name: name, sets: setsLo, setsMax: setsHi, reps: repsLo, repsMax: repsHi };
    if (opt && opt.noLoad) e.noLoad = true;
    if (opt && opt.perSide) e.perSide = true;
    /* Some work is timed rather than counted. unit:'sec' means the numbers are seconds of
       work, and the session turns them into minutes on the way in, because minutes are what
       the training log records. setsLabel renames "sets" where the work is not counted in
       sets — rounds, on the ropes. */
    if (opt && opt.unit) e.unit = opt.unit;
    if (opt && opt.setsLabel) e.setsLabel = opt.setsLabel;
    // Which block of the session it belongs to. A section without groups renders as one list.
    if (opt && opt.group) e.group = opt.group;
    return e;
  }
  var CHEST = {
    key: 'chest', name: 'Chest', tag: 'CHEST', part: 'Chest',
    priority: 'Strength → Explosiveness → Unilateral stability → Muscular endurance',
    pool: {
      all: [
        rng('Barbell bench press', 3, 5, 3, 8),
        rng('Dumbbell bench press', 3, 4, 6, 10),
        rng('Incline dumbbell press', 3, 4, 6, 10),
        rng('Weighted dips', 3, 4, 5, 10),
        rng('Push-ups', 3, 4, 10, 30, {noLoad: true}),
        rng('Explosive / clap push-ups', 3, 5, 3, 6, {noLoad: true}),
        rng('Medicine-ball chest pass', 3, 5, 3, 6),
        rng('Cable chest press', 3, 4, 8, 12),
        rng('Single-arm cable press', 3, 4, 6, 12, {perSide: true}),
        rng('Single-arm dumbbell floor press', 3, 4, 6, 10, {perSide: true}),
        rng('Cable fly', 2, 3, 10, 15),
        rng('Dumbbell squeeze press', 3, 3, 8, 12)
      ]
    }
  };
  function stub(key, name) { return { key: key, name: name, tag: name.toUpperCase() }; }

  var SHOULDERS = {
    key: 'shoulders', name: 'Shoulders', tag: 'SHOULDERS', part: 'Shoulders',
    priority: 'Shoulder strength → Explosiveness → Rotator cuff stability → Rear delts → Shoulder endurance',
    pool: {
      all: [
        rng('Barbell overhead press', 3, 5, 3, 8),
        rng('Dumbbell shoulder press', 3, 4, 6, 10),
        rng('Single-arm dumbbell overhead press', 3, 4, 6, 10, {perSide: true}),
        rng('Landmine press', 3, 4, 6, 10, {perSide: true}),
        rng('Arnold press', 3, 4, 8, 12),
        rng('Dumbbell lateral raise', 3, 4, 10, 15),
        rng('Cable lateral raise', 3, 4, 10, 15),
        rng('Face pulls', 3, 4, 12, 20),
        rng('Cable external rotation', 2, 3, 12, 20, {perSide: true}),
        rng('Dumbbell rear delt fly', 3, 4, 10, 15),
        rng('Reverse pec deck', 3, 4, 10, 15),
        rng('Plate front raise', 2, 3, 10, 15),
        rng('Medicine-ball overhead throw', 3, 5, 3, 6),
        rng('Medicine-ball rotational throw', 3, 5, 3, 6, {perSide: true}),
        rng('Battle ropes', 3, 5, 20, 30, {unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
        rng('Dumbbell / barbell shrugs', 3, 4, 8, 15)
      ]
    }
  };

  /* Twenty-five, in four blocks. Three of the list as given could not stand: weighted dips
     were already on Chest and battle ropes already on Shoulders, and hammer curls appeared
     twice in the same list under two names. Each is replaced in its own slot by a movement
     doing the same job — a bodyweight triceps press, a fighter's grip-and-arm conditioning
     round, and the forearm curl the second hammer curl was standing in for. */
  var ARMS = {
    key: 'arms', name: 'Arms', tag: 'ARMS', part: 'Arms',
    priority: 'Arm strength → Grip strength → Forearm and wrist strength → Triceps power → Biceps strength → Muscular endurance',
    pool: {
      all: [
        rng('Barbell curl', 3, 4, 6, 10, {group: 'BICEPS'}),
        rng('Dumbbell hammer curl', 3, 4, 8, 12, {group: 'BICEPS'}),
        rng('Incline dumbbell curl', 3, 3, 8, 12, {group: 'BICEPS'}),
        rng('Cable curl', 3, 3, 10, 15, {group: 'BICEPS'}),
        rng('Preacher curl', 3, 3, 8, 12, {group: 'BICEPS'}),
        rng('Reverse curl', 3, 3, 10, 15, {group: 'BICEPS'}),

        rng('Close-grip bench press', 3, 5, 4, 8, {group: 'TRICEPS'}),
        rng('Diamond press-up', 3, 4, 8, 15, {group: 'TRICEPS', noLoad: true}),
        rng('Cable triceps pushdown', 3, 4, 8, 15, {group: 'TRICEPS'}),
        rng('Overhead cable triceps extension', 3, 3, 10, 15, {group: 'TRICEPS'}),
        rng('Dumbbell skull crushers', 3, 3, 8, 12, {group: 'TRICEPS'}),
        rng('Single-arm cable triceps extension', 3, 3, 10, 15, {group: 'TRICEPS', perSide: true}),

        rng("Farmer's carries", 3, 5, 20, 40, {group: 'FOREARMS & GRIP', unit: 'm'}),
        rng('Heavy dumbbell holds', 3, 5, 20, 45, {group: 'FOREARMS & GRIP', unit: 'sec'}),
        rng('Wrist curls', 3, 3, 12, 20, {group: 'FOREARMS & GRIP'}),
        rng('Reverse wrist curls', 3, 3, 12, 20, {group: 'FOREARMS & GRIP'}),
        rng('Zottman curl', 3, 4, 8, 12, {group: 'FOREARMS & GRIP'}),
        rng('Plate pinch holds', 3, 5, 20, 45, {group: 'FOREARMS & GRIP', unit: 'sec'}),
        rng('Towel cable curls', 3, 3, 8, 12, {group: 'FOREARMS & GRIP'}),
        rng('Dead hangs', 3, 5, 20, 60, {group: 'FOREARMS & GRIP', unit: 'sec', noLoad: true}),

        rng('Kettlebell finger curl', 3, 4, 8, 15, {group: 'KETTLEBELL WRIST & GRIP'}),
        rng('Kettlebell wrist flip', 3, 4, 8, 15, {group: 'KETTLEBELL WRIST & GRIP'}),
        rng('Kettlebell levering', 3, 4, 6, 10, {group: 'KETTLEBELL WRIST & GRIP', perSide: true}),
        rng('Kettlebell bottoms-up hold', 3, 5, 20, 45, {group: 'KETTLEBELL WRIST & GRIP', unit: 'sec', perSide: true}),
        rng('Kettlebell rack hold', 3, 4, 20, 45, {group: 'KETTLEBELL WRIST & GRIP', unit: 'sec'}),
        rng('Kettlebell bottoms-up walk', 3, 4, 20, 40, {group: 'KETTLEBELL WRIST & GRIP', unit: 'm', perSide: true}),
        rng('Kettlebell bottoms-up clean', 3, 4, 6, 10, {group: 'KETTLEBELL WRIST & GRIP', perSide: true}),
        rng('Kettlebell horn hold', 3, 4, 20, 45, {group: 'KETTLEBELL WRIST & GRIP', unit: 'sec'}),
        rng('Kettlebell towel hold', 3, 4, 20, 45, {group: 'KETTLEBELL WRIST & GRIP', unit: 'sec'}),
        rng('Kettlebell pinch-grip hold', 3, 4, 15, 30, {group: 'KETTLEBELL WRIST & GRIP', unit: 'sec', perSide: true}),
        rng('Kettlebell radial deviation', 3, 3, 10, 15, {group: 'KETTLEBELL WRIST & GRIP', perSide: true}),
        rng('Kettlebell ulnar deviation', 3, 3, 10, 15, {group: 'KETTLEBELL WRIST & GRIP', perSide: true}),
        rng('Kettlebell finger walk', 3, 3, 8, 15, {group: 'KETTLEBELL WRIST & GRIP', perSide: true}),

        rng('Rope climbs', 1, 1, 3, 5, {group: 'FIGHTER-SPECIFIC', unit: 'climb', noLoad: true}),
        rng('Sledgehammer tyre strikes', 3, 5, 20, 30, {group: 'FIGHTER-SPECIFIC', unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
        rng('Sled pulls', 3, 5, 20, 40, {group: 'FIGHTER-SPECIFIC', unit: 'm', setsLabel: 'ROUNDS'}),
        rng('Heavy bag straight-punch intervals', 3, 5, 20, 30, {group: 'FIGHTER-SPECIFIC', unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
        rng('Cable isometric holds', 3, 4, 15, 30, {group: 'FIGHTER-SPECIFIC', unit: 'sec'})
      ]
    }
  };

  /* The nine sections below were written here rather than supplied, in the shape the first
     three set: a fighter's session in priority order, real ranges, and the unit the work is
     actually measured in. They are a menu to choose from, not a prescription — nothing is
     logged until it is added and ticked. */
  var BACK = {
    key: 'back', name: 'Back', tag: 'BACK', part: 'Back',
    priority: 'Pulling strength → Rowing power → Posterior chain → Grip → Rotational control → Endurance',
    pool: { all: [
      rng('Weighted pull-up', 3, 5, 3, 8, {group: 'VERTICAL PULL'}),
      rng('Pull-up', 3, 4, 5, 12, {group: 'VERTICAL PULL', noLoad: true}),
      rng('Chin-up', 3, 4, 5, 12, {group: 'VERTICAL PULL', noLoad: true}),
      rng('Lat pulldown', 3, 4, 8, 12, {group: 'VERTICAL PULL'}),
      rng('Straight-arm pulldown', 3, 3, 10, 15, {group: 'VERTICAL PULL'}),

      rng('Barbell bent-over row', 3, 5, 5, 10, {group: 'HORIZONTAL PULL'}),
      rng('Pendlay row', 3, 4, 4, 8, {group: 'HORIZONTAL PULL'}),
      rng('Single-arm dumbbell row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL', perSide: true}),
      rng('Chest-supported row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL'}),
      rng('Seated cable row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL'}),
      rng('Inverted row', 3, 4, 8, 15, {group: 'HORIZONTAL PULL', noLoad: true}),

      rng('Conventional deadlift', 3, 5, 3, 6, {group: 'POSTERIOR CHAIN'}),
      rng('Trap-bar deadlift', 3, 4, 4, 8, {group: 'POSTERIOR CHAIN'}),
      rng('Rack pull', 3, 4, 4, 8, {group: 'POSTERIOR CHAIN'}),
      rng('Good morning', 3, 3, 8, 12, {group: 'POSTERIOR CHAIN'}),

      rng('Towel pull-up', 3, 4, 3, 8, {group: 'FIGHTER-SPECIFIC', noLoad: true}),
      rng('Bear crawl', 3, 5, 20, 40, {group: 'FIGHTER-SPECIFIC', unit: 'm', noLoad: true}),
      rng('Sandbag over-shoulder throw', 3, 5, 3, 6, {group: 'FIGHTER-SPECIFIC', perSide: true}),
      rng('Renegade row', 3, 4, 6, 10, {group: 'FIGHTER-SPECIFIC', perSide: true}),

      rng('Band pull-apart', 3, 4, 15, 25, {group: 'BANDS', noLoad: true}),
      rng('Band lat pulldown', 3, 4, 12, 20, {group: 'BANDS', noLoad: true}),
      rng('Band seated row', 3, 4, 12, 20, {group: 'BANDS', noLoad: true}),
      rng('Band single-arm row', 3, 4, 12, 20, {group: 'BANDS', perSide: true, noLoad: true}),
      rng('Band deadlift', 3, 4, 15, 25, {group: 'BANDS', noLoad: true})
    ] }
  };

  var CORE = {
    key: 'core', name: 'Core', tag: 'CORE', part: 'Core',
    priority: 'Bracing → Anti-rotation → Rotational power → Hip flexion → Endurance',
    pool: { all: [
      rng('Plank', 3, 4, 30, 60, {group: 'ANTI-EXTENSION', unit: 'sec', noLoad: true}),
      rng('Weighted plank', 3, 4, 20, 45, {group: 'ANTI-EXTENSION', unit: 'sec'}),
      rng('Ab wheel rollout', 3, 4, 8, 12, {group: 'ANTI-EXTENSION', noLoad: true}),
      rng('Hollow body hold', 3, 4, 20, 45, {group: 'ANTI-EXTENSION', unit: 'sec', noLoad: true}),

      rng('Pallof press', 3, 3, 10, 15, {group: 'ANTI-ROTATION', perSide: true}),
      rng('Suitcase carry', 3, 5, 20, 40, {group: 'ANTI-ROTATION', unit: 'm', perSide: true}),
      rng('Side plank', 3, 3, 20, 45, {group: 'ANTI-ROTATION', unit: 'sec', perSide: true, noLoad: true}),

      rng('Russian twist', 3, 3, 15, 25, {group: 'ROTATION & POWER', noLoad: true}),
      rng('Cable woodchop', 3, 4, 10, 15, {group: 'ROTATION & POWER', perSide: true}),
      rng('Medicine-ball slam', 3, 5, 5, 10, {group: 'ROTATION & POWER'}),
      rng('Landmine rotation', 3, 4, 8, 12, {group: 'ROTATION & POWER', perSide: true}),

      rng('Hanging leg raise', 3, 4, 8, 15, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Toes-to-bar', 3, 4, 5, 12, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('V-up', 3, 3, 12, 20, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Dragon flag', 3, 3, 3, 8, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Dead bug', 3, 3, 10, 15, {group: 'FLEXION & ENDURANCE', perSide: true, noLoad: true})
    ] }
  };

  var HIPS = {
    key: 'hips', name: 'Hips & Glutes', tag: 'HIPS & GLUTES', part: 'Legs',
    priority: 'Hip strength → Unilateral control → Hip power → Mobility → Endurance',
    pool: { all: [
      rng('Barbell hip thrust', 3, 4, 6, 12),
      rng('Sumo deadlift', 3, 5, 3, 8),
      rng('Cable pull-through', 3, 3, 10, 15),
      rng('Bulgarian split squat', 3, 4, 6, 12, {perSide: true}),
      rng('Reverse lunge', 3, 4, 8, 12, {perSide: true}),
      rng('Walking lunge', 3, 4, 20, 40, {unit: 'm'}),
      rng('Glute bridge', 3, 3, 10, 20, {noLoad: true}),
      rng('Lateral band walk', 3, 3, 12, 20, {perSide: true, noLoad: true}),
      rng('Cossack squat', 3, 3, 6, 12, {perSide: true, noLoad: true}),
      rng('Hip airplane', 2, 3, 5, 10, {perSide: true, noLoad: true}),
      rng('90/90 hip switch', 2, 3, 8, 15, {noLoad: true})
    ] }
  };

  var QUADS = {
    key: 'quads', name: 'Quads', tag: 'QUADS', part: 'Legs',
    priority: 'Squat strength → Unilateral strength → Leg drive → Endurance',
    pool: { all: [
      rng('Back squat', 3, 5, 3, 8),
      rng('Front squat', 3, 4, 4, 8),
      rng('Goblet squat', 3, 4, 8, 15),
      rng('Hack squat', 3, 4, 8, 12),
      rng('Leg press', 3, 4, 8, 15),
      rng('Split squat', 3, 4, 8, 12, {perSide: true}),
      rng('Step-up', 3, 4, 8, 12, {perSide: true}),
      rng('Leg extension', 3, 3, 12, 20),
      rng('Sissy squat', 3, 3, 8, 15, {noLoad: true}),
      rng('Jump squat', 3, 5, 5, 10, {noLoad: true}),
      rng('Wall sit', 3, 3, 30, 60, {unit: 'sec', noLoad: true}),
      rng('Sled push', 3, 5, 20, 40, {unit: 'm', setsLabel: 'ROUNDS'})
    ] }
  };

  var HAMSTRINGS = {
    key: 'hamstrings', name: 'Hamstrings', tag: 'HAMSTRINGS', part: 'Legs',
    priority: 'Hinge strength → Knee flexion → Unilateral control → Eccentric strength',
    pool: { all: [
      rng('Romanian deadlift', 3, 4, 6, 10),
      rng('Stiff-leg deadlift', 3, 4, 6, 10),
      rng('Single-leg Romanian deadlift', 3, 3, 8, 12, {perSide: true}),
      rng('Nordic hamstring curl', 3, 4, 4, 8, {noLoad: true}),
      rng('Glute-ham raise', 3, 4, 5, 10, {noLoad: true}),
      rng('Lying leg curl', 3, 4, 8, 15),
      rng('Seated leg curl', 3, 4, 8, 15),
      rng('Slider leg curl', 3, 3, 8, 15, {noLoad: true}),
      rng('Back extension', 3, 3, 10, 15, {noLoad: true})
    ] }
  };

  var CALVES = {
    key: 'calves', name: 'Calves', tag: 'CALVES', part: 'Legs',
    priority: 'Calf strength → Stiffness and bounce → Tibialis balance → Endurance',
    pool: { all: [
      rng('Standing calf raise', 3, 5, 8, 15),
      rng('Seated calf raise', 3, 4, 10, 20),
      rng('Leg-press calf raise', 3, 4, 10, 20),
      rng('Donkey calf raise', 3, 3, 10, 20),
      rng('Single-leg calf raise', 3, 3, 10, 20, {perSide: true, noLoad: true}),
      rng('Tibialis raise', 3, 3, 15, 25, {noLoad: true}),
      rng('Pogo hop', 3, 5, 20, 40, {noLoad: true}),
      rng('Ankle bounce', 3, 4, 20, 40, {noLoad: true}),
      rng('Skipping', 3, 5, 30, 60, {unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
      rng('Loaded toe walk', 3, 4, 20, 30, {unit: 'm'})
    ] }
  };

  var FEET = {
    key: 'feet', name: 'Feet & Ankles', tag: 'FEET & ANKLES', part: 'Legs',
    priority: 'Ankle mobility → Foot strength → Balance → Landing control',
    pool: { all: [
      rng('Ankle circles', 2, 3, 10, 15, {perSide: true, noLoad: true}),
      rng('Banded ankle dorsiflexion', 3, 3, 10, 15, {perSide: true, noLoad: true}),
      rng('Eccentric heel drop', 3, 3, 8, 15, {noLoad: true}),
      rng('Short foot exercise', 3, 3, 10, 15, {perSide: true, noLoad: true}),
      rng('Toe splay', 2, 3, 10, 20, {noLoad: true}),
      rng('Towel toe curl', 3, 3, 10, 15, {perSide: true, noLoad: true}),
      rng('Heel walk', 3, 3, 15, 25, {unit: 'm', noLoad: true}),
      rng('Toe walk', 3, 3, 15, 25, {unit: 'm', noLoad: true}),
      rng('Single-leg balance', 3, 3, 30, 60, {unit: 'sec', perSide: true, noLoad: true}),
      rng('Barefoot skipping', 3, 5, 20, 40, {unit: 'sec', setsLabel: 'ROUNDS', noLoad: true})
    ] }
  };

  var NECK = {
    key: 'neck', name: 'Neck', tag: 'NECK', part: 'Neck',
    priority: 'Isometric strength → Bridging → Flexion and extension → Lateral strength → Endurance',
    pool: { all: [
      rng('Wrestler\u2019s bridge', 3, 4, 20, 45, {unit: 'sec', noLoad: true}),
      rng('Front bridge', 3, 4, 20, 45, {unit: 'sec', noLoad: true}),
      rng('Isometric neck hold', 3, 4, 20, 40, {unit: 'sec', perSide: true, noLoad: true}),
      rng('Neck harness extension', 3, 4, 10, 20),
      rng('Neck harness flexion', 3, 4, 10, 20),
      rng('Lateral neck raise', 3, 3, 10, 20, {perSide: true, noLoad: true}),
      rng('Banded neck extension', 3, 3, 12, 20, {noLoad: true}),
      rng('Banded neck flexion', 3, 3, 12, 20, {noLoad: true}),
      rng('Partner manual neck resistance', 3, 3, 8, 15, {perSide: true, noLoad: true}),
      rng('Shrug hold', 3, 4, 20, 40, {unit: 'sec'})
    ] }
  };

  var HANDS = {
    key: 'hands', name: 'Hands & Forearms', tag: 'HANDS & FOREARMS', part: 'Arms',
    priority: 'Crushing grip → Pinch grip → Finger strength → Extensor balance → Endurance',
    pool: { all: [
      rng('Gripper close', 3, 5, 5, 12),
      rng('Thick-bar hold', 3, 5, 20, 45, {unit: 'sec'}),
      rng('Pinch block lift', 3, 5, 15, 30, {unit: 'sec'}),
      rng('Wrist roller', 3, 3, 3, 5),
      rng('Hammer wrist rotation', 3, 3, 10, 15, {perSide: true}),
      rng('Fingertip press-up', 3, 3, 5, 12, {noLoad: true}),
      rng('Knuckle press-up', 3, 3, 8, 15, {noLoad: true}),
      rng('Finger extension band', 3, 3, 15, 25, {noLoad: true}),
      rng('Rice bucket digs', 3, 3, 30, 60, {unit: 'sec', noLoad: true}),
      rng('Ball squeeze', 3, 3, 20, 40, {noLoad: true}),
      rng('Towel wring', 3, 3, 20, 40, {unit: 'sec', noLoad: true})
    ] }
  };

  /* A section by implement rather than by body part, so it re-expresses movements the
     body-part sections already cover — that is the point of it, and every name is its own.
     Names taken from a wall chart; the chart's own artwork is not used anywhere. */
  var KETTLEBELLS = {
    key: 'kettlebells', name: 'Kettlebells', tag: 'KETTLEBELLS', part: 'Full',
    priority: 'Technique → Ballistic power → Overhead strength → Core control → Grip and carry endurance',
    pool: { all: [
      rng('Kettlebell Turkish get-up', 3, 5, 1, 3, {group: 'TOTAL BODY', perSide: true}),
      rng('Kettlebell clean', 3, 5, 5, 10, {group: 'TOTAL BODY', perSide: true}),
      rng('Kettlebell double-arm swing', 3, 5, 10, 20, {group: 'TOTAL BODY'}),
      rng('Kettlebell single-arm swing', 3, 5, 8, 15, {group: 'TOTAL BODY', perSide: true}),
      rng('Kettlebell wood chop', 3, 4, 8, 15, {group: 'TOTAL BODY', perSide: true}),
      rng('Kettlebell windmill', 3, 3, 5, 8, {group: 'TOTAL BODY', perSide: true}),
      rng('Kettlebell snatch', 3, 5, 5, 10, {group: 'TOTAL BODY', perSide: true}),
      rng('Kettlebell atlas swing', 3, 4, 8, 12, {group: 'TOTAL BODY'}),
      rng('Kettlebell sumo high pull', 3, 4, 8, 15, {group: 'TOTAL BODY'}),
      rng('Kettlebell thruster', 3, 5, 5, 12, {group: 'TOTAL BODY'}),
      rng('Kettlebell side plank row', 3, 3, 6, 12, {group: 'TOTAL BODY', perSide: true}),

      rng('Kettlebell shoulder press', 3, 4, 5, 10, {group: 'UPPER BODY', perSide: true}),
      rng('Kettlebell deficit push-up', 3, 4, 8, 15, {group: 'UPPER BODY', noLoad: true}),
      rng('Kettlebell chest press', 3, 4, 6, 12, {group: 'UPPER BODY'}),
      rng('Kettlebell pull-over', 3, 3, 8, 12, {group: 'UPPER BODY'}),
      rng('Kettlebell halo', 3, 3, 8, 12, {group: 'UPPER BODY'}),
      rng('Kettlebell curl', 3, 4, 8, 12, {group: 'UPPER BODY'}),
      rng('Kettlebell triceps extension', 3, 3, 8, 15, {group: 'UPPER BODY'}),
      rng('Kettlebell side raise', 3, 3, 10, 15, {group: 'UPPER BODY'}),
      rng('Kettlebell front raise', 3, 3, 10, 15, {group: 'UPPER BODY'}),
      rng('Kettlebell side bend', 3, 3, 10, 15, {group: 'UPPER BODY', perSide: true}),

      rng('Kettlebell sidewinder', 3, 3, 8, 12, {group: 'CORE', perSide: true}),
      rng('Kettlebell around-the-body', 3, 3, 8, 15, {group: 'CORE', perSide: true}),
      rng('Kettlebell half Turkish get-up', 3, 4, 3, 6, {group: 'CORE', perSide: true}),
      rng('Kettlebell overhead sit-up', 3, 3, 8, 15, {group: 'CORE'}),
      rng('Kettlebell Russian twist', 3, 3, 12, 20, {group: 'CORE'}),
      rng('Kettlebell side plank', 3, 3, 20, 45, {group: 'CORE', unit: 'sec', perSide: true}),
      rng('Kettlebell figure eight', 3, 4, 10, 20, {group: 'CORE'}),
      rng('Kettlebell leg raise', 3, 3, 8, 15, {group: 'CORE'}),
      rng('Kettlebell torso twist', 3, 3, 10, 20, {group: 'CORE'}),

      rng('Kettlebell bent-over row', 3, 4, 8, 12, {group: 'BACK', perSide: true}),
      rng('Kettlebell renegade row', 3, 4, 6, 10, {group: 'BACK', perSide: true}),

      rng('Kettlebell deadlift', 3, 5, 6, 12, {group: 'LOWER BODY'}),
      rng("Kettlebell farmer's walk", 3, 5, 20, 40, {group: 'LOWER BODY', unit: 'm'}),
      rng('Kettlebell single-leg deadlift', 3, 4, 8, 12, {group: 'LOWER BODY', perSide: true}),
      rng('Kettlebell weighted lunge', 3, 4, 8, 12, {group: 'LOWER BODY', perSide: true}),
      rng('Kettlebell lunge pass', 3, 4, 8, 12, {group: 'LOWER BODY', perSide: true}),
      rng('Kettlebell squat', 3, 4, 8, 15, {group: 'LOWER BODY'}),
      rng('Kettlebell squat flip', 3, 4, 6, 12, {group: 'LOWER BODY'}),
      rng('Kettlebell overhead squat', 3, 3, 5, 10, {group: 'LOWER BODY', perSide: true}),

      /* Girevoy sport — the Soviet kettlebell discipline: competitions from the late 1940s,
         codified as a sport in 1985. The three competition lifts are the jerk, the snatch and
         the long cycle; the rest are the classic pressing and lifting work that sat around
         them. Sets in the sport are timed rather than counted, so the timed pieces are here
         in seconds and the lifts in reps. */
      rng('Kettlebell biathlon jerk', 3, 5, 10, 30, {group: 'SOVIET · GIREVOY SPORT'}),
      rng('Kettlebell long cycle clean and jerk', 3, 5, 8, 20, {group: 'SOVIET · GIREVOY SPORT'}),
      rng('Kettlebell biathlon snatch', 3, 5, 10, 30, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell half snatch', 3, 4, 8, 15, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell timed set', 3, 4, 60, 300, {group: 'SOVIET · GIREVOY SPORT', unit: 'sec'}),
      rng('Kettlebell military press', 3, 5, 5, 10, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell clean and press', 3, 5, 5, 10, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell push press', 3, 4, 6, 12, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell see-saw press', 3, 4, 8, 12, {group: 'SOVIET · GIREVOY SPORT'}),
      rng('Kettlebell bent press', 3, 4, 3, 6, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell side press', 3, 4, 5, 8, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell Sots press', 3, 3, 5, 10, {group: 'SOVIET · GIREVOY SPORT'}),
      rng('Kettlebell two-hands anyhow', 3, 3, 3, 6, {group: 'SOVIET · GIREVOY SPORT', perSide: true}),
      rng('Kettlebell rack walk', 3, 4, 20, 40, {group: 'SOVIET · GIREVOY SPORT', unit: 'm'}),
      rng('Kettlebell juggling cast', 3, 4, 8, 15, {group: 'SOVIET · GIREVOY SPORT'})
    ] }
  };

  var SECTIONS = [
    CHEST,
    SHOULDERS,
    ARMS,
    BACK,
    CORE,
    HIPS,
    QUADS,
    HAMSTRINGS,
    CALVES,
    FEET,
    NECK,
    HANDS,
    KETTLEBELLS,
    stub('full-body', 'Full Body')
  ];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { LEVELS: LEVELS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
