/* The exercise database:  node exercise-index.test.mjs

   This is what Bulk Import consults to decide what an exercise is and which body part it
   belongs to. It is pure data and a forgiving lookup, so it is tested here rather than by
   clicking through an import.

   The cases below came from a real session that would not file: a phone types "kettle bell"
   and the list said "kettlebell", so four of seven exercises found nothing at all and were
   filed by a regex guess instead. */
import fs from 'fs';
const root = {};
new Function('window', fs.readFileSync('./exercise-index.js', 'utf8'))(root);
const I = root.EXERCISE_INDEX;

const T = []; const t = (n, f) => T.push([n, f]);
const eq = (g, w, what) => { if (g !== w) throw new Error(what + ': expected ' + JSON.stringify(w) + ', got ' + JSON.stringify(g)); };
const ok = (c, what) => { if (!c) throw new Error(what); };
const find = (q) => { const h = I.lookup(q); return h ? h.group + '/' + h.muscle : null; };

t('the session that would not file, now files', async () => {
  const want = {
    'Kettle bell shoulder hold': 'Shoulders/Shoulders',
    'Seated halo':               'Shoulders/Shoulders',
    'Dead hang':                 'Arms/Forearms',
    'Kettle bell wrist flip':    'Arms/Forearms',
    'Kettle bell wrist curls':   'Arms/Forearms',
    'Leg abductor':              'Legs/Glutes',
    'Seated Leg press':          'Legs/Quads',
  };
  for (const q of Object.keys(want)) eq(find(q), want[q], q + ' filed wrongly');
});

t('equipment written as two words finds the one-word entry', async () => {
  /* Nobody types "kettlebell" on a phone between sets. */
  eq(find('kettle bell wrist curl'), find('kettlebell wrist curl'), 'kettle bell');
  eq(find('dumb bell shoulder press'), find('dumbbell shoulder press'), 'dumb bell');
  eq(find('bar bell wrist curl'), find('barbell wrist curl'), 'bar bell');
  ok(find('kettle bells halo'), 'a plural should not break it');
});

t('and the one-word spellings of what the list writes as two', async () => {
  eq(find('pullup'), find('pull up'), 'pullup');
  eq(find('pushups'), find('push up'), 'pushups');
  eq(find('chinup'), find('chin up'), 'chinup');
  eq(find('situp'), find('sit up'), 'situp');
});

t('the abductor machine and the adductor beside it are both known', async () => {
  for (const q of ['leg abductor', 'hip abduction', 'seated hip abduction', 'abductor machine'])
    eq(find(q), 'Legs/Glutes', q);
  for (const q of ['leg adductor', 'hip adduction', 'adductor machine'])
    eq(find(q), 'Legs/Adductors', q);
});

t('a held kettlebell is shoulder work, whatever the clock says', async () => {
  for (const q of ['kettlebell shoulder hold', 'kettlebell overhead hold', 'kettlebell rack hold', 'kettlebell halo'])
    eq(find(q), 'Shoulders/Shoulders', q);
});

t('the longest name still wins, with the numbers still attached', async () => {
  /* The whole reason lookup is forgiving: it is fed by speech and by pasted logs. */
  eq(I.lookup('3 sets of seated leg press at 90kg').key, 'seated leg press', 'the specific one, not "leg press"');
  eq(I.lookup('log 30 minutes of incline dumbbell press').key, 'incline dumbbell press', 'not "press"');
  eq(I.lookup('10x16kg kettle bell wrist flip').key, 'kettlebell wrist flip', 'with a set line in front of it');
});

t('the common exercises the list simply did not have', async () => {
  /* Found while checking the change above: the list carried "side plank" and "hanging leg
     raise" but not "plank" or "leg raise", and had no entry at all for a kettlebell swing,
     a calf raise or a seated row — the plainest names in any log. */
  const want = {
    'plank': 'Core/Abs', 'leg raise': 'Core/Abs',
    'calf raise': 'Legs/Calves', 'seated row': 'Back/Back',
    'kettlebell swing': 'Legs/Glutes', 'sled push': 'Legs/Quads', 'box jump': 'Legs/Quads',
    'burpee': 'Cardio/Cardio', 'jumping jack': 'Cardio/Cardio', 'battle ropes': 'Cardio/Cardio',
    'clean and press': 'Shoulders/Shoulders', 'turkish get up': 'Shoulders/Shoulders',
  };
  for (const q of Object.keys(want)) eq(find(q), want[q], q + ' filed wrongly');
});

t('a bare name does not steal a qualified one', async () => {
  /* Adding "plank" and "leg raise" must not make the longest-match rule stop preferring the
     specific entry that was already there. */
  eq(I.lookup('side plank').key, 'side plank', 'side plank');
  eq(I.lookup('copenhagen plank').key, 'copenhagen plank', 'copenhagen plank');
  eq(I.lookup('hanging leg raise').key, 'hanging leg raise', 'hanging leg raise');
  eq(I.lookup('standing calf raise').key, 'standing calf raise', 'standing calf raise');
  eq(I.lookup('narrow stance leg press').key, 'narrow stance leg press', 'narrow-stance leg press');
});

/* The hundred kettlebell movements, exactly as the list was supplied — including the
   hyphens, the possessives and the names with the equipment in the middle. */
const KB100 = `Two-Hand Kettlebell Swing|Single-Arm Kettlebell Swing|Alternating-Hand Swing|American Swing|Double Kettlebell Swing|Hand-to-Hand Swing|Suitcase Swing|Kneeling Swing|Single-Leg Swing|Sumo Swing|Single-Arm Clean|Double Kettlebell Clean|Alternating Clean|Hang Clean|Clean and Press|Clean and Jerk|Squat Clean|Tall Clean|Single-Arm Snatch|Double Kettlebell Snatch|Alternating Snatch|Hang Snatch|Snatch to Overhead Squat|Half Snatch|Snatch Balance|Single-Arm Overhead Press|Double Kettlebell Press|Push Press|Push Jerk|Bottoms-Up Press|Alternating Press|Z-Press|Floor Press|Half-Kneeling Press|Tall-Kneeling Press|Seated Press|Viking Press|Arnold-Style Kettlebell Press|Goblet Squat|Double Kettlebell Front Squat|Single-Arm Front Squat|Racked Squat|Sumo Squat|Overhead Squat|Pistol Squat|Cossack Squat|Zercher Squat|Pause Squat|Squat to Press|Single-Kettlebell Front Squat|Suitcase Squat|Box Squat with Kettlebell|Goblet Reverse Lunge|Racked Forward Lunge|Walking Lunge|Overhead Lunge|Suitcase Lunge|Lateral Lunge|Curtsy Lunge|Bulgarian Split Squat|Step-Up|Single-Leg Deadlift|Skater Squat with Kettlebell|Reverse Lunge to Press|Cossack Lunge|Two-Hand Deadlift|Single-Arm Deadlift|Sumo Deadlift|Single-Leg Romanian Deadlift|Double Kettlebell Deadlift|Suitcase Deadlift|Deficit Deadlift|Good Morning|Staggered-Stance Deadlift|Single-Arm Bent-Over Row|Double Kettlebell Row|Renegade Row|High Pull|Gorilla Row|Plank Row|Meadows-Style Row|Kneeling Single-Arm Row|Turkish Get-Up|Windmill|Halo|Russian Twist|Kettlebell Sit-Up|Plank Drag|Suitcase Carry|Farmer's Carry|Overhead Carry|Bottoms-Up Carry|Swing to Clean to Press|Clean and Squat|Figure-8|Figure-8 to Hold|Around-the-Body Pass|Thruster|Man Maker|Devil's Press`.split('|');

t('all one hundred kettlebell movements resolve', async () => {
  eq(KB100.length, 100, 'the list itself should be a hundred');
  const missing = KB100.filter(n => !I.lookup(n));
  eq(missing.length, 0, 'these found nothing: ' + missing.join(', '));
});

t('the hinge files to the hips however high the bell finishes', async () => {
  /* A judgement worth pinning: an American swing goes overhead but it is not shoulder work. */
  for (const q of ['two hand kettlebell swing', 'american swing', 'single leg swing',
                   'single arm clean', 'hang clean', 'suitcase deadlift'])
    eq(find(q), 'Legs/Glutes', q);
});

t('a snatch files to the shoulder that has to hold it', async () => {
  for (const q of ['single arm snatch', 'hang snatch', 'half snatch', 'snatch balance'])
    eq(find(q), 'Shoulders/Shoulders', q);
});

t('a complex belongs to no single muscle', async () => {
  /* Full is the Fitness page's whole-body bucket. It used to be labelled Mixed here, which
     that page has no bucket for — a row sent there is a row nobody sees. */
  for (const q of ['thruster', 'man maker', "devil's press", 'clean and squat', 'swing to clean to press'])
    eq(I.lookup(q).group, 'Full', q);
  ok(I.groups.includes('Full'), 'Full should be a declared group');
  ok(!I.groups.includes('Mixed'), 'Mixed renders nowhere and should not be offered');
});

t('a name with the equipment in the middle of it still resolves', async () => {
  /* The lookup matches consecutive words, so "Arnold-Style Kettlebell Press" cannot reach
     "arnold press" on its own — these go through the alias map instead. */
  eq(I.lookup('Arnold-Style Kettlebell Press').key, 'arnold press', 'arnold-style');
  eq(I.lookup('Meadows-Style Row').key, 'meadows row', 'meadows-style');
  eq(I.lookup('Box Squat with Kettlebell').key, 'box squat', 'box squat with kettlebell');
  eq(I.lookup('Skater Squat with Kettlebell').key, 'skater squat', 'skater squat with kettlebell');
});

t('the file has no repeated keys', async () => {
  /* A repeated key in an object literal is silently the last one, which is how a
     classification changes without anybody editing it. */
  const src = fs.readFileSync('./exercise-index.js', 'utf8');
  const keys = [...src.matchAll(/^ {4}'((?:[^'\\]|\\.)*)':/gm)].map(m => m[1]);
  const seen = {}, dupes = [];
  keys.forEach(k => { if (seen[k]) dupes.push(k); seen[k] = 1; });
  eq(dupes.join(','), '', 'duplicate keys');
  ok(keys.length > 380, 'the list should have grown, got ' + keys.length);
});

t('nothing that used to resolve stopped resolving', async () => {
  /* The normaliser was changed, which is the kind of change that quietly breaks the other
     257 entries. A spot check across every group. */
  const spot = {
    'bench press': 'Chest', 'deadlift': 'Back', 'overhead press': 'Shoulders',
    'lat pulldown': 'Back', 'hammer curl': 'Arms', 'romanian deadlift': 'Back',   // listed under Lower Back first, by the owner's own list
    'barbell curl': 'Arms', 'back squat': 'Legs', 'plank': 'Core',
    'treadmill run': 'Cardio', 'side plank': 'Core',
  };
  for (const q of Object.keys(spot)) {
    const h = I.lookup(q);
    ok(h, q + ' no longer resolves at all');
    eq(h.group, spot[q], q + ' changed group');
  }
});

t('neck work is not here, and does not need to be', async () => {
  /* The index has no Neck entries — the Forge's own Neck section carries ten, and
     _guessBodyPart consults the Forge before this list. Asserted so that a future reader does
     not take the absence for an oversight and file them twice. */
  eq(I.lookup('neck curl'), null, 'the index should not carry neck work');
  eq(I.lookup('neck harness extension'), null, 'nor this');
});

t('a word that is not an exercise stays not an exercise', async () => {
  for (const q of ['', 'kettle', 'seated', 'hello there', '10x16kg'])
    eq(I.lookup(q), null, JSON.stringify(q) + ' should not match anything');
});

let pass = 0, fail = 0;
for (const [n, f] of T) {
  try { await f(); console.log('  PASS  ' + n); pass++; }
  catch (e) { console.log('  FAIL  ' + n + '\n          ' + e.message); fail++; }
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
