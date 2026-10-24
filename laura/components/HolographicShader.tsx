"use client";

import { useEffect, useRef } from "react";

const VERTEX_SRC = "attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }";

const FRAGMENT_SRC = `
  precision highp float;
  uniform vec2 u_res; uniform float u_time; uniform float u_glow;
  float hash(vec2 p){ p=fract(p*vec2(127.1,311.7)); return fract(p.x*p.y); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }
  vec3 pal(float t){ return vec3(0.5)+0.5*cos(6.283*(t+vec3(0,0.1,0.2))); }
  void main(){
    vec2 uv = gl_FragCoord.xy/u_res; vec2 p = uv-0.5; p.x *= u_res.x/u_res.y;
    float n = noise(uv*3.0 + u_time*0.04);
    float sweepPos = sin(u_time*0.3)*0.5;
    float ang = uv.x*1.2 - uv.y*1.0 + sweepPos*2.0 + n*0.5;
    vec3 irid = pal(ang*0.5 + n*0.2);
    float sweep = exp(-10.0 * abs(dot(p,normalize(vec2(0.7,0.7))) - sweepPos*1.5));
    float foil = (pow(0.5+0.5*sin(ang*10.0), 2.0)*0.3 + sweep*0.6) * u_glow;
    vec3 col = mix(vec3(0.03), irid, foil) + sweep*0.1*u_glow;
    gl_FragColor = vec4(col, 1.0);
  }`;

/** The "Nebula Quantum Card" background, minus the pointer-driven 3D tilt
 * -- purely a time-based ambient shimmer, so a grid of many of these never
 * turns into a field of cards chasing the cursor. `glow` nudges the sheen
 * brighter (set true on hover) without moving anything. Pauses its own
 * render loop via IntersectionObserver so off-screen cards cost nothing. */
export function HolographicShader({ glow = false, className = "" }: { glow?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef(glow ? 1 : 0.35);
  const targetGlowRef = useRef(glow ? 1 : 0.35);

  useEffect(() => {
    targetGlowRef.current = glow ? 1 : 0.35;
  }, [glow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERTEX_SRC));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uGlow = gl.getUniformLocation(program, "u_glow");

    const fit = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * d;
      canvas.height = canvas.clientHeight * d;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(canvas);
    fit();

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvas);

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || !canvas.width || !canvas.height) return;
      glowRef.current += (targetGlowRef.current - glowRef.current) * 0.08;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t / 1000);
      gl.uniform1f(uGlow, glowRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
