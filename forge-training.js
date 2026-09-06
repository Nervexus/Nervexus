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

  var SECTIONS = [
    CHEST,
    SHOULDERS,
    stub('arms', 'Arms'),
    stub('back', 'Back'),
    stub('core', 'Core'),
    stub('hips', 'Hips & Glutes'),
    stub('quads', 'Quads'),
    stub('hamstrings', 'Hamstrings'),
    stub('calves', 'Calves'),
    stub('feet', 'Feet & Ankles'),
    stub('neck', 'Neck'),
    stub('hands', 'Hands & Forearms'),
    stub('full-body', 'Full Body')
  ];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { LEVELS: LEVELS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
