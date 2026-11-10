"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { GEMSTONES } from "@/content/gemstones";
import { cn } from "@/lib/cn";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GemGlyph from "./GemGlyph";

// Lazy, client-only: the exhibit's 3D code is fetched only once the section
// is within ~600px of the viewport, so the hero and nav are never delayed.
const GemstoneScene = dynamic(() => import("@/components/three/GemstoneScene"), {
  ssr: false,
});

export default function GemStage({ index }: { index: number }) {
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const compact = useMediaQuery("(max-width: 767px)");

  const [lowPower, setLowPower] = useState(false);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLowPower(compact || (navigator.hardwareConcurrency ?? 8) <= 4);
  }, [compact]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(
      ([e]) => e.isIntersecting && setNear(true),
      { rootMargin: "600px 0px" },
    );
    const viewIO = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    nearIO.observe(el);
    viewIO.observe(el);
    return () => {
      nearIO.disconnect();
      viewIO.disconnect();
    };
  }, []);

  const show3D = webgl === true && near && !failed;

  return (
    <div
      ref={box}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[46svh] md:inset-0 md:h-auto"
    >
      {/* Fallback imagery: the real cut of each stone, crossfading with selection */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-[1600ms] ease-luxe md:justify-end md:pr-[9%]",
          show3D && ready ? "opacity-0" : "opacity-100",
        )}
      >
        <div
          className="float-soft relative h-[78%] md:h-[60%]"
          style={{ aspectRatio: "2.1 / 2.7" }}
        >
          {GEMSTONES.map((g, i) => (
            <GemGlyph
              key={g.id}
              gem={g}
              className={cn(
                "absolute inset-0 h-full w-full transition-opacity duration-[1400ms] ease-luxe",
                i === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
        </div>
      </div>

      {show3D && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1600ms] ease-luxe",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <ErrorBoundary onError={() => setFailed(true)}>
            <GemstoneScene
              active={inView}
              compact={compact}
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
