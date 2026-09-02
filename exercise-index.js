/* exercise-index.js — what every exercise is, and where it files.

   Written from a list supplied by the owner: 258 exercises across 15 muscles. It is data,
   not logic — extend it by adding lines, nothing here needs to change.

   Two labels per entry, because the list is finer than the app:

     muscle   the real classification, as given — Biceps, Quads, Lower Back, Obliques…
     group    the bucket the Fitness page actually renders — Chest, Back, Shoulders,
              Arms, Legs, Core, Cardio, Mixed

   Keeping both means the detail is not thrown away to fit eight tabs, and can be
   surfaced later without re-deriving it.

   Twelve exercises were listed under two muscles (Romanian Deadlift under Lower Back and
   Hamstrings, Bulgarian Split Squat under Glutes and Quads, and so on). First listed
   wins; to change one, move it above the other in the source list.

   lookup() is deliberately forgiving, because this is fed by speech: it normalises case,
   hyphens and punctuation, then matches the LONGEST listed name appearing in the text as
   whole words. "log 30 minutes of incline dumbbell press" finds "incline dumbbell press"
   rather than stopping at "press", and "3 sets of bench press at 60kg" finds it with all
   the numbers still attached.
*/
(function (root) {
  // Runs once: the <helmet> relocation re-executes every engine script. See voice-assistant-engine.js.
  if (root.EXERCISE_INDEX) return;

  'use strict';

  // normalised name -> [muscle, app group, display name]
  var MAP = {
    'bench press':                           ['Chest',      'Chest',     'Bench Press'],
    'incline bench press':                   ['Chest',      'Chest',     'Incline Bench Press'],
    'decline bench press':                   ['Chest',      'Chest',     'Decline Bench Press'],
    'dumbbell bench press':                  ['Chest',      'Chest',     'Dumbbell Bench Press'],
    'incline dumbbell press':                ['Chest',      'Chest',     'Incline Dumbbell Press'],
    'decline dumbbell press':                ['Chest',      'Chest',     'Decline Dumbbell Press'],
    'machine chest press':                   ['Chest',      'Chest',     'Machine Chest Press'],
    'smith machine bench press':             ['Chest',      'Chest',     'Smith Machine Bench Press'],
    'incline smith machine press':           ['Chest',      'Chest',     'Incline Smith Machine Press'],
    'dumbbell fly':                          ['Chest',      'Chest',     'Dumbbell Fly'],
    'incline dumbbell fly':                  ['Chest',      'Chest',     'Incline Dumbbell Fly'],
    'cable fly':                             ['Chest',      'Chest',     'Cable Fly'],
    'low cable fly':                         ['Chest',      'Chest',     'Low Cable Fly'],
    'high cable fly':                        ['Chest',      'Chest',     'High Cable Fly'],
    'pec deck':                              ['Chest',      'Chest',     'Pec Deck'],
    'chest fly machine':                     ['Chest',      'Chest',     'Chest Fly Machine'],
    'push up':                               ['Chest',      'Chest',     'Push-Up'],
    'wide push up':                          ['Chest',      'Chest',     'Wide Push-Up'],
    'diamond push up':                       ['Chest',      'Chest',     'Diamond Push-Up'],
    'archer push up':                        ['Chest',      'Chest',     'Archer Push-Up'],
    'deficit push up':                       ['Chest',      'Chest',     'Deficit Push-Up'],
    'ring push up':                          ['Chest',      'Chest',     'Ring Push-Up'],
    'chest dips':                            ['Chest',      'Chest',     'Chest Dips'],
    'svend press':                           ['Chest',      'Chest',     'Svend Press'],
    'plate press':                           ['Chest',      'Chest',     'Plate Press'],
    'landmine press':                        ['Chest',      'Chest',     'Landmine Press'],
    'dumbbell pullover':                     ['Chest',      'Chest',     'Dumbbell Pullover'],
    'pull up':                               ['Back',       'Back',      'Pull-Up'],
    'wide grip pull up':                     ['Back',       'Back',      'Wide-Grip Pull-Up'],
    'neutral grip pull up':                  ['Back',       'Back',      'Neutral-Grip Pull-Up'],
    'chin up':                               ['Back',       'Back',      'Chin-Up'],
    'lat pulldown':                          ['Back',       'Back',      'Lat Pulldown'],
    'wide grip lat pulldown':                ['Back',       'Back',      'Wide-Grip Lat Pulldown'],
    'close grip lat pulldown':               ['Back',       'Back',      'Close-Grip Lat Pulldown'],
    'neutral grip lat pulldown':             ['Back',       'Back',      'Neutral-Grip Lat Pulldown'],
    'straight arm pulldown':                 ['Back',       'Back',      'Straight-Arm Pulldown'],
    'barbell row':                           ['Back',       'Back',      'Barbell Row'],
    'pendlay row':                           ['Back',       'Back',      'Pendlay Row'],
    'yates row':                             ['Back',       'Back',      'Yates Row'],
    't bar row':                             ['Back',       'Back',      'T-Bar Row'],
    'chest supported row':                   ['Back',       'Back',      'Chest-Supported Row'],
    'seated cable row':                      ['Back',       'Back',      'Seated Cable Row'],
    'close grip cable row':                  ['Back',       'Back',      'Close-Grip Cable Row'],
    'wide grip cable row':                   ['Back',       'Back',      'Wide-Grip Cable Row'],
    'one arm dumbbell row':                  ['Back',       'Back',      'One-Arm Dumbbell Row'],
    'machine row':                           ['Back',       'Back',      'Machine Row'],
    'plate loaded row':                      ['Back',       'Back',      'Plate-Loaded Row'],
    'inverted row':                          ['Back',       'Back',      'Inverted Row'],
    'meadows row':                           ['Back',       'Back',      'Meadows Row'],
    'seal row':                              ['Back',       'Back',      'Seal Row'],
    'landmine row':                          ['Back',       'Back',      'Landmine Row'],
    'rack pull':                             ['Back',       'Back',      'Rack Pull'],
    'deadlift':                              ['Back',       'Back',      'Deadlift'],
    'sumo deadlift':                         ['Back',       'Back',      'Sumo Deadlift'],
    'trap bar deadlift':                     ['Back',       'Back',      'Trap Bar Deadlift'],
    'overhead press':                        ['Shoulders',  'Shoulders', 'Overhead Press'],
    'barbell shoulder press':                ['Shoulders',  'Shoulders', 'Barbell Shoulder Press'],
    'dumbbell shoulder press':               ['Shoulders',  'Shoulders', 'Dumbbell Shoulder Press'],
    'seated dumbbell press':                 ['Shoulders',  'Shoulders', 'Seated Dumbbell Press'],
    'arnold press':                          ['Shoulders',  'Shoulders', 'Arnold Press'],
    'machine shoulder press':                ['Shoulders',  'Shoulders', 'Machine Shoulder Press'],
    'smith machine shoulder press':          ['Shoulders',  'Shoulders', 'Smith Machine Shoulder Press'],
    'landmine shoulder press':               ['Shoulders',  'Shoulders', 'Landmine Shoulder Press'],
    'lateral raise':                         ['Shoulders',  'Shoulders', 'Lateral Raise'],
    'dumbbell lateral raise':                ['Shoulders',  'Shoulders', 'Dumbbell Lateral Raise'],
    'cable lateral raise':                   ['Shoulders',  'Shoulders', 'Cable Lateral Raise'],
    'machine lateral raise':                 ['Shoulders',  'Shoulders', 'Machine Lateral Raise'],
    'leaning lateral raise':                 ['Shoulders',  'Shoulders', 'Leaning Lateral Raise'],
    'front raise':                           ['Shoulders',  'Shoulders', 'Front Raise'],
    'dumbbell front raise':                  ['Shoulders',  'Shoulders', 'Dumbbell Front Raise'],
    'cable front raise':                     ['Shoulders',  'Shoulders', 'Cable Front Raise'],
    'plate front raise':                     ['Shoulders',  'Shoulders', 'Plate Front Raise'],
    'rear delt fly':                         ['Shoulders',  'Shoulders', 'Rear Delt Fly'],
    'reverse pec deck':                      ['Shoulders',  'Shoulders', 'Reverse Pec Deck'],
    'cable rear delt fly':                   ['Shoulders',  'Shoulders', 'Cable Rear Delt Fly'],
    'face pull':                             ['Shoulders',  'Shoulders', 'Face Pull'],
    'upright row':                           ['Shoulders',  'Shoulders', 'Upright Row'],
    'barbell upright row':                   ['Shoulders',  'Shoulders', 'Barbell Upright Row'],
    'cable upright row':                     ['Shoulders',  'Shoulders', 'Cable Upright Row'],
    'cuban press':                           ['Shoulders',  'Shoulders', 'Cuban Press'],
    'lu raise':                              ['Shoulders',  'Shoulders', 'Lu Raise'],
    'barbell curl':                          ['Biceps',     'Arms',      'Barbell Curl'],
    'ez bar curl':                           ['Biceps',     'Arms',      'EZ-Bar Curl'],
    'dumbbell curl':                         ['Biceps',     'Arms',      'Dumbbell Curl'],
    'alternating dumbbell curl':             ['Biceps',     'Arms',      'Alternating Dumbbell Curl'],
    'hammer curl':                           ['Biceps',     'Arms',      'Hammer Curl'],
    'cross body hammer curl':                ['Biceps',     'Arms',      'Cross-Body Hammer Curl'],
    'incline dumbbell curl':                 ['Biceps',     'Arms',      'Incline Dumbbell Curl'],
    'preacher curl':                         ['Biceps',     'Arms',      'Preacher Curl'],
    'ez bar preacher curl':                  ['Biceps',     'Arms',      'EZ-Bar Preacher Curl'],
    'machine preacher curl':                 ['Biceps',     'Arms',      'Machine Preacher Curl'],
    'concentration curl':                    ['Biceps',     'Arms',      'Concentration Curl'],
    'cable curl':                            ['Biceps',     'Arms',      'Cable Curl'],
    'bayesian curl':                         ['Biceps',     'Arms',      'Bayesian Curl'],
    'spider curl':                           ['Biceps',     'Arms',      'Spider Curl'],
    'drag curl':                             ['Biceps',     'Arms',      'Drag Curl'],
    'zottman curl':                          ['Biceps',     'Arms',      'Zottman Curl'],
    'reverse curl':                          ['Biceps',     'Arms',      'Reverse Curl'],
    'machine bicep curl':                    ['Biceps',     'Arms',      'Machine Bicep Curl'],
    'high cable curl':                       ['Biceps',     'Arms',      'High Cable Curl'],
    '21s':                                   ['Biceps',     'Arms',      '21s'],
    'tricep pushdown':                       ['Triceps',    'Arms',      'Tricep Pushdown'],
    'rope pushdown':                         ['Triceps',    'Arms',      'Rope Pushdown'],
    'straight bar pushdown':                 ['Triceps',    'Arms',      'Straight-Bar Pushdown'],
    'v bar pushdown':                        ['Triceps',    'Arms',      'V-Bar Pushdown'],
    'single arm pushdown':                   ['Triceps',    'Arms',      'Single-Arm Pushdown'],
    'overhead tricep extension':             ['Triceps',    'Arms',      'Overhead Tricep Extension'],
    'dumbbell overhead extension':           ['Triceps',    'Arms',      'Dumbbell Overhead Extension'],
    'cable overhead extension':              ['Triceps',    'Arms',      'Cable Overhead Extension'],
    'ez bar skull crusher':                  ['Triceps',    'Arms',      'EZ-Bar Skull Crusher'],
    'dumbbell skull crusher':                ['Triceps',    'Arms',      'Dumbbell Skull Crusher'],
    'close grip bench press':                ['Triceps',    'Arms',      'Close-Grip Bench Press'],
    'tricep dips':                           ['Triceps',    'Arms',      'Tricep Dips'],
    'bench dips':                            ['Triceps',    'Arms',      'Bench Dips'],
    'dumbbell kickback':                     ['Triceps',    'Arms',      'Dumbbell Kickback'],
    'cable kickback':                        ['Triceps',    'Arms',      'Cable Kickback'],
    'jm press':                              ['Triceps',    'Arms',      'JM Press'],
    'tate press':                            ['Triceps',    'Arms',      'Tate Press'],
    'machine tricep extension':              ['Triceps',    'Arms',      'Machine Tricep Extension'],
    'single arm overhead extension':         ['Triceps',    'Arms',      'Single-Arm Overhead Extension'],
    'cross body tricep extension':           ['Triceps',    'Arms',      'Cross-Body Tricep Extension'],
    'wrist curl':                            ['Forearms',   'Arms',      'Wrist Curl'],
    'reverse wrist curl':                    ['Forearms',   'Arms',      'Reverse Wrist Curl'],
    'barbell wrist curl':                    ['Forearms',   'Arms',      'Barbell Wrist Curl'],
    'dumbbell wrist curl':                   ['Forearms',   'Arms',      'Dumbbell Wrist Curl'],
    'farmer\'s carry':                       ['Forearms',   'Arms',      'Farmer\'s Carry'],
    'suitcase carry':                        ['Forearms',   'Arms',      'Suitcase Carry'],
    'plate pinch':                           ['Forearms',   'Arms',      'Plate Pinch'],
    'dead hang':                             ['Forearms',   'Arms',      'Dead Hang'],
    'towel hang':                            ['Forearms',   'Arms',      'Towel Hang'],
    'wrist roller':                          ['Forearms',   'Arms',      'Wrist Roller'],
    'gripper':                               ['Forearms',   'Arms',      'Gripper'],
    'finger curl':                           ['Forearms',   'Arms',      'Finger Curl'],
    'crunch':                                ['Abs',        'Core',      'Crunch'],
    'sit up':                                ['Abs',        'Core',      'Sit-Up'],
    'decline sit up':                        ['Abs',        'Core',      'Decline Sit-Up'],
    'weighted sit up':                       ['Abs',        'Core',      'Weighted Sit-Up'],
    'cable crunch':                          ['Abs',        'Core',      'Cable Crunch'],
    'machine crunch':                        ['Abs',        'Core',      'Machine Crunch'],
    'hanging leg raise':                     ['Abs',        'Core',      'Hanging Leg Raise'],
    'hanging knee raise':                    ['Abs',        'Core',      'Hanging Knee Raise'],
    'captain\'s chair leg raise':            ['Abs',        'Core',      'Captain\'s Chair Leg Raise'],
    'lying leg raise':                       ['Abs',        'Core',      'Lying Leg Raise'],
    'reverse crunch':                        ['Abs',        'Core',      'Reverse Crunch'],
    'v up':                                  ['Abs',        'Core',      'V-Up'],
    'toes to bar':                           ['Abs',        'Core',      'Toes-to-Bar'],
    'ab wheel rollout':                      ['Abs',        'Core',      'Ab Wheel Rollout'],
    'stability ball crunch':                 ['Abs',        'Core',      'Stability Ball Crunch'],
    'bicycle crunch':                        ['Abs',        'Core',      'Bicycle Crunch'],
    'dead bug':                              ['Abs',        'Core',      'Dead Bug'],
    'hollow body hold':                      ['Abs',        'Core',      'Hollow Body Hold'],
    'flutter kicks':                         ['Abs',        'Core',      'Flutter Kicks'],
    'mountain climbers':                     ['Abs',        'Core',      'Mountain Climbers'],
    'side plank':                            ['Obliques',   'Core',      'Side Plank'],
    'russian twist':                         ['Obliques',   'Core',      'Russian Twist'],
    'cable woodchop':                        ['Obliques',   'Core',      'Cable Woodchop'],
    'cable side bend':                       ['Obliques',   'Core',      'Cable Side Bend'],
    'dumbbell side bend':                    ['Obliques',   'Core',      'Dumbbell Side Bend'],
    'landmine rotation':                     ['Obliques',   'Core',      'Landmine Rotation'],
    'pallof press':                          ['Obliques',   'Core',      'Pallof Press'],
    'side crunch':                           ['Obliques',   'Core',      'Side Crunch'],
    'hanging oblique knee raise':            ['Obliques',   'Core',      'Hanging Oblique Knee Raise'],
    'back extension':                        ['Lower Back', 'Back',      'Back Extension'],
    '45 degree back extension':              ['Lower Back', 'Back',      '45-Degree Back Extension'],
    'hyperextension':                        ['Lower Back', 'Back',      'Hyperextension'],
    'reverse hyperextension':                ['Lower Back', 'Back',      'Reverse Hyperextension'],
    'good morning':                          ['Lower Back', 'Back',      'Good Morning'],
    'superman':                              ['Lower Back', 'Back',      'Superman'],
    'bird dog':                              ['Lower Back', 'Back',      'Bird Dog'],
    'romanian deadlift':                     ['Lower Back', 'Back',      'Romanian Deadlift'],
    'conventional deadlift':                 ['Lower Back', 'Back',      'Conventional Deadlift'],
    'jefferson curl':                        ['Lower Back', 'Back',      'Jefferson Curl'],
    'hip thrust':                            ['Glutes',     'Legs',      'Hip Thrust'],
    'barbell hip thrust':                    ['Glutes',     'Legs',      'Barbell Hip Thrust'],
    'dumbbell hip thrust':                   ['Glutes',     'Legs',      'Dumbbell Hip Thrust'],
    'glute bridge':                          ['Glutes',     'Legs',      'Glute Bridge'],
    'single leg glute bridge':               ['Glutes',     'Legs',      'Single-Leg Glute Bridge'],
    'glute kickback machine':                ['Glutes',     'Legs',      'Glute Kickback Machine'],
    'donkey kick':                           ['Glutes',     'Legs',      'Donkey Kick'],
    'fire hydrant':                          ['Glutes',     'Legs',      'Fire Hydrant'],
    'bulgarian split squat':                 ['Glutes',     'Legs',      'Bulgarian Split Squat'],
    'reverse lunge':                         ['Glutes',     'Legs',      'Reverse Lunge'],
    'walking lunge':                         ['Glutes',     'Legs',      'Walking Lunge'],
    'curtsy lunge':                          ['Glutes',     'Legs',      'Curtsy Lunge'],
    'step up':                               ['Glutes',     'Legs',      'Step-Up'],
    'cable pull through':                    ['Glutes',     'Legs',      'Cable Pull-Through'],
    'frog pumps':                            ['Glutes',     'Legs',      'Frog Pumps'],
    'b stance hip thrust':                   ['Glutes',     'Legs',      'B-Stance Hip Thrust'],
    'single leg hip thrust':                 ['Glutes',     'Legs',      'Single-Leg Hip Thrust'],
    'back squat':                            ['Quads',      'Legs',      'Back Squat'],
    'front squat':                           ['Quads',      'Legs',      'Front Squat'],
    'hack squat':                            ['Quads',      'Legs',      'Hack Squat'],
    'leg press':                             ['Quads',      'Legs',      'Leg Press'],
    'narrow stance leg press':               ['Quads',      'Legs',      'Narrow-Stance Leg Press'],
    'leg extension':                         ['Quads',      'Legs',      'Leg Extension'],
    'front foot elevated split squat':       ['Quads',      'Legs',      'Front-Foot Elevated Split Squat'],
    'forward lunge':                         ['Quads',      'Legs',      'Forward Lunge'],
    'sissy squat':                           ['Quads',      'Legs',      'Sissy Squat'],
    'goblet squat':                          ['Quads',      'Legs',      'Goblet Squat'],
    'smith machine squat':                   ['Quads',      'Legs',      'Smith Machine Squat'],
    'belt squat':                            ['Quads',      'Legs',      'Belt Squat'],
    'spanish squat':                         ['Quads',      'Legs',      'Spanish Squat'],
    'cyclist squat':                         ['Quads',      'Legs',      'Cyclist Squat'],
    'wall sit':                              ['Quads',      'Legs',      'Wall Sit'],
    'pistol squat':                          ['Quads',      'Legs',      'Pistol Squat'],
    'stiff leg deadlift':                    ['Hamstrings', 'Legs',      'Stiff-Leg Deadlift'],
    'seated leg curl':                       ['Hamstrings', 'Legs',      'Seated Leg Curl'],
    'lying leg curl':                        ['Hamstrings', 'Legs',      'Lying Leg Curl'],
    'standing leg curl':                     ['Hamstrings', 'Legs',      'Standing Leg Curl'],
    'nordic hamstring curl':                 ['Hamstrings', 'Legs',      'Nordic Hamstring Curl'],
    'glute ham raise':                       ['Hamstrings', 'Legs',      'Glute-Ham Raise'],
    'single leg romanian deadlift':          ['Hamstrings', 'Legs',      'Single-Leg Romanian Deadlift'],
    'dumbbell romanian deadlift':            ['Hamstrings', 'Legs',      'Dumbbell Romanian Deadlift'],
    'stability ball leg curl':               ['Hamstrings', 'Legs',      'Stability Ball Leg Curl'],
    'slider leg curl':                       ['Hamstrings', 'Legs',      'Slider Leg Curl'],
    'razor curl':                            ['Hamstrings', 'Legs',      'Razor Curl'],
    'standing calf raise':                   ['Calves',     'Legs',      'Standing Calf Raise'],
    'seated calf raise':                     ['Calves',     'Legs',      'Seated Calf Raise'],
    'leg press calf raise':                  ['Calves',     'Legs',      'Leg Press Calf Raise'],
    'donkey calf raise':                     ['Calves',     'Legs',      'Donkey Calf Raise'],
    'single leg calf raise':                 ['Calves',     'Legs',      'Single-Leg Calf Raise'],
    'smith machine calf raise':              ['Calves',     'Legs',      'Smith Machine Calf Raise'],
    'machine calf raise':                    ['Calves',     'Legs',      'Machine Calf Raise'],
    'tibialis raise':                        ['Calves',     'Legs',      'Tibialis Raise'],
    'seated tibialis raise':                 ['Calves',     'Legs',      'Seated Tibialis Raise'],
    'calf press':                            ['Calves',     'Legs',      'Calf Press'],
    'hip adduction machine':                 ['Adductors',  'Legs',      'Hip Adduction Machine'],
    'cable hip adduction':                   ['Adductors',  'Legs',      'Cable Hip Adduction'],
    'copenhagen plank':                      ['Adductors',  'Legs',      'Copenhagen Plank'],
    'sumo squat':                            ['Adductors',  'Legs',      'Sumo Squat'],
    'cossack squat':                         ['Adductors',  'Legs',      'Cossack Squat'],
    'lateral lunge':                         ['Adductors',  'Legs',      'Lateral Lunge'],
    'side lunge':                            ['Adductors',  'Legs',      'Side Lunge'],
    'running':                               ['Cardio',     'Cardio',    'Running'],
    'jogging':                               ['Cardio',     'Cardio',    'Jogging'],
    'sprinting':                             ['Cardio',     'Cardio',    'Sprinting'],
    'walking':                               ['Cardio',     'Cardio',    'Walking'],
    'treadmill':                             ['Cardio',     'Cardio',    'Treadmill'],
    'cycling':                               ['Cardio',     'Cardio',    'Cycling'],
    'stationary bike':                       ['Cardio',     'Cardio',    'Stationary Bike'],
    'spin bike':                             ['Cardio',     'Cardio',    'Spin Bike'],
    'swimming':                              ['Cardio',     'Cardio',    'Swimming'],
    'rowing':                                ['Cardio',     'Cardio',    'Rowing'],
    'stair climber':                         ['Cardio',     'Cardio',    'Stair Climber'],
    'stairmaster':                           ['Cardio',     'Cardio',    'Stairmaster'],
    'elliptical':                            ['Cardio',     'Cardio',    'Elliptical'],
    'cross trainer':                         ['Cardio',     'Cardio',    'Cross Trainer'],
    'ski erg':                               ['Cardio',     'Cardio',    'Ski Erg'],
    'assault bike':                          ['Cardio',     'Cardio',    'Assault Bike'],
    'air bike':                              ['Cardio',     'Cardio',    'Air Bike'],
    'jump rope':                             ['Cardio',     'Cardio',    'Jump Rope'],
    'hiking':                                ['Cardio',     'Cardio',    'Hiking'],
    'incline walking':                       ['Cardio',     'Cardio',    'Incline Walking'],
    'hiit':                                  ['Cardio',     'Cardio',    'HIIT'],
    'sprint intervals':                      ['Cardio',     'Cardio',    'Sprint Intervals'],
    'circuit training':                      ['Cardio',     'Cardio',    'Circuit Training'],
    'boxing':                                ['Cardio',     'Cardio',    'Boxing'],
    'kickboxing':                            ['Cardio',     'Cardio',    'Kickboxing'],
  };

  /* Spoken short forms of entries ALREADY on the list — the verb where the list has the
     noun. Not new exercises: every target below is a name from the supplied list.

     "3 minutes run" is what a noisy room does to "3 minutes of running", and without
     these it logs an exercise called "Run" that classifies as nothing.

     Deliberately excludes "row" and "squat". Bare "row" would send "3 sets of 10 rows"
     to the Rowing machine when a lifter means Barbell Row, and "squat" could be any of
     six listed variants — both are better left to the fallback patterns than guessed. */
  var ALIAS = {
    'run':'running', 'runs':'running', 'ran':'running',
    'jog':'jogging', 'jogs':'jogging', 'jogged':'jogging',
    'cycle':'cycling', 'cycles':'cycling', 'cycled':'cycling', 'bike':'cycling', 'bikes':'cycling', 'biking':'cycling', 'biked':'cycling',
    'swim':'swimming', 'swims':'swimming', 'swam':'swimming', 'swum':'swimming',
    'walk':'walking', 'walks':'walking', 'walked':'walking',
    'sprint':'sprinting', 'sprints':'sprinting', 'sprinted':'sprinting',
    'hike':'hiking', 'hikes':'hiking', 'hiked':'hiking',
    'skipping':'jump rope', 'skip rope':'jump rope', 'skipped rope':'jump rope', 'rope':'jump rope',
    /* Past tense, because people report training in it: "I benched 80 kilos". Unlike bare
       "row" and "squat" this one is not ambiguous — nothing else is called benching. */
    'benched':'bench press', 'benching':'bench press',
    'treadmill run':'treadmill', 'cross-trainer':'cross trainer'
  };

  var GROUPS = ['Chest','Back','Shoulders','Arms','Legs','Core','Cardio','Mixed'];

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/\u2019/g, "'")
      .replace(/-/g, ' ')
      .replace(/[^a-z0-9' ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Spoken input rarely matches the written name exactly: "push-ups" for Push-Up,
     "farmers carry" for Farmer's Carry. A loose form — apostrophes dropped, trailing s
     stripped off each word — collapses both onto the same key, so the list does not have
     to enumerate every plural and possessive by hand. */
  function loose(s) {
    return norm(s).replace(/'/g, '').replace(/\b(\w+?)s\b/g, '$1').replace(/\s+/g, ' ').trim();
  }

  /* Keys longest-first, so a specific name always beats a shorter one contained in it —
     "incline dumbbell press" before "dumbbell press" before "press". Built once. */
  var KEYS = Object.keys(MAP).sort(function (a, b) { return b.length - a.length; });
  var LOOSE = {};
  KEYS.forEach(function (k) { var l = loose(k); if (!LOOSE[l]) LOOSE[l] = k; });
  var LOOSE_KEYS = Object.keys(LOOSE).sort(function (a, b) { return b.length - a.length; });

  function whole(hay, needle) {
    return new RegExp('(^| )' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( |$)').test(hay);
  }

  function resolveAlias(k) { return (ALIAS[k] && MAP[ALIAS[k]]) ? ALIAS[k] : k; }

  function lookup(text) {
    var t = norm(text);
    if (!t) return null;
    var a = resolveAlias(t);
    if (MAP[a]) return entry(a, MAP[a]);

    var lt = loose(t), i, k;
    if (LOOSE[lt]) { k = LOOSE[lt]; return entry(k, MAP[k]); }

    // an alias sitting inside a longer phrase — "30 minutes run", "went for a jog"
    var words = t.split(' ');
    for (i = words.length; i > 0; i--) {
      for (var j = 0; j + i <= words.length; j++) {
        var seg = words.slice(j, j + i).join(' ');
        if (ALIAS[seg] && MAP[ALIAS[seg]]) return entry(ALIAS[seg], MAP[ALIAS[seg]]);
      }
    }

    // exact wording first, then the loose form — so a precise name is never beaten by a
    // sloppier match on a different exercise
    for (i = 0; i < KEYS.length; i++) if (whole(t, KEYS[i])) return entry(KEYS[i], MAP[KEYS[i]]);
    for (i = 0; i < LOOSE_KEYS.length; i++) {
      if (whole(lt, LOOSE_KEYS[i])) { k = LOOSE[LOOSE_KEYS[i]]; return entry(k, MAP[k]); }
    }
    return null;
  }
  function entry(key, v) { return { key: key, muscle: v[0], group: v[1], name: v[2] }; }

  root.EXERCISE_INDEX = {
    lookup: lookup, norm: norm, groups: GROUPS,
    size: KEYS.length,
    muscleOf: function (t) { var h = lookup(t); return h ? h.muscle : null; },
    groupOf:  function (t) { var h = lookup(t); return h ? h.group  : null; },
    nameOf:   function (t) { var h = lookup(t); return h ? h.name   : null; }
  };

}(window));
