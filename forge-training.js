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

  var CHEST = {
    key: 'chest', name: 'Chest', tag: 'CHEST',
    part: 'Chest',
    pool: {
      gym: [
        ex('Barbell bench press', 4, 6),
        ex('Incline barbell press', 4, 8),
        ex('Decline barbell press', 3, 8),
        ex('Dumbbell bench press', 4, 8),
        ex('Incline dumbbell press', 4, 10),
        ex('Decline dumbbell press', 3, 10),
        ex('Dumbbell flye', 3, 12),
        ex('Incline dumbbell flye', 3, 12),
        ex('Cable crossover, high to low', 3, 15),
        ex('Cable crossover, low to high', 3, 15),
        ex('Cable flye, mid', 3, 12),
        ex('Pec deck', 3, 12),
        ex('Machine chest press', 3, 10),
        ex('Incline machine press', 3, 10),
        ex('Smith machine bench press', 3, 8),
        ex('Weighted dip', 4, 8),
        ex('Landmine press', 3, 10),
        ex('Floor press', 3, 8),
        ex('Svend press', 3, 15),
        ex('Dumbbell pullover', 3, 12)
      ],
      home: [
        ex('Press-up', 4, 15),
        ex('Incline press-up', 3, 15),
        ex('Decline press-up', 3, 12),
        ex('Diamond press-up', 3, 12),
        ex('Wide press-up', 3, 15),
        ex('Archer press-up', 3, 8),
        ex('Explosive press-up', 4, 8),
        ex('Chair dip', 3, 12),
        ex('Band chest press', 3, 15),
        ex('Band flye', 3, 15)
      ]
    }
  };

  /* The Training centre's sections, in the order they are worked through. None of them have
     content yet — each is a key, a name and a label, and the page renders it as an empty
     page. A stub with an empty work array would read as built-and-broken rather than
     not-started, so they carry nothing else at all. */
  function stub(key, name) { return { key: key, name: name, tag: name.toUpperCase() }; }

  var SECTIONS = [
    CHEST,
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
    stub('full-body', 'Full Body')
  ];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { LEVELS: LEVELS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
