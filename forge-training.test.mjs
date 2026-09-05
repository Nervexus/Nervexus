/* Training-centre sections:  node forge-training.test.mjs

   Twelve sections, none of them filled in yet. These check the list and the shape of a stub —
   the content tests come back with the first section that has content. */
import T from './forge-training.js';

const TESTS=[]; const t=(n,f)=>TESTS.push([n,f]);

t('all thirteen sections are listed, in order', () => {
  const want = ['Chest','Shoulders','Arms','Back','Core','Hips & Glutes','Quads',
                'Hamstrings','Calves','Feet & Ankles','Neck','Hands & Forearms','Full Body'];
  const got = T.SECTIONS.map(x=>x.name);
  if(got.join(' | ')!==want.join(' | '))
    throw new Error('section list is wrong:\n  got  '+got.join(', ')+'\n  want '+want.join(', '));
});

t('every section has a key, a name and a label, and the keys are unique', () => {
  for(const x of T.SECTIONS){
    if(!x.key || !x.name || !x.tag) throw new Error('incomplete section: '+JSON.stringify(x));
    if(x.tag!==x.name.toUpperCase()) throw new Error(x.name+' label does not match its name');
  }
  const keys=T.SECTIONS.map(x=>x.key);
  if(new Set(keys).size!==keys.length) throw new Error('duplicate section keys');
});

t('a section can be found by key, and an unknown key returns null', () => {
  for(const x of T.SECTIONS)
    if(T.section(x.key)!==x) throw new Error(x.key+' is not findable');
  if(T.section('not-a-section')) throw new Error('an unknown key must return null, not a guess');
});

t('no section carries an empty container', () => {
  /* A stub with work:[] reads as built-and-broken rather than not-started, and the page
     would draw a level filter and a tools panel for a chart that does not exist. */
  for(const x of T.SECTIONS)
    for(const k of ['work','tools','types','muscles','standards','rules'])
      if(x[k]!==undefined) throw new Error(x.name+' carries an empty '+k+' — leave it off entirely');
});

t('there is a level vocabulary ready for the first chart', () => {
  if(!Array.isArray(T.LEVELS) || T.LEVELS.length<2) throw new Error('LEVELS is missing');
  for(const l of T.LEVELS) if(typeof l!=='string') throw new Error('bad level: '+l);
});

let pass=0, fail=0;
for(const [n,f] of TESTS){ try{ f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
