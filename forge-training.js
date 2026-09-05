/* THE FORGE — TRAINING CENTRE, section data.
   =====================================================================================
   The Training centre is built from sections. The page renders whatever is in SECTIONS, so
   a new section is a data change rather than a page rewrite.

   Each section carries a chart of ways to train it and the tools that do the job. Every
   exercise names a figure in forge-hand-figures.js, a level, and a dose — an exercise
   without a dose is a suggestion, not training. `risk` is loading information, not a
   disclaimer: grip is the easiest thing in the body to overtrain into tendinopathy,
   because strength climbs faster than the tendon behind it. */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every script. See engine-guards.test.mjs.
  if (root.ForgeTraining) return;

  var LEVELS = ['easy', 'hard', 'brutal'];

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
    stub('hands', 'Hands & Forearms')
  ];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { LEVELS: LEVELS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
