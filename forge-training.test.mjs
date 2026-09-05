/* Training-centre section data:  node forge-training.test.mjs

   These check the things that make a chart worth following rather than the things that are
   merely present: an exercise with no dose, a figure that does not exist, or grip work with
   no extension work in it are all failures here. */
import T from './forge-training.js';
import F from './forge-hand-figures.js';

const TESTS=[]; const t=(n,f)=>TESTS.push([n,f]);
const hands = T.section('hands');

t('the training centre is built from sections, and hands is one', () => {
  if(!Array.isArray(T.SECTIONS) || !T.SECTIONS.length) throw new Error('no sections');
  if(!hands) throw new Error('hand training is missing');
  if(T.section('not-a-section')) throw new Error('an unknown key must return null, not a guess');
  const keys=T.SECTIONS.map(s=>s.key);
  if(new Set(keys).size!==keys.length) throw new Error('section keys must be unique');
  if(!hands.name || !hands.tag) throw new Error('a section needs a name and a label');
});

t('all twelve sections are listed, in order, and only hands has content', () => {
  const want = ['Chest','Shoulders','Arms','Back','Core','Hips & Glutes','Quads',
                'Hamstrings','Calves','Feet & Ankles','Neck','Hand Training'];
  const got = T.SECTIONS.map(x=>x.name);
  if(got.join(' | ')!==want.join(' | ')) throw new Error('section list is wrong:\n  got  '+got.join(', '));
  for(const x of T.SECTIONS){
    if(!x.key || !x.name) throw new Error('a section with no key or name');
    if(!x.tag) throw new Error(x.name+' has no label');
  }
  const full = T.SECTIONS.filter(x=>x.work && x.work.length).map(x=>x.name);
  if(full.join()!=='Hand Training') throw new Error('only Hand Training should have content yet, got: '+full.join(', '));
});

t('an empty section carries nothing that would half-render', () => {
  /* A stub with a stray empty array reads as "built but broken" rather than "not started".
     Nothing there is the point. */
  for(const x of T.SECTIONS){
    if(x.work && x.work.length) continue;
    for(const k of ['work','tools','types','muscles','standards','rules'])
      if(x[k]!==undefined) throw new Error(x.name+' carries an empty '+k+' — leave it off entirely');
  }
});

t('every exercise has a figure that actually exists', () => {
  /* A missing figure renders an empty box and throws nothing, so the chart would look
     half-built and nothing would say why. */
  for(const w of hands.work){
    if(!w.fig) throw new Error(w.name+' has no figure');
    if(!F[w.fig]) throw new Error(w.name+' points at a figure that does not exist: '+w.fig);
  }
});

t('no figure is drawn and then left unused', () => {
  const used=new Set(hands.work.map(w=>w.fig));
  const spare=Object.keys(F).filter(k=>!used.has(k));
  if(spare.length) throw new Error('figures drawn but never shown: '+spare.join(', '));
});

t('every figure is drawn on the shared grid, in one style', () => {
  for(const [k,svg] of Object.entries(F)){
    if(typeof svg!=='string' || svg.length<40) throw new Error(k+' is not a drawing');
    if(/<svg|<\/svg>/.test(svg)) throw new Error(k+' should be inner paths, not a whole svg element');
    if(/https?:|<image|xlink/.test(svg)) throw new Error(k+' pulls in something external — everything here must be drawn, not fetched');
    if(/fill="(?!currentColor|none)/.test(svg)) throw new Error(k+' uses a hard-coded fill; it must take the ink colour of its card');
    if(/stroke="(?!currentColor|none)/.test(svg)) throw new Error(k+' uses a hard-coded stroke');
  }
});

t('every exercise carries a dose and a cue', () => {
  if(hands.work.length<15) throw new Error('too short to be a chart');
  for(const w of hands.work){
    if(!w.name) throw new Error('unnamed exercise');
    if(!w.dose) throw new Error(w.name+' has no dose — frequency is the whole prescription');
    if(!/x|·|daily|weekly|min|s\b/i.test(w.dose)) throw new Error(w.name+' dose is not specific: '+w.dose);
    if(!w.cue || w.cue.length<25) throw new Error(w.name+' has no usable cue');
  }
});

t('the chart is graded, and it is mostly hard', () => {
  const by={}; hands.work.forEach(w=>{ by[w.level]=(by[w.level]||0)+1; });
  for(const w of hands.work)
    if(!T.LEVELS.includes(w.level)) throw new Error(w.name+' has no valid level: '+w.level);
  if(!by.easy) throw new Error('nothing easy — there has to be a way in');
  const hardish=(by.hard||0)+(by.brutal||0);
  if(hardish<=(by.easy||0)) throw new Error('this is meant to be mostly hard: '+JSON.stringify(by));
});

t('the kettlebell finger curl is in, and says which way is the work', () => {
  const kb=hands.work.find(w=>/kettlebell finger curl/i.test(w.name));
  if(!kb) throw new Error('kettlebell finger curls missing');
  if(kb.level!=='hard') throw new Error('it is not an easy exercise');
  if(!/lower|slow/i.test(kb.cue)) throw new Error('the cue must say the lowering half is the work');
});

t('extension work is prescribed daily, not mentioned in passing', () => {
  const ext=hands.work.find(w=>/extension/i.test(w.name));
  if(!ext) throw new Error('no finger extension exercise');
  if(!/daily/i.test(ext.dose)) throw new Error('extension needs a frequency matching the closing work');
  if(!ext.risk) throw new Error('the reason it matters must sit where the work is');
});

t('the work that hurts people carries a warning long enough to act on', () => {
  const risky=hands.work.filter(w=>w.risk);
  if(risky.length<3) throw new Error('grippers, levering and edge hangs all need loading notes');
  for(const w of risky) if(w.risk.length<40) throw new Error(w.name+' has a warning too short to act on');
  const edge=hands.work.find(w=>/edge hang/i.test(w.name));
  if(!edge || !/pulley|month/i.test(edge.risk)) throw new Error('edge hangs must state what tears and how long it costs');
});

t('every tool says what it does, what it costs and whether it is needed', () => {
  if(hands.tools.length<8) throw new Error('too few tools to build a hand with');
  const needs=new Set(['essential','useful','optional']);
  for(const x of hands.tools){
    if(!x.name) throw new Error('unnamed tool');
    if(!x.cost) throw new Error(x.name+' has no cost — that is what makes a kit list real');
    if(!needs.has(x.need)) throw new Error(x.name+' is not graded essential/useful/optional');
    if(!x.does || x.does.length<25) throw new Error(x.name+' does not say what it is for');
  }
  if(!hands.tools.some(x=>x.need==='essential')) throw new Error('nothing is marked essential');
  if(hands.tools.filter(x=>x.need==='essential').length>4) throw new Error('if most of it is essential, none of it is');
});

t('the essential kit is the cheap kit', () => {
  /* A list that says you need three hundred pounds of equipment to train your hands is
     wrong, and people stop reading at that point. */
  const money=(c)=>{ const m=/£(\d+)/.exec(c||''); return m?+m[1]:0; };
  const essential=hands.tools.filter(x=>x.need==='essential').reduce((a,x)=>a+money(x.cost),0);
  if(essential>100) throw new Error('the essentials come to £'+essential+' — too much to call essential');
});

let pass=0, fail=0;
for(const [n,f] of TESTS){ try{ f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
