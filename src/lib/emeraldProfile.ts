/**
 * Emerald (step) cut profile, shared by the 3D geometry and the SVG fallback.
 * The long axis of the stone is z; y is the stone's vertical axis (table up).
 */
export const HALF_WIDTH = 0.82;
export const HALF_LENGTH = 1.12;
export const CHAMFER = 0.34;

export interface ProfileLevel {
  /** Height of this outline */
  y: number;
  /** Scale of the outline relative to the girdle (1 = girdle) */
  s: number;
}

/** Table → crown steps → girdle → pavilion steps → keel. */
export const PROFILE: ProfileLevel[] = [
  { y: 0.6, s: 0.6 }, // table
  { y: 0.48, s: 0.74 }, // crown step 1
  { y: 0.34, s: 0.88 }, // crown step 2
  { y: 0.18, s: 1.0 }, // girdle (top)
  { y: 0.08, s: 1.0 }, // girdle (bottom)
  { y: -0.28, s: 0.8 }, // pavilion step 1
  { y: -0.66, s: 0.56 }, // pavilion step 2
  { y: -1.02, s: 0.3 }, // pavilion step 3
  { y: -1.26, s: 0.05 }, // keel
];

/** Octagonal (clipped-corner rectangle) outline as [x, z] pairs, 8 points. */
export function ringPoints(s: number): Array<[number, number]> {
  const hw = HALF_WIDTH * s;
  const hl = HALF_LENGTH * s;
  const c = CHAMFER * s;
  return [
    [-hw + c, hl],
    [hw - c, hl],
    [hw, hl - c],
    [hw, -hl + c],
    [hw - c, -hl],
    [-hw + c, -hl],
    [-hw, -hl + c],
    [-hw, hl - c],
  ];
}
