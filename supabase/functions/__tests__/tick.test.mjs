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
  for(const need of ['Cold shower','new version is live','last opened Nervexus'])
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
  if(!/missed check-in/i.test(email.sends[0].subject)) throw new Error('subject did not lead with the urgent item: '+email.sends[0].subject);
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

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
