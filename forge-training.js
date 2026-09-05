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

  /* Full Body is a session rather than a subject: one checklist, ticked as you go. Ticking
     writes the set to the same training log Fitness HQ uses, so there is one record of what
     you did rather than two that disagree.

     Every item carries what addWorkout needs to log it — the body part it counts toward and
     a real quantity (reps, minutes or distance). An item with none of those is silently
     refused by the log, so the tick would appear to work and record nothing. */
  var FULL_BODY = {
    key: 'full-body', name: 'Full Body', tag: 'FULL BODY',
    checklist: [
      { id: 'squat',    name: 'Back squat',        part: 'Legs',      target: '3 × 5',    sets: 3, reps: 5,  load: true },
      { id: 'deadlift', name: 'Deadlift',          part: 'Back',      target: '1 × 5',    sets: 1, reps: 5,  load: true },
      { id: 'bench',    name: 'Bench press',       part: 'Chest',     target: '3 × 5',    sets: 3, reps: 5,  load: true },
      { id: 'press',    name: 'Overhead press',    part: 'Shoulders', target: '3 × 5',    sets: 3, reps: 5,  load: true },
      { id: 'row',      name: 'Barbell row',       part: 'Back',      target: '3 × 8',    sets: 3, reps: 8,  load: true },
      { id: 'pullup',   name: 'Pull-ups',          part: 'Back',      target: '3 × max',  sets: 3, reps: 8,  load: true },
      { id: 'dip',      name: 'Dips',              part: 'Chest',     target: '3 × 8',    sets: 3, reps: 8,  load: true },
      { id: 'carry',    name: "Farmer's carry",    part: 'Core',      target: '3 × 40m',  dist: 120, distUnit: 'm', load: true },
      { id: 'legraise', name: 'Hanging leg raise', part: 'Core',      target: '3 × 12',   sets: 3, reps: 12, load: false },
      { id: 'plank',    name: 'Plank',             part: 'Core',      target: '3 × 60s',  minutes: 3, load: false }
    ]
  };

  /* The Training centre's sections, in the order they are worked through. None of them have
     content yet — each is a key, a name and a label, and the page renders it as an empty
     page. A stub with an empty work array would read as built-and-broken rather than
     not-started, so they carry nothing else at all. */
  function stub(key, name) { return { key: key, name: name, tag: name.toUpperCase() }; }

  var SECTIONS = [
    stub('chest', 'Chest'),
    stub('shoulders', 'Shoulders'),
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
    FULL_BODY
  ];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { LEVELS: LEVELS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
