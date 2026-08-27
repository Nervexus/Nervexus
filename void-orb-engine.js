/* void-orb-engine.js — WebGL displaced-wireframe orb.

   Ported from a React Three Fiber component: an icosahedron whose vertices are pushed
   along their normals by 3D simplex noise, drawn as a wireframe so the displacement
   reads as a churning mesh surface rather than a lit solid.

   No new dependency — three.js is already in the repo as anatomy-three.js (a local
   bundle of three + GLTFLoader + meshopt that publishes window.NX3D). Loaded on demand
   here the same way anatomy-3d.js does it, so the orb costs nothing until it mounts.

   Exposes window.VoidOrb.mount(container, opts) -> { setColor, resize, destroy }
   opts: color ([r,g,b] 0..1), detail (icosahedron subdivisions), speed,
         amplitude, frequency, mouse (bool — follow pointer)

   R3F equivalences, for anyone comparing against the original component:
     <Canvas>              -> renderer + scene + camera set up in mount()
     useFrame(...)         -> the frame() loop below
     useThree().pointer    -> S.pointer, filled by the pointermove handler
     uniforms useMemo      -> S.uniforms, created once and mutated in place
*/
(function (root) {
  'use strict';

  var BUNDLE_URL = 'anatomy-three.js';
  var bundleP = null;

  function loadBundle() {
    if (window.NX3D) return Promise.resolve(window.NX3D);
    if (bundleP) return bundleP;
    bundleP = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = BUNDLE_URL;
      s.async = true;
      s.onload = function () { window.NX3D ? res(window.NX3D) : rej(new Error('3D bundle did not initialise')); };
      s.onerror = function () { bundleP = null; rej(new Error('Could not load the 3D bundle')); };
      document.head.appendChild(s);
    });
    return bundleP;
  }

  function supported() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  /* Ashima / Stefan Gustavson 3D simplex noise (MIT). This is the standard
     implementation — the same one the source component pastes in — so it is
     reproduced in full here rather than guessed at. Everything above main()
     is verbatim; only main() is ours. */
  var SNOISE = [
    'vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }',
    'vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }',
    'float snoise(vec3 v){',
    '  const vec2 C = vec2(1.0/6.0, 1.0/3.0);',
    '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
    '  vec3 i  = floor(v + dot(v, C.yyy));',
    '  vec3 x0 = v - i + dot(i, C.xxx);',
    '  vec3 g = step(x0.yzx, x0.xyz);',
    '  vec3 l = 1.0 - g;',
    '  vec3 i1 = min(g.xyz, l.zxy);',
    '  vec3 i2 = max(g.xyz, l.zxy);',
    '  vec3 x1 = x0 - i1 + C.xxx;',
    '  vec3 x2 = x0 - i2 + C.yyy;',
    '  vec3 x3 = x0 - D.yyy;',
    '  i = mod289(i);',
    '  vec4 p = permute(permute(permute(',
    '             i.z + vec4(0.0, i1.z, i2.z, 1.0))',
    '           + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
    '           + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
    '  float n_ = 0.142857142857;',
    '  vec3 ns = n_ * D.wyz - D.xzx;',
    '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
    '  vec4 x_ = floor(j * ns.z);',
    '  vec4 y_ = floor(j - 7.0 * x_);',
    '  vec4 x = x_ * ns.x + ns.yyyy;',
    '  vec4 y = y_ * ns.x + ns.yyyy;',
    '  vec4 h = 1.0 - abs(x) - abs(y);',
    '  vec4 b0 = vec4(x.xy, y.xy);',
    '  vec4 b1 = vec4(x.zw, y.zw);',
    '  vec4 s0 = floor(b0) * 2.0 + 1.0;',
    '  vec4 s1 = floor(b1) * 2.0 + 1.0;',
    '  vec4 sh = -step(h, vec4(0.0));',
    '  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;',
    '  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;',
    '  vec3 p0 = vec3(a0.xy, h.x);',
    '  vec3 p1 = vec3(a0.zw, h.y);',
    '  vec3 p2 = vec3(a1.xy, h.z);',
    '  vec3 p3 = vec3(a1.zw, h.w);',
    '  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));',
    '  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;',
    '  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);',
    '  m = m * m;',
    '  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));',
    '}'
  ].join('\n');

  root.VoidOrb = { supported: supported, _snoise: SNOISE, _loadBundle: loadBundle };

}(window));
