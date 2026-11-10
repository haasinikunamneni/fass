import { gsap } from "gsap";
import { QUALITY, TIMING as T } from "./config";
import type { LogoProgress, SceneState } from "./state";

type Quality = keyof typeof QUALITY;
export type Timeline = gsap.core.Timeline;
const len = (r: readonly [number, number]) => r[1] - r[0];

/**
 * The whole film as one GSAP timeline that only tweens plain state objects.
 * Rendering lives elsewhere (diamond/LoaderScene, LogoStage), so re-pacing or
 * re-staging the sequence never touches shaders, and swapping logo artwork
 * never touches this file.
 */
export function buildMainTimeline(S: SceneState, L: LogoProgress, quality: Quality): gsap.core.Timeline {
  const q = QUALITY[quality];
  const k = quality === "low" ? 0.6 : 1; // calmer camera/rotation on phones
  const tl = gsap.timeline({ paused: true });
  S.macro = q.macroDistance;

  // ACT II - crayon coal gathers, wobbles slowly, then compresses.
  tl.to(S, { assemble: 1, duration: len(T.coalAssemble), ease: "power2.out" }, T.coalAssemble[0]);
  tl.to(S, { ry: 1.1, rx: 0.35, rz: -0.05, duration: 4.8, ease: "sine.inOut" }, 1.2);
  tl.to(S, { compress: 1, scale: 0.7, duration: len(T.compress), ease: "power2.inOut" }, T.compress[0]);

  // ACT III - the Arabic signature is written by fireflies, simultaneously.
  tl.to(L, { drawA: 1, duration: len(T.arabicDraw), ease: "sine.inOut" }, T.arabicDraw[0]);

  // ACT IV - fragmentation, crystallisation, rough diamond.
  tl.to(S, { frag: 1, duration: len(T.fragment), ease: "power1.inOut" }, T.fragment[0]);
  tl.to(S, { debris: 1, duration: 3.2, ease: "none" }, T.fragment[0]);
  tl.to(S, { coalMix: 0, duration: 3.2, ease: "sine.inOut" }, T.coalToCrystal[0]);
  tl.to(S, { crystal: 1, duration: 3.4, ease: "power1.inOut" }, T.coalToCrystal[0] + 0.2);
  tl.to(S, { scale: 0.78, ry: 2.4, rx: 0.5, duration: 4, ease: "sine.inOut" }, T.fragment[0]);
  tl.to(S, { light: 1.2, duration: 7, ease: "none" }, T.fragment[0]);

  // ACT V - Arabic dissolves into particles that form English.
  tl.to(L, { morph: 1, duration: len(T.morphToEnglish), ease: "sine.inOut" }, T.morphToEnglish[0]);

  // ACT VI - the cut: facets emerge and align, the stone turns to show its crown.
  tl.to(S, { cut: 1, duration: len(T.cut), ease: "power3.inOut" }, T.cut[0]);
  tl.to(S, { scale: 0.62, rx: 0.55, ry: 3.6, rz: 0.1, spin: 0.28, duration: len(T.cut), ease: "power2.inOut" }, T.cut[0]);

  // ACT VII - flight and camera. The stone and camera run on separate paths.
  const [m0, m1] = T.motion;
  tl.to(S, { pathT: 1, duration: m1 - m0 - 0.2, ease: "sine.inOut" }, m0);
  tl.to(S, { camT: 1, duration: m1 - m0, ease: "sine.inOut" }, m0 + 0.4);
  tl.to(S, { follow: 0.9, duration: 2, ease: "power2.inOut" }, m0);
  tl.to(S, { light: 8, duration: m1 - m0 + 2, ease: "none" }, m0);
  tl.to(S, { spin: 0.5, duration: 4, ease: "sine.inOut" }, m0);
  tl.to(S, { spin: 0.3, duration: 4.4, ease: "sine.inOut" }, m0 + 4);
  tl.to(S, { rx: 0.55 + 0.35 * k, rz: 0.7 * k, duration: 3.6, ease: "sine.inOut" }, m0);
  tl.to(S, { rx: 0.2, rz: -0.5 * k, duration: 2.8, ease: "sine.inOut" }, T.closeUp[0]);
  tl.to(S, { rx: 0.55, rz: 0.1, duration: 2, ease: "sine.inOut" }, T.closeUp[1]);

  // Macro close-up on the facets, then a controlled pull-back.
  tl.to(S, { closeness: 1, duration: 1.6, ease: "power3.inOut" }, T.closeUp[0]);
  tl.to(S, { macro: q.macroDistance * 0.8, duration: 1.2, ease: "sine.inOut" }, T.closeUp[0] + 1.6);
  tl.to(S, { closeness: 0, duration: 1.6, ease: "power2.inOut" }, T.closeUp[1]);
  tl.to(L, { alphaB: 0.45, duration: 1.2, ease: "sine.inOut" }, T.closeUp[0] - 0.2);
  tl.to(L, { alphaB: 0.9, duration: 1.4, ease: "sine.inOut" }, T.closeUp[1]);

  tl.addLabel("ready", m1);
  tl.to({}, { duration: 0.001 }, m1);
  return tl;
}

/** Fallback when WebGL is unavailable: the signature still writes and transforms. */
export function buildLogoOnlyTimeline(L: LogoProgress): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  tl.to(L, { drawA: 1, duration: 3.6, ease: "sine.inOut" }, 1);
  tl.to(L, { morph: 1, duration: 3.4, ease: "sine.inOut" }, 5.4);
  tl.to({}, { duration: 0.001 }, 9.4);
  return tl;
}

/** Holds the final scene gracefully if essential assets are still loading. */
export function buildIdleLoop(S: SceneState): gsap.core.Timeline {
  const tl = gsap.timeline({ repeat: -1, yoyo: true });
  tl.to(S, { pathT: 0.62, camT: 0.5, duration: 7, ease: "sine.inOut" });
  return tl;
}

/**
 * Final movement: the stone approaches the lens, facets fill the frame and a
 * controlled reflection passes across them. The black overlay then fades away
 * (it never flashes white); the homepage emerges from that fade.
 */
export function buildHandoff(
  S: SceneState,
  L: LogoProgress,
  onDone: () => void,
  duration: number = T.handoffDuration,
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete: onDone });
  tl.to(S, { follow: 1, closeness: 0, duration: 0.4, ease: "power1.out" }, 0);
  tl.to(S, { approach: 1, scale: 0.85, duration, ease: "power3.in" }, 0);
  tl.to(S, { light: "+=1.8", duration, ease: "power1.inOut" }, 0);
  tl.to(L, { alphaA: 0, alphaB: 0, duration: duration * 0.55, ease: "power1.in" }, 0);
  return tl;
}
