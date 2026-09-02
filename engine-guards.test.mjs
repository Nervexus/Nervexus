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
  ['voice-assistant-engine.js','VoiceAssistant'],
  ['notification-engine.js','NotificationManager'],
  ['void-orb-engine.js','VoidOrb'],
  ['constellation-engine.js','ProviderConstellation'],
  ['providers-data.js','PROVIDERS_DATA'],
  ['exercise-index.js','EXERCISE_INDEX'],
  ['notif-engine.js','NotifEngine'],
  ['voice-engine.js','VoiceEngine'],
];
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
process.exit(bad ? 1 : 0);
