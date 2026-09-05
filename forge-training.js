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

  var HANDS = {
    key: 'hands',
    name: 'Hand Training',
    tag: 'GRIP & HAND DEVELOPMENT',

    /* What actually does the work. Priced so "get some kit" stops being an abstraction —
       the whole list is under a hundred pounds and most of it is optional. */
    tools: [
      { name: 'Pull-up bar', cost: '£20', need: 'essential',
        does: 'Hangs, one-arm hangs, towel hangs. The one thing on this list with no substitute.' },
      { name: 'Kettlebell, 16-24kg', cost: '£35', need: 'essential',
        does: 'Finger curls, bottoms-up holds, carries. One bell covers half the chart.' },
      { name: 'Rubber bands, finger', cost: '£4', need: 'essential',
        does: 'Extension and spreads — the antagonist work. The cheapest thing here and the one that keeps your elbows working.' },
      { name: 'Rated gripper', cost: '£20', need: 'useful',
        does: 'Crush strength you can put a number on. Buy a pair — one you can close, one you cannot.' },
      { name: 'Two smooth 10kg plates', cost: 'already have', need: 'useful',
        does: 'Pinch holds and pinch curls. Smooth sides out or it is not a pinch.' },
      { name: 'Fat grips or a thick bar', cost: '£15', need: 'useful',
        does: 'Roughly doubles the grip demand of the same weight. Turns any bar into grip work.' },
      { name: 'Towel', cost: 'free', need: 'useful',
        does: 'Towel hangs and wringing. Free, and harder than most things you can buy.' },
      { name: 'Wrist roller', cost: '£12 or make one', need: 'optional',
        does: 'Forearm flexion and extension under continuous tension. A pipe, a rope and a plate.' },
      { name: 'Grip dynamometer', cost: '£25', need: 'optional',
        does: 'The only way to know whether any of this is working, rather than guessing.' },
      { name: 'Rice bucket', cost: '£3', need: 'optional',
        does: 'Endurance and blood flow for the small muscles inside the hand. Also settles forearms after heavy work.' },
      { name: 'Chalk', cost: '£6', need: 'optional',
        does: 'Skin and friction. Rips and slick hands stop training more often than weakness does.' },
      { name: 'Nail file', cost: '£2', need: 'optional',
        does: 'File calluses flat. A torn callus costs a fortnight.' }
    ],

    /* The chart: every way to train a hand, easiest first within each level. */
    work: [
      { fig: 'rice', level: 'easy', name: 'Rice bucket', dose: '2-3 min · after training',
        cue: 'Open, close, rotate, dig. Endurance and blood flow for the muscles inside the hand.' },
      { fig: 'ball', level: 'easy', name: 'Ball squeeze', dose: '3 x 30 · daily',
        cue: 'A tennis ball is enough. Squeeze hard, hold two seconds, release slowly.' },
      { fig: 'band-ext', level: 'easy', name: 'Finger extensions', dose: '3 x 20-30 · daily',
        cue: 'Band around the fingertips, open slowly and all the way. Two minutes a day.',
        risk: 'Nearly everything else here closes the hand. Unopposed flexion is how grip training turns into golfer’s and tennis elbow — this is the item that prevents it, so it is the one not to skip.' },
      { fig: 'spread', level: 'easy', name: 'Finger spreads', dose: '2 x 15 · daily',
        cue: 'Band around all five fingers and spread against it. Then knuckles bent, fingers straight, and hold.' },
      { fig: 'towel-wring', level: 'easy', name: 'Towel wringing', dose: '3 x 30s each way · daily',
        cue: 'Damp towel, wring it out in both directions. Free, and it hits rotation nothing else touches.' },

      { fig: 'hang', level: 'hard', name: 'Dead hang', dose: '3-5 sets to near failure · 3x/week',
        cue: 'Full grip, no straps, shoulders pulled down rather than hanging slack. The best return of anything on this chart.' },
      { fig: 'kb-curl', level: 'hard', name: 'Kettlebell finger curls', dose: '3 x 12-15 · 2x/week',
        cue: 'Forearm flat, bell hanging off the fingers. Let it roll down to the fingertips, then curl it back into the palm. Slow both ways — the lowering half is the half that builds it.' },
      { fig: 'bb-curl', level: 'hard', name: 'Barbell finger curls', dose: '3 x 15-20 · 2x/week',
        cue: 'Seated, forearms on the thighs, bar rolled out to the fingertips and curled back. Heavier than the kettlebell version, shorter range.' },
      { fig: 'bar-hold', level: 'hard', name: 'Barbell hold', dose: '3 x 20-30s · 2x/week after pulling',
        cue: 'Load past what you can deadlift for reps. Double overhand, no hook, no straps — the grip is the point, not the lift.' },
      { fig: 'pinch', level: 'hard', name: 'Plate pinch', dose: '4 x 20-30s · 2x/week',
        cue: 'Two plates per hand, smooth sides out. Start with two 10s. The thumb pad does the work.' },
      { fig: 'carry', level: 'hard', name: "Farmer's carry", dose: '3-4 trips of 30-40m · weekly',
        cue: 'Heavy, tall, breathing under control. Support grip, traps and trunk in the same trip.' },
      { fig: 'gripper', level: 'hard', name: 'Gripper close', dose: '3-5 singles · 2x/week',
        cue: 'Set it deep in the palm before you close. A deep set beats a strong squeeze.',
        risk: 'Never max a gripper daily. Crush strength climbs faster than the tendon behind it, and this is the quickest route to an angry elbow.' },
      { fig: 'thickbar', level: 'hard', name: 'Thick-bar hold', dose: '3 x 15-20s · weekly',
        cue: 'Doubling the bar diameter roughly halves what you can hold. That gap is the whole reason to do it.' },
      { fig: 'roller', level: 'hard', name: 'Wrist roller', dose: '2-3 passes up and down · 2x/week',
        cue: 'Arms out in front, roll it up and lower it under control. The lowering is the half that counts.' },
      { fig: 'wrist-curl', level: 'hard', name: 'Wrist curls & reverse', dose: '3 x 12-15 each · 2x/week',
        cue: 'Full range, no bounce. The reverse version trains the extensors, so it is not the one to drop when you are tired.' },
      { fig: 'sledge', level: 'hard', name: 'Sledgehammer levering', dose: '2 x 8 each way · weekly',
        cue: 'Grip near the end of the handle, lower slowly. Radial and ulnar deviation, which nothing else on the chart touches.',
        risk: 'Start with a short grip well up the handle. The leverage builds fast and the wrist is small.' },

      { fig: 'hang-one', level: 'brutal', name: 'One-arm hang', dose: '4-6 sets to failure · 2x/week',
        cue: 'Free hand off the bar entirely. Build to it from two-hand hangs — do not just drop an arm.' },
      { fig: 'towel-hang', level: 'brutal', name: 'Towel hang', dose: '3-4 sets to failure · weekly',
        cue: 'One towel per hand over the bar. Roughly halves what a bar hang gives you.' },
      { fig: 'bottoms-up', level: 'brutal', name: 'Bottoms-up kettlebell hold', dose: '3 x 20s each · weekly',
        cue: 'Bell inverted above the handle. Crush grip, wrist locked straight, and the whole arm has to stabilise.' },
      { fig: 'crimp', level: 'brutal', name: 'Edge hang', dose: '4-6 x 7-10s · 2x/week',
        cue: 'Four fingers on a 20mm edge, thumb off, feet supporting some weight until you can take it all.',
        risk: 'Finger pulleys tear and take months. Never on cold hands, never to failure, and not at all in your first year of grip work.' }
    ]
  };

  /* The Training centre's sections, in the order they are worked through. Only the ones
     carrying `work` have anything in them yet; the rest are placeholders waiting for their
     content, and the page renders them as empty pages rather than hiding them. */
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
    HANDS
  ];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { LEVELS: LEVELS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
