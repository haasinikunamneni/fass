import type { LogoSourceConfig } from "./logo/logoMath";

/** sessionStorage flag: the full sequence plays once per browser session. */
export const SESSION_KEY = "fass:loader:v1";

/** The loader owns its own background. It is deliberately NOT the site's #070908. */
export const LOADER_BLACK = "#000000";

export const COLORS = {
  diamondBlue: "#CFE7FF",
  iceWhite: "#F5F9FF",
  reflectionBlue: "#A7C6E6",
} as const;

/**
 * LOGO ARTWORK (swap point).
 * The animation system never contains letterforms. To use the approved FASS
 * artwork, overwrite the two SVG files in /public/brand/loader/ or point
 * `src` somewhere else. Nothing else needs to change.
 */
export const LOGOS: { arabic: LogoSourceConfig; english: LogoSourceConfig } = {
  arabic: {
    src: "/brand/loader/arabic-placeholder.svg",
    strokeWidth: 3,
    step: 2.5,
    ordering: "document",
  },
  english: {
    src: "/brand/loader/english-placeholder.svg",
    strokeWidth: 2.6,
    step: 2.5,
    ordering: "document",
  },
};

/** Where the 2D signature sits on screen (fractions of the viewport). */
export const LOGO_LAYOUT = {
  landscape: { cx: 0.5, cy: 0.77, widthFrac: 0.42, maxWidth: 620 },
  portrait: { cx: 0.5, cy: 0.74, widthFrac: 0.84, maxWidth: 520 },
};

/** Seconds on the master timeline. Edit here to re-pace the film. */
export const TIMING = {
  void: 1.2,
  coalAssemble: [1.2, 4.4],
  arabicDraw: [1.8, 5.4],
  compress: [4.2, 6.0],
  fragment: [6.0, 9.0],
  coalToCrystal: [6.2, 9.8],
  morphToEnglish: [7.2, 10.6],
  cut: [10.0, 13.0],
  motion: [13.0, 21.4],
  closeUp: [16.6, 19.4],
  handoffDuration: 1.9,
  /** Never let the loader run longer than this, whatever happens. */
  hardTimeoutMs: 45000,
  /** Fade of the black overlay into the homepage. */
  exitFade: 0.9,
} as const;

export interface QualitySettings {
  maxDpr: number;
  closeUpDpr: number;
  bounces: number;
  dispersion: boolean;
  debris: number;
  /** Logo particles per viewBox unit of path length. */
  particleDensity: number;
  macroDistance: number;
}

export const QUALITY: Record<"high" | "low", QualitySettings> = {
  high: { maxDpr: 2, closeUpDpr: 1.25, bounces: 5, dispersion: true, debris: 520, particleDensity: 0.55, macroDistance: 1.35 },
  low: { maxDpr: 1.5, closeUpDpr: 1, bounces: 3, dispersion: false, debris: 180, particleDensity: 0.22, macroDistance: 1.9 },
};

export function detectQuality(): "high" | "low" {
  if (typeof window === "undefined") return "high";
  const small = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  return small || coarse || cores <= 4 ? "low" : "high";
}
