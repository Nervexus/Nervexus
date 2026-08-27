/* void-orb-engine.js — WebGL displaced-wireframe orb ("void orb").

   An icosahedron whose vertices are pushed along their normals by 3D simplex noise
   and drawn as a wireframe, so the displacement reads as a churning mesh surface
   rather than a lit solid. Ported 1:1 from a React Three Fiber component; the
   shaders are the original's, unchanged.

   No new dependency: three.js is already in the repo as anatomy-three.js (a local
   bundle of three + GLTFLoader + meshopt publishing window.NX3D). It is loaded on
   demand here, the same way anatomy-3d.js does it, so this costs nothing until an
   orb actually mounts.

   window.VoidOrb.mount(container, opts) -> { setColor, resize, destroy, ready }
     color      [r,g,b] 0..1 multiplied over the shader's greyscale. Default white,
                which is the original look — the shader itself has no colour.
     detail     icosahedron subdivisions. See DETAIL below before raising it.
     radius     sphere radius (original: 1.8)
     speed      time scale (original: 1.0 — uTime advances in real seconds)
     amplitude  displacement scale (original: 0.15)
     frequency  noise frequency (original: 1.5)
     spin       constant Y rotation, rad/sec (original: 0.05)
     tilt       how far pointer tilts X/Z, radians (original: 0.2)
     pointer    follow the pointer at all (default true)

   R3F equivalences, for anyone diffing against the source component:
     <Canvas>              -> renderer/scene/camera in mount()
     useFrame(...)         -> frame()
     useThree().pointer    -> S.ptr, normalised device coords, y up
     uniforms useMemo      -> S.uniforms, created once and mutated in place
   The source's <ambientLight> is deliberately not ported: ShaderMaterial does not
   consume three's lights unless the shader opts into the lighting chunks, and this
   one does not, so it was a no-op.
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

  /* How far the active state pushes the surface out. Used twice — once to actually swell
     it, once to work out how far back the camera has to sit for the swollen orb to still
     fit. Keeping it as one constant is the point: when these two drifted apart the orb
     grew past the frustum and rendered flat against the canvas edge, which reads as it
     being trapped in an invisible box. */
  var ACTIVE_AMP_MUL = 1.9;
  var FRUSTUM_FILL = 0.88;   // headroom left around the orb at full swell
  var FOV = 45;

  function supported() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  /* Detail is the expensive knob and it is not linear: an icosahedron at detail d is
     20*(d+1)^2 triangles, and `wireframe` draws three line segments per triangle.

       detail 64 -> 84,500 tris -> ~253k segments -> ~8MB of vertex data
       detail 32 -> 21,780 tris -> ~65k segments
       detail 16 ->  5,780 tris -> ~17k segments

     The source uses 64, which is right for a full-viewport hero and wasteful for a
     230px widget — the extra triangles land inside single pixels. Default therefore
     scales with the element's rendered size, and an explicit `detail` overrides it. */
  function autoDetail(px) {
    if (px >= 560) return 64;
    if (px >= 340) return 48;
    if (px >= 200) return 32;
    return 20;
  }

  /* Ashima / Stefan Gustavson 3D simplex noise (MIT), as pasted in by the source
     component. Verbatim — only main() below is application code. */
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

  /* Vertex shader. The source hard-coded 1.5 / 0.15 / 0.15; they are uniforms here so
     a call site can retune without a second copy of the shader. Defaults reproduce it. */
  var VERT = [
    'uniform float uTime;',
    'uniform float uFreq;',
    'uniform float uAmp;',
    'varying vec2 vUv;',
    'varying float vDisplacement;',
    SNOISE,
    'void main(){',
    '  vUv = uv;',
    '  float noise = snoise(position * uFreq + uTime * 0.15);',
    '  float displacement = noise * uAmp;',
    '  vDisplacement = displacement;',
    '  vec3 newPosition = position + normal * displacement;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);',
    '}'
  ].join('\n');

  /* Fragment shader, verbatim from the source but multiplied by uColor so the orb can
     be tinted at the call site. uColor defaults to white, which is a no-op — the
     original is pure greyscale, brightness coming entirely from the displacement. */
  var FRAG = [
    'uniform vec3 uColor;',
    'varying vec2 vUv;',
    'varying float vDisplacement;',
    'void main(){',
    '  float intensity = 0.3 + vDisplacement * 2.0;',
    '  vec3 color = vec3(intensity) * uColor;',
    '  float line = smoothstep(0.0, 0.02, abs(fract(vUv.x * 20.0) - 0.5));',
    '  line *= smoothstep(0.0, 0.02, abs(fract(vUv.y * 20.0) - 0.5));',
    '  gl_FragColor = vec4(color * (1.0 - line * 0.5), 0.6);',
    '}'
  ].join('\n');

  function mount(el, opts) {
    opts = opts || {};
    if (!el || !supported()) return null;

    var S = {
      el: el, dead: false, raf: 0, THREE: null,
      renderer: null, scene: null, camera: null, mesh: null, geo: null, mat: null,
      uniforms: null, ro: null, last: 0,
      ptr: { x: 0, y: 0 },                       // normalised device coords, y up
      reduced: false,
      radius: opts.radius != null ? opts.radius : 1.8,
      detail: opts.detail || 0,
      speed: opts.speed != null ? opts.speed : 1,
      spin: opts.spin != null ? opts.spin : 0.05,
      tilt: opts.tilt != null ? opts.tilt : 0.2,
      pointer: opts.pointer !== false,
      /* Active state: the voice page used to swap the old orb into a livelier mode while
         the mic was listening. Same idea here — the surface churns harder and turns faster.
         Eased rather than switched so it swells and settles instead of snapping. */
      act: 0, actTarget: 0,
      baseAmp: opts.amplitude != null ? opts.amplitude : 0.15
    };

    try { S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function size() {
      var w = el.clientWidth || 1, h = el.clientHeight || 1;
      return { w: w, h: h };
    }

    function onPointer(e) {
      if (!S.pointer) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // R3F's `pointer` is NDC with y up; raw client coords would invert the tilt.
      S.ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      S.ptr.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    }

    function resize() {
      if (S.dead || !S.renderer) return;
      var s = size();
      S.camera.aspect = s.w / s.h;
      S.camera.updateProjectionMatrix();
      S.renderer.setSize(s.w, s.h, false);
    }

    function frame(now) {
      if (S.dead) return;
      S.raf = requestAnimationFrame(frame);
      var delta = S.last ? Math.min(0.1, (now - S.last) / 1000) : 0;
      S.last = now;

      S.act += (S.actTarget - S.act) * (1 - Math.pow(0.004, delta));
      S.uniforms.uAmp.value = S.baseAmp * (1 + S.act * (ACTIVE_AMP_MUL - 1));
      if (!S.reduced) {
        S.uniforms.uTime.value += delta * S.speed * (1 + S.act * 1.6);
        S.mesh.rotation.y += delta * S.spin * (1 + S.act * 2.2);
      }
      S.uniforms.uMouse.value[0] = S.ptr.x;
      S.uniforms.uMouse.value[1] = S.ptr.y;

      /* The source lerps at a flat 0.05 per frame, which eases twice as fast on a
         120Hz screen as on 60Hz. Same feel, expressed per second instead. */
      var k = 1 - Math.pow(1 - 0.05, delta * 60);
      S.mesh.rotation.x += (S.ptr.y * S.tilt - S.mesh.rotation.x) * k;
      S.mesh.rotation.z += (S.ptr.x * S.tilt - S.mesh.rotation.z) * k;

      S.renderer.render(S.scene, S.camera);
    }

    var ready = loadBundle().then(function (NX) {
      if (S.dead) return null;
      var THREE = S.THREE = NX.THREE;
      var s = size();
      var detail = S.detail || autoDetail(Math.max(s.w, s.h));

      try {
        S.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (err) {
        // Past the browser's live-context cap this throws rather than returning null.
        if (window.console) console.warn('[VoidOrb] could not create a WebGL context: '
          + ((err && err.message) || err) + ' — too many 3D canvases are live.');
        S.lost = true;
        return false;
      }
      S.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));  // dpr={[1,2]}
      S.renderer.setSize(s.w, s.h, false);
      S.renderer.setClearColor(0x000000, 0);
      S.renderer.domElement.style.cssText = 'display:block; width:100%; height:100%;';

      /* A WebGL context can be taken away — the browser caps how many are live at once
         (around sixteen) and will drop the oldest, and a GPU driver reset kills all of
         them. Either way the canvas goes blank and stays blank, with nothing thrown.
         Flagging it lets the host rebuild instead of staring at a dead canvas, and the
         console line is there so this is diagnosable from a screenshot rather than a
         guess. */
      S.renderer.domElement.addEventListener('webglcontextlost', function (e) {
        e.preventDefault();
        S.lost = true;
        if (window.console) console.warn('[VoidOrb] WebGL context lost — the orb will be rebuilt. '
          + 'If this repeats, too many 3D canvases are being created.');
      }, false);

      el.appendChild(S.renderer.domElement);

      S.scene = new THREE.Scene();
      // The source hard-coded z = 5, which fits the orb at rest (94% of frame height) and
      // clips it the moment the active state swells the surface. Derive the distance from
      // the largest the orb can get instead.
      var halfAt1 = Math.tan(FOV / 2 * Math.PI / 180);
      var maxExtent = S.radius + S.baseAmp * ACTIVE_AMP_MUL;
      var dist = maxExtent / (halfAt1 * FRUSTUM_FILL);
      S.camera = new THREE.PerspectiveCamera(FOV, s.w / s.h, 0.1, 100);
      S.camera.position.set(0, 0, dist);

      var c = opts.color || [1, 1, 1];
      S.uniforms = {
        uTime:  { value: 0 },
        uMouse: { value: [0, 0] },
        uFreq:  { value: opts.frequency != null ? opts.frequency : 1.5 },
        uAmp:   { value: opts.amplitude != null ? opts.amplitude : 0.15 },
        uColor: { value: new THREE.Vector3(c[0], c[1], c[2]) }
      };

      S.geo = new THREE.IcosahedronGeometry(S.radius, detail);
      S.mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, uniforms: S.uniforms,
        transparent: true, wireframe: true
      });
      S.mesh = new THREE.Mesh(S.geo, S.mat);
      S.scene.add(S.mesh);

      if (S.pointer) window.addEventListener('pointermove', onPointer, { passive: true });
      if (window.ResizeObserver) { S.ro = new ResizeObserver(resize); S.ro.observe(el); }
      else window.addEventListener('resize', resize);

      S.raf = requestAnimationFrame(frame);
      return true;
    }).catch(function (err) {
      // Nothing to show is the right failure here — the orb is decorative, and the
      // page behind it is complete without it.
      if (window.console) console.warn('[VoidOrb]', err && err.message);
      return false;
    });

    return {
      ready: ready,
      resize: resize,
      /* True once the GPU has taken the context away. The host polls this and rebuilds —
         a lost context has already freed its slot, so rebuilding is safe and is the only
         way back. */
      isLost: function () { return !!S.dead || !!S.lost; },
      /* The canvas itself, so a host whose DOM was rebuilt underneath it can put the same
         one back rather than building a second context. Contexts are capped at around
         sixteen per page; re-attaching costs nothing, rebuilding spends one. */
      canvas: function () { return (S.renderer && S.renderer.domElement) || null; },
      setColor: function (rgb) {
        if (S.uniforms && rgb) S.uniforms.uColor.value.set(rgb[0], rgb[1], rgb[2]);
      },
      setActive: function (on) { S.actTarget = on ? 1 : 0; },
      destroy: function () {
        if (S.dead) return;
        S.dead = true;
        if (S.raf) cancelAnimationFrame(S.raf);
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('resize', resize);
        if (S.ro) { try { S.ro.disconnect(); } catch (e) {} }
        if (S.geo) S.geo.dispose();
        if (S.mat) S.mat.dispose();
        if (S.renderer) {
          try { S.renderer.dispose(); } catch (e) {}
          try { S.renderer.forceContextLoss(); } catch (e) {}
          if (S.renderer.domElement && S.renderer.domElement.parentNode) {
            S.renderer.domElement.parentNode.removeChild(S.renderer.domElement);
          }
        }
        S.renderer = S.scene = S.camera = S.mesh = S.geo = S.mat = null;
      }
    };
  }

  root.VoidOrb = { mount: mount, supported: supported };

}(window));
