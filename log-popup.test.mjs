/* The ten-minutes-after-the-performance-log popup:  node log-popup.test.mjs

   Pulls the real _checkLogAllPopup body out of index.html and runs it against fixtures, so
   the gate is executed rather than read. A popup that fires at the wrong moment is the kind
   of bug you only find by annoying the person using it. */
import fs from 'fs';
const src = fs.readFileSync(new URL('./index.html', import.meta.url).pathname,'utf8');
// Brace-match the method body rather than guessing at an indent pattern.
const a = src.indexOf('_checkLogAllPopup(){');
let i = src.indexOf('{', a), depth = 0, end = -1;
for (let j = i; j < src.length; j++) {
  if (src[j] === '{') depth++;
  else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
}
const body = src.slice(i + 1, end);
const fn = new Function('return function(){' + body + '}')();

const TODAY = '2026-09-02';
function ctx(o){
  const opened = { yes:false };
  const self = {
    state: Object.assign({ logAllOpen:false, perfCheckinOpen:false, whatsNewOpen:false, searchOpen:false,
                           perfLogs:[{date:TODAY}], prefs:{ _perfLoggedAt: Date.now()-11*60000 } }, o),
    _todayStr:()=>TODAY,
    _logKinds:()=>o.__allDone ? [{done:true}] : [{done:false},{done:true}],
    mut(f){ Object.assign(this.state, f(this.state)); },
    openLogAll(){ opened.yes = true; },
  };
  return { self, opened };
}
const cases = [
  ['fires ten minutes after the performance log', {}, true],
  ['not before ten minutes', { prefs:{ _perfLoggedAt: Date.now()-9*60000 } }, false],
  ['not if the performance log is not done', { perfLogs:[] }, false],
  ['not if the performance log was another day', { perfLogs:[{date:'2026-09-01'}] }, false],
  ['not twice in one day', { prefs:{ _perfLoggedAt: Date.now()-11*60000, _logAllPopupDate: TODAY } }, false],
  ['not if every log is already filled in', { __allDone:true }, false],
  ['not on top of the check-in modal', { perfCheckinOpen:true }, false],
  ['not on top of the whats-new modal', { whatsNewOpen:true }, false],
  ['not while the panel is already open', { logAllOpen:true }, false],
  ['not if no timestamp was ever recorded', { prefs:{} }, false],
];
let bad=0;
for (const [name, over, expect] of cases){
  const { self, opened } = ctx(over);
  fn.call(self);
  const ok = opened.yes === expect;
  if(!ok) bad++;
  console.log((ok?'  PASS  ':'  FAIL  ')+name+(ok?'':'  (expected '+expect+', got '+opened.yes+')'));
}
// and the stamp that stops it repeating
const { self, opened } = ctx({});
fn.call(self);
if(self.state.prefs._logAllPopupDate !== TODAY){ console.log('  FAIL  firing did not stamp the date'); bad++; }
else console.log('  PASS  firing stamps the date, so dismissing it does not bring it back');
console.log('\n'+(cases.length+1-bad)+'/'+(cases.length+1)+' popup gate cases correct');
process.exit(bad?1:0);
