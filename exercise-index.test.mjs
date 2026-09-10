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
