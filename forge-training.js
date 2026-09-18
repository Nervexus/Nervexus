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
        rng('Barbell bench press', 3, 5, 3, 8, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Incline barbell bench press', 3, 5, 4, 8, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Decline barbell bench press', 3, 4, 4, 8, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Wide-grip bench press', 3, 4, 4, 8, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Close-grip barbell bench press', 3, 4, 5, 10, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Floor press', 3, 4, 4, 8, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Board press', 3, 4, 3, 6, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Spoto press', 3, 4, 4, 8, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Guillotine press', 3, 3, 6, 10, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Smith machine bench press', 3, 4, 6, 10, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Smith machine incline press', 3, 4, 6, 10, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Machine chest press', 3, 4, 8, 12, {group: 'BARBELL & MACHINE PRESSES'}),
        rng('Incline machine chest press', 3, 4, 8, 12, {group: 'BARBELL & MACHINE PRESSES'}),

        rng('Dumbbell bench press', 3, 4, 6, 10, {group: 'DUMBBELL PRESSES'}),
        rng('Incline dumbbell press', 3, 4, 6, 10, {group: 'DUMBBELL PRESSES'}),
        rng('Decline dumbbell bench press', 3, 4, 6, 10, {group: 'DUMBBELL PRESSES'}),
        rng('Single-arm dumbbell floor press', 3, 4, 6, 10, {group: 'DUMBBELL PRESSES', perSide: true}),
        rng('Single-arm dumbbell bench press', 3, 4, 6, 10, {group: 'DUMBBELL PRESSES', perSide: true}),
        rng('Neutral-grip dumbbell press', 3, 4, 6, 10, {group: 'DUMBBELL PRESSES'}),
        rng('Alternating dumbbell press', 3, 4, 6, 12, {group: 'DUMBBELL PRESSES'}),
        rng('Dumbbell hex press', 3, 3, 8, 12, {group: 'DUMBBELL PRESSES'}),
        rng('Dumbbell squeeze press', 3, 3, 8, 12, {group: 'DUMBBELL PRESSES'}),
        rng('Svend press', 3, 3, 10, 15, {group: 'DUMBBELL PRESSES'}),

        rng('Cable fly', 2, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Incline cable fly', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Decline cable fly', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Low-to-high cable fly', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('High-to-low cable fly', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Standing cable crossover', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Single-arm cable crossover', 3, 3, 10, 15, {group: 'FLYES & ISOLATION', perSide: true}),
        rng('Incline dumbbell fly', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Decline dumbbell fly', 3, 3, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Pec deck fly', 3, 4, 10, 15, {group: 'FLYES & ISOLATION'}),
        rng('Dumbbell pullover', 3, 3, 8, 12, {group: 'FLYES & ISOLATION'}),

        rng('Push-ups', 3, 4, 10, 30, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Explosive / clap push-ups', 3, 5, 3, 6, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Weighted dips', 3, 4, 5, 10, {group: 'BODYWEIGHT & PLYOMETRIC'}),
        rng('Wide-grip push-up', 3, 4, 10, 20, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Incline push-up', 3, 4, 10, 25, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Decline push-up', 3, 4, 8, 20, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Deficit push-up', 3, 4, 8, 15, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Feet-elevated push-up', 3, 4, 8, 20, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Archer push-up', 3, 3, 4, 10, {group: 'BODYWEIGHT & PLYOMETRIC', perSide: true, noLoad: true}),
        rng('Ring push-up', 3, 3, 6, 15, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Ring dips', 3, 4, 4, 10, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Plyo push-up', 3, 4, 5, 10, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),
        rng('Weighted push-up', 3, 4, 6, 15, {group: 'BODYWEIGHT & PLYOMETRIC'}),
        rng('Pseudo planche push-up', 3, 3, 4, 10, {group: 'BODYWEIGHT & PLYOMETRIC', noLoad: true}),

        rng('Cable chest press', 3, 4, 8, 12, {group: 'CABLES, BANDS & THROWS'}),
        rng('Single-arm cable press', 3, 4, 6, 12, {group: 'CABLES, BANDS & THROWS', perSide: true}),
        rng('Medicine-ball chest pass', 3, 5, 3, 6, {group: 'CABLES, BANDS & THROWS'}),
        rng('Medicine-ball rebound throw', 3, 5, 3, 6, {group: 'CABLES, BANDS & THROWS'}),
        rng('Landmine chest press', 3, 4, 6, 10, {group: 'CABLES, BANDS & THROWS'}),
        rng('Landmine single-arm press', 3, 4, 6, 10, {group: 'CABLES, BANDS & THROWS', perSide: true}),
        rng('Resistance band chest press', 3, 4, 12, 20, {group: 'CABLES, BANDS & THROWS', noLoad: true}),
        rng('Resistance band fly', 3, 4, 12, 20, {group: 'CABLES, BANDS & THROWS', noLoad: true}),
        rng('Cable iron cross', 3, 4, 12, 15, {group: 'CABLES, BANDS & THROWS'})
      ]
    }
  };
  function stub(key, name) { return { key: key, name: name, tag: name.toUpperCase() }; }

  var SHOULDERS = {
    key: 'shoulders', name: 'Shoulders', tag: 'SHOULDERS', part: 'Shoulders',
    priority: 'Shoulder strength → Explosiveness → Rotator cuff stability → Rear delts → Shoulder endurance',
    pool: {
      all: [
        rng('Barbell overhead press', 3, 5, 3, 8, {group: 'OVERHEAD PRESSES'}),
        rng('Seated barbell overhead press', 3, 4, 5, 10, {group: 'OVERHEAD PRESSES'}),
        rng('Push press', 3, 5, 3, 6, {group: 'OVERHEAD PRESSES'}),
        rng('Behind-the-neck press', 3, 4, 5, 8, {group: 'OVERHEAD PRESSES'}),
        rng('Z press', 3, 3, 5, 10, {group: 'OVERHEAD PRESSES'}),
        rng('Dumbbell shoulder press', 3, 4, 6, 10, {group: 'OVERHEAD PRESSES'}),
        rng('Seated dumbbell shoulder press', 3, 4, 6, 10, {group: 'OVERHEAD PRESSES'}),
        rng('Single-arm dumbbell overhead press', 3, 4, 6, 10, {group: 'OVERHEAD PRESSES', perSide: true}),
        rng('Arnold press', 3, 4, 8, 12, {group: 'OVERHEAD PRESSES'}),
        rng('Landmine press', 3, 4, 6, 10, {group: 'OVERHEAD PRESSES', perSide: true}),
        rng('Single-arm landmine shoulder press', 3, 4, 6, 10, {group: 'OVERHEAD PRESSES', perSide: true}),
        rng('Viking press', 3, 4, 5, 10, {group: 'OVERHEAD PRESSES'}),
        rng('Cuban press', 3, 3, 8, 12, {group: 'OVERHEAD PRESSES'}),
        rng('Machine shoulder press', 3, 4, 8, 12, {group: 'OVERHEAD PRESSES'}),
        rng('Smith machine overhead press', 3, 4, 6, 10, {group: 'OVERHEAD PRESSES'}),

        rng('Dumbbell lateral raise', 3, 4, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Cable lateral raise', 3, 4, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Machine lateral raise', 3, 4, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Leaning single-arm lateral raise', 3, 3, 10, 15, {group: 'LATERAL & FRONT RAISES', perSide: true}),
        rng('Seated lateral raise', 3, 3, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Egyptian lateral raise', 3, 3, 10, 15, {group: 'LATERAL & FRONT RAISES', perSide: true}),
        rng('Plate front raise', 2, 3, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Barbell front raise', 3, 3, 8, 12, {group: 'LATERAL & FRONT RAISES'}),
        rng('Cable front raise', 3, 3, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Y-raise', 3, 3, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('W-raise', 3, 3, 10, 15, {group: 'LATERAL & FRONT RAISES'}),
        rng('Lu raise', 3, 3, 8, 12, {group: 'LATERAL & FRONT RAISES'}),

        rng('Face pulls', 3, 4, 12, 20, {group: 'REAR DELTS & ROTATOR CUFF'}),
        rng('Cable external rotation', 2, 3, 12, 20, {group: 'REAR DELTS & ROTATOR CUFF', perSide: true}),
        rng('Cable internal rotation', 2, 3, 12, 20, {group: 'REAR DELTS & ROTATOR CUFF', perSide: true}),
        rng('Dumbbell rear delt fly', 3, 4, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF'}),
        rng('Bent-over dumbbell lateral raise', 3, 3, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF'}),
        rng('Reverse pec deck', 3, 4, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF'}),
        rng('Lying dumbbell external rotation', 2, 3, 12, 20, {group: 'REAR DELTS & ROTATOR CUFF', perSide: true}),
        rng('Prone Y-raise', 3, 3, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF'}),
        rng('Prone T-raise', 3, 3, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF'}),
        rng('Scapular wall slide', 3, 3, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF', noLoad: true}),
        rng('Cable Y-raise', 3, 3, 10, 15, {group: 'REAR DELTS & ROTATOR CUFF'}),

        rng('Dumbbell / barbell shrugs', 3, 4, 8, 15, {group: 'TRAPS & SHRUGS'}),
        rng('Trap bar shrug', 3, 4, 8, 15, {group: 'TRAPS & SHRUGS'}),
        rng('Cable shrug', 3, 4, 10, 15, {group: 'TRAPS & SHRUGS'}),
        rng('Behind-the-back barbell shrug', 3, 3, 8, 15, {group: 'TRAPS & SHRUGS'}),
        rng('Snatch-grip shrug', 3, 4, 6, 10, {group: 'TRAPS & SHRUGS'}),
        rng("Farmer's walk shrug", 3, 4, 20, 40, {group: 'TRAPS & SHRUGS', unit: 'm'}),

        rng('Medicine-ball overhead throw', 3, 5, 3, 6, {group: 'POWER & CONDITIONING'}),
        rng('Medicine-ball rotational throw', 3, 5, 3, 6, {group: 'POWER & CONDITIONING', perSide: true}),
        rng('Medicine-ball scoop toss', 3, 5, 3, 6, {group: 'POWER & CONDITIONING'}),
        rng('Battle ropes', 3, 5, 20, 30, {group: 'POWER & CONDITIONING', unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
        rng('Alternating battle rope waves', 3, 5, 20, 30, {group: 'POWER & CONDITIONING', unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
        rng('Battle rope slams', 3, 5, 20, 30, {group: 'POWER & CONDITIONING', unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
        rng('Sledgehammer overhead slam', 3, 5, 10, 20, {group: 'POWER & CONDITIONING'}),
        rng('Landmine rotational shoulder press', 3, 4, 6, 10, {group: 'POWER & CONDITIONING', perSide: true})
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
        rng('EZ-bar curl', 3, 4, 6, 10, {group: 'BICEPS'}),
        rng('Drag curl', 3, 3, 8, 12, {group: 'BICEPS'}),
        rng('Spider curl', 3, 3, 8, 12, {group: 'BICEPS'}),
        rng('Concentration curl', 3, 3, 8, 12, {group: 'BICEPS', perSide: true}),
        rng('Cable rope hammer curl', 3, 3, 10, 15, {group: 'BICEPS'}),
        rng('21s', 2, 3, 21, 21, {group: 'BICEPS'}),
        rng('Behind-the-back cable curl', 3, 3, 10, 15, {group: 'BICEPS', perSide: true}),
        rng("Waiter's curl", 3, 3, 10, 15, {group: 'BICEPS'}),
        rng('Cross-body hammer curl', 3, 3, 8, 12, {group: 'BICEPS'}),
        rng('Machine bicep curl', 3, 4, 8, 15, {group: 'BICEPS'}),
        rng('Resistance band curl', 3, 3, 12, 20, {group: 'BICEPS', noLoad: true}),

        rng('Close-grip bench press', 3, 5, 4, 8, {group: 'TRICEPS'}),
        rng('Diamond press-up', 3, 4, 8, 15, {group: 'TRICEPS', noLoad: true}),
        rng('Cable triceps pushdown', 3, 4, 8, 15, {group: 'TRICEPS'}),
        rng('Overhead cable triceps extension', 3, 3, 10, 15, {group: 'TRICEPS'}),
        rng('Dumbbell skull crushers', 3, 3, 8, 12, {group: 'TRICEPS'}),
        rng('Single-arm cable triceps extension', 3, 3, 10, 15, {group: 'TRICEPS', perSide: true}),
        rng('JM press', 3, 4, 6, 10, {group: 'TRICEPS'}),
        rng('Tate press', 3, 3, 8, 12, {group: 'TRICEPS'}),
        rng('Bench dips', 3, 4, 10, 20, {group: 'TRICEPS', noLoad: true}),
        rng('Triceps kickback', 3, 3, 10, 15, {group: 'TRICEPS', perSide: true}),
        rng('V-bar triceps pushdown', 3, 4, 8, 15, {group: 'TRICEPS'}),
        rng('Reverse-grip triceps pushdown', 3, 3, 10, 15, {group: 'TRICEPS'}),
        rng('Machine triceps extension', 3, 4, 8, 15, {group: 'TRICEPS'}),
        rng('Triceps dip machine', 3, 4, 8, 15, {group: 'TRICEPS'}),
        rng('Lying barbell triceps extension', 3, 3, 8, 12, {group: 'TRICEPS'}),

        rng("Farmer's carries", 3, 5, 20, 40, {group: 'FOREARMS & GRIP', unit: 'm'}),
        rng('Heavy dumbbell holds', 3, 5, 20, 45, {group: 'FOREARMS & GRIP', unit: 'sec'}),
        rng('Wrist curls', 3, 3, 12, 20, {group: 'FOREARMS & GRIP'}),
        rng('Reverse wrist curls', 3, 3, 12, 20, {group: 'FOREARMS & GRIP'}),
        rng('Zottman curl', 3, 4, 8, 12, {group: 'FOREARMS & GRIP'}),
        rng('Plate pinch holds', 3, 5, 20, 45, {group: 'FOREARMS & GRIP', unit: 'sec'}),
        rng('Towel cable curls', 3, 3, 8, 12, {group: 'FOREARMS & GRIP'}),
        rng('Dead hangs', 3, 5, 20, 60, {group: 'FOREARMS & GRIP', unit: 'sec', noLoad: true}),
        rng('Barbell wrist curl', 3, 3, 12, 20, {group: 'FOREARMS & GRIP'}),
        rng('Behind-the-back barbell wrist curl', 3, 3, 12, 20, {group: 'FOREARMS & GRIP'}),
        rng('One-arm dumbbell wrist curl', 3, 3, 12, 20, {group: 'FOREARMS & GRIP', perSide: true}),
        rng('Fat-grip hold', 3, 5, 20, 45, {group: 'FOREARMS & GRIP', unit: 'sec'}),
        rng('Grip crusher hold', 3, 4, 10, 20, {group: 'FOREARMS & GRIP', unit: 'sec'}),
        rng('One-arm barbell hold', 3, 4, 15, 30, {group: 'FOREARMS & GRIP', unit: 'sec', perSide: true}),

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
        rng('Gi grip pull-up', 3, 4, 3, 8, {group: 'FIGHTER-SPECIFIC', noLoad: true}),
        rng('Towel farmer\'s carry', 3, 5, 20, 40, {group: 'FIGHTER-SPECIFIC', unit: 'm'}),
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
      rng('Wide-grip pull-up', 3, 4, 4, 10, {group: 'VERTICAL PULL', noLoad: true}),
      rng('Neutral-grip pull-up', 3, 4, 5, 10, {group: 'VERTICAL PULL', noLoad: true}),
      rng('Behind-the-neck pulldown', 3, 3, 8, 12, {group: 'VERTICAL PULL'}),
      rng('Single-arm lat pulldown', 3, 3, 8, 12, {group: 'VERTICAL PULL', perSide: true}),
      rng('Kneeling lat pulldown', 3, 3, 10, 15, {group: 'VERTICAL PULL'}),
      rng('Assisted pull-up machine', 3, 4, 6, 12, {group: 'VERTICAL PULL'}),

      rng('Barbell bent-over row', 3, 5, 5, 10, {group: 'HORIZONTAL PULL'}),
      rng('Pendlay row', 3, 4, 4, 8, {group: 'HORIZONTAL PULL'}),
      rng('Single-arm dumbbell row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL', perSide: true}),
      rng('Chest-supported row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL'}),
      rng('Seated cable row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL'}),
      rng('Inverted row', 3, 4, 8, 15, {group: 'HORIZONTAL PULL', noLoad: true}),
      rng('T-bar row', 3, 4, 6, 10, {group: 'HORIZONTAL PULL'}),
      rng('Meadows row', 3, 4, 6, 10, {group: 'HORIZONTAL PULL', perSide: true}),
      rng('Yates row', 3, 4, 5, 8, {group: 'HORIZONTAL PULL'}),
      rng('Machine row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL'}),
      rng('Landmine row', 3, 4, 8, 12, {group: 'HORIZONTAL PULL'}),
      rng('Wide-grip cable row', 3, 3, 10, 15, {group: 'HORIZONTAL PULL'}),
      rng('One-arm barbell row', 3, 4, 6, 10, {group: 'HORIZONTAL PULL', perSide: true}),

      rng('Conventional deadlift', 3, 5, 3, 6, {group: 'POSTERIOR CHAIN'}),
      rng('Trap-bar deadlift', 3, 4, 4, 8, {group: 'POSTERIOR CHAIN'}),
      rng('Rack pull', 3, 4, 4, 8, {group: 'POSTERIOR CHAIN'}),
      rng('Good morning', 3, 3, 8, 12, {group: 'POSTERIOR CHAIN'}),
      rng('Deficit deadlift', 3, 4, 3, 6, {group: 'POSTERIOR CHAIN'}),
      rng('Snatch-grip deadlift', 3, 4, 3, 6, {group: 'POSTERIOR CHAIN'}),
      rng('Block pull', 3, 4, 3, 6, {group: 'POSTERIOR CHAIN'}),
      rng('45-degree back extension', 3, 4, 10, 15, {group: 'POSTERIOR CHAIN', noLoad: true}),
      rng('Reverse hyperextension', 3, 4, 10, 15, {group: 'POSTERIOR CHAIN'}),

      rng('Towel pull-up', 3, 4, 3, 8, {group: 'FIGHTER-SPECIFIC', noLoad: true}),
      rng('Bear crawl', 3, 5, 20, 40, {group: 'FIGHTER-SPECIFIC', unit: 'm', noLoad: true}),
      rng('Sandbag over-shoulder throw', 3, 5, 3, 6, {group: 'FIGHTER-SPECIFIC', perSide: true}),
      rng('Renegade row', 3, 4, 6, 10, {group: 'FIGHTER-SPECIFIC', perSide: true}),
      rng('Muscle-up', 3, 4, 3, 8, {group: 'FIGHTER-SPECIFIC', noLoad: true}),

      rng('Band pull-apart', 3, 4, 15, 25, {group: 'BANDS', noLoad: true}),
      rng('Band lat pulldown', 3, 4, 12, 20, {group: 'BANDS', noLoad: true}),
      rng('Band seated row', 3, 4, 12, 20, {group: 'BANDS', noLoad: true}),
      rng('Band single-arm row', 3, 4, 12, 20, {group: 'BANDS', perSide: true, noLoad: true}),
      rng('Band deadlift', 3, 4, 15, 25, {group: 'BANDS', noLoad: true}),
      rng('Band face pull', 3, 4, 15, 25, {group: 'BANDS', noLoad: true}),
      rng('Band pull-through', 3, 4, 15, 25, {group: 'BANDS', noLoad: true}),
      rng('Banded good morning', 3, 3, 12, 20, {group: 'BANDS', noLoad: true})
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
      rng('Barbell rollout', 3, 4, 6, 10, {group: 'ANTI-EXTENSION'}),
      rng('Stability ball rollout', 3, 4, 8, 12, {group: 'ANTI-EXTENSION', noLoad: true}),
      rng('RKC plank', 3, 4, 15, 30, {group: 'ANTI-EXTENSION', unit: 'sec', noLoad: true}),
      rng('Long-lever plank', 3, 4, 15, 30, {group: 'ANTI-EXTENSION', unit: 'sec', noLoad: true}),

      rng('Pallof press', 3, 3, 10, 15, {group: 'ANTI-ROTATION', perSide: true}),
      rng('Suitcase carry', 3, 5, 20, 40, {group: 'ANTI-ROTATION', unit: 'm', perSide: true}),
      rng('Side plank', 3, 3, 20, 45, {group: 'ANTI-ROTATION', unit: 'sec', perSide: true, noLoad: true}),
      rng('Half-kneeling Pallof press', 3, 3, 10, 15, {group: 'ANTI-ROTATION', perSide: true}),
      rng('Copenhagen plank', 3, 3, 15, 30, {group: 'ANTI-ROTATION', unit: 'sec', perSide: true, noLoad: true}),
      rng('Cable anti-rotation hold', 3, 3, 15, 30, {group: 'ANTI-ROTATION', unit: 'sec', perSide: true}),

      rng('Russian twist', 3, 3, 15, 25, {group: 'ROTATION & POWER', noLoad: true}),
      rng('Cable woodchop', 3, 4, 10, 15, {group: 'ROTATION & POWER', perSide: true}),
      rng('Medicine-ball slam', 3, 5, 5, 10, {group: 'ROTATION & POWER'}),
      rng('Landmine rotation', 3, 4, 8, 12, {group: 'ROTATION & POWER', perSide: true}),
      rng('High-to-low cable chop', 3, 3, 10, 15, {group: 'ROTATION & POWER', perSide: true}),
      rng('Low-to-high cable chop', 3, 3, 10, 15, {group: 'ROTATION & POWER', perSide: true}),
      rng('Standing medicine-ball rotational slam', 3, 4, 6, 10, {group: 'ROTATION & POWER', perSide: true}),

      rng('Hanging leg raise', 3, 4, 8, 15, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Toes-to-bar', 3, 4, 5, 12, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('V-up', 3, 3, 12, 20, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Dragon flag', 3, 3, 3, 8, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Dead bug', 3, 3, 10, 15, {group: 'FLEXION & ENDURANCE', perSide: true, noLoad: true}),
      rng('Weighted sit-up', 3, 4, 10, 20, {group: 'FLEXION & ENDURANCE'}),
      rng('Decline sit-up', 3, 4, 10, 20, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Cable crunch', 3, 4, 10, 20, {group: 'FLEXION & ENDURANCE'}),
      rng('Machine crunch', 3, 4, 10, 20, {group: 'FLEXION & ENDURANCE'}),
      rng('Reverse crunch', 3, 3, 12, 20, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('Bicycle crunch', 3, 3, 15, 25, {group: 'FLEXION & ENDURANCE', noLoad: true}),
      rng('L-sit hold', 3, 4, 10, 30, {group: 'FLEXION & ENDURANCE', unit: 'sec', noLoad: true})
    ] }
  };

  var HIPS = {
    key: 'hips', name: 'Hips & Glutes', tag: 'HIPS & GLUTES', part: 'Legs',
    priority: 'Hip strength → Unilateral control → Hip power → Mobility → Endurance',
    pool: { all: [
      rng('Barbell hip thrust', 3, 4, 6, 12, {group: 'HIP THRUSTS & BRIDGES'}),
      rng('Single-leg hip thrust', 3, 3, 8, 12, {group: 'HIP THRUSTS & BRIDGES', perSide: true}),
      rng('Banded hip thrust', 3, 4, 12, 20, {group: 'HIP THRUSTS & BRIDGES'}),
      rng('Machine hip thrust', 3, 4, 8, 15, {group: 'HIP THRUSTS & BRIDGES'}),
      rng('Glute bridge', 3, 3, 10, 20, {group: 'HIP THRUSTS & BRIDGES', noLoad: true}),
      rng('Single-leg glute bridge', 3, 3, 8, 15, {group: 'HIP THRUSTS & BRIDGES', perSide: true, noLoad: true}),
      rng('Frog pump', 3, 3, 15, 25, {group: 'HIP THRUSTS & BRIDGES', noLoad: true}),

      rng('Bulgarian split squat', 3, 4, 6, 12, {group: 'UNILATERAL & LUNGES', perSide: true}),
      rng('Reverse lunge', 3, 4, 8, 12, {group: 'UNILATERAL & LUNGES', perSide: true}),
      rng('Walking lunge', 3, 4, 20, 40, {group: 'UNILATERAL & LUNGES', unit: 'm'}),
      rng('Curtsy lunge', 3, 3, 8, 12, {group: 'UNILATERAL & LUNGES', perSide: true, noLoad: true}),
      rng('Lateral lunge', 3, 3, 8, 12, {group: 'UNILATERAL & LUNGES', perSide: true}),
      rng('Deficit reverse lunge', 3, 3, 8, 12, {group: 'UNILATERAL & LUNGES', perSide: true}),
      rng('Step-back lunge', 3, 4, 8, 12, {group: 'UNILATERAL & LUNGES', perSide: true}),
      rng('Skater squat', 3, 3, 6, 10, {group: 'UNILATERAL & LUNGES', perSide: true, noLoad: true}),
      rng('Cossack squat', 3, 3, 6, 12, {group: 'UNILATERAL & LUNGES', perSide: true, noLoad: true}),

      rng('Sumo deadlift', 3, 5, 3, 8, {group: 'HINGE & POSTERIOR'}),
      rng('Cable pull-through', 3, 3, 10, 15, {group: 'HINGE & POSTERIOR'}),
      rng('B-stance Romanian deadlift', 3, 3, 8, 12, {group: 'HINGE & POSTERIOR', perSide: true}),
      rng('Cable glute kickback', 3, 3, 10, 15, {group: 'HINGE & POSTERIOR', perSide: true}),

      rng('Lateral band walk', 3, 3, 12, 20, {group: 'MOBILITY & ACTIVATION', perSide: true, noLoad: true}),
      rng('Hip airplane', 2, 3, 5, 10, {group: 'MOBILITY & ACTIVATION', perSide: true, noLoad: true}),
      rng('90/90 hip switch', 2, 3, 8, 15, {group: 'MOBILITY & ACTIVATION', noLoad: true}),
      rng('Clamshell', 3, 3, 12, 20, {group: 'MOBILITY & ACTIVATION', perSide: true, noLoad: true}),
      rng('Fire hydrant', 3, 3, 10, 15, {group: 'MOBILITY & ACTIVATION', perSide: true, noLoad: true}),
      rng('Monster walk', 3, 3, 15, 25, {group: 'MOBILITY & ACTIVATION', unit: 'm', noLoad: true}),
      rng('Standing cable hip abduction', 3, 3, 12, 20, {group: 'MOBILITY & ACTIVATION', perSide: true}),
      rng('Seated hip abduction machine', 3, 4, 10, 20, {group: 'MOBILITY & ACTIVATION'})
    ] }
  };

  var QUADS = {
    key: 'quads', name: 'Quads', tag: 'QUADS', part: 'Legs',
    priority: 'Squat strength → Unilateral strength → Leg drive → Endurance',
    pool: { all: [
      rng('Back squat', 3, 5, 3, 8, {group: 'SQUATS & PRESSES'}),
      rng('Front squat', 3, 4, 4, 8, {group: 'SQUATS & PRESSES'}),
      rng('Zercher squat', 3, 4, 5, 10, {group: 'SQUATS & PRESSES'}),
      rng('Box squat', 3, 4, 4, 8, {group: 'SQUATS & PRESSES'}),
      rng('Pause squat', 3, 4, 3, 6, {group: 'SQUATS & PRESSES'}),
      rng('Safety-bar squat', 3, 4, 5, 8, {group: 'SQUATS & PRESSES'}),
      rng('Belt squat', 3, 4, 6, 12, {group: 'SQUATS & PRESSES'}),
      rng('Smith machine squat', 3, 4, 8, 12, {group: 'SQUATS & PRESSES'}),
      rng('Goblet squat', 3, 4, 8, 15, {group: 'SQUATS & PRESSES'}),
      rng('Hack squat', 3, 4, 8, 12, {group: 'SQUATS & PRESSES'}),
      rng('Leg press', 3, 4, 8, 15, {group: 'SQUATS & PRESSES'}),
      rng('Single-leg leg press', 3, 3, 8, 15, {group: 'SQUATS & PRESSES', perSide: true}),

      rng('Split squat', 3, 4, 8, 12, {group: 'UNILATERAL', perSide: true}),
      rng('Front-foot-elevated split squat', 3, 3, 8, 12, {group: 'UNILATERAL', perSide: true}),
      rng('Step-up', 3, 4, 8, 12, {group: 'UNILATERAL', perSide: true}),
      rng('Box step-up', 3, 4, 8, 12, {group: 'UNILATERAL', perSide: true}),
      rng('Lateral step-up', 3, 3, 8, 12, {group: 'UNILATERAL', perSide: true}),
      rng('Deficit step-up', 3, 3, 6, 10, {group: 'UNILATERAL', perSide: true}),
      rng('Pistol squat', 3, 3, 3, 8, {group: 'UNILATERAL', perSide: true, noLoad: true}),
      rng('Assisted pistol squat', 3, 3, 5, 10, {group: 'UNILATERAL', perSide: true, noLoad: true}),

      rng('Leg extension', 3, 3, 12, 20, {group: 'ISOLATION & PLYOMETRIC'}),
      rng('Sissy squat', 3, 3, 8, 15, {group: 'ISOLATION & PLYOMETRIC', noLoad: true}),
      rng('Machine sissy squat', 3, 3, 8, 15, {group: 'ISOLATION & PLYOMETRIC'}),
      rng('Spanish squat', 3, 4, 20, 40, {group: 'ISOLATION & PLYOMETRIC', unit: 'sec'}),
      rng('Wall sit', 3, 3, 30, 60, {group: 'ISOLATION & PLYOMETRIC', unit: 'sec', noLoad: true}),
      rng('Jump squat', 3, 5, 5, 10, {group: 'ISOLATION & PLYOMETRIC', noLoad: true}),
      rng('Box jump', 3, 5, 5, 10, {group: 'ISOLATION & PLYOMETRIC', noLoad: true}),
      rng('Broad jump', 3, 5, 3, 6, {group: 'ISOLATION & PLYOMETRIC', noLoad: true}),
      rng('Depth jump', 3, 4, 4, 8, {group: 'ISOLATION & PLYOMETRIC', noLoad: true}),
      rng('Tuck jump', 3, 4, 5, 10, {group: 'ISOLATION & PLYOMETRIC', noLoad: true}),
      rng('Sled push', 3, 5, 20, 40, {group: 'ISOLATION & PLYOMETRIC', unit: 'm', setsLabel: 'ROUNDS'})
    ] }
  };

  var HAMSTRINGS = {
    key: 'hamstrings', name: 'Hamstrings', tag: 'HAMSTRINGS', part: 'Legs',
    priority: 'Hinge strength → Knee flexion → Unilateral control → Eccentric strength',
    pool: { all: [
      rng('Romanian deadlift', 3, 4, 6, 10, {group: 'HINGE PATTERNS'}),
      rng('Dumbbell Romanian deadlift', 3, 4, 6, 10, {group: 'HINGE PATTERNS'}),
      rng('Stiff-leg deadlift', 3, 4, 6, 10, {group: 'HINGE PATTERNS'}),
      rng('Deficit Romanian deadlift', 3, 4, 6, 10, {group: 'HINGE PATTERNS'}),
      rng('Single-leg Romanian deadlift', 3, 3, 8, 12, {group: 'HINGE PATTERNS', perSide: true}),
      rng('Kettlebell Romanian deadlift', 3, 4, 8, 12, {group: 'HINGE PATTERNS'}),
      rng('Banded Romanian deadlift', 3, 3, 10, 15, {group: 'HINGE PATTERNS', noLoad: true}),

      rng('Nordic hamstring curl', 3, 4, 4, 8, {group: 'CURLS & ISOLATION', noLoad: true}),
      rng('Glute-ham raise', 3, 4, 5, 10, {group: 'CURLS & ISOLATION', noLoad: true}),
      rng('Lying leg curl', 3, 4, 8, 15, {group: 'CURLS & ISOLATION'}),
      rng('Seated leg curl', 3, 4, 8, 15, {group: 'CURLS & ISOLATION'}),
      rng('Standing leg curl', 3, 3, 10, 15, {group: 'CURLS & ISOLATION', perSide: true}),
      rng('Cable leg curl', 3, 3, 10, 15, {group: 'CURLS & ISOLATION', perSide: true}),
      rng('Stability ball leg curl', 3, 3, 10, 15, {group: 'CURLS & ISOLATION', noLoad: true}),
      rng('Slider leg curl', 3, 3, 8, 15, {group: 'CURLS & ISOLATION', noLoad: true}),
      rng('Back extension', 3, 3, 10, 15, {group: 'CURLS & ISOLATION', noLoad: true})
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
      rng('Loaded toe walk', 3, 4, 20, 30, {unit: 'm'}),
      rng('Smith machine calf raise', 3, 4, 10, 20),
      rng('Barbell calf raise', 3, 4, 10, 20),
      rng('Machine standing calf raise', 3, 4, 10, 20),
      rng('Single-leg dumbbell calf raise', 3, 3, 10, 15, {perSide: true}),
      rng('Seated dumbbell calf raise', 3, 4, 10, 20),
      rng('Calf raise isometric hold', 3, 4, 20, 40, {unit: 'sec'}),
      rng('Double-unders', 3, 5, 20, 40, {unit: 'sec', setsLabel: 'ROUNDS', noLoad: true})
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
      rng('Barefoot skipping', 3, 5, 20, 40, {unit: 'sec', setsLabel: 'ROUNDS', noLoad: true}),
      rng('Ankle alphabet', 2, 3, 1, 1, {perSide: true, noLoad: true}),
      rng('Resisted ankle eversion', 3, 3, 12, 20, {perSide: true, noLoad: true}),
      rng('Resisted ankle inversion', 3, 3, 12, 20, {perSide: true, noLoad: true}),
      rng('Marble pickup', 2, 3, 10, 20, {perSide: true, noLoad: true}),
      rng('Toe yoga', 2, 3, 10, 15, {perSide: true, noLoad: true}),
      rng('Single-leg balance on foam pad', 3, 3, 30, 60, {unit: 'sec', perSide: true, noLoad: true}),
      rng('Bosu ball single-leg stand', 3, 3, 30, 60, {unit: 'sec', perSide: true, noLoad: true})
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
      rng('Shrug hold', 3, 4, 20, 40, {unit: 'sec'}),
      rng('Weighted neck flexion', 3, 4, 10, 20),
      rng('Weighted neck extension', 3, 4, 10, 20),
      rng('Four-way neck machine', 3, 4, 10, 15),
      rng('Manual lateral neck resistance', 3, 3, 8, 15, {perSide: true, noLoad: true}),
      rng('Banded neck rotation', 3, 3, 10, 15, {perSide: true, noLoad: true})
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
      rng('Towel wring', 3, 3, 20, 40, {unit: 'sec', noLoad: true}),
      rng('Captains of Crush hold', 3, 5, 10, 20, {unit: 'sec'}),
      rng('Rolling thunder lift', 3, 5, 10, 20, {unit: 'sec'}),
      rng('Vertical bar hold', 3, 4, 15, 30, {unit: 'sec'}),
      rng('Dumbbell finger curl', 3, 3, 10, 15),
      rng('Sledgehammer lever hold', 3, 4, 15, 30, {unit: 'sec', perSide: true}),
      rng('Plate wrist rotation', 3, 3, 8, 15, {perSide: true}),
      rng('Grip trainer negative', 3, 4, 10, 20, {unit: 'sec'})
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
      rng('Kettlebell high pull', 3, 4, 8, 15, {group: 'TOTAL BODY'}),
      rng('Kettlebell close-grip swing', 3, 5, 10, 20, {group: 'TOTAL BODY'}),
      rng('Kettlebell hand-to-hand swing', 3, 5, 10, 20, {group: 'TOTAL BODY'}),
      rng('Kettlebell single-arm clean and press', 3, 4, 5, 8, {group: 'TOTAL BODY', perSide: true}),

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
      rng('Kettlebell goblet squat', 3, 4, 8, 15, {group: 'LOWER BODY'}),
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
