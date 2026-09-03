/* Drives the REAL reminder-tick logic (transpiled) against a fake database.
   node tick.test.mjs */
import { makeAdmin } from './stub-supabase.mjs';
import * as email from './stub-email.mjs';
import * as push from './stub-push.mjs';
const { sweepUser } = await import('./tick.built.mjs');

const T=[]; const t=(n,f)=>T.push([n,f]);
const reset=()=>{ email.sends.length=0; push.pushes.length=0; email.setNextResult({ok:true}); };
const UID='u1';
const today=new Date().toISOString().slice(0,10);
/* The function resolves the current version from the live site; the test asks the same
   source, so it cannot drift from what the code will actually see. */
const LATEST=await (async()=>{ try{ const r=await fetch('https://nervexus.vercel.app/?v='+Date.now());
  const m=/NOTIF_BUILD_VERSION\s*=\s*'[^']*?(v\d+\.\d+)/.exec(await r.text()); return m?m[1]:'v11.227'; }
  catch{ return 'v11.227'; } })();

function baseTables(extra={}){
  return Object.assign({
    missions:[{id:'m1',user_id:UID,name:'Cold shower',status:'active',deleted_at:null,recurring:true,last_completed:null},
              {id:'m2',user_id:UID,name:'Read 20 pages',status:'active',deleted_at:null,recurring:true,last_completed:null}],
    user_checklists:[], checklist_items:[], events:[], notifications:[],
    performance_status:[], performance_holidays:[], performance_logs:[],
    profiles:[{id:UID,last_login_date:today}],
  }, extra);
}
const prefs={ reminderEmailEnabled:true, reminderEmailAddr:'me@example.com', pushEnabled:true, notifsEnabled:true, timezone:'Europe/London' };

/* The headline requirement: several outstanding things produce ONE email. */
t('four outstanding concerns produce exactly one email', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    events:[{id:'e1',user_id:UID,title:'Dentist',event_date:today,event_time:'15:00',repeat_days:null,deleted_at:null}],
    profiles:[{id:UID,last_login_date:'2020-01-01'}],
  }));
  const r=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'old'});
  if(email.sends.length!==1) throw new Error('expected 1 email, got '+email.sends.length+': '+email.sends.map(s=>s.subject).join(' | '));
  if(r.collected<2) throw new Error('expected several items collected, got '+r.collected);
  const body=email.sends[0].text;
  // The tasks line is a count now, not a list of names — the owner's copy asks for
  // "you have {n} tasks pending", so the mission names are deliberately gone.
  for(const need of ['tasks pending','new version is live','last opened Nervexus'])
    if(!body.includes(need)) throw new Error('digest missing '+JSON.stringify(need)+'\n'+body);
});

/* Failure must not burn the dedupe keys — the bug that made one outage permanent. */
t('a rejected send does not mark anything as sent', async()=>{
  reset(); email.setNextResult({ok:false,error:'Resend rejected (403): domain not verified'});
  const admin=makeAdmin(baseTables({ profiles:[{id:UID,last_login_date:'2020-01-01'}] }));
  const r=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'old'});
  if(r.emails!==0) throw new Error('reported an email it did not send');
  if(!r.emailError || !r.emailError.includes('403')) throw new Error('the reason was swallowed: '+r.emailError);
  const sentRows=admin._inserted.filter(x=>x.status==='sent'&&(x.channels||[]).includes('email'));
  if(sentRows.length) throw new Error('burned '+sentRows.length+' dedupe key(s) on a failed send');
  const failRow=admin._inserted.find(x=>x.source_type==='digest-email-error');
  if(!failRow) throw new Error('the failure was not recorded anywhere the user can see it');

  // And the retry: same data, working provider -> it sends.
  reset();
  const r2=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'old'});
  if(r2.emails!==1) throw new Error('the retry after a failure did not send');
});

/* Once it HAS sent, the same unchanged state must not send again. */
t('a successful send is not repeated while nothing changes', async()=>{
  reset();
  const admin=makeAdmin(baseTables({ profiles:[{id:UID,last_login_date:'2020-01-01'}] }));
  await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'old'});
  if(email.sends.length!==1) throw new Error('setup: '+email.sends.length);
  reset();
  await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'old'});
  if(email.sends.length!==0) throw new Error('sent the same digest twice');
});

/* A deadline must not wait for the 4-hour cadence. */
t('a high-priority item forces the digest out immediately', async()=>{
  reset();
  // Quiet on every front except the tasks list, so only a NORMAL-priority item is pending.
  const quiet={...prefs, lastSeenVersion:LATEST};
  const admin=makeAdmin(baseTables({
    // A digest-email row from one minute ago: the cadence would normally hold everything.
    notifications:[{user_id:UID,source_type:'digest-email',created_at:new Date(Date.now()-60000).toISOString(),dedupe_key:'x'}],
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
  }));
  const r1=await sweepUser(admin,UID,'Sam',quiet);
  if(email.sends.length!==0) throw new Error('normal-priority items ignored the cadence');
  if(r1.held!=='cadence') throw new Error('expected a cadence hold, got '+JSON.stringify(r1.held));

  // Now make yesterday a miss, which produces a high-priority performance warning.
  reset();
  const y=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const admin2=makeAdmin(baseTables({
    notifications:[{user_id:UID,source_type:'digest-email',created_at:new Date(Date.now()-60000).toISOString(),dedupe_key:'x'}],
    performance_status:[{user_id:UID,miss_streak:2,banned:false,last_eval_date:y}],
  }));
  await sweepUser(admin2,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  if(email.sends.length!==1) throw new Error('a high-priority warning was batched past its deadline');
  if(!/strike/i.test(email.sends[0].subject)) throw new Error('subject did not lead with the urgent item: '+email.sends[0].subject);
});

/* Email off must mean email off, without disabling push. */
t('push still fires when email is switched off', async()=>{
  reset();
  const admin=makeAdmin(baseTables());
  await sweepUser(admin,UID,'Sam',{...prefs, reminderEmailEnabled:false, lastSeenVersion:LATEST});
  if(email.sends.length!==0) throw new Error('emailed a user who turned email off');
  if(push.pushes.length!==1) throw new Error('push should be unaffected, got '+push.pushes.length);
});

/* An HTML part is included by default, and deliberately dropped when the user has written
   their own template — their wording is the point. */
t('html is sent by default and withheld when a custom template is set', async()=>{
  reset();
  const admin=makeAdmin(baseTables());
  await sweepUser(admin,UID,'Sam',prefs);
  if(!email.sends[0].html) throw new Error('no html part');
  if(!email.sends[0].html.includes('NERVEXUS')) throw new Error('html is not the digest');
  reset();
  const admin2=makeAdmin(baseTables());
  await sweepUser(admin2,UID,'Sam',{...prefs, emailTemplateBody:'CUSTOM: {{message}}'});
  if(email.sends[0].html) throw new Error('custom template should not also send designed html');
  if(!email.sends[0].text.startsWith('CUSTOM:')) throw new Error('custom template ignored: '+email.sends[0].text.slice(0,60));
});

t('nothing outstanding sends nothing', async()=>{
  reset();
  const admin=makeAdmin(baseTables({ missions:[],
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}] }));
  const r=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  if(email.sends.length!==0) throw new Error('sent an empty digest');
  if(r.collected!==0) throw new Error('collected '+r.collected);
});

/* ---- the rewritten copy -------------------------------------------------------------
   Checks the wording actually reaches the email, and that the numbers inside it are the
   right numbers — a template with the wrong count in it is worse than no template. */
t('the tasks line counts missions and checklist items as one total', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    user_checklists:[{id:'c1',user_id:UID,title:'Weekly reset',completed_at:null}],
    checklist_items:[{id:'i1',checklist_id:'c1',done:false},{id:'i2',checklist_id:'c1',done:false}],
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
  }));
  await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  const body=email.sends[0].text;
  // 2 missions + 2 checklist items = 4, in one sentence, not two sections.
  if(!/You have 4 tasks pending, awaiting completion/.test(body))
    throw new Error('tasks copy or count wrong:\n'+body);
  if(!/hours? left until the day ends/.test(body)) throw new Error('missing the hours-left line');
  if(/checklist item/i.test(body)) throw new Error('checklists are still a separate line');
});

t('the greeting follows the time of day, not the server clock', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
  }));
  await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  const first=email.sends[0].text.split('\n')[0];
  if(!/^Good (morning|afternoon|evening) Sam,$/.test(first))
    throw new Error('greeting is not time-aware: '+JSON.stringify(first));
});

t('every email closes the same way', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
  }));
  await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  if(!/Ultra X [Mm]anagement team\s*$/.test(email.sends[0].text.trimEnd()))
    throw new Error('sign-off missing or not last');
});

/* The Logs sweep names only what is genuinely missing. Listing a log you already filled in
   is how a reminder email teaches you to ignore it. */
t('the logs line names only the logs actually missing', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    missions:[],
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
    sleep_logs:[{id:'s1',user_id:UID,log_date:today}],
    hydration_logs:[{id:'h1',user_id:UID,log_date:today}],
  }));
  const r=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  const ukMin=(()=>{ const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
    const [h,m]=f.split(':').map(Number); return h*60+m; })();
  if(ukMin < 21*60){ if(r.logs!==0) throw new Error('logs fired before 21:00 UK'); return; }
  const body=email.sends[0].text;
  if(/Sleep & energy/.test(body)) throw new Error('named a log that was already filled in');
  if(/Hydration/.test(body)) throw new Error('named a log that was already filled in');
  if(!/Training/.test(body)) throw new Error('did not name Training, which is missing');
  if(!/Body metrics/.test(body)) throw new Error('did not name Body metrics, which is missing');
});

/* The bug this replaced: 'log_date' was assumed on every table, but workouts and expenses
   are stamped with an occurred_at timestamp. A workout logged today has to count. */
t('a workout logged today counts, despite being a timestamp not a date', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    missions:[],
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
    workouts:[{id:'w1',user_id:UID,occurred_at:today+'T18:30:00.000Z'}],
  }));
  const r=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:LATEST});
  if(r.logs===0) return; // before 21:00 UK, nothing to assert
  if(/Training/.test(email.sends[0].text))
    throw new Error('a workout logged today was still reported as missing');
});

/* ---- calendar wording ---------------------------------------------------------------
   The heads-up is about TOMORROW and goes out in the 21:00 local slot, so the fixture has
   to be a tomorrow-dated event and a timezone where it is currently evening. Rather than
   skip when the clock is wrong, the test finds a zone where it is right — there is always
   one, and a test that quietly skips is a test that stops testing. */
function eveningTz(){
  const zones=['Pacific/Kiritimati','Pacific/Auckland','Australia/Sydney','Asia/Tokyo','Asia/Shanghai',
    'Asia/Bangkok','Asia/Dhaka','Asia/Karachi','Asia/Dubai','Europe/Moscow','Europe/Athens','Europe/Paris',
    'Europe/London','Atlantic/Azores','America/Noronha','America/Sao_Paulo','America/New_York',
    'America/Chicago','America/Denver','America/Los_Angeles','America/Anchorage','Pacific/Honolulu','Pacific/Midway'];
  for(const tz of zones){
    const h=+new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hour12:false}).format(new Date());
    if(h>=21 && h<=22) return tz;
  }
  throw new Error('no timezone is currently in the 21:00-22:00 send window');
}
const TZ_EVENING=eveningTz();
const tomorrowUTC=new Date(Date.now()+86400000).toISOString().slice(0,10);
function tomorrowEvent(extra){
  return Object.assign({ id:'e1', user_id:UID, title:'Client review',
    event_date:tomorrowUTC, event_time:'09:00', repeat_days:null, deleted_at:null, kind:'general' }, extra||{});
}
const calTables=(ev)=>baseTables({ missions:[], events:[ev],
  performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
  performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
  workouts:[{id:'w',user_id:UID,occurred_at:today+'T10:00:00.000Z'}],
  expenses:[{id:'x',user_id:UID,occurred_at:today+'T10:00:00.000Z'}],
  sleep_logs:[{id:'s',user_id:UID,log_date:today}],
  hydration_logs:[{id:'h',user_id:UID,log_date:today}],
  body_metrics:[{id:'b',user_id:UID,log_date:today}] });
const calPrefs=()=>({...prefs, timezone:TZ_EVENING, lastSeenVersion:LATEST});
async function calLine(ev){
  reset();
  const admin=makeAdmin(calTables(ev));
  const r=await sweepUser(admin,UID,'Sam',calPrefs());
  if(!email.sends.length) throw new Error('no email sent: '+JSON.stringify(r));
  return email.sends[0].text;
}

t('a work event reads with its end time and who is there', async()=>{
  const body=await calLine(tomorrowEvent({ kind:'work', end_time:'17:00', attendees:'Dan and Priya' }));
  if(!body.includes('from 09:00 till 17:00')) throw new Error('no time range:\n'+body);
  if(!body.includes('with Dan and Priya')) throw new Error('no attendees:\n'+body);
  if(/set for yourself to do/.test(body)) throw new Error('used the general wording for a work event');
});

t('a general task reads with its rough duration', async()=>{
  const body=await calLine(tomorrowEvent({ kind:'general', est_minutes:90 }));
  if(!/set for yourself to do/.test(body)) throw new Error('not the general wording:\n'+body);
  // 90 minutes must not be read out as "90 minutes".
  if(!/an hour and 30 minutes/.test(body)) throw new Error('duration not spoken naturally:\n'+body);
  if(/till/.test(body)) throw new Error('a general task got a time range');
});

/* The failure this whole schema change exists to avoid: a work event with nothing else
   filled in must not print "till undefined with undefined". */
t('a work event with no end time or attendees says only what is known', async()=>{
  const body=await calLine(tomorrowEvent({ kind:'work' }));
  if(/undefined|null/.test(body)) throw new Error('leaked an empty field:\n'+body);
  if(!body.includes('at 09:00')) throw new Error('lost the start time:\n'+body);
});

/* Every event created before these columns existed has no kind at all. */
t('an event with no kind is treated as general, not broken', async()=>{
  const ev=tomorrowEvent({}); delete ev.kind;
  const body=await calLine(ev);
  if(!/set for yourself to do/.test(body)) throw new Error('legacy event did not read as general:\n'+body);
  if(/undefined/.test(body)) throw new Error('legacy event leaked undefined:\n'+body);
});

/* The bug this replaced: the email window was measured against TODAY's occurrence, so
   "24 hours ahead" could only ever land in a 15-minute sliver after midnight. An event
   tomorrow has to produce an email today. */
t('an event tomorrow produces the heads-up today', async()=>{
  const body=await calLine(tomorrowEvent({}));
  if(!/For tomorrow you have Client review/.test(body)) throw new Error('no heads-up:\n'+body);
});

t('an event that is not tomorrow produces no heads-up', async()=>{
  reset();
  const far=tomorrowEvent({ event_date:new Date(Date.now()+5*86400000).toISOString().slice(0,10) });
  const admin=makeAdmin(calTables(far));
  const r=await sweepUser(admin,UID,'Sam',calPrefs());
  if(email.sends.length) throw new Error('emailed about an event five days out:\n'+email.sends[0].text);
  if(r.collected!==0) throw new Error('collected something: '+r.collected);
});

/* A live run addressed the digest "Hey Mr" — firstName() took the first word of the
   account name, which was the title. This is the regression guard. */
t('a title is never used as the name', async()=>{
  for(const [full, expect] of [['Mr Sam Whitfield','Sam'], ['Dr. Sam','Sam'], ['Sam','Sam'],
                               ['Mr','__none__'], ['Mr.','__none__'], ['','__none__']]) {
    reset();
    const admin=makeAdmin(baseTables({
      performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
      performance_logs:[{user_id:UID,log_date:today,id:'p1'}] }));
    await sweepUser(admin,UID,full,{...prefs, lastSeenVersion:LATEST});
    const first=email.sends[0].text.split('\n')[0];
    if(expect==='__none__'){
      if(!/^Good (morning|afternoon|evening),$/.test(first))
        throw new Error(JSON.stringify(full)+' greeted with a title: '+JSON.stringify(first));
    } else {
      if(!first.endsWith(expect+',')) throw new Error(JSON.stringify(full)+' -> '+JSON.stringify(first));
      if(/\b(Mr|Mrs|Dr)\b/.test(first)) throw new Error('title leaked: '+first);
    }
  }
});

/* ---- release notes must not be an email on their own ---------------------------------
   Reported from the live app: an unexpected afternoon email that turned out to be
   "Nervexus v11.235 is out". The version note fires whenever the live version string
   changes, so every deploy sent one — two in a day, and more on a busy day. It is marked
   'low' precisely so it rides along with something worth interrupting for. */
t('a release note alone does not send an email', async()=>{
  reset();
  const admin=makeAdmin(baseTables({ missions:[],
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}],
    workouts:[{id:'w',user_id:UID,occurred_at:today+'T10:00:00.000Z'}],
    expenses:[{id:'x',user_id:UID,occurred_at:today+'T10:00:00.000Z'}],
    sleep_logs:[{id:'s',user_id:UID,log_date:today}],
    hydration_logs:[{id:'h',user_id:UID,log_date:today}],
    meals:[{id:'m',user_id:UID,logged_date:today}],
    body_metrics:[{id:'b',user_id:UID,log_date:today}],
    activities:[{id:'a',user_id:UID,occurred_at:today+'T10:00:00.000Z'}] }));
  const r=await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'older'});
  if(email.sends.length) throw new Error('emailed a release note on its own:\n'+email.sends[0].text);
  if(r.held!=='low-priority only') throw new Error('expected a low-priority hold, got '+JSON.stringify(r.held));
  // and it must not be thrown away — no dedupe key burned, so it can ride along later
  const burned=admin._inserted.filter(x=>x.source_type==='version');
  if(burned.length) throw new Error('the release note was marked sent without being sent');
});

t('a release note rides along with real content', async()=>{
  reset();
  const admin=makeAdmin(baseTables({
    performance_status:[{user_id:UID,miss_streak:0,banned:false,last_eval_date:today}],
    performance_logs:[{user_id:UID,log_date:today,id:'p1'}] }));
  await sweepUser(admin,UID,'Sam',{...prefs, lastSeenVersion:'older'});
  if(!email.sends.length) throw new Error('nothing sent when there were real tasks pending');
  const body=email.sends[0].text;
  if(!/tasks pending/.test(body)) throw new Error('missing the tasks line');
  if(!/new version is live/.test(body)) throw new Error('the release note did not ride along:\n'+body);
});

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
