"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { getLenis } from "@/lib/lenis";
import LogoStage from "./LogoStage";
import {
  LOADER_BLACK,
  LOGOS,
  QUALITY,
  SESSION_KEY,
  TIMING,
  detectQuality,
} from "./config";
import {
  buildHandoff,
  buildIdleLoop,
  buildLogoOnlyTimeline,
  buildMainTimeline,
  type Timeline,
} from "./choreography";
import { loadLogo } from "./logo/sampleLogo";
import type { SampledLogo } from "./logo/logoMath";
import { createLogoProgress, createSceneState } from "./state";

const LoaderScene = dynamic(() => import("./diamond/LoaderScene"), { ssr: false });

type Phase = "pending" | "play" | "off";

function shouldPlay(): boolean {
  const flag = new URLSearchParams(window.location.search).get("loader");
  if (flag === "0") return false;
  if (flag === "1") return true; // force replay for testing
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") return false;
  } catch {
    /* storage blocked: play */
  }
  return true;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Cinematic loading experience. Mounted once in the root layout, outside the
 * page tree, so no existing component is touched. It owns an isolated pure-black
 * (#000000) layer; the site's own #070908 is only revealed by the final fade.
 *
 * The server renders the black cover so the homepage never flashes; an inline
 * script in <head> hides the cover (data-loader="off") for repeat visits within
 * a session and for reduced-motion users.
 */
export default function FassLoader() {
  const [phase, setPhase] = useState<Phase>("pending");
  const [logos, setLogos] = useState<{ a: SampledLogo; b: SampledLogo } | null>(null);
  const [useScene, setUseScene] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">("high");

  const played = useRef(false);
  const locked = useRef(false);
  const S = useRef(createSceneState());
  const L = useRef(createLogoProgress());
  const finishRef = useRef<() => void>(() => {});
  const handlers = useRef({ ready: () => {}, error: () => {} });

  // 1) Decide whether to play at all.
  useEffect(() => {
    if (shouldPlay()) {
      played.current = true;
      setPhase("play");
    } else {
      setPhase("off");
    }
  }, []);

  // 2) Run the sequence.
  useEffect(() => {
    if (phase !== "play") return;

    Object.assign(S.current, createSceneState());
    Object.assign(L.current, createLogoProgress());
    const scene = S.current;
    const logo = L.current;

    const q = detectQuality();
    const webgl = hasWebGL();
    setQuality(q);
    setUseScene(webgl);

    let disposed = false;
    let started = false;
    let finished = false;
    let waiting = false;
    let assetsReady = false;
    let sceneReady = false;
    let sampled: { a: SampledLogo; b: SampledLogo } | null = null;
    let main: Timeline | null = null;
    let idle: Timeline | null = null;
    let handoff: Timeline | null = null;
    const timers: number[] = [];

    lockScroll();
    locked.current = true;
    const raf = requestAnimationFrame(() => getLenis()?.stop());

    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      main?.kill();
      idle?.kill();
      handoff?.kill();
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setPhase("off");
    };
    finishRef.current = finish;

    const runHandoff = () => {
      if (finished || handoff) return;
      idle?.kill();
      idle = null;
      handoff = buildHandoff(scene, logo, finish);
    };

    const begin = () => {
      if (started || disposed || !sampled) return;
      started = true;
      main = webgl ? buildMainTimeline(scene, logo, q) : buildLogoOnlyTimeline(logo);
      main.eventCallback("onComplete", () => {
        if (assetsReady) {
          if (webgl) runHandoff();
          else finish();
        } else {
          waiting = true;
          if (webgl) idle = buildIdleLoop(scene);
        }
      });
      main.play(0);
    };

    // Essential site assets load in parallel; the film never waits for them
    // unless it finishes first, in which case it holds on the final scene.
    const fontsReady = (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined);
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    Promise.all([fontsReady, loaded]).then(() => {
      assetsReady = true;
      if (waiting) {
        if (webgl) runHandoff();
        else finish();
      }
    });

    const ac = new AbortController();
    Promise.all([loadLogo(LOGOS.arabic, ac.signal), loadLogo(LOGOS.english, ac.signal)])
      .then(([a, b]) => {
        if (disposed) return;
        sampled = { a, b };
        setLogos(sampled);
        if (!webgl) begin();
        else if (sceneReady) begin();
      })
      .catch(() => finish()); // logo failed to load: go straight to the homepage

    // If the 3D chunk never becomes ready, continue with the 2D signature only.
    timers.push(
      window.setTimeout(() => {
        if (!started && sampled && !sceneReady) {
          setUseScene(false);
          main = buildLogoOnlyTimeline(logo);
          started = true;
          main.eventCallback("onComplete", () => finish());
          main.play(0);
        }
      }, 9000),
    );

    // Hard ceiling: the loader can never trap the visitor.
    timers.push(window.setTimeout(() => finish(), TIMING.hardTimeoutMs));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);

    handlers.current.ready = () => {
      sceneReady = true;
      if (sampled) begin();
    };
    handlers.current.error = () => finish();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      ac.abort();
      window.removeEventListener("keydown", onKey);
      main?.kill();
      idle?.kill();
      handoff?.kill();
      if (locked.current) {
        locked.current = false;
        unlockScroll();
      }
    };
  }, [phase]);

  if (phase === "off" && !played.current) return null;

  const onExitComplete = () => {
    if (locked.current) {
      locked.current = false;
      unlockScroll();
    }
    document.documentElement.setAttribute("data-loader", "off");
  };

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {phase !== "off" && (
        <motion.div
          key="fass-loader"
          id="fass-loader"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Loading"
          initial={false}
          exit={{ opacity: 0, transition: { duration: TIMING.exitFade, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: LOADER_BLACK, overflow: "hidden" }}
        >
          {phase === "play" && useScene && (
            <LoaderScene
              state={S.current}
              quality={QUALITY[quality]}
              onReady={() => handlers.current.ready()}
              onError={() => handlers.current.error()}
            />
          )}
          {logos && (
            <LogoStage
              arabic={logos.a}
              english={logos.b}
              progress={L}
              density={QUALITY[quality].particleDensity}
            />
          )}
          <button
            type="button"
            onClick={() => finishRef.current()}
            className="sr-only bg-black px-4 py-2 text-eyebrow uppercase text-ivory focus:not-sr-only focus:absolute focus:bottom-6 focus:left-1/2 focus:-translate-x-1/2"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
