import fs from 'fs';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
const S='/tmp/claude-0/-home-user-Nervexus/8c0d0981-63c6-52d2-b477-4d01a7e77cb5/scratchpad';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});

// --- world-space vertices of a document, in scene order ---
function worldVerts(doc, cb){
  const root=doc.getRoot().listScenes()[0];
  const walk=(node, m)=>{
    const t=node.getWorldMatrix ? node.getWorldMatrix() : null;
    const mesh=node.getMesh();
    if(mesh){
      for(const prim of mesh.listPrimitives()){
        const pos=prim.getAttribute('POSITION');
        cb(node, pos, t);
      }
    }
    for(const c of node.listChildren()) walk(c, m);
  };
  for(const n of root.listChildren()) walk(n, null);
}
function apply(m, x,y,z){
  if(!m) return [x,y,z];
  return [ m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14] ];
}

// 1. the skin body currently shipped in the app
const skin=await io.readBinary(fs.readFileSync('/home/user/Nervexus/anatomy-model.glb'));
const sxyz=[]; const smeta=[];
worldVerts(skin,(node,pos,m)=>{
  const n=pos.getCount(); const el=[0,0,0];
  smeta.push({name:node.getName()||'', count:n});
  for(let i=0;i<n;i++){ pos.getElement(i,el); const p=apply(m,el[0],el[1],el[2]); sxyz.push(p[0],p[1],p[2]); }
});
fs.writeFileSync(S+'/skin_verts.f32', Buffer.from(new Float32Array(sxyz).buffer));
fs.writeFileSync(S+'/skin_meta.json', JSON.stringify(smeta,null,1));
console.log('skin vertices:', sxyz.length/3, smeta.map(m=>m.name+':'+m.count).join(' '));

// 2. the muscle set, with a zone id per vertex
// MUST match ZONE_NAMES in anatomy-3d.js exactly, delts_rear slot included.
const ZONES=['','chest','lats','delts','delts_rear','biceps','triceps','forearms','traps','abs','obliques','lower_back','glutes','quads','hamstrings','calves','adductors'];
const mus=await io.readBinary(fs.readFileSync(S+'/muscles_raw.glb'));
const mxyz=[]; const mid=[];
worldVerts(mus,(node,pos,m)=>{
  const zone=(node.getName()||'').split('|')[0];
  const z=ZONES.indexOf(zone); if(z<1) return;
  const n=pos.getCount(); const el=[0,0,0];
  for(let i=0;i<n;i++){ pos.getElement(i,el); const p=apply(m,el[0],el[1],el[2]); mxyz.push(p[0],p[1],p[2]); mid.push(z); }
});
fs.writeFileSync(S+'/mus_verts.f32', Buffer.from(new Float32Array(mxyz).buffer));
fs.writeFileSync(S+'/mus_zone.u8', Buffer.from(new Uint8Array(mid).buffer));
console.log('muscle vertices:', mxyz.length/3);
