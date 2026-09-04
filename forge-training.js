/* THE FORGE — TRAINING CENTRE, section data.
   =====================================================================================
   The Training centre is built from sections. This file holds them, and the page renders
   whatever is in SECTIONS — so a new section is a data change, not a page rewrite.

   Rules this file keeps, so it stays useful under load:

   * A standard is a number you pass or fail. "Stronger grip" is not a standard;
     "a 60-second hang with bodyweight on the bar" is.
   * Muscles are named properly and paired with what they actually do. A list of Latin
     that does not say what moves is decoration.
   * `risk` is loading information, not a disclaimer. Grip is the easiest thing in the
     body to overtrain into tendinopathy, because strength climbs faster than the tendon
     holding it. Harsh and reckless are different things.

   Pure data plus one helper: no DOM, no network, no state. */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every script. See engine-guards.test.mjs.
  if (root.ForgeTraining) return;

  var TIERS = ['Baseline', 'Hardened', 'Forged', 'Unit'];

  var HANDS = {
    key: 'hands',
    name: 'Hand Training',
    tag: 'GRIP & HAND DEVELOPMENT',
    why: 'Your hands are the only part of you that touches the load. Grip is the first thing '
       + 'that fails on a heavy pull and the last thing anyone trains on purpose — which is why '
       + 'most people are lifting to the limit of their fingers rather than their back. '
       + 'It is also the most visible strength there is: a hand that has been trained looks and '
       + 'feels different from one that has not, and it holds up for sixty years rather than thirty.',

    /* The five things "grip" actually means. Training one does almost nothing for the others,
       which is why a strong deadlift hold can sit next to a pathetic pinch. */
    types: [
      { name: 'Crush', what: 'Closing the hand against resistance.',
        detail: 'Grippers, thick-bar squeezes. What a handshake measures. Trains the flexors through their full closing range.' },
      { name: 'Support', what: 'Holding a load without closing any further.',
        detail: 'Hangs, deadlift holds, carries. The one that actually limits your pulling, and the one straps let you avoid forever.' },
      { name: 'Pinch', what: 'Thumb opposing the fingers, no palm contact.',
        detail: 'Plate pinches, block lifts. The weakest and least trained of the five, and the one that builds the thumb pad.' },
      { name: 'Extension', what: 'Opening the hand against resistance.',
        detail: 'Bands, rice, finger spreads. The antagonist to everything else here, and the single best defence against elbow tendinopathy.' },
      { name: 'Wrist & rotation', what: 'Bending and turning the wrist under load.',
        detail: 'Wrist curls, rollers, sledgehammer levering. Covers flexion, extension, deviation and pronation/supination.' }
    ],

    /* Grouped by where they live, because that is what decides how you train them: the
       extrinsics are forearm muscles pulling on tendons that run into the hand, the
       intrinsics live inside the hand itself. */
    muscles: [
      { group: 'Extrinsic flexors — forearm, tendons running into the hand', items: [
        { name: 'Flexor digitorum profundus', does: 'Bends the fingertips. The prime mover in any hold — this is what fails on a deadlift.' },
        { name: 'Flexor digitorum superficialis', does: 'Bends the middle finger joints. Does most of the work in a crush.' },
        { name: 'Flexor pollicis longus', does: 'Bends the thumb tip. Without it there is no pinch.' },
        { name: 'Flexor carpi radialis & ulnaris', does: 'Bend the wrist. Keep it from collapsing under a heavy hold.' }
      ]},
      { group: 'Extrinsic extensors — the half nobody trains', items: [
        { name: 'Extensor digitorum', does: 'Opens the fingers. Chronically weak in anyone who only grips.' },
        { name: 'Extensor carpi radialis longus & brevis', does: 'Extend the wrist. The brevis tendon is where tennis elbow happens.' },
        { name: 'Extensor carpi ulnaris', does: 'Extends and angles the wrist toward the little finger.' },
        { name: 'Extensor pollicis longus & brevis', does: 'Open and straighten the thumb.' }
      ]},
      { group: 'Intrinsics — inside the hand itself', items: [
        { name: 'Thenar group', does: 'The pad at the base of the thumb — abductor, flexor and opponens pollicis brevis. Opposition, and most of a hand’s visible bulk.' },
        { name: 'Adductor pollicis', does: 'Drives the thumb toward the palm. The muscle a pinch is actually built on.' },
        { name: 'Hypothenar group', does: 'The little-finger pad. Cups the hand around a bar.' },
        { name: 'Dorsal interossei', does: 'Spread the fingers apart. Trained by almost nothing except deliberate extension work.' },
        { name: 'Palmar interossei', does: 'Draw the fingers together. Half of a tight, even grip.' },
        { name: 'Lumbricals', does: 'Bend the knuckles while the fingers stay straight — the position every crimp and open-hand hold lives in.' }
      ]},
      { group: 'Forearm rotators — where hand strength turns into arm size', items: [
        { name: 'Brachioradialis', does: 'Bends the elbow with the palm neutral. Thick-bar and hammer work builds it faster than curls.' },
        { name: 'Pronator teres', does: 'Turns the palm down.' },
        { name: 'Supinator', does: 'Turns the palm up. Weak supination is a quiet cause of elbow pain.' }
      ]}
    ],

    standards: [
      { id: 'hang-two',    name: 'Dead hang, two hands',        unit: 'seconds', tiers: [30, 60, 120, 180],
        how: 'Bar, full grip, no straps, shoulders active. Stop at the point the fingers open, not before.' },
      { id: 'hang-one',    name: 'One-arm hang',                unit: 'seconds', tiers: [5, 15, 30, 60],
        how: 'Best arm. Free hand off the bar entirely.' },
      { id: 'hang-towel',  name: 'Towel hang, two towels',      unit: 'seconds', tiers: [10, 25, 45, 75],
        how: 'One towel per hand over the bar. Roughly halves what a bar hang gives you.' },
      { id: 'bar-hold',    name: 'Barbell hold at bodyweight',  unit: 'seconds', tiers: [10, 20, 45, 60],
        how: 'Deadlift the bar loaded to your own bodyweight and hold. Double overhand, no hook, no straps.' },
      { id: 'pinch-plate', name: 'Two-hand plate pinch, 10kg',  unit: 'seconds', tiers: [10, 30, 45, 60],
        how: 'Two 10kg plates per hand, smooth sides facing out. Thumb does the work.' },
      { id: 'gripper',     name: 'Gripper close, rated',        unit: 'kg', tiers: [60, 80, 100, 140],
        how: 'A clean close from a deep set, held for a second. Rated resistance of the gripper, not how it feels.' },
      { id: 'dynamometer', name: 'Dynamometer, best hand',      unit: 'kg', tiers: [45, 55, 65, 80],
        how: 'Standing, elbow at ninety degrees, one hard squeeze. Best of three.' },
      { id: 'ext-band',    name: 'Finger extension, band',      unit: 'reps', tiers: [15, 25, 40, 60],
        how: 'Heavy band around all five fingertips, open slowly and fully. Reps to failure.' }
    ],

    work: [
      { name: 'Dead hangs', dose: '3-5 sets to near failure · 3x/week',
        cue: 'Full grip, shoulders pulled down rather than hanging slack. The best return of anything on this list, and it costs a bar.' },
      { name: 'Barbell or trap-bar holds', dose: '3 x 20-30s · 2x/week, after pulling',
        cue: 'Load past what you can deadlift for reps. Double overhand, no hook grip, no straps — the point is the grip, not the lift.' },
      { name: "Farmer's carries", dose: '3-4 trips of 30-40m · weekly',
        cue: 'Heavy, tall, breathing under control. Builds support grip, traps and trunk in the same trip.' },
      { name: 'Plate pinch', dose: '4 x 20-30s · 2x/week',
        cue: 'Two plates per hand, smooth sides out. Start with two 10s. Thumb pad does the work, not the fingers.' },
      { name: 'Gripper work', dose: '3-5 singles or short sets · 2x/week',
        cue: 'Set it deep in the palm before you close. Deep set first, strength second.',
        risk: 'Never max a gripper daily. Crush strength climbs faster than the tendon behind it, and this is the fastest route to an angry elbow.' },
      { name: 'Thick bar & towel work', dose: 'swap into rows and holds · weekly',
        cue: 'Doubling bar diameter roughly halves what you can hold. That gap is the whole point of doing it.' },
      { name: 'Finger extensions', dose: '3 x 20-30 · daily',
        cue: 'Band around the fingertips, open slowly and all the way. Costs two minutes.',
        risk: 'Every other item here closes the hand. Unopposed flexion is how grip training turns into golfer’s and tennis elbow — this is the item that prevents it, so it is the one not to skip.' },
      { name: 'Wrist roller', dose: '2-3 passes up and down · 2x/week',
        cue: 'Slow on the way down. The lowering half is the half that builds it.' },
      { name: 'Wrist curls & reverse curls', dose: '3 x 12-15 each · 2x/week',
        cue: 'Full range, no bounce. The reverse version is the one that trains the extensors, so do not drop it when you are tired.' },
      { name: 'Rice bucket', dose: '2-3 minutes · after training',
        cue: 'Open, close, rotate, dig. Endurance and blood flow for the intrinsics, and it settles the forearms down after heavy work.' },
      { name: 'Finger spreads & lumbrical holds', dose: '2 x 15 · daily',
        cue: 'Band around all five fingers and spread. Then knuckles bent with fingers straight, and hold.' },
      { name: 'Sledgehammer levering', dose: '2 x 8 each direction · weekly',
        cue: 'Grip near the end, lower slowly. Radial and ulnar deviation, which nothing else on the list touches.',
        risk: 'Start with a short grip well up the handle. The leverage builds fast and the wrist is small.' }
    ],

    rules: [
      { rule: 'Two hard grip sessions a week, not five',
        why: 'Tendon adapts far slower than muscle. Grip strength will climb faster than the tissue holding it, and the tissue is what gives out.' },
      { rule: 'Train opening as hard as closing',
        why: 'Eleven of the twelve items above close the hand. Balance the extensors or the elbows collect the bill.' },
      { rule: 'Straps are for the back, never for grip day',
        why: 'They are a tool for out-loading your grip on heavy pulls. Used every session they guarantee your hands stay the weak link forever.' },
      { rule: 'Stop at pain that lasts a week',
        why: 'Elbow and wrist tendinopathy takes months to settle once established and weeks if caught. Back off the closing work, keep the extensions.' },
      { rule: 'Skin before strength',
        why: 'Rips and thick calluses stop you training more often than weakness does. File calluses flat, keep them dry.' }
    ]
  };

  var SECTIONS = [HANDS];

  function section(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i];
    return null;
  }

  root.ForgeTraining = { TIERS: TIERS, SECTIONS: SECTIONS, section: section };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ForgeTraining;
})(typeof window !== 'undefined' ? window : this);
