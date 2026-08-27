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
    say:t=>spoken.push(t), speak:t=>spoken.push(t), ack:t=>spoken.push(t), replaceLast:t=>{spoken[spoken.length-1]=t;},
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
      // stands in for exercise-index.js
      exerciseName:(n)=>({'on the stairmaster':'Stairmaster','hammer curls':'Hammer Curl','running':'Running','run':'Running','bench press':'Bench Press','cycling':'Cycling'}[String(n).toLowerCase()]||null),
      completeTask:(l)=>{ calls.push(['completeTask',l]); return /accountant/i.test(l)?'Call accountant':null; },
      completeMission:(n)=>{ calls.push(['completeMission',n]); return /cold/i.test(n)?'Cold shower':null; },
      waterToday:()=>({ml:1500, goalMl:2000}),
      latestWeight:()=>({kg:82, date:'2026-08-27'}),
      lastSleep:()=>({hours:7, minutes:30, date:'2026-08-27'}),
      foodLogged:()=>({count:2, kcal:1060, protein:70}),
      moneyToday:()=>({income:1200, expenses:40}),
      eventsOn:(d)=>d==='TOMORROW'?['Dentist at 15:00']:[],
      missionsLeft:()=>['Cold shower'],
      noteCount:()=>3,
      todayStr:()=>'TODAY', dateStrIn:(n)=>n===1?'TOMORROW':'TODAY',
    }
  };
}
const T=[]; const t=(n,f)=>T.push([n,f]);
const eq=(a,b,m)=>{ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' got '+JSON.stringify(a)+' want '+JSON.stringify(b)); };
const has=(s,sub,m)=>{ if(!String(s).toLowerCase().includes(sub.toLowerCase())) throw new Error((m||'')+' "'+s+'" lacks "'+sub+'"'); };
const call=(n)=>calls.find(c=>c[0]===n);
// Action rules speak twice — acknowledgement then confirmation — so assertions about
// the outcome read the LAST line, not the first.
const last=()=>spoken[spoken.length-1];

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
t('logs sets, reps and weight, under the canonical name', async()=>{ const h=host();
  await VA.handle('Log bench press 3 sets of 8 at 60 kilos',h);
  const c=call('logWorkout'); eq([c[1],c[4],c[5],c[3]],['Bench Press',3,8,60]); });
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

// ---- completion ----
t('ticks a task off', async()=>{ const h=host(); await VA.handle('Mark call the accountant as done',h);
  const c=call('completeTask'); has(c[1],'call the accountant'); has(last(),'ticked off'); });
t('an unknown task falls through instead of lying', async()=>{ const h=host(false);
  await VA.handle('Mark buy a yacht as done',h);
  has(last(),'didn’t catch that','a command she cannot fulfil is a miss, not a missing API key');
  if(/ticked off|provider|API/i.test(last())) throw new Error('claimed success or blamed the key: '+last()); });
t('completes a mission', async()=>{ const h=host(); await VA.handle('Complete my cold shower mission',h);
  has(last(),'Cold shower'); });

// ---- queries ----
t('water today with goal percentage', async()=>{ const h=host(); await VA.handle('How much water have I had?',h);
  has(spoken[0],'1500 ml'); has(spoken[0],'75%'); });
t('latest weight', async()=>{ const h=host(); await VA.handle('What is my weight?',h);
  has(spoken[0],'82 kg'); });
t('last night sleep', async()=>{ const h=host(); await VA.handle('How did I sleep?',h);
  has(spoken[0],'7 hours'); has(spoken[0],'30 min'); });
t('calories and protein, without claiming a day', async()=>{ const h=host(); await VA.handle('How many calories have I had?',h);
  has(spoken[0],'1060'); has(spoken[0],'70 g');
  if(/today/i.test(spoken[0])) throw new Error('meals have no date — must not claim a daily total'); });
t('spend today', async()=>{ const h=host(); await VA.handle('How much have I spent today?',h);
  has(spoken[0],'40'); has(spoken[0],'expenses'); });
t('earned today is not the same as spent', async()=>{ const h=host(); await VA.handle('How much have I earned today?',h);
  has(spoken[0],'1200'); has(spoken[0],'income'); });
t('agenda for tomorrow', async()=>{ const h=host(); await VA.handle('What is on tomorrow?',h);
  has(spoken[0],'Dentist'); });
t('agenda defaults to today', async()=>{ const h=host(); await VA.handle('What is on?',h);
  has(spoken[0],'Nothing in the calendar for today'); });
t('missions left', async()=>{ const h=host(); await VA.handle('What missions do I have left?',h);
  has(spoken[0],'1 mission'); has(spoken[0],'Cold shower'); });

// ---- filler tolerance ----
t('strips a wake word and politeness', async()=>{ const h=host();
  await VA.handle('Hey Nervexus, could you please log 500 ml of water for me, thanks',h);
  eq(call('logHydration'),['logHydration',500]); });
t('strips a bare please', async()=>{ const h=host();
  await VA.handle('Please open my fitness centre',h);
  eq(call('nav'),['nav','health']); });

// ---- a weight needs no preposition ----
t('"I did 100 kg bench press today" logs, it does not ask', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('I did 100 kg bench press today',h);
  const c=call('logWorkout'); if(!c) throw new Error('did not log: '+last());
  eq([c[1],c[3]],['Bench Press',100]);
  if(VA._pending()) throw new Error('asked for sets it already had'); });
t('bare weight in any position', async()=>{
  for(const say of ['log bench press 100kg','log 100 kg bench press','i did bench press 100 kilos']){
    const h=host(); VA._clearPending(); await VA.handle(say,h);
    const c=call('logWorkout'); if(!c) throw new Error('"'+say+'" did not log: '+last());
    eq(c[3],100,'weight from "'+say+'"'); } });
t('"today" is not part of the exercise name', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('I did 100 kg bench press today',h);
  if(/today/i.test(call('logWorkout')[1])) throw new Error('name kept "today": '+call('logWorkout')[1]); });
t('minutes are still minutes, not a weight', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('log 30 minutes of running',h);
  const c=call('logWorkout'); eq([c[2],c[3]],[30,0],'30 must be duration, weight zero'); });

// ---- asking instead of guessing ----
t('a verb dropped by a noisy room becomes a question, not a refusal', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('3 minutes run',h);
  has(last(),'Did you want me to log'); has(last(),'3 minutes of running');
  if(call('logWorkout')) throw new Error('wrote before asking'); });
t('yes completes it', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('3 minutes run',h); await VA.handle('yes',h);
  const c=call('logWorkout'); if(!c) throw new Error('not logged after yes: '+last());
  eq([c[1],c[2]],['Running',3]); });
t('no leaves it alone', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('3 minutes run',h); await VA.handle('no',h);
  if(call('logWorkout')) throw new Error('logged despite being told no');
  has(last(),'left it'); });
t('a phrase counts as yes', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('30 minutes cycling',h); await VA.handle('log it',h);
  if(!call('logWorkout')) throw new Error('"log it" was not taken as confirmation'); });
t('an exercise with no numbers asks for them, then completes', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('bench press',h);
  has(last(),'how many sets');
  if(call('logWorkout')) throw new Error('wrote before asking');
  await VA.handle('3 sets of 8 at 60 kilos',h);
  const c=call('logWorkout'); if(!c) throw new Error('not logged after the answer: '+last());
  eq([c[1],c[4],c[5],c[3]],['Bench Press',3,8,60]); });
t('a new command drops the pending question rather than swallowing it', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('30 minutes cycling',h);
  await VA.handle('What tasks do I have left?',h);
  has(last(),'task'); 
  if(call('logWorkout')) throw new Error('logged the abandoned proposal'); });
t('the question does not outlive one turn', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('30 minutes cycling',h);
  await VA.handle('What is the date?',h);
  await VA.handle('yes',h);
  if(call('logWorkout')) throw new Error('a stale question was still live'); });
t('noise proposes nothing', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('soil',h);
  has(last(),'didn’t catch that');
  if(VA._pending()) throw new Error('proposed something from noise'); });
t('a complete command never asks', async()=>{ const h=host();
  VA._clearPending(); await VA.handle('log 30 minutes of running',h);
  if(VA._pending()) throw new Error('asked when it did not need to');
  if(!call('logWorkout')) throw new Error('did not log'); });

// ---- the exercise index supplies the proper name ----
t('a known exercise is logged under its canonical name', async()=>{ const h=host();
  await VA.handle('log 3 sets of 12 hammer curls',h);
  eq(call('logWorkout')[1],'Hammer Curl','should not log the raw parse "Hammer curls"'); });
t('"on the stairmaster" logs as Stairmaster, not "On the stairmaster"', async()=>{ const h=host();
  await VA.handle('log 20 minutes on the stairmaster',h);
  eq(call('logWorkout')[1],'Stairmaster'); });
t('an exercise the index does not know keeps what was said', async()=>{ const h=host();
  await VA.handle('log 30 minutes of underwater basket weaving',h);
  eq(call('logWorkout')[1],'Underwater basket weaving'); });

// ---- every way of saying "record this" ----
t('all eighteen verb forms log a workout', async()=>{
  const forms=['log','logged','logging','add','added','record','recorded','put down','put in','put',
               'track','tracked','enter','mark','chuck in','stick in','i did','i just did'];
  for(const v of forms){ const h=host();
    await VA.handle(v+' 30 minutes of cycling',h);
    const c=call('logWorkout');
    if(!c) throw new Error('"'+v+'" did not log: '+last());
    eq([c[1],c[2]],['Cycling',30],'verb "'+v+'"'); } });
t('the broad verbs still decline when there is nothing to log', async()=>{
  for(const say of ['put the kettle on','did you see that','mark this as important']){
    const h=host(); await VA.handle(say,h);
    if(call('logWorkout')) throw new Error('"'+say+'" logged a workout'); } });
t('"note down 30 minutes of cycling" is a workout, not a memory', async()=>{ const h=host();
  await VA.handle('note down 30 minutes of cycling',h);
  const c=call('logWorkout'); if(!c) throw new Error('not logged: '+last());
  eq([c[1],c[2]],['Cycling',30]);
  if(call('addMemory')) throw new Error('stored it as a memory instead'); });
t('"note down my thoughts" keeps the fact clean and reads properly', async()=>{ const h=host();
  await VA.handle('note down my thoughts',h);
  eq(call('addMemory'),['addMemory','my thoughts'],'"down" must not end up in the fact');
  if(/remember that my thoughts/i.test(last())) throw new Error('ungrammatical reply: '+last()); });

// ---- every line from the 21:22 transcript, verbatim ----
t('"add 30 minutes of cycling to my fitness log"', async()=>{ const h=host();
  await VA.handle('add 30 minutes of cycling to my fitness log',h);
  const c=call('logWorkout'); if(!c) throw new Error('no tool called: '+last());
  eq([c[1],c[2]],['Cycling',30]); });
t('"Laura at 30 minutes of cycling to my fitness" — name, misheard add, bare destination', async()=>{ const h=host();
  await VA.handle('Laura at 30 minutes of cycling to my fitness',h);
  const c=call('logWorkout'); if(!c) throw new Error('no tool called: '+last());
  eq([c[1],c[2]],['Cycling',30]); });
t('"hello at 30 minutes of cycling to my fitness log"', async()=>{ const h=host();
  await VA.handle('hello at 30 minutes of cycling to my fitness log',h);
  const c=call('logWorkout'); if(!c) throw new Error('no tool called: '+last());
  eq([c[1],c[2]],['Cycling',30]); });
t('"to myfitness log" — recogniser ran the words together', async()=>{ const h=host();
  await VA.handle('add 30 minutes of cycling to myfitness log',h);
  const c=call('logWorkout'); eq([c[1],c[2]],['Cycling',30]); });
t('"soil" is still refused rather than guessed at', async()=>{ const h=host();
  await VA.handle('soil',h);
  if(call('logWorkout')) throw new Error('logged something from noise');
  has(last(),'didn’t catch that'); });
t('"add a task ..." still beats the workout rule', async()=>{ const h=host();
  await VA.handle('Add a task to call the accountant',h);
  eq(call('addTask'),['addTask','Call the accountant']);
  if(call('logWorkout')) throw new Error('workout rule stole a task'); });
t('"had chicken and rice at 600 calories" is still a meal, not an add', async()=>{ const h=host();
  await VA.handle('had chicken and rice at 600 calories',h);
  const c=call('logMeal'); if(!c) throw new Error('meal lost to the add normaliser: '+last());
  eq([c[1],c[2]],['Chicken and rice',600]); });

// ---- the recogniser mishears "log" constantly ----
t('the exact mishearing from the test run: "look 30 minutes of running"', async()=>{ const h=host();
  await VA.handle('hello can you look 30 minutes of running on my training log',h);
  const c=call('logWorkout'); if(!c) throw new Error('still not recognised: '+last());
  eq([c[1],c[2]],['Running',30]); });
t('"lock" and "logged" are corrected too', async()=>{ let h=host();
  await VA.handle('lock 500 ml of water',h); eq(call('logHydration'),['logHydration',500]);
  h=host(); await VA.handle('logged 30 minutes of running',h);
  const c=call('logWorkout'); eq([c[1],c[2]],['Running',30]); });
t('"look at my training log" stays a question, not a log command', async()=>{ const h=host(false);
  await VA.handle('look at my training log',h);
  if(call('logWorkout')) throw new Error('turned a question into a workout'); });

// ---- people name the destination as well as the thing ----
t('the exact sentence that produced "logged running on my training"', async()=>{ const h=host();
  await VA.handle('hello please can you log 30 minutes of running on my training',h);
  const c=call('logWorkout'); eq([c[1],c[2]],['Running',30],'exercise name must not absorb "on my training"');
  has(last(),'30 minutes of running'); has(last(),'fitness log');
  if(/on my training/i.test(last())) throw new Error('destination leaked into the reply: '+last()); });
t('reads a timed workout back as a sentence, not as fields', async()=>{ const h=host();
  await VA.handle('Log 30 minutes of running',h);
  has(last(),'I’ve logged 30 minutes of running'); });
t('reads sets and weight back naturally', async()=>{ const h=host();
  await VA.handle('Log bench press 3 sets of 8 at 60 kilos',h);
  has(last(),'Bench press'); has(last(),'3 sets of 8'); has(last(),'60 kg'); });
t('a task keeps its own words but drops the destination', async()=>{ const h=host();
  await VA.handle('Add a task to call the accountant to my list',h);
  eq(call('addTask'),['addTask','Call the accountant']); });
t('a mission drops the destination too', async()=>{ const h=host();
  await VA.handle('Add a mission called cold shower to my missions',h);
  eq(call('addMission'),['addMission','Cold shower']); });
t('"to" inside the task itself is not mistaken for a destination', async()=>{ const h=host();
  await VA.handle('Add a task to talk to the bank',h);
  eq(call('addTask'),['addTask','Talk to the bank']); });
t('an exercise that is only a destination phrase is refused, not logged empty', async()=>{ const h=host(false);
  await VA.handle('log 20 minutes to my log',h);
  if(call('logWorkout')) throw new Error('logged a workout with no exercise name'); });

// ---- acknowledge, then confirm ----
t('an action is acknowledged before it runs, then confirmed', async()=>{ const h=host();
  await VA.handle('Log 30 minutes of running',h);
  if(spoken.length!==2) throw new Error('expected ack + confirmation, got '+JSON.stringify(spoken));
  has(spoken[1],'I’ve logged'); has(spoken[1],'Running'); has(spoken[1],'30 min'); });
t('the acknowledgement comes first, before the tool is called', async()=>{ const h=host();
  const order=[]; const realAck=h.ack; h.ack=(t)=>{ order.push('ack'); realAck(t); };
  const realLog=h.tools.logWorkout; h.tools.logWorkout=(...a)=>{ order.push('log'); return realLog(...a); };
  await VA.handle('Log 30 minutes of running',h);
  eq(order,['ack','log']); });
t('a question is answered in one beat, not acknowledged first', async()=>{ const h=host();
  await VA.handle('How much water have I had?',h);
  if(spoken.length!==1) throw new Error('a query should not be acknowledged: '+JSON.stringify(spoken)); });
t('acknowledgements rotate rather than repeating', async()=>{ const h=host();
  await VA.handle('Log 500 ml of water',h); const first=spoken[0];
  await VA.handle('Log 500 ml of water',h); const second=spoken[2];
  if(first===second) throw new Error('same acknowledgement twice running: '+first); });

// ---- Loura ----
t('answers to her name', async()=>{ const h=host(); await VA.handle('What is your name?',h);
  has(spoken[0],'Loura'); has(spoken[0],'Sam'); });
t('her name works as a wake word', async()=>{ const h=host(); await VA.handle('Loura, log 500 ml of water',h);
  eq(call('logHydration'),['logHydration',500]); });
t('common mis-hearings of her name are stripped too', async()=>{ const h=host();
  await VA.handle('Laura log 500 ml of water',h);
  eq(call('logHydration'),['logHydration',500]); });

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
t('a real question with no key names the provider as the reason', async()=>{ const h=host(false);
  await VA.handle('Why do my knees hurt after squats?',h);
  has(last(),'AI provider'); });
t('a misheard command is not blamed on the missing key', async()=>{ const h=host(false);
  await VA.handle('flurgle the widget',h);
  has(last(),'didn’t catch that');
  if(/provider|API|key/i.test(last())) throw new Error('blamed the key for a parse miss: '+last()); });
t('unmatched utterance with a key goes to the model', async()=>{ const h=host(true,'Because of load.');
  await VA.handle('Why do my knees hurt after squats?',h);
  has(spoken.join(' '),'Because of load.'); });
t('local rules still run when a key IS connected', async()=>{ const h=host(true);
  await VA.handle('Log 500 ml of water',h);
  eq(call('logHydration'),['logHydration',500],'local must beat AI'); });
t('a throwing tool is reported, not swallowed', async()=>{ const h=host();
  h.tools.addTask=()=>{ throw new Error('database offline'); };
  await VA.handle('Add a task to call the accountant',h);
  has(last(),'database offline'); });

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
