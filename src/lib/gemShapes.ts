import { PROFILE, ringPoints } from "./emeraldProfile";

/**
 * Pure cut definitions (no three.js import) shared by the 3D geometry and the
 * SVG fallback imagery. Each gem is a stack of outlines ("rings") from table
 * to keel; all rings of one gem have the same number of points.
 * Axes: y is the stone's vertical axis (table up), x/z lie in the table plane.
 */
export type GemId = "emerald" | "ruby" | "sapphire" | "diamond";
export type Pt = [number, number];

export interface Ring {
  y: number;
  pts: Pt[];
}

export interface GemShape {
  id: GemId;
  rings: Ring[];
  /** Index of the girdle's top ring (rings above it form the crown) */
  girdle: number;
  /** Presentation tilt (radians) so the table faces the viewer */
  tilt: number;
  /** Scale multiplier so all four stones read at a similar size */
  fit: number;
}

const TAU = Math.PI * 2;
const N = 16;

/* Emerald: rectangular step cut with clipped corners (8 points). */
const emerald: GemShape = {
  id: "emerald",
  rings: PROFILE.map((l) => ({ y: l.y, pts: ringPoints(l.s) })),
  girdle: 3,
  tilt: 1.05,
  fit: 1,
};

/* Ruby: elongated oval, domed crown, slightly faceted outline. */
const oval = (y: number, s: number, wobble = 0.035): Ring => ({
  y,
  pts: Array.from({ length: N }, (_, i) => {
    const a = (TAU * i) / N;
    const f = i % 2 === 0 ? 1 : 1 - wobble;
    return [0.88 * s * f * Math.sin(a), 1.12 * s * f * Math.cos(a)] as Pt;
  }),
});
const ruby: GemShape = {
  id: "ruby",
  rings: [
    oval(0.55, 0.5),
    oval(0.45, 0.74),
    oval(0.3, 0.92),
    oval(0.16, 1),
    oval(0.06, 1),
    oval(-0.4, 0.8),
    oval(-0.85, 0.46),
    oval(-1.12, 0.07),
  ],
  girdle: 3,
  tilt: 1.0,
  fit: 0.95,
};

/* Sapphire: pear (teardrop): pointed tip, full rounded base. */
const pear = (y: number, s: number, wobble = 0.04): Ring => ({
  y,
  pts: Array.from({ length: N }, (_, i) => {
    const a = (TAU * i) / N; // 0 = tip, PI = base
    const c = Math.cos(a);
    const w = 0.3 + 0.6 * Math.pow((1 - c) / 2, 0.8);
    const f = i % 2 === 0 ? 1 : 1 - wobble;
    return [1.25 * w * Math.sin(a) * s * f, 1.2 * c * s * f] as Pt;
  }),
});
const sapphire: GemShape = {
  id: "sapphire",
  rings: [
    pear(0.52, 0.5),
    pear(0.42, 0.72),
    pear(0.28, 0.91),
    pear(0.14, 1),
    pear(0.04, 1),
    pear(-0.36, 0.8),
    pear(-0.8, 0.46),
    pear(-1.08, 0.07),
  ],
  girdle: 3,
  tilt: 0.98,
  fit: 0.92,
};

/* Diamond: round brilliant. Alternating radii create the kite and star facets. */
const round = (y: number, even: number, odd: number): Ring => ({
  y,
  pts: Array.from({ length: N }, (_, i) => {
    const a = (TAU * i) / N;
    const r = i % 2 === 0 ? even : odd;
    return [r * Math.sin(a), r * Math.cos(a)] as Pt;
  }),
});
const diamond: GemShape = {
  id: "diamond",
  rings: [
    round(0.62, 0.56, 0.517), // table (octagon)
    round(0.5, 0.72, 0.8), // star facets
    round(0.32, 0.94, 0.91), // upper girdle facets
    round(0.2, 1, 1), // girdle top
    round(0.1, 1, 1), // girdle bottom
    round(-0.45, 0.55, 0.62), // pavilion mains
    round(-1.0, 0.07, 0.07), // culet
  ],
  girdle: 3,
  tilt: 0.78,
  fit: 0.98,
};

export const SHAPES: Record<GemId, GemShape> = {
  emerald,
  ruby,
  sapphire,
  diamond,
};
