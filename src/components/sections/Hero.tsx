"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { heroState } from "@/lib/heroState";
import Button from "@/components/ui/Button";
import Magnetic from "@/components/ui/Magnetic";
import HeroGem from "@/components/three/HeroGem";

const delay = (s: number) => ({ "--delay": `${s}s` }) as CSSProperties;

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);

  // Scroll-linked exit: copy lifts and fades, the gem drifts up and turns
  // (via heroState). Skipped entirely for reduced motion.
  useLayoutEffect(() => {
    const el = section.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(content.current, {
        yPercent: -10,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "75% top",
          scrub: true,
        },
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          heroState.progress = self.progress;
        },
      });
    });

    return () => {
      mm.revert();
      heroState.progress = 0;
    };
  }, []);

  return (
    <section
      id="hero"
      ref={section}
      aria-label="Introduction"
      className="grain relative isolate min-h-[100svh] overflow-hidden bg-obsidian"
    >
      <div aria-hidden className="atmosphere absolute inset-0">
        <div className="atmo-deep" />
        <div className="atmo-core" />
        <div className="atmo-warm" />
        <div className="light-shaft" />
      </div>

      <HeroGem />
      <div aria-hidden className="hero-scrim" />

      <div
        ref={content}
        className="container-maison relative z-10 flex min-h-[100svh] flex-col justify-end pb-20 pt-32 md:pb-24 lg:pb-28"
      >
        <div className="max-w-[44rem] lg:max-w-[50%]">
          <p className="eyebrow fade-up flex items-center gap-4" style={delay(0.9)}>
            <span aria-hidden className="block h-px w-10 bg-champagne/70" />
            The Emerald Collection
          </p>

          <h1 className="mt-6 font-display text-display-xl font-light text-ivory">
            <span className="reveal-line">
              <span style={delay(0.35)}>Born of the Earth.</span>
            </span>
            <span className="reveal-line">
              <span className="italic text-champagne" style={delay(0.5)}>
                Made to Last.
              </span>
            </span>
          </h1>

          <p
            className="fade-up mt-6 max-w-[26rem] text-body-lg font-light text-ivory/70"
            style={delay(1.05)}
          >
            Discover the extraordinary beauty of nature&rsquo;s rarest creations.
          </p>

          <div
            className="fade-up mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-9"
            style={delay(1.2)}
          >
            <Magnetic>
              <Button href="#collections">Explore the Collection</Button>
            </Magnetic>
            <Button href="#story" variant="ghost">
              Discover Our World
            </Button>
          </div>
        </div>
      </div>

      {/* Mineral caption, desktop only */}
      <p
        aria-hidden
        className="eyebrow fade-in absolute right-gutter top-1/2 z-10 hidden -translate-y-1/2 text-champagne/60 [writing-mode:vertical-rl] lg:block"
        style={delay(1.6)}
      >
        Emerald &nbsp;·&nbsp; Be₃Al₂Si₆O₁₈
      </p>

      {/* Scroll indicator */}
      <div
        aria-hidden
        className="fade-in absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 md:bottom-8 md:left-auto md:right-gutter md:translate-x-0"
        style={delay(1.8)}
      >
        <span className="eyebrow hidden text-ivory/50 md:block">Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-ivory/15 md:h-14">
          <span className="scroll-line absolute inset-0 bg-champagne" />
        </span>
      </div>
    </section>
  );
}
