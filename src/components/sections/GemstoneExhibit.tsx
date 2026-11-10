"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { GEMSTONES, exhibit } from "@/content/gemstones";
import { EASE_LUXE } from "@/lib/animation";
import { hexToRgb } from "@/lib/color";
import { exhibitState } from "@/lib/exhibitState";
import { gsap } from "@/lib/gsap";
import Button from "@/components/ui/Button";
import Magnetic from "@/components/ui/Magnetic";
import GemStage from "@/components/exhibit/GemStage";
import GemTabs from "@/components/exhibit/GemTabs";
import DiscoverPanel from "@/components/exhibit/DiscoverPanel";

const TOTAL = GEMSTONES.length;
const SWIPE_MIN = 56;

export default function GemstoneExhibit() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const section = useRef<HTMLElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; lastX: number; type: string } | null>(null);

  // Single source of truth is exhibitState (read by the WebGL scene).
  const go = useCallback((next: number, dir?: 1 | -1) => {
    const n = (next + TOTAL) % TOTAL;
    if (n === exhibitState.index) return;
    exhibitState.dir = dir ?? (n > exhibitState.index ? 1 : -1);
    exhibitState.index = n;
    exhibitState.yaw = 0;
    setIndex(n);
  }, []);
  const step = useCallback((d: 1 | -1) => go(exhibitState.index + d, d), [go]);

  useEffect(() => {
    exhibitState.index = 0;
    exhibitState.yaw = 0;
    return () => {
      exhibitState.index = 0;
      exhibitState.yaw = 0;
    };
  }, []);

  // Scroll-triggered entrances and a subtle parallax on the stage.
  useLayoutEffect(() => {
    const el = section.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(el.querySelectorAll("[data-reveal]"), {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: el.querySelector("[data-intro]"), start: "top 85%", once: true },
      });
      gsap.from(el.querySelectorAll("[data-controls]"), {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: block.current, start: "top 35%", once: true },
      });
      gsap.fromTo(
        stage.current,
        { yPercent: 5 },
        {
          yPercent: -5,
          ease: "none",
          scrollTrigger: {
            trigger: block.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });
    return () => mm.revert();
  }, []);

  // Pointer gestures on the stage: mouse drag rotates, touch swipe navigates.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role='tab']")) return;
    gesture.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, type: e.pointerType };
    if (e.pointerType === "mouse") e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.type !== "mouse") return;
    exhibitState.yaw += (e.clientX - g.lastX) * 0.008;
    g.lastX = e.clientX;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.type === "mouse") return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
      step(dx < 0 ? 1 : -1);
    }
  };

  const current = GEMSTONES[index];

  // Text variants: masked line reveal for titles, soft rise for copy.
  const wrap: Variants = {
    hide: { transition: { staggerChildren: 0 } },
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } },
  };
  const mask: Variants = reduce
    ? { hide: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hide: { y: "112%", transition: { duration: 0.45, ease: EASE_LUXE } },
        show: { y: "0%", transition: { duration: 1.1, ease: EASE_LUXE } },
      };
  const rise: Variants = reduce
    ? { hide: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hide: { opacity: 0, y: 14, transition: { duration: 0.3 } },
        show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXE } },
      };

  return (
    <section
      id="gemstones"
      ref={section}
      aria-labelledby="gemstones-title"
      className="relative isolate overflow-hidden bg-obsidian"
    >
      {/* Environment: one atmosphere per stone, crossfaded */}
      <div aria-hidden className="absolute inset-0">
        {GEMSTONES.map((g, i) => (
          <div
            key={g.id}
            className="absolute inset-0 transition-opacity duration-[1600ms] ease-luxe"
            style={{
              opacity: i === index ? 1 : 0,
              backgroundImage: `radial-gradient(55% 60% at 72% 52%, rgb(${hexToRgb(g.theme.glow)} / 0.3), transparent 72%), radial-gradient(90% 80% at 15% 100%, rgb(${hexToRgb(g.theme.deep)} / 0.95), transparent 70%)`,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgb(var(--c-obsidian)) 0%, transparent 14%, transparent 86%, rgb(var(--c-obsidian)) 100%)",
          }}
        />
      </div>

      <div data-intro className="container-maison relative z-10 pt-section">
        <p data-reveal className="eyebrow flex items-center gap-4">
          <span aria-hidden className="block h-px w-10 bg-champagne/70" />
          {exhibit.eyebrow}
        </p>
        <h2
          id="gemstones-title"
          data-reveal
          className="mt-6 max-w-3xl font-display text-display-lg font-light text-ivory"
        >
          {exhibit.titleLead}{" "}
          <span className="italic text-champagne">{exhibit.titleEmphasis}</span>
        </h2>
      </div>

      <div
        ref={block}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (gesture.current = null)}
        className="relative min-h-[100svh] touch-pan-y md:cursor-grab md:active:cursor-grabbing"
      >
        <div ref={stage} className="absolute inset-0">
          <GemStage index={index} />
        </div>

        <div className="pointer-events-none container-maison relative z-10 flex min-h-[100svh] flex-col pb-8 pt-[46svh] md:pb-14 md:pt-24">
          <div className="pointer-events-auto mt-2 md:my-auto md:max-w-[min(30rem,42%)]">
            {/* All four texts share one grid cell: height is fixed, no layout shift */}
            <div
              id="gem-panel"
              role="tabpanel"
              aria-labelledby={`gem-tab-${current.id}`}
              aria-live="polite"
              className="grid"
            >
              {GEMSTONES.map((g, i) => {
                const active = i === index;
                return (
                  <motion.article
                    key={g.id}
                    variants={wrap}
                    initial={false}
                    animate={active ? "show" : "hide"}
                    aria-hidden={!active}
                    className="[grid-area:1/1]"
                    style={{ pointerEvents: active ? "auto" : "none" }}
                  >
                    <motion.p
                      variants={rise}
                      className="eyebrow transition-colors duration-1000"
                      style={{ color: g.theme.accent }}
                    >
                      {String(i + 1).padStart(2, "0")} &nbsp;—&nbsp; {g.mineral}
                    </motion.p>
                    <h3 className="mt-5 overflow-hidden pb-[0.14em] font-display text-display-xl font-light text-ivory">
                      <motion.span variants={mask} className="block">
                        {g.name}
                      </motion.span>
                    </h3>
                    <motion.p
                      variants={rise}
                      className="mt-6 max-w-md text-body-lg font-light text-ivory/75"
                    >
                      {g.intro}
                    </motion.p>
                    <motion.p
                      variants={rise}
                      className="mt-5 text-eyebrow font-medium uppercase text-ivory/40"
                    >
                      {g.cut}
                    </motion.p>
                  </motion.article>
                );
              })}
            </div>

            <div className="mt-9">
              <Magnetic>
                <Button aria-haspopup="dialog" onClick={() => setOpen(true)}>
                  {exhibit.discoverLabel}
                </Button>
              </Magnetic>
            </div>
          </div>

          <div data-controls className="pointer-events-auto mt-10 md:mt-0">
            <GemTabs index={index} onSelect={go} onStep={step} />
          </div>
        </div>
      </div>

      <DiscoverPanel gem={current} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
