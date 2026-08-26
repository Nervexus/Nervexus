import fs from 'fs';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { meshopt } from '@gltf-transform/functions';
const S='/tmp/claude-0/-home-user-Nervexus/8c0d0981-63c6-52d2-b477-4d01a7e77cb5/scratchpad';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});

const doc=await io.readBinary(fs.readFileSync('/home/user/Nervexus/anatomy-model.glb'));
const zones=new Uint8Array(fs.readFileSync(S+'/zones.u8'));

// Same traversal order the labels were generated in.
const prims=[];
const walk=(n)=>{ const m=n.getMesh(); if(m) for(const p of m.listPrimitives()) prims.push(p); for(const c of n.listChildren()) walk(c); };
for(const n of doc.getRoot().listScenes()[0].listChildren()) walk(n);

let off=0;
for(const p of prims){
  const n=p.getAttribute('POSITION').getCount();
  const arr=new Float32Array(n);
  for(let i=0;i<n;i++) arr[i]=zones[off+i];
  off+=n;
  // Carried as a vertex attribute so it can never drift from the geometry: if the mesh is
  // ever re-exported or reordered, the labels move with their vertices.
  p.setAttribute('_MUSCLE', doc.createAccessor().setType('SCALAR').setArray(arr).setBuffer(doc.getRoot().listBuffers()[0]));
}
if(off!==zones.length) throw new Error(`label count ${zones.length} != vertex count ${off}`);
console.log('labels embedded across', prims.length, 'primitives,', off, 'vertices');

await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const out=await io.writeBinary(doc);
fs.writeFileSync('/home/user/Nervexus/anatomy-model.glb', out);
console.log('anatomy-model.glb', (out.length/1048576).toFixed(2)+'MB');
