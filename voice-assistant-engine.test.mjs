/* Standalone test suite for voice-assistant-engine.js. No framework, no install:
     node voice-assistant-engine.test.mjs
   Exits non-zero on failure.

   The engine takes everything through an injected host, so every rule can be driven
   here with a fake one and asserted on the tool calls it produced — no browser, no
   speech, no provider. Rule ORDER is the fragile part (first match wins), so the
   cases below deliberately include utterances that more than one rule could claim. */
import fs from 'fs';
const root={}; new Function('window', fs.readFileSync(new URL('./voice-assistant-engine.js', import.meta.url),'utf8'))(root);
const VA=root.VoiceAssistant;

let calls, spoken;
function host(hasAI=false, aiReply='AI says hi'){
  calls=[]; spoken=[];
  const rec=(n)=>(...a)=>{ calls.push([n,...a]); return undefined; };
  return {
    firstName:()=>'Sam',
    say:t=>spoken.push(t), speak:t=>spoken.push(t), replaceLast:t=>{spoken[spoken.length-1]=t;},
    hasAI:()=>hasAI,
    ask:async()=>({text:aiReply}),
    tools:{
      nav:rec('nav'), addTask:rec('addTask'), addMission:rec('addMission'), addMemory:rec('addMemory'),
      scheduleEvent:(t,w)=>{calls.push(['scheduleEvent',t,w]); return {date:'Fri 4 Sep', time:'15:00'};},
      openTasks:()=>{calls.push(['openTasks']); return ['Call accountant','Renew insurance'];},
      doneToday:()=>{calls.push(['doneToday']); return {tasks:['Email Dan'], missions:['Cold shower']};},
      trainingToday:()=>{calls.push(['trainingToday']); return ['Bench press'];},
      logWorkout:rec('logWorkout'), logHydration:rec('logHydration'), logWeight:rec('logWeight'),
      logSleep:rec('logSleep'), logMeal:rec('logMeal'), addNote:rec('addNote'),
      logIncome:rec('logIncome'), logExpense:rec('logExpense'), disableAssistant:rec('disableAssistant'),
    }
  };
}
const T=[]; const t=(n,f)=>T.push([n,f]);
const eq=(a,b,m)=>{ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' got '+JSON.stringify(a)+' want '+JSON.stringify(b)); };
const has=(s,sub,m)=>{ if(!String(s).toLowerCase().includes(sub.toLowerCase())) throw new Error((m||'')+' "'+s+'" lacks "'+sub+'"'); };
const call=(n)=>calls.find(c=>c[0]===n);

// ---- LOCAL tier: no provider connected at all ----
t('opens a page', async()=>{ const h=host(); await VA.handle('Open my fitness centre',h);
  eq(call('nav'),['nav','health']); });
t('adds a task', async()=>{ const h=host(); await VA.handle('Add a task to call the accountant',h);
  eq(call('addTask'),['addTask','Call the accountant']); });
t('reads back open tasks', async()=>{ const h=host(); await VA.handle('What tasks do I have left?',h);
  has(spoken[0],'2 tasks'); has(spoken[0],'Call accountant'); });
t('reports what is done today', async()=>{ const h=host(); await VA.handle('What have I done today?',h);
  has(spoken[0],'1 task'); has(spoken[0],'Cold shower'); });
t('reports training', async()=>{ const h=host(); await VA.handle('What did I train today?',h);
  has(spoken[0],'Bench press'); });
t('adds a mission', async()=>{ const h=host(); await VA.handle('Add a mission called cold shower',h);
  eq(call('addMission'),['addMission','Cold shower']); });
t('remembers a fact', async()=>{ const h=host(); await VA.handle('Remember that my gym closes at ten',h);
  eq(call('addMemory'),['addMemory','my gym closes at ten']); });
t('schedules an event', async()=>{ const h=host(); await VA.handle('Schedule a dentist appointment on Friday at 3pm',h);
  const c=call('scheduleEvent'); if(!c) throw new Error('not scheduled'); has(c[1],'dentist'); });
t('logs a timed workout', async()=>{ const h=host(); await VA.handle('Log 30 minutes of running',h);
  const c=call('logWorkout'); eq([c[1],c[2]],['Running',30]); });
t('logs sets, reps and weight', async()=>{ const h=host(); await VA.handle('Log bench press 3 sets of 8 at 60 kilos',h);
  const c=call('logWorkout'); eq([c[1],c[4],c[5],c[3]],['Bench press',3,8,60]); });
t('handles spoken numbers', async()=>{ const h=host(); await VA.handle('Log twenty minutes of cycling',h);
  const c=call('logWorkout'); eq([c[1],c[2]],['Cycling',20]); });
t('logs water in ml', async()=>{ const h=host(); await VA.handle('Log 500 ml of water',h);
  eq(call('logHydration'),['logHydration',500]); });
t('converts litres and glasses', async()=>{ const h=host(); await VA.handle('Log 2 litres of water',h);
  eq(call('logHydration'),['logHydration',2000]); });
t('logs body weight', async()=>{ const h=host(); await VA.handle('Log my weight at 82 kilos',h);
  eq(call('logWeight'),['logWeight',82]); });
t('logs sleep', async()=>{ const h=host(); await VA.handle('Log 7 hours 30 minutes of sleep',h);
  eq(call('logSleep'),['logSleep',7,30]); });
t('logs a meal with calories', async()=>{ const h=host(); await VA.handle('Log chicken and rice at 600 calories',h);
  const c=call('logMeal'); eq([c[1],c[2]],['Chicken and rice',600]); });
t('logs an expense', async()=>{ const h=host(); await VA.handle('Log an expense of 40 for fuel',h);
  const c=call('logExpense'); eq([c[1],c[2]],['Fuel',40]); });
t('logs income', async()=>{ const h=host(); await VA.handle('Log income of 1200 from consulting',h);
  const c=call('logIncome'); eq([c[1],c[2]],['Consulting',1200]); });
t('saves a note', async()=>{ const h=host(); await VA.handle('Make a note called ideas - buy the domain',h);
  const c=call('addNote'); eq(c[1],'Ideas'); });
t('tells the date', async()=>{ const h=host(); await VA.handle('What is the date?',h);
  if(!spoken[0].startsWith('It’s')) throw new Error(spoken[0]); });
t('turns itself off', async()=>{ const h=host(); await VA.handle('That will be all',h);
  if(!call('disableAssistant')) throw new Error('did not disable'); });

// ---- rule ordering: utterances more than one rule could claim ----
t('"log 30 minutes of running" is a workout, not a meal', async()=>{ const h=host();
  await VA.handle('Log 30 minutes of running',h);
  if(call('logMeal')) throw new Error('meal rule stole a workout'); });
t('"log an expense of 40 for fuel" is money, not a meal', async()=>{ const h=host();
  await VA.handle('Log an expense of 40 for fuel',h);
  if(call('logMeal')) throw new Error('meal rule stole an expense'); });
t('"log 500 ml of water" is hydration, not a workout', async()=>{ const h=host();
  await VA.handle('Log 500 ml of water',h);
  if(call('logWorkout')) throw new Error('workout rule stole water'); });
t('"open the pod bay doors" is not a page and falls through', async()=>{ const h=host();
  await VA.handle('Open the pod bay doors',h);
  if(call('nav')) throw new Error('navigated somewhere invented'); });

// ---- AI tier ----
t('unmatched utterance with no key explains itself and does not throw', async()=>{ const h=host(false);
  await VA.handle('Why do my knees hurt after squats?',h);
  has(spoken[0],'AI centre'); has(spoken[0],'still log'); });
t('unmatched utterance with a key goes to the model', async()=>{ const h=host(true,'Because of load.');
  await VA.handle('Why do my knees hurt after squats?',h);
  has(spoken.join(' '),'Because of load.'); });
t('local rules still run when a key IS connected', async()=>{ const h=host(true);
  await VA.handle('Log 500 ml of water',h);
  eq(call('logHydration'),['logHydration',500],'local must beat AI'); });
t('a throwing tool is reported, not swallowed', async()=>{ const h=host();
  h.tools.addTask=()=>{ throw new Error('database offline'); };
  await VA.handle('Add a task to call the accountant',h);
  has(spoken[0],'database offline'); });

// ---- manifest ----
t('manifest declares both tiers with needsKey set', async()=>{
  const m=VA.manifest();
  if(!m.local.length || !m.ai.length) throw new Error('empty manifest');
  if(m.local.some(x=>x.needsKey)) throw new Error('a local task claims it needs a key');
  if(m.ai.some(x=>!x.needsKey)) throw new Error('an AI task claims it does not need a key');
  if(m.local.some(x=>!x.example)) throw new Error('a local task has no example');
});

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
