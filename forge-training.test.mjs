/* Training-centre section data:  node forge-training.test.mjs

   These check the things that make a section worth reading rather than the things that are
   merely present. A standard nobody can pass or fail, a muscle listed without saying what it
   moves, or grip work with no extension work in it are all failures here. */
import T from './forge-training.js';

const t=(n,f)=>TESTS.push([n,f]); const TESTS=[];
const hands = T.section('hands');

t('the training centre is built from sections, and hands is one', () => {
  if(!Array.isArray(T.SECTIONS) || !T.SECTIONS.length) throw new Error('no sections');
  if(!hands) throw new Error('hand training is missing');
  if(T.section('not-a-section')) throw new Error('an unknown key must return null, not a guess');
  const keys=T.SECTIONS.map(s=>s.key);
  if(new Set(keys).size!==keys.length) throw new Error('section keys must be unique');
});

t('the section says why it exists, at length', () => {
  if(!hands.why || hands.why.length<120) throw new Error('the rationale is too thin to be worth reading');
  if(!hands.name || !hands.tag) throw new Error('a section needs a name and a label');
});

t('all five kinds of grip are covered', () => {
  const names=hands.types.map(x=>x.name.toLowerCase());
  for(const k of ['crush','support','pinch','extension','wrist'])
    if(!names.some(n=>n.includes(k))) throw new Error('grip type missing: '+k);
  for(const x of hands.types){
    if(!x.what || !x.detail) throw new Error(x.name+' must say what it is and why it matters');
  }
});

t('every muscle named says what it actually moves', () => {
  if(hands.muscles.length<3) throw new Error('too few muscle groups to be a map of the hand');
  let n=0;
  for(const g of hands.muscles){
    if(!g.group) throw new Error('a muscle group with no heading');
    if(!g.items.length) throw new Error(g.group+' is empty');
    for(const m of g.items){
      n++;
      if(!m.name) throw new Error('unnamed muscle in '+g.group);
      if(!m.does || m.does.length<20) throw new Error(m.name+' is listed without saying what it does');
    }
  }
  if(n<12) throw new Error('only '+n+' muscles named — that is a gesture, not a map');
});

t('the intrinsics are covered, not just the forearm', () => {
  /* "Hand training" that only lists forearm flexors is forearm training. The muscles that
     make a hand thick live inside it. */
  const all=hands.muscles.flatMap(g=>g.items.map(m=>m.name.toLowerCase())).join(' | ');
  for(const m of ['thenar','hypothenar','interossei','lumbricals','adductor pollicis'])
    if(!all.includes(m)) throw new Error('intrinsic missing: '+m);
});

t('the extensors are named as well as the flexors', () => {
  const groups=hands.muscles.map(g=>g.group.toLowerCase()).join(' | ');
  if(!groups.includes('flexor')) throw new Error('no flexor group');
  if(!groups.includes('extensor')) throw new Error('no extensor group — the half that gets injured');
});

t('every standard is a number with four ordered tiers', () => {
  const ids=new Set();
  if(hands.standards.length<5) throw new Error('too few standards to measure a hand by');
  for(const s of hands.standards){
    if(ids.has(s.id)) throw new Error('duplicate standard id: '+s.id);
    ids.add(s.id);
    if(!s.name || !s.unit) throw new Error(s.id+' needs a name and a unit');
    if(!Array.isArray(s.tiers) || s.tiers.length!==T.TIERS.length)
      throw new Error(s.id+' must have exactly '+T.TIERS.length+' tiers');
    for(let i=1;i<s.tiers.length;i++)
      if(s.tiers[i]<s.tiers[i-1]) throw new Error(s.id+' tiers must not go backwards: '+s.tiers.join('/'));
    if(!s.how || s.how.length<20) throw new Error(s.id+' does not say how to test it, so nobody can');
  }
});

t('the standards cover more than one kind of grip', () => {
  /* Eight hang variations would be one test repeated. */
  const txt=hands.standards.map(s=>s.name.toLowerCase()).join(' | ');
  for(const k of ['hang','hold','pinch','gripper'])
    if(!txt.includes(k)) throw new Error('no standard for: '+k);
});

t('every exercise carries a dose and a cue', () => {
  if(hands.work.length<8) throw new Error('too little work to build a hand from');
  for(const w of hands.work){
    if(!w.name) throw new Error('unnamed exercise');
    if(!w.dose) throw new Error(w.name+' has no dose — frequency is the whole prescription');
    if(!w.cue || w.cue.length<20) throw new Error(w.name+' has no usable cue');
  }
});

t('extension work is prescribed, not just mentioned', () => {
  /* The single most common way grip training goes wrong. It has to be in the work, with a
     dose, not buried in a paragraph. */
  const ext=hands.work.find(w=>/extension/i.test(w.name));
  if(!ext) throw new Error('no finger extension exercise');
  if(!/daily/i.test(ext.dose)) throw new Error('extension work needs a frequency that matches the closing work');
  if(!ext.risk) throw new Error('the reason extension matters must be stated where the work is');
});

t('the work that hurts people carries a warning', () => {
  const risky=hands.work.filter(w=>w.risk);
  if(risky.length<2) throw new Error('grippers and levering both need loading notes');
  const g=hands.work.find(w=>/gripper/i.test(w.name));
  if(!g || !g.risk) throw new Error('gripper work must state it is not a daily max');
  for(const w of risky) if(w.risk.length<30) throw new Error(w.name+' has a warning too short to act on');
});

t('the rules state the tendon problem and the strap problem', () => {
  if(hands.rules.length<4) throw new Error('too few rules');
  for(const r of hands.rules){
    if(!r.rule || !r.why || r.why.length<30) throw new Error('a rule must say why, or it gets ignored');
  }
  const txt=hands.rules.map(r=>(r.rule+' '+r.why).toLowerCase()).join(' | ');
  if(!txt.includes('tendon')) throw new Error('nothing says tendon adapts slower than muscle');
  if(!txt.includes('strap')) throw new Error('nothing says what straps do to grip');
});

let pass=0, fail=0;
for(const [n,f] of TESTS){ try{ f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
