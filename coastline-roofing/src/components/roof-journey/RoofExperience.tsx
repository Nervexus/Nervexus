"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { siteConfig } from "@/config/site";
import { PhoneIcon } from "../icons";
import { buildHouse } from "./buildHouse";
import {
  buildKeyframes,
  buildCaptions,
  sampleCamera,
  captionOpacity,
  repairProgressFor,
} from "./keyframes";

const JOURNEY_VH = 650;

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function RoofExperience() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captionStates, setCaptionStates] = useState<number[]>(() => buildCaptions().map(() => 0));
  const [scrollHintVisible, setScrollHintVisible] = useState(true);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    // Deliberately a client-only check run post-mount, not during the
    // lazy initializer: the server has no WebGL, so both have to agree
    // on the no-canvas fallback for the very first (hydration) render,
    // then this effect swaps in the real answer once we're in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebglOk(supportsWebGL());
  }, []);

  // The journey's pinned layer sticks *below* the site's own sticky header,
  // not at the true viewport top -- so its height has to be the viewport
  // minus the header, or its bottom (and the CTA row docked to it) ends up
  // pushed off-screen by exactly the header's height. This runs regardless
  // of WebGL support, since the HTML overlay/CTAs render either way.
  useEffect(() => {
    const sticky = stickyRef.current;
    const headerEl = document.querySelector("header");
    if (!sticky) return;

    function apply() {
      const headerHeight = headerEl?.getBoundingClientRect().height ?? 0;
      sticky!.style.top = `${headerHeight}px`;
      sticky!.style.height = `calc(100vh - ${headerHeight}px)`;
    }
    apply();

    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    if (!webglOk) return;
    const wrapper = wrapperRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !sticky || !canvas) return;

    const isSmallScreen = window.innerWidth < 760;
    const headerEl = document.querySelector("header");
    let headerHeight = headerEl?.getBoundingClientRect().height ?? 0;

    function applyStickyMetrics() {
      headerHeight = headerEl?.getBoundingClientRect().height ?? 0;
      sticky!.style.top = `${headerHeight}px`;
      sticky!.style.height = `calc(100vh - ${headerHeight}px)`;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallScreen ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd9d4c5);
    scene.fog = new THREE.Fog(0xd9d4c5, 18, 44);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    const hemi = new THREE.HemisphereLight(0xf5f4f0, 0x3c4038, 0.65);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff3e0, 2.0);
    sun.position.set(10, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(isSmallScreen ? 1024 : 2048, isSmallScreen ? 1024 : 2048);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.035;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xaab4c8, 0.4);
    fill.position.set(-8, 6, -10);
    scene.add(fill);

    const house = buildHouse();
    scene.add(house.group);

    const keyframes = buildKeyframes(house);
    const captions = buildCaptions();

    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();

    function resize() {
      applyStickyMetrics();
      const w = sticky!.clientWidth;
      const h = sticky!.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);
    window.addEventListener("resize", resize);

    let raf = 0;
    const nextCaptionStates: number[] = captions.map(() => 0);

    function render() {
      const rect = wrapper!.getBoundingClientRect();
      const stickyHeight = sticky!.clientHeight;
      const scrollable = rect.height - stickyHeight;
      const progress =
        scrollable > 0
          ? Math.min(1, Math.max(0, (headerHeight - rect.top) / scrollable))
          : 0;

      sampleCamera(keyframes, progress, camPos, camLook);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      house.setRepairProgress(repairProgressFor(progress));

      let changed = false;
      captions.forEach((cap, i) => {
        const o = captionOpacity(cap, progress);
        if (Math.abs(o - nextCaptionStates[i]) > 0.01) changed = true;
        nextCaptionStates[i] = o;
      });
      if (changed) setCaptionStates([...nextCaptionStates]);
      setScrollHintVisible(progress < 0.02);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      house.dispose();
      renderer.dispose();
    };
  }, [webglOk]);

  const captions = buildCaptions();

  return (
    <section
      ref={wrapperRef}
      id="top"
      className="dark-surface relative bg-ink-950"
      style={{ height: `${JOURNEY_VH}vh` }}
      aria-label="Coastline Roofing — a tour of a real pitched roof"
    >
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {webglOk ? (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 10%, #4a4435 0%, #202522 60%)",
            }}
          />
        )}

        {/* HTML overlay: safe nav clearance, captions, persistent CTAs */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-4 pt-24 pb-6 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
          <div className="relative mx-auto w-full max-w-7xl flex-1">
            {captions.map((cap, i) => (
              <div
                key={cap.title}
                className="absolute inset-0 flex flex-col justify-center"
                style={{
                  opacity: captionStates[i] ?? 0,
                  transform: `translateY(${(1 - (captionStates[i] ?? 0)) * 14}px)`,
                  transition: "opacity 0.15s linear, transform 0.15s linear",
                }}
              >
                <div className="max-w-xl">
                  <p className="flex items-center gap-4 text-xs font-medium tracking-[0.2em] text-gold-400 uppercase">
                    <span className="h-px w-10 bg-gold-400/60" />
                    {cap.eyebrow}
                  </p>
                  <h2 className="mt-6 font-display text-4xl leading-[1.08] text-warm text-balance sm:text-5xl lg:text-6xl">
                    {cap.title}
                  </h2>
                  {cap.body ? (
                    <p className="mt-5 max-w-md text-base leading-relaxed font-light text-warm/70 sm:text-lg">
                      {cap.body}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="pointer-events-auto mx-auto flex w-full max-w-7xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-14">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
              <a
                href={siteConfig.phone.href}
                className="inline-flex items-center justify-center gap-3 bg-gold-500 px-8 py-4 text-xs font-medium tracking-[0.14em] text-ink-950 uppercase transition-colors hover:bg-gold-400 light:rounded-[3px]"
              >
                <PhoneIcon className="h-4 w-4" />
                Call Now
              </a>
              <a
                href="#quote"
                className="group hidden items-center gap-2 text-sm text-warm sm:inline-flex"
              >
                Get a Free Quote
                <span className="h-px w-6 bg-gold-400 transition-all group-hover:w-9" />
              </a>
            </div>

            <div
              className="hidden flex-col items-center gap-2 text-xs tracking-[0.08em] text-warm/40 transition-opacity duration-300 sm:flex"
              style={{ opacity: scrollHintVisible ? 1 : 0 }}
            >
              <span>Scroll to explore the roof</span>
              <span className="h-10 w-px bg-warm/30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
