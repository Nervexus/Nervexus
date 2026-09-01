/* Tests for the digest renderer: node digest-template.test.mjs
   The renderer is the part of the email system that can be checked without a database, a
   mail provider or a deploy, so it is checked properly. */
import { buildDigest, buildSubject, groupBySection, SECTIONS, THEMES } from './supabase/functions/_shared/digest-template.js';

const T=[]; const t=(n,f)=>T.push([n,f]);
const has=(s,sub,m)=>{ if(!String(s).includes(sub)) throw new Error((m||'')+' missing '+JSON.stringify(sub)+' in '+JSON.stringify(String(s).slice(0,200))); };
const not=(s,sub,m)=>{ if(String(s).includes(sub)) throw new Error((m||'')+' unexpectedly contains '+JSON.stringify(sub)); };

const sample = [
  { section:'performance', line:"Today's check-in is still pending — you have until 10pm.", subject:'Performance check-in pending', priority:'high' },
  { section:'tasks', line:'Cold shower, Read 20 pages — 2 missions pending.', priority:'normal' },
  { section:'tasks', line:'3 checklist items open on Weekly reset.', priority:'normal' },
  { section:'calendar', line:'Dentist at 15:00 tomorrow.', meta:'Fri 4 Sep', priority:'normal' },
  { section:'logs', line:'No training logged yet today.', priority:'normal' },
  { section:'update', line:'Nervexus v11.227 is live.', priority:'low' },
];

t('one email carries every section', ()=>{
  const d=buildDigest({ name:'Sam', items:sample });
  // Labels are HTML-escaped on the way in, so "Tasks & Missions" is "Tasks &amp; Missions".
  for(const label of ['Performance Terminal','Tasks &amp; Missions','Calendar','Logs','App Update'])
    has(d.html,label,'html:');
  if(d.count!==6) throw new Error('count '+d.count);
});

/* The whole point of the change: five concerns produce one message, not five. */
t('every item appears exactly once, in both parts', ()=>{
  const d=buildDigest({ name:'Sam', items:sample });
  for(const it of sample){
    has(d.text,it.line,'text:');
    const needle=it.line.replace(/&/g,'&amp;').replace(/'/g,'&#39;');
    has(d.html,needle,'html:');
    const n=d.text.split(it.line).length-1;
    if(n!==1) throw new Error('line repeated '+n+' times in text: '+it.line);
  }
});

/* The subject names the most urgent item rather than a count, so the inbox preview is
   worth reading. */
t('the subject leads with the most urgent item', ()=>{
  has(buildSubject('Sam', sample),'Performance check-in pending');
  has(buildSubject('Sam', sample),'+5 more');
  const one=buildSubject('Sam',[sample[1]]);
  not(one,'+','a single item should not advertise extras');
});

t('priority ordering does not depend on input order', ()=>{
  const shuffled=[sample[5],sample[3],sample[0],sample[1]];
  has(buildSubject('Sam',shuffled),'Performance check-in pending');
});

/* Sections render in a fixed order regardless of how the sweeps happened to collect them,
   so the email looks the same shape every day. */
t('sections keep a fixed order', ()=>{
  const g=groupBySection([sample[5],sample[3],sample[0]]).map(x=>x.key);
  if(JSON.stringify(g)!==JSON.stringify(['performance','calendar','update']))
    throw new Error('order '+JSON.stringify(g));
});

/* A caller typo must not silently drop somebody's reminder. */
t('an unknown section is surfaced, never swallowed', ()=>{
  const d=buildDigest({ name:'Sam', items:[{ section:'nonsense', line:'Something happened.', priority:'normal' }] });
  has(d.html,'Other'); has(d.text,'Something happened.');
});

/* Values come from a database and from user-entered names; an apostrophe in a mission
   title must not be able to close an attribute or inject a tag. */
t('user content is escaped in the html', ()=>{
  const d=buildDigest({ name:'Sam', items:[
    { section:'tasks', line:'<script>alert(1)</script> & "quoted"', priority:'normal' }] });
  not(d.html,'<script>','raw script tag reached the html');
  has(d.html,'&lt;script&gt;');
  has(d.html,'&amp;');
  has(d.text,'<script>alert(1)</script>','the plain-text part is not escaped, correctly');
});

/* Email clients are not browsers. Outlook drops these outright. */
t('the html uses no layout email clients cannot render', ()=>{
  const d=buildDigest({ name:'Sam', items:sample });
  for(const bad of ['display:flex','display:grid','<link','@media','position:absolute','var(--'])
    not(d.html,bad,'unsupported in email:');
});

t('nothing outstanding still renders sanely', ()=>{
  const d=buildDigest({ name:'Sam', items:[] });
  if(d.count!==0) throw new Error('count');
  has(d.subject,'Nothing outstanding');
});

t('an item with no line is dropped rather than rendered blank', ()=>{
  const d=buildDigest({ name:'Sam', items:[{ section:'tasks', line:'', priority:'normal' }, sample[1]] });
  if(d.count!==1) throw new Error('count '+d.count);
});

t('the signoff is appended once', ()=>{
  const d=buildDigest({ name:'Sam', items:sample, signoff:'\n\nBest,\nUltra X management team' });
  const n=d.text.split('Ultra X management team').length-1;
  if(n!==1) throw new Error('signoff appears '+n+' times');
  if(!d.text.trimEnd().endsWith('Ultra X management team')) throw new Error('signoff is not last');
});

t('every declared section has a label', ()=>{
  for(const s of SECTIONS) if(!s.key||!s.label) throw new Error('bad section '+JSON.stringify(s));
});

/* ---- themes ------------------------------------------------------------------------
   A theme changes colour and type only. The table structure is shared, so the email-client
   constraints are proved once for all of them rather than per theme — and a theme that
   tried to introduce, say, a media query would fail here. */
t('every theme renders the same content and breaks no client rules', ()=>{
  for(const name of Object.keys(THEMES)){
    const d=buildDigest({ name:'Sam', items:sample, theme:name });
    for(const it of sample){
      const needle=it.line.replace(/&/g,'&amp;').replace(/'/g,'&#39;');
      has(d.html,needle,name+':');
    }
    for(const bad of ['display:flex','display:grid','<link','@media','position:absolute','var(--','@font-face'])
      not(d.html,bad,name+' uses '+bad+', which email clients drop:');
    has(d.html,'role="presentation"',name+': layout must stay table-based —');
    if(/<style[\s>]/.test(d.html)) throw new Error(name+' has a <style> block; Gmail strips those');
  }
});

/* Dark themes have one failure mode worth pinning: a card with no explicit background
   inherits the client's own, which on a dark ground turns the text invisible. */
t('every theme paints its own background and ink', ()=>{
  for(const name of Object.keys(THEMES)){
    const th=THEMES[name];
    const d=buildDigest({ name:'Sam', items:sample, theme:name });
    has(d.html,'background:'+th.ground,name+': page ground not painted —');
    has(d.html,'background:'+th.card,name+': card ground not painted —');
    has(d.html,'color:'+th.ink,name+': ink not set —');
  }
});

t('an unknown theme name falls back rather than rendering unstyled', ()=>{
  const d=buildDigest({ name:'Sam', items:sample, theme:'does-not-exist' });
  has(d.html,'background:'+THEMES.editorial.ground);
});

t('the plain-text part is identical whatever the theme', ()=>{
  const a=buildDigest({ name:'Sam', items:sample, theme:'noir' }).text;
  const b=buildDigest({ name:'Sam', items:sample, theme:'terminal' }).text;
  if(a!==b) throw new Error('themes changed the plain-text part');
});

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
