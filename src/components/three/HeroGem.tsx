"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { heroState } from "@/lib/heroState";
import { cn } from "@/lib/cn";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import EmeraldFallback from "./EmeraldFallback";

// three.js / R3F are loaded lazily, client-side only: they never block the
// initial HTML, navigation or headline, and cannot cause hydration mismatches.
const EmeraldScene = dynamic(() => import("./EmeraldScene"), { ssr: false });

export default function HeroGem() {
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const phone = useMediaQuery("(max-width: 767px)");

  const [lowPower, setLowPower] = useState(false);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  // Mobile and low-core devices get a lighter render path.
  useEffect(() => {
    setLowPower(phone || (navigator.hardwareConcurrency ?? 8) <= 4);
  }, [phone]);

  // Start loading the 3D scene only once the page has painted and is idle.
  useEffect(() => {
    if (!webgl) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMount(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMount(true), 400);
    return () => clearTimeout(id);
  }, [webgl]);

  // Pause rendering when the hero is off-screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pointer (mouse hover or touch drag) → normalised -1..1, +y up.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      heroState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      heroState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const reset = () => {
      heroState.pointerX = 0;
      heroState.pointerY = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", reset);
    window.addEventListener("pointercancel", reset);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("pointercancel", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      reset();
    };
  }, []);

  const show3D = webgl === true && mount && !failed;

  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
      <EmeraldFallback hidden={show3D && ready} />
      {show3D && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1600ms] ease-luxe",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <ErrorBoundary onError={() => setFailed(true)}>
            <EmeraldScene
              active={inView}
              lowPower={lowPower}
              reducedMotion={reducedMotion}
              onReady={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
