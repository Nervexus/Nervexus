/* The Forge:  node forge-engine.test.mjs
   No install, like the rest of this repo.

   Two jobs. The scoring maths, because a wrong tier is silently wrong — it still renders,
   it is just a lie about how strong someone is. And the data itself, because content is
   where typos hide: a standard with no tiers, tiers out of order, a lowerIsBetter flag on
   a standard where more is obviously better. */
import fs from 'fs';
const root={}; new Function('window', fs.readFileSync(new URL('./forge-engine.js', import.meta.url),'utf8'))(root);
const F=root.Forge;

const T=[]; const t=(n,f)=>T.push([n,f]);
const eq=(a,b,m)=>{ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' got '+JSON.stringify(a)+' want '+JSON.stringify(b)); };
const ALL=[...F.REGIONS, ...F.MENTAL];
const STANDARDS=ALL.flatMap(g=>g.standards);

// ---- shape ----------------------------------------------------------------------------
t('every centre the brief asked for is present', ()=>{
  const want=['head','neck','shoulders','chest','abs','back','upper-legs','lower-legs','feet','hands'];
  eq(F.REGIONS.map(r=>r.key), want, 'training regions:');
  const mental=['focus','memory','creativity','motivation','discipline','addiction'];
  eq(F.MENTAL.map(m=>m.key), mental, 'mental domains:');
});

t('every region and domain explains why it is there and what to do', ()=>{
  for(const g of ALL){
    if(!g.why || g.why.length < 40) throw new Error(g.name+' has no real rationale');
    const items=g.work||g.drills;
    if(!items || items.length < 3) throw new Error(g.name+' has fewer than 3 things to actually do');
    for(const w of items){
      if(!w.name) throw new Error(g.name+': an item with no name');
      if(!w.dose) throw new Error(g.name+' / '+w.name+': no dose — "do some" is not a programme');
      if(!(w.cue||w.how)) throw new Error(g.name+' / '+w.name+': no cue');
    }
  }
});

// ---- standards ------------------------------------------------------------------------
t('every standard is measurable and its tiers are ordered', ()=>{
  const seen=new Set();
  for(const st of STANDARDS){
    if(!st.id) throw new Error('standard with no id: '+st.name);
    if(seen.has(st.id)) throw new Error('duplicate standard id: '+st.id);
    seen.add(st.id);
    if(!st.unit) throw new Error(st.id+' has no unit — it cannot be measured');
    if(!Array.isArray(st.tiers) || st.tiers.length!==4) throw new Error(st.id+' needs exactly 4 tiers');
    for(let i=1;i<4;i++){
      const asc = st.tiers[i] >= st.tiers[i-1];
      const ok = st.lowerIsBetter ? !asc || st.tiers[i]===st.tiers[i-1] : asc;
      if(!ok) throw new Error(st.id+' tiers are out of order for its direction: '+JSON.stringify(st.tiers));
    }
  }
});

/* The flag that would silently invert a whole standard. Anything measured in reps, kg,
   seconds or minutes is better when higher — if one of those is marked lowerIsBetter it is
   a typo, and the score would quietly reward being worse. */
t('lowerIsBetter is only on standards where less really is better', ()=>{
  const higherUnits=/rep|kg|second|minute|cm|%|item|digit|idea|count|day/i;
  const legit=new Set(['zero-days','start-lag']);
  for(const st of STANDARDS){
    if(st.lowerIsBetter && !legit.has(st.id)) throw new Error(st.id+' claims lower is better — is that right?');
    if(!st.lowerIsBetter && legit.has(st.id)) throw new Error(st.id+' lost its lowerIsBetter flag');
    if(st.lowerIsBetter && !higherUnits.test(st.unit)) throw new Error(st.id+' odd unit for an inverted standard');
  }
});

// ---- tierOf ----------------------------------------------------------------------------
t('tierOf returns the highest tier actually met', ()=>{
  const st={ tiers:[10,20,30,40] };
  eq(F.tierOf(st, 5), 0, 'below baseline:');
  eq(F.tierOf(st, 10), 1, 'exactly baseline:');
  eq(F.tierOf(st, 25), 2, 'between:');
  eq(F.tierOf(st, 40), 4, 'exactly unit:');
  eq(F.tierOf(st, 999), 4, 'above unit:');
  eq(F.tierOf(st, null), 0, 'unmeasured:');
  eq(F.tierOf(st, NaN), 0, 'not a number:');
});

t('tierOf inverts for standards where lower is better', ()=>{
  const st={ tiers:[120,60,30,15], lowerIsBetter:true };
  eq(F.tierOf(st, 200), 0, 'worse than baseline:');
  eq(F.tierOf(st, 120), 1, 'baseline:');
  eq(F.tierOf(st, 45), 2, 'between:');
  eq(F.tierOf(st, 15), 4, 'unit:');
  eq(F.tierOf(st, 5), 4, 'better than unit:');
});

// ---- unitScore --------------------------------------------------------------------------
/* An unmeasured standard must not read as a failed one. Otherwise the score starts near
   zero and falls every time a new standard is added, which punishes the programme for
   getting more complete. */
t('unmeasured standards are ignored, not counted as zero', ()=>{
  const one=F.unitScore({ pullups: 35 });
  eq(one.assessed, 1, 'assessed count:');
  eq(one.score, 100, 'a single Unit-level score is 100%, not 1/48th of it:');
  if(one.total < 40) throw new Error('total should count every standard');
});

t('unitScore averages tiers and names the tier', ()=>{
  const s=F.unitScore({ pullups: 8, bench: 75 });   // both exactly Baseline
  eq(s.score, 25, 'two baselines:');
  eq(s.tier, 'Baseline', 'tier name:');
  const u=F.unitScore({ pullups: 35, bench: 175 }); // both Unit
  eq(u.score, 100, 'two units:');
  eq(u.tier, 'Unit', 'tier name:');
});

t('an empty assessment scores zero without crashing', ()=>{
  const s=F.unitScore({});
  eq(s.score, 0); eq(s.assessed, 0); eq(s.tier, 'Baseline');
  eq(F.unitScore(null).score, 0, 'null:');
  eq(F.unitScore(undefined).score, 0, 'undefined:');
});

// ---- weakest ----------------------------------------------------------------------------
t('weakest names the lowest tiers first, and only measured ones', ()=>{
  const w=F.weakest({ pullups: 35, deadhang: 30, 'deep-block': 25, bench: 175 }, 3);
  if(w.length!==3) throw new Error('expected 3, got '+w.length);
  if(w[0].tier > w[1].tier || w[1].tier > w[2].tier) throw new Error('not sorted weakest-first');
  for(const x of w) if(!x.area || !x.group || !x.name) throw new Error('weakest entry missing labels');
  if(F.weakest({}, 5).length) throw new Error('unmeasured standards leaked into weakest');
});

// ---- health ------------------------------------------------------------------------------
/* The evidence grade is the whole point of the health page. A lever with no grade would
   read as authoritative as sleep. */
t('every testosterone lever is graded, and the grading is honest', ()=>{
  const ok=new Set(['strong','moderate','weak']);
  for(const l of F.T_LEVERS){
    if(!ok.has(l.evidence)) throw new Error(l.name+' has no valid evidence grade');
    if(!l.detail || l.detail.length < 40) throw new Error(l.name+' has no explanation');
  }
  const sleep=F.T_LEVERS.find(l=>/sleep/i.test(l.name));
  if(!sleep || sleep.evidence!=='strong') throw new Error('sleep must be graded strong');
  const supps=F.T_LEVERS.find(l=>/supplement/i.test(l.name));
  if(!supps || supps.evidence!=='weak') throw new Error('T-booster supplements must be graded weak, not omitted');
  // strongest evidence first, so the list reads in order of what actually matters
  const order={strong:0,moderate:1,weak:2};
  const grades=F.T_LEVERS.map(l=>order[l.evidence]);
  for(let i=1;i<grades.length;i++) if(grades[i]<grades[i-1]) throw new Error('levers are not ordered by evidence');
});

t('every food says what it costs and what it gives', ()=>{
  for(const f of F.FOODS){
    if(!/£/.test(f.per)) throw new Error(f.name+' has no price — cost is the point');
    if(!f.gives) throw new Error(f.name+' does not say what it provides');
  }
  if(F.FOODS.length < 10) throw new Error('too few foods to build a week from');
});

/* Harsh is fine. Reckless is not — the two places people actually get hurt must carry
   loading information, not just enthusiasm. */
t('the genuinely risky work carries a warning', ()=>{
  const neck=F.REGIONS.find(r=>r.key==='neck');
  if(!neck.work.some(w=>w.risk && /isometric/i.test(w.risk))) throw new Error('neck work must state isometrics come first');
  const cold=F.MENTAL.find(m=>m.key==='discipline').drills.find(d=>/cold/i.test(d.name));
  if(!cold.risk) throw new Error('cold exposure needs its warning');
  const addiction=F.MENTAL.find(m=>m.key==='addiction');
  if(!addiction.drills.some(d=>d.risk && /withdrawal/i.test(d.risk))) throw new Error('withdrawal danger must be stated');
});

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
