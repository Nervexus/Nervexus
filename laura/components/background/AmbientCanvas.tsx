"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// A raymarched, SDF-based morphing sphere: monochrome, lit by a single
// fixed key light plus fresnel rim, with its surface displaced by 3D value
// noise driven by u_time so it slowly breathes/warps rather than sitting
// static.
const FRAG = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z
  );
}

float map(vec3 p) {
  float d = length(p) - 1.0;
  float n = vnoise(p * 1.6 + u_time * 0.12) * 0.1;
  return d + n;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  vec3 ro = vec3(0.0, 0.0, 6.0);
  vec3 rd = normalize(vec3(uv, -1.5));

  float t = 0.0;
  float hit = 0.0;
  vec3 p = ro;
  for (int i = 0; i < 90; i++) {
    p = ro + rd * t;
    float d = map(p);
    if (d < 0.0015) {
      hit = 1.0;
      break;
    }
    t += d;
    if (t > 8.0) break;
  }

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  if (hit > 0.5) {
    vec3 n = getNormal(p);
    vec3 lightDir = normalize(vec3(0.6, 0.7, 0.55));
    float diff = max(dot(n, lightDir), 0.0);
    float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
    float shade = diff * 0.4 + fresnel * 0.55 + 0.04;
    col = vec3(shade);
    alpha = clamp(shade * 0.5, 0.0, 0.85);
  }

  gl_FragColor = vec4(col, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Layer 0: a raw-WebGL ambient mesh -- a monochrome morphing sphere,
 * static regardless of pointer position (deliberately not mouse-reactive),
 * masked by a radial gradient that stays fixed to the viewport while
 * #canvas-wrapper drifts and rotates with scroll (via ScrollTrigger). */
export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: true, antialias: true });
    if (!canvas || !gl) return;

    const vertShader = compile(gl, gl.VERTEX_SHADER, VERT);
    const fragShader = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas!;
      canvas!.width = clientWidth * dpr;
      canvas!.height = clientHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    function frame(now: number) {
      const t = (now - start) / 1000;
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform2f(uResolution, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, t);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    gsap.set(wrapper, { y: "-15vh" });
    const tween = gsap.to(wrapper, {
      y: "50vh",
      rotation: 360,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        WebkitMaskImage: "radial-gradient(circle 560px at 50% 38%, black 0%, transparent 100%)",
        maskImage: "radial-gradient(circle 560px at 50% 38%, black 0%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <div id="canvas-wrapper" ref={wrapperRef} className="absolute inset-0">
        <canvas id="ambient-canvas" ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  );
}
