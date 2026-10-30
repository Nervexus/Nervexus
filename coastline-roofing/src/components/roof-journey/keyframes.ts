import * as THREE from "three";
import type { HouseParts } from "./buildHouse";

export type CameraKeyframe = {
  /** Global scroll progress, 0..1, strictly increasing. */
  p: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

export type Caption = {
  /** Fade-in start / fully-in / fully-out / fade-out-end, as progress 0..1. */
  a: number;
  b: number;
  c: number;
  d: number;
  eyebrow: string;
  title: string;
  body?: string;
};

function v(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}

/**
 * Nine camera beats covering establishing / hero / material / repair /
 * replacement / flat roof / guttering / chimney / inspection. The brief's
 * own suggested fifteen beats are explicitly "proposed, not required" --
 * project transformations, craftsmanship, local service, customer
 * confidence and the enquiry finale are handed off to the existing
 * gallery / services / reviews / areas / quote sections below this
 * journey, which already cover that ground well rather than duplicating
 * it inside the 3D scene.
 */
export function buildKeyframes(house: HouseParts): CameraKeyframe[] {
  const { chimneyTop, eaveFront, ridgeMid, flatRoofCenter, patchCenter } = house;

  return [
    { p: 0.0, position: v(15, 9.5, 17), lookAt: v(0, 2.6, 0) },
    { p: 0.11, position: v(7.5, 4.6, 10.5), lookAt: v(0, ridgeMid.y * 0.55, eaveFront.z * 0.3) },
    {
      p: 0.24,
      position: v(patchCenter.x - 0.4, patchCenter.y + 2.4, patchCenter.z + 5.4),
      lookAt: patchCenter.clone(),
    },
    {
      p: 0.34,
      position: v(patchCenter.x + 2.0, patchCenter.y + 1.5, patchCenter.z + 3.6),
      lookAt: patchCenter.clone(),
    },
    {
      p: 0.46,
      position: v(patchCenter.x - 2.0, patchCenter.y + 2.0, patchCenter.z + 4.2),
      lookAt: patchCenter.clone(),
    },
    {
      p: 0.58,
      position: v(flatRoofCenter.x - 4.4, flatRoofCenter.y + 2.8, flatRoofCenter.z + 4.8),
      lookAt: flatRoofCenter.clone(),
    },
    {
      p: 0.7,
      position: v(-3, 4.3, eaveFront.z + 4.6),
      lookAt: v(-3, eaveFront.y + 0.1, eaveFront.z),
    },
    {
      p: 0.82,
      position: v(chimneyTop.x + 2.4, chimneyTop.y + 0.4, chimneyTop.z + 2.6),
      lookAt: chimneyTop.clone(),
    },
    { p: 1.0, position: v(-16, 10, -15), lookAt: v(0, 2.8, 0) },
  ];
}

export function buildCaptions(): Caption[] {
  return [
    {
      a: 0.0,
      b: 0.03,
      c: 0.08,
      d: 0.105,
      eyebrow: "Southampton, Hampshire",
      title: "Roofing Southampton Can Rely On",
      body: "Storm damage, leaks, full re-roofs or a new set of gutters — our local, fully insured team gets it done right the first time.",
    },
    {
      a: 0.14,
      b: 0.18,
      c: 0.215,
      d: 0.24,
      eyebrow: "Material",
      title: "Slate, laid course by course",
      body: "Every tile overlaps the one below it — the detail that keeps water out for decades, not just years.",
    },
    {
      a: 0.27,
      b: 0.3,
      c: 0.33,
      d: 0.35,
      eyebrow: "Roof Repairs",
      title: "We find what's actually wrong",
      body: "Slipped and cracked tiles, failed pointing, storm damage — diagnosed properly before anything is touched.",
    },
    {
      a: 0.39,
      b: 0.42,
      c: 0.45,
      d: 0.47,
      eyebrow: "New Roofs",
      title: "Put right, properly",
      body: "Matched tiles, correct coursing, no shortcuts — finished to blend in, not stand out.",
    },
    {
      a: 0.51,
      b: 0.54,
      c: 0.57,
      d: 0.59,
      eyebrow: "Flat Roofs",
      title: "GRP and felt, done for extensions and dormers",
      body: "Including roof lanterns — flat doesn't have to mean featureless.",
    },
    {
      a: 0.63,
      b: 0.66,
      c: 0.69,
      d: 0.71,
      eyebrow: "Guttering & Fascias",
      title: "Where most leaks actually start",
      body: "Gutters, fascias and soffits — installed and repaired so water goes where it's supposed to.",
    },
    {
      a: 0.75,
      b: 0.78,
      c: 0.81,
      d: 0.83,
      eyebrow: "Chimney Work",
      title: "Flashing is the detail that matters",
      body: "Repointing, flashing and capping — the junctions are where roofs actually fail.",
    },
    {
      a: 0.87,
      b: 0.9,
      c: 0.97,
      d: 1.0,
      eyebrow: "Emergency Repairs",
      title: "One roof, inspected as a whole system",
      body: "19+ years experience · Fully insured · No call-out charge for quotes.",
    },
  ];
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Interpolates camera position + lookAt for a given global progress. */
export function sampleCamera(
  keyframes: CameraKeyframe[],
  p: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
) {
  const clamped = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < keyframes.length - 2 && keyframes[i + 1].p < clamped) i++;
  const a = keyframes[i];
  const b = keyframes[i + 1];
  const span = b.p - a.p || 1;
  const t = smoothstep((clamped - a.p) / span);

  tmpA.copy(a.position);
  tmpB.copy(b.position);
  outPos.copy(tmpA.lerp(tmpB, t));

  tmpA.copy(a.lookAt);
  tmpB.copy(b.lookAt);
  outLook.copy(tmpA.lerp(tmpB, t));
}

/** 0 at/ before `a`, 1 between `b` and `c`, back to 0 at/after `d`. */
export function captionOpacity(cap: Caption, p: number) {
  if (p <= cap.a || p >= cap.d) return 0;
  if (p < cap.b) return (p - cap.a) / (cap.b - cap.a);
  if (p > cap.c) return 1 - (p - cap.c) / (cap.d - cap.c);
  return 1;
}

/** 0 before the repair beat, 1 from the replacement beat onward. */
export function repairProgressFor(p: number) {
  const start = 0.3;
  const end = 0.44;
  if (p <= start) return 0;
  if (p >= end) return 1;
  return smoothstep((p - start) / (end - start));
}
