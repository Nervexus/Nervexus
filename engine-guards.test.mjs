/* Engine re-execution guards:  node engine-guards.test.mjs

   index.html keeps every engine <script> inside <helmet>, and the boot-time relocation of
   that block re-executes all of them. That double execution caused the v11.202 bug.

   Each engine must therefore (a) still define its global on the first run, and (b) be a
   no-op on the second — the same object, not a rebuilt one. Before the guards this test
   reported 0/8: every engine replaced its global on the second pass, so anything holding a
   reference to the first was talking to a discarded copy.

   The harness passes {} for document on purpose. Every engine still defines its global,
   which is what proves none of them need a real DOM at load time — and therefore that the
   FIRST execution was always the complete one and the second was only waste. */
import fs from 'fs';
const ENGINES = [
  // The eight originally identified as engines.
  ['voice-assistant-engine.js','VoiceAssistant'],
  ['notification-engine.js','NotificationManager'],
  ['void-orb-engine.js','VoidOrb'],
  ['constellation-engine.js','ProviderConstellation'],
  ['providers-data.js','PROVIDERS_DATA'],
  ['exercise-index.js','EXERCISE_INDEX'],
  ['notif-engine.js','NotifEngine'],
  ['voice-engine.js','VoiceEngine'],
  /* And the fifteen the first list missed. That list came from an earlier note rather than
     an audit of what index.html actually loads — which is why this test now derives its
     subjects from the page instead (see the completeness check at the bottom). */
  ['orb-engine.js','OrbEngine'],
  ['supabase-client.js','SB'],
  ['health-tracker.js','HealthKit'],
  ['anatomy-3d.js','NervexusAnatomy3D'],
  ['gentleman-blackbook.js','BLACKBOOK_DATA'],
  ['learning-english.js','LearningEnglish'],
  ['learning-gentleman.js','LearningGentleman'],
  ['learning-grammar.js','LearningGrammar'],
  ['learning-history.js','LearningHistory'],
  ['learning-maths.js','LearningMaths'],
  ['learning-money.js','LearningMoney'],
  ['learning-physiology.js','LearningPhysiology'],
  ['learning-science.js','LearningScience'],
  ['learning-speaking.js','LearningSpeaking'],
  // These two already carried guards; the list simply did not know about them.
  ['finance-import.js','FinanceImport'],
  ['ai-gateway.js','AIGateway'],
  // The Forge — training/mental/health standards data.
  ['forge-engine.js','Forge'],
  // The Training centre's section data.
  ['forge-training.js','ForgeTraining'],
  // The XP gain chip and its spark ring.
  ['xp-fx.js','XPFx'],
];

/* Two files are deliberately unguarded, and the completeness check below knows it:
     support.js       — generated framework runtime ("do not edit"), and it is the code that
                        performs the relocation; guarding it could break the mechanism.
     countries-data.js — a bare data assignment with no listeners or timers, so a second
                        run rewrites the same array and costs nothing but cycles. */
const EXEMPT = new Set(['support.js', 'countries-data.js']);
let bad = 0;
for (const [file, glob] of ENGINES) {
  const src = fs.readFileSync(new URL('./' + file, import.meta.url).pathname, 'utf8');
  const root = {};
  const run = () => { try { new Function('window','document','navigator','self', src)(root, {}, {}, root); return null; }
                      catch (e) { return e.message; } };
  const e1 = run();
  const first = root[glob];
  const e2 = run();
  const second = root[glob];

  const defined = first !== undefined;
  const sameObject = defined && first === second;   // second pass must not replace it
  const ok = !e1 && !e2 && defined && sameObject;
  if (!ok) bad++;
  console.log(
    (ok ? '  OK   ' : '  FAIL ') + file.padEnd(28) +
    'defines:' + (defined ? 'yes' : 'NO ') +
    '  identical after 2nd run:' + (sameObject ? 'yes' : 'NO ') +
    (e1 ? '  run1:' + e1 : '') + (e2 ? '  run2:' + e2 : ''));
}
console.log('\n' + (ENGINES.length - bad) + '/' + ENGINES.length + ' engines load once and no-op on re-execution');
/* The check that would have caught the incomplete list the first time: every local script
   index.html loads is either covered above or explicitly exempt. */
const html = fs.readFileSync(new URL('./index.html', import.meta.url).pathname, 'utf8');
const loaded = [...html.matchAll(/src="([a-z0-9./-]+\.js)(?:\?[^"]*)?"/g)]
  .map(m => m[1]).filter(p => !p.startsWith('vendor/') && !p.startsWith('http'))
  .map(p => p.replace(/^\.\//, ''));
const covered = new Set(ENGINES.map(e => e[0]));
const uncovered = [...new Set(loaded)].filter(p => !covered.has(p) && !EXEMPT.has(p));
if (uncovered.length) {
  console.log('\n  FAIL  index.html loads scripts this test does not cover: ' + uncovered.join(', '));
  process.exit(1);
}
console.log('completeness: all ' + new Set(loaded).size + ' local scripts are covered or exempt');

process.exit(bad ? 1 : 0);
