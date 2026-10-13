/* Transpile the real reminder-tick edge function to JS and rewrite its imports to local
   stubs, so the shipped collect->flush logic can be executed and asserted on in Node. */
import ts from 'typescript';
import fs from 'fs';
const SRC=new URL('../reminder-tick/index.ts', import.meta.url).pathname;
let js = ts.transpileModule(fs.readFileSync(SRC,'utf8'), {
  compilerOptions:{ target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
js = js
  .replace(/from 'https:\/\/esm\.sh\/@supabase\/supabase-js@2'/, "from './stub-supabase.mjs'")
  .replace(/from '\.\.\/_shared\/push\.ts'/, "from './stub-push.mjs'")
  .replace(/from '\.\.\/_shared\/email\.ts'/, "from './stub-email.mjs'")
  .replace(/from '\.\.\/_shared\/digest-template\.js'/, "from '../_shared/digest-template.js'");
// Deno.serve would start a server; neutralise it and expose the internals instead.
js = js.replace(/Deno\.serve\(/, 'export const __handler = (');
js += "\nexport { sweepUser, flushDigest, buildDigest as _bd };\n";
fs.writeFileSync('./tick.built.mjs', js);
console.log('built tick.built.mjs ('+js.split('\n').length+' lines)');
