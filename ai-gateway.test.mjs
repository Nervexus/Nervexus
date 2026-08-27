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
let calls=[];
function host(o={}){
  const cfg=o.cfg||{anthropic:{saved:1,on:true},google:{saved:1,on:true},openai:{saved:1,on:true}};
  return {
    providers:()=>PROVS, cfg:(id)=>cfg[id]||{}, model:(id)=>id+'-m',
    routing:()=>o.routing||{}, defaultId:()=>o.def||'', backupId:()=>o.bk||'',
    failover:()=>o.failover!==false, online:()=>o.online!==false,
    call:(id,p,m)=>{ calls.push(id); const f=(o.fail||[]).includes(id);
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
t('unconfigured gateway does not throw', async()=>{
  const g2={}; new Function('window', fs.readFileSync('/home/user/Nervexus/ai-gateway.js','utf8'))(g2);
  eq((await g2.AIGateway.ask('voice','hi')).code,'unconfigured');
});

let pass=0, fail=0;
for(const [n,f] of T){ try{ await f(); console.log('  PASS  '+n); pass++; }catch(e){ console.log('  FAIL  '+n+' :: '+e.message); fail++; } }
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
