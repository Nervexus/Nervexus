/* A fake Supabase client: enough of the query builder for reminder-tick, backed by plain
   arrays, so the sweeps can be driven against known data. */
export function createClient(){ return null; }
export function makeAdmin(tables){
  const db = tables;
  const inserted = [];
  function table(name){
    let rows = (db[name]||[]).slice();
    const api = {
      _filters: [],
      select(cols, opts){ api._head = opts&&opts.head; api._count = opts&&opts.count; return api; },
      eq(c,v){ rows = rows.filter(r=>r[c]===v); return api; },
      is(c,v){ rows = rows.filter(r=>(r[c]??null)===v); return api; },
      order(){ return api; },
      gte(c,v){ rows = rows.filter(r=>String(r[c])>=v); return api; },
      lte(c,v){ rows = rows.filter(r=>String(r[c])<=v); return api; },
      limit(n){ rows = rows.slice(0,n); return thenable(); },
      maybeSingle(){ return Promise.resolve({ data: rows[0]||null }); },
      insert(r){ const arr = Array.isArray(r)?r:[r]; arr.forEach(x=>{ inserted.push({table:name,...x}); (db[name]=db[name]||[]).push(x); }); return Promise.resolve({data:arr}); },
      upsert(r){ (db[name]=db[name]||[]); const i=db[name].findIndex(x=>x.user_id===r.user_id); if(i>=0) Object.assign(db[name][i],r); else db[name].push(r); return Promise.resolve({data:[r]}); },
      then(res,rej){ return thenable().then(res,rej); },
    };
    function thenable(){ return Promise.resolve(api._count?{count:rows.length,data:rows}:{data:rows}); }
    return api;
  }
  return { from:(n)=>table(n), _inserted:inserted, _db:db };
}
