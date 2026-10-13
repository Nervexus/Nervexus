/* Standalone test suite for ai-gateway.js. No framework, no install:
     node ai-gateway.test.mjs
   Exits non-zero on failure. The gateway takes all its state through injected
   accessors, so every routing rule can be exercised here against a fake host
   without a browser, Supabase, or a real provider key. */
import fs from 'fs';
const root={};
new Function('window', fs.readFileSync('/home/user/Nervexus/ai-gateway.js','utf8'))(root);
const G=root.AIGateway;

const PROVS=[{id:'anthropic',name:'Claude'},{id:'google',name:'Gemini',live:true},{id:'openai',name:'OpenAI'}];
let calls=[]; let seen=[];
function host(o={}){
  const cfg=o.cfg||{anthropic:{saved:1,on:true},google:{saved:1,on:true},openai:{saved:1,on:true}};
  return {
    providers:()=>PROVS, cfg:(id)=>cfg[id]||{}, model:(id)=>id+'-m',
    routing:()=>o.routing||{}, defaultId:()=>o.def||'', backupId:()=>o.bk||'',
    failover:()=>o.failover!==false, online:()=>o.online!==false,
    call:(id,p,m,img)=>{ calls.push(id); seen.push({id, prompt:p, image:img||null}); const f=(o.fail||[]).includes(id);
      return Promise.resolve(f?{error:'boom '+id}:{result:'ok from '+id}); },
    stream:o.stream===false?null:((id,p,onD,m)=>{ calls.push('s:'+id);
      if((o.fail||[]).includes(id)) return Promise.resolve({error:'boom '+id});
      onD('chunk '); return Promise.resolve({result:'ok from '+id}); })
  };
}
const T=[]; const t=(n,f)=>T.push([n,f]);
const eq=(a,b,m)=>{ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||'')+' got '+JSON.stringify(a)+' want '+JSON.stringify(b)); };

t('role routing wins over default', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({routing:{briefings:'openai'}, def:'anthropic'}));
  const r=await G.ask('briefings','hi'); eq(r.provider,'openai');
});
t('default used when role unset', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'google'}));
  eq((await G.ask('writing','hi')).provider,'google');
});
t('backup used when default disconnected', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', bk:'openai', cfg:{anthropic:{saved:0},google:{saved:1,on:true},openai:{saved:1,on:true}}}));
  eq((await G.ask('voice','hi')).provider,'openai');
});
t('disabled provider skipped', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', cfg:{anthropic:{saved:1,on:false},google:{saved:1,on:true},openai:{saved:1,on:true}}}));
  if((await G.ask('voice','hi')).provider==='anthropic') throw new Error('used disabled provider');
});
t('live requires a live-capable provider', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic'}));
  eq((await G.ask('voice','hi',{live:true})).provider,'google','live must pick google');
});
t('live with no live provider -> typed error', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({cfg:{anthropic:{saved:1,on:true},google:{saved:0},openai:{saved:1,on:true}}}));
  eq((await G.ask('voice','hi',{live:true})).code,'no-live-provider');
});
t('nothing connected -> typed error', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({cfg:{}}));
  eq((await G.ask('voice','hi')).code,'no-provider');
});
t('offline -> typed error, no call attempted', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({online:false}));
  eq((await G.ask('voice','hi')).code,'offline'); eq(calls.length,0);
});
t('failover on: falls through to next provider', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', bk:'openai', fail:['anthropic']}));
  eq((await G.ask('voice','hi')).provider,'openai'); eq(calls,['anthropic','openai']);
});
t('failover off: one attempt only', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', fail:['anthropic'], failover:false}));
  const r=await G.ask('voice','hi'); eq(r.code,'failed'); eq(calls,['anthropic']);
});
t('3 failures bench a provider', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', bk:'openai', fail:['anthropic']}));
  for(let i=0;i<3;i++) await G.ask('voice','x');
  if(G.health('anthropic').healthy) throw new Error('should be benched');
  calls=[]; await G.ask('voice','x');
  if(calls[0]==='anthropic') throw new Error('benched provider still tried first');
});
t('benched provider still used if it is the only one', async()=>{
  calls=[]; G.clearHealth();
  G.configure(host({def:'anthropic', fail:['anthropic'], cfg:{anthropic:{saved:1,on:true}}}));
  for(let i=0;i<3;i++) await G.ask('voice','x');
  calls=[]; const r=await G.ask('voice','x');
  eq(r.code,'failed','should attempt, not report no-provider'); eq(calls,['anthropic']);
});
t('stream delivers deltas', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic'}));
  let got=''; const r=await G.stream('voice','hi',d=>got+=d);
  eq(got,'chunk '); eq(r.provider,'anthropic');
});
t('no stream transport -> falls back to call on same provider', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', stream:false}));
  let got=''; const r=await G.stream('voice','hi',d=>got+=d);
  eq(r.provider,'anthropic'); eq(got,'ok from anthropic');
});
t('stream failure before first token retries next provider', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', bk:'openai', fail:['anthropic']}));
  const r=await G.stream('voice','hi',()=>{}); eq(r.provider,'openai');
});
t('resolve() names the provider a role will use', async()=>{
  G.clearHealth(); G.configure(host({routing:{market:'openai'}, def:'anthropic'}));
  eq(G.resolve('market'),'openai'); eq(G.resolve('voice'),'anthropic'); eq(G.resolve('voice',{live:true}),'google');
});
t('chain() is the real fallback order, role first', async()=>{
  G.clearHealth(); G.configure(host({routing:{market:'openai'}, def:'anthropic', bk:'google'}));
  eq(G.chain('market'),['openai','anthropic','google']);
  eq(G.chain('voice'),['anthropic','google','openai']);
});
t('chain() omits disconnected and narrows on live', async()=>{
  G.clearHealth(); G.configure(host({def:'anthropic', cfg:{anthropic:{saved:1,on:true},google:{saved:1,on:true},openai:{saved:0}}}));
  eq(G.chain('voice'),['anthropic','google']);
  eq(G.chain('voice',{live:true}),['google']);
});
t('chain() drops a benched provider to last resort', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', bk:'openai', fail:['anthropic']}));
  for(let i=0;i<3;i++) await G.ask('voice','x');
  if(G.chain('voice')[0]==='anthropic') throw new Error('benched provider still leads the chain');
});
t('chain({includeBenched}) keeps a paused provider, behind the healthy ones', async()=>{
  calls=[]; G.clearHealth(); G.configure(host({def:'anthropic', bk:'openai', fail:['anthropic']}));
  for(let i=0;i<3;i++) await G.ask('voice','x');
  eq(G.chain('voice'),['openai','google'],'routing chain excludes the benched one');
  const shown=G.chain('voice',{includeBenched:true});
  eq(shown,['openai','google','anthropic'],'display chain shows it last');
});
t('unconfigured gateway does not throw', async()=>{
  const g2={}; new Function('window', fs.readFileSync('/home/user/Nervexus/ai-gateway.js','utf8'))(g2);
  eq((await g2.AIGateway.ask('voice','hi')).code,'unconfigured');
});

/* ---- pictures ------------------------------------------------------------------------
   Every "read this screenshot" feature in the app was written against a shim that folded
   the image into the text prompt, so a wall of base64 went to a text endpoint and the
   answer was always a failure. The image is its own argument now, and these hold that. */

t('an image is handed to the provider as its own argument, not folded into the prompt', async()=>{
  calls=[]; seen=[]; G.clearHealth(); G.configure(host({def:'anthropic'}));
  const img={media_type:'image/png', data:'AAAA'};
  const r=await G.ask('image','read this rota',{image:img});
  eq(r.text,'ok from anthropic','the call should have gone through');
  eq(seen.length,1,'one call');
  eq(seen[0].image,img,'the image did not reach the provider');
  eq(seen[0].prompt,'read this rota','the prompt should be words only');
  if(/AAAA/.test(seen[0].prompt)) throw new Error('the base64 leaked into the prompt');
});

t('a picture never streams', async()=>{
  calls=[]; seen=[]; G.clearHealth(); G.configure(host({def:'anthropic'}));
  await G.stream('image','read this',(d)=>{},{image:{media_type:'image/png',data:'AAAA'}});
  eq(calls,['anthropic'],'it should have gone down the whole-response path, got '+JSON.stringify(calls));
});

t('only the providers that can read a picture are tried', async()=>{
  /* Perplexity is connected and first in line for the role, and cannot take an image. It
     must not be attempted at all — a guaranteed rejection is not a failover worth making. */
  calls=[]; seen=[]; G.clearHealth();
  const h=host({routing:{image:'perplexity'}, def:'anthropic'});
  const provs=[...PROVS,{id:'perplexity',name:'Perplexity'}];
  h.providers=()=>provs; const c=h.cfg; h.cfg=(id)=>id==='perplexity'?{saved:1,on:true}:c(id);
  G.configure(h);
  const r=await G.ask('image','read this',{image:{media_type:'image/png',data:'AAAA'}});
  eq(r.text,'ok from anthropic','it should have fallen to one that can see');
  if(calls.includes('perplexity')) throw new Error('a text-only provider was sent a picture');
});

t('with nothing that can see, it says so rather than failing obscurely', async()=>{
  calls=[]; seen=[]; G.clearHealth();
  const h=host({cfg:{}});
  h.providers=()=>[{id:'perplexity',name:'Perplexity'}];
  h.cfg=()=>({saved:1,on:true});
  G.configure(h);
  const r=await G.ask('image','read this',{image:{media_type:'image/png',data:'AAAA'}});
  if(!r.error) throw new Error('it should not have claimed success');
  eq(r.code,'no-vision-provider','the reason should name the actual problem');
  if(!/Claude, ChatGPT or Gemini/.test(r.error)) throw new Error('and say what to connect: '+r.error);
});

t('a text request is unaffected by any of it', async()=>{
  calls=[]; seen=[]; G.clearHealth(); G.configure(host({def:'anthropic'}));
  await G.ask('writing','hello');
  eq(seen[0].image,null,'a text call must not gain an image argument');
});

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
