/**
 * Round brilliant-cut geometry, built from first principles (no dependencies).
 *
 * Facets: 1 table, 8 star, 8 bezel (kite), 16 upper-girdle, 16 girdle band,
 * 16 lower-girdle, 8 pavilion main = 73 planar facets. Kite facets are made
 * exactly planar by construction (see `kitePlanarRadius`).
 *
 * Output:
 * - `positions`: non-indexed triangles (each facet fan-triangulated, then
 *   subdivided) so a vertex shader can displace them deterministically
 *   from position alone (no cracks) to morph the cut stone into rough shapes.
 * - `planes`: one [nx, ny, nz, d] per facet (outward normal, n·p = d). The
 *   fragment shader ray-traces light inside the convex solid against these.
 */

type V3 = [number, number, number];

export const FACET_COUNT = 73;

const H = 0.32; // crown height (table above girdle)
const G = 0.03; // girdle thickness
const PAV = 0.86; // pavilion depth below the girdle
const TABLE_R = 0.55;
const CROWN_MID_R = 0.78; // radial position of the star/kite midline on the crown
const PAV_MID_R = 0.6; // same for the pavilion
const STEP = Math.PI / 4;
const HALF = Math.PI / 8;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const polar = (a: number, r: number, y: number): V3 => [r * Math.cos(a), y, r * Math.sin(a)];

/** Newell normal of a polygon (robust for planar quads and triangles). */
function newell(poly: V3[]): V3 {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

export interface DiamondData {
  positions: Float32Array;
  facetIds: Float32Array;
  planes: Float32Array;
  planeCount: number;
}

export function buildDiamond(subdivisions = 2): DiamondData {
  const culetY = -(G + PAV);
  const shiftY = -(H + culetY) / 2; // centre the stone vertically on the origin

  // Ring points
  const T: V3[] = [];
  const B: V3[] = [];
  const U: V3[] = [];
  const Bl: V3[] = [];
  const Ul: V3[] = [];
  const S: V3[] = [];
  const L: V3[] = [];

  // Kite midline points lie on the line joining the table corner to the girdle
  // point, so each kite is exactly planar.
  const starR = CROWN_MID_R / Math.cos(HALF);
  const starY = H * (1 - (CROWN_MID_R - TABLE_R) / (1 - TABLE_R));
  const pavR = PAV_MID_R / Math.cos(HALF);
  const pavY = culetY + (-G - culetY) * PAV_MID_R;

  for (let i = 0; i < 8; i++) {
    const a = i * STEP;
    T.push(polar(a, TABLE_R, H));
    B.push(polar(a, 1, 0));
    U.push(polar(a + HALF, 1, 0));
    Bl.push(polar(a, 1, -G));
    Ul.push(polar(a + HALF, 1, -G));
    S.push(polar(a + HALF, starR, starY));
    L.push(polar(a + HALF, pavR, pavY));
  }
  const C: V3 = [0, culetY, 0];

  const facets: V3[][] = [];
  facets.push(T.slice()); // table
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const p = (i + 7) % 8;
    facets.push([T[i], T[j], S[i]]); // star
    facets.push([T[i], S[p], B[i], S[i]]); // bezel kite
    facets.push([S[i], B[i], U[i]]); // upper girdle (2 per gap)
    facets.push([S[i], U[i], B[j]]);
  }

  // Girdle band: 16 vertical quads around the alternating B/U ring.
  const ringTop: V3[] = [];
  const ringBot: V3[] = [];
  for (let i = 0; i < 8; i++) {
    ringTop.push(B[i], U[i]);
    ringBot.push(Bl[i], Ul[i]);
  }
  for (let k = 0; k < 16; k++) {
    const k2 = (k + 1) % 16;
    facets.push([ringTop[k], ringTop[k2], ringBot[k2], ringBot[k]]);
  }
  // Pavilion
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const p = (i + 7) % 8;
    facets.push([L[i], Bl[i], Ul[i]]); // lower girdle (2 per gap)
    facets.push([L[i], Ul[i], Bl[j]]);
    facets.push([C, L[p], Bl[i], L[i]]); // pavilion main
  }

  // Apply the vertical shift, build planes (outward) and triangles.
  const interior: V3 = [0, 0, 0];
  const planes: number[] = [];
  const tris: V3[][] = [];
  const triFacet: number[] = [];

  facets.forEach((poly, fi) => {
    const P = poly.map((v): V3 => [v[0], v[1] + shiftY, v[2]]);
    let n = newell(P);
    let d = dot(n, P[0]);
    if (dot(n, interior) > d) {
      n = [-n[0], -n[1], -n[2]];
      d = -d;
    }
    planes.push(n[0], n[1], n[2], d);
    for (let k = 1; k < P.length - 1; k++) {
      tris.push([P[0], P[k], P[k + 1]]);
      triFacet.push(fi);
    }
  });

  // Midpoint subdivision (planar facets stay planar).
  let work = tris;
  let ids = triFacet;
  for (let s = 0; s < subdivisions; s++) {
    const next: V3[][] = [];
    const nextIds: number[] = [];
    work.forEach((t, i) => {
      const [a, b, c] = t;
      const ab: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const bc: V3 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2, (b[2] + c[2]) / 2];
      const ca: V3 = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2, (c[2] + a[2]) / 2];
      next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
      for (let q = 0; q < 4; q++) nextIds.push(ids[i]);
    });
    work = next;
    ids = nextIds;
  }

  const positions = new Float32Array(work.length * 9);
  const facetIds = new Float32Array(work.length * 3);
  work.forEach((t, i) => {
    for (let v = 0; v < 3; v++) {
      positions.set(t[v], i * 9 + v * 3);
      facetIds[i * 3 + v] = ids[i];
    }
  });

  return { positions, facetIds, planes: new Float32Array(planes), planeCount: planes.length / 4 };
}

export const _internal = { sub, cross, len }; // exported for tests only
