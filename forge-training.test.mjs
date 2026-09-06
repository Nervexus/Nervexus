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

/* Every section that has been filled in so far, and the body part its exercises log
   against. A section is added here the moment it gets a pool. */
const FILLED = [
  ['chest','Chest', {all:12}],
  ['shoulders','Shoulders', {all:16}],
  ['arms','Arms', {all:25}],
];

t('each filled section carries the lists it is meant to', () => {
  for(const [key, part, want] of FILLED){
    const c = T.section(key);
    if(!c) throw new Error('no section called '+key);
    if(!c.pool) throw new Error(key+' has no exercise pool');
    const got=Object.keys(c.pool).sort().join(',');
    if(got !== Object.keys(want).sort().join(',')) throw new Error(key+' has lists '+got);
    for(const k of Object.keys(want))
      if(c.pool[k].length !== want[k]) throw new Error(key+'/'+k+': expected '+want[k]+', got '+c.pool[k].length);
    if(c.part !== part) throw new Error(key+' must log against '+part+', not '+c.part);
  }
});

t('a range runs the right way round', () => {
  /* The block shows the low end and offers the range as the target, so a max below the min
     would print backwards and start the user above their own top of range. */
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)) for(const x of sec.pool[where]){
      if(x.setsMax!=null && x.setsMax < x.sets) throw new Error(x.name+': sets range runs backwards');
      if(x.repsMax!=null && x.repsMax < x.reps) throw new Error(x.name+': reps range runs backwards');
    }
  }
});

t('a filled section logs against a body part the log knows', () => {
  /* addPoolToSession falls back to "Full" for anything outside this list, so a typo here
     would quietly send every set of that section to the wrong place. */
  const PARTS = ['Chest','Back','Shoulders','Arms','Legs','Core','Cardio'];
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    if(PARTS.indexOf(sec.part) < 0) throw new Error(sec.name+' logs against "'+sec.part+'", which the training log does not have');
  }
});

t('every pooled exercise can actually be logged', () => {
  /* The training log silently drops an entry with no reps, minutes or distance, so an
     exercise without one would add to the session, tick, and record nothing. */
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)){
      for(const x of sec.pool[where]){
        if(!x.name) throw new Error('unnamed exercise in '+sec.name+'/'+where);
        if(!(x.reps>0 || x.minutes>0)) throw new Error(sec.name+'/'+where+': '+x.name+' has nothing to log');
        if(!(x.sets>0)) throw new Error(sec.name+'/'+where+': '+x.name+' has no sets');
      }
    }
  }
});

t('no exercise is listed twice', () => {
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    const all=[].concat(...Object.keys(sec.pool).map(k=>sec.pool[k])).map(x=>x.name.toLowerCase());
    if(new Set(all).size!==all.length) throw new Error(sec.name+' repeats an exercise');
  }
});

t('no home list needs a gym', () => {
  /* Half a gym list is useless at home; the home pool is the one you fall back on. */
  for(const sec of T.SECTIONS){
    if(!sec.pool || !sec.pool.home) continue;
    const home=sec.pool.home.map(x=>x.name.toLowerCase()).join(' | ');
    for(const kit of ['barbell','cable','machine','smith','pec deck','landmine'])
      if(home.includes(kit)) throw new Error(sec.name+"'s home list needs a "+kit);
  }
});

t('no exercise name appears in two sections', () => {
  /* A landmine press was on both the Chest and the Shoulders list. The session can tell two
     of them apart by body part now, but a name on two lists is still a name on two lists —
     the same movement described twice, and a second chance to disagree about its numbers.
     One list keeps it and the other gets its own movement. */
  const seen={};
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)){
      for(const x of sec.pool[where]){
        const k=x.name.toLowerCase();
        if(seen[k] && seen[k]!==sec.name) throw new Error('"'+x.name+'" is on both the '+seen[k]+' and '+sec.name+' lists');
        seen[k]=sec.name;
      }
    }
  }
});

t('every unit is one the page and the log both know', () => {
  /* The training log records reps, minutes and a distance. Anything measured in another unit
     has to name it, so the page can label it and the session can convert — otherwise metres
     or seconds land in the log as a rep count, which they are not. */
  const KNOWN = ['sec', 'm', 'climb'];
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)) for(const x of sec.pool[where]){
      if(x.unit && KNOWN.indexOf(x.unit)<0) throw new Error(x.name+': unknown unit '+x.unit);
    }
  }
});

t('a section is either grouped throughout or not grouped at all', () => {
  /* Half a section carrying groups would render one labelled block and then a headless one. */
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)){
      const list=sec.pool[where];
      const withGroup=list.filter(x=>x.group).length;
      if(withGroup && withGroup!==list.length)
        throw new Error(sec.name+'/'+where+': '+withGroup+' of '+list.length+' carry a group');
    }
  }
});

t('a group is contiguous — it does not come back later', () => {
  /* The page draws a heading the first time it sees a group. A group split in two would get
     two headings with the same name. */
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)){
      const seq=sec.pool[where].map(x=>x.group||'').filter((g,i,a)=>i===0||a[i-1]!==g);
      if(new Set(seq).size!==seq.length) throw new Error(sec.name+'/'+where+': a group is split up');
    }
  }
});

t('work in another unit still lands in the log as something', () => {
  /* Seconds become minutes across the sets, metres become a distance, a climb is a rep. Each
     has to come out greater than zero — an exercise that converts to nothing adds to the
     session, ticks, and records silence. */
  for(const sec of T.SECTIONS){
    if(!sec.pool) continue;
    for(const where of Object.keys(sec.pool)) for(const x of sec.pool[where]){
      if(!x.unit) continue;
      if(!(x.reps>0)) throw new Error(x.name+' is measured in '+x.unit+' but carries no amount');
      if(x.unit==='sec'){
        const mins=Math.max(1, Math.round((x.sets||1)*x.reps/60));
        if(!(mins>0)) throw new Error(x.name+' converts to no time at all');
      }
    }
  }
});

t('no section carries an empty container', () => {
  /* A stub with work:[] reads as built-and-broken rather than not-started, and the page
     would draw a level filter and a tools panel for a chart that does not exist. */
  for(const x of T.SECTIONS){
    if(x.pool || x.work) continue;
    for(const k of ['work','tools','pool','types','muscles','standards','rules'])
      if(x[k]!==undefined) throw new Error(x.name+' carries an empty '+k+' — leave it off entirely');
  }
});

t('there is a level vocabulary ready for the first chart', () => {
  if(!Array.isArray(T.LEVELS) || T.LEVELS.length<2) throw new Error('LEVELS is missing');
  for(const l of T.LEVELS) if(typeof l!=='string') throw new Error('bad level: '+l);
});

let pass=0, fail=0;
for(const [n,f] of TESTS){ try{ f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
