/* Parked hand-training diagrams:  node forge-hand-figures.test.mjs

   Twenty drawings built for the hands section. The section was cleared back to a stub, so
   nothing loads this file at the moment — it is kept because the drawings are the expensive
   part and will be wanted the moment Hands & Forearms gets built. This test exists so they
   do not rot while parked: it checks they are still well-formed, self-contained and on the
   shared grid. The chart data that went with them is in git at fda6b4d. */
import F from './forge-hand-figures.js';

const TESTS=[]; const t=(n,f)=>TESTS.push([n,f]);

t('all twenty drawings are still here', () => {
  const n=Object.keys(F).length;
  if(n!==20) throw new Error('expected 20 drawings, found '+n);
});

t('each one is inner paths, not a whole document', () => {
  for(const [k,svg] of Object.entries(F)){
    if(typeof svg!=='string' || svg.length<40) throw new Error(k+' is not a drawing');
    if(/<svg|<\/svg>/.test(svg)) throw new Error(k+' should be inner shapes, not a whole svg element');
  }
});

t('nothing is fetched and nothing is hard-coded', () => {
  /* The whole reason these were drawn rather than sourced: no licence attached, nothing to
     load at runtime, and they take the ink colour of whatever card they sit in. */
  for(const [k,svg] of Object.entries(F)){
    if(/https?:|<image|xlink|url\(/.test(svg)) throw new Error(k+' pulls in something external');
    if(/fill="(?!currentColor|none)/.test(svg)) throw new Error(k+' hard-codes a fill');
    if(/stroke="(?!currentColor|none)/.test(svg)) throw new Error(k+' hard-codes a stroke');
  }
});

t('every drawing has enough in it to read as something', () => {
  for(const [k,svg] of Object.entries(F)){
    const shapes=(svg.match(/<(path|circle|rect|ellipse)\b/g)||[]).length;
    if(shapes<3) throw new Error(k+' has only '+shapes+' shapes — it will read as noise');
  }
});

let pass=0, fail=0;
for(const [n,f] of TESTS){ try{ f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
