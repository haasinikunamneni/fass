/**
 * Pure, DOM-free logo geometry helpers. A logo is a list of strokes; each
 * stroke is a sampled polyline in the SVG's own viewBox coordinates (origin at
 * the viewBox corner). Nothing here knows what the artwork depicts, so the
 * temporary placeholders and the final approved artwork are handled identically.
 */

export interface LogoSourceConfig {
  /** URL of the SVG (served from /public). */
  src: string;
  /** Default stroke width in viewBox units (per-path `data-stroke-width` wins). */
  strokeWidth?: number;
  /** Sampling distance in viewBox units. Smaller = smoother, heavier. */
  step?: number;
  /**
   * How strokes are ordered for drawing.
   * - "document": SVG document order (default; preserves the artist's writing order)
   * - "rtl" / "ltr": sort by bounding box, only when no path has `data-order`
   * A numeric `data-order` attribute on any path always takes priority.
   */
  ordering?: "document" | "rtl" | "ltr";
}

export interface LogoStroke {
  /** Interleaved x,y samples. */
  pts: Float32Array;
  /** Cumulative length at each sample. */
  cum: Float32Array;
  length: number;
  width: number;
}

export interface SampledLogo {
  width: number;
  height: number;
  /** Strokes already sorted into drawing order. */
  strokes: LogoStroke[];
  total: number;
}

export interface StrokeSpan {
  /** Global 0..1 parameter where this stroke starts / ends. */
  start: number;
  end: number;
}

export function strokeSpans(logo: SampledLogo): StrokeSpan[] {
  const spans: StrokeSpan[] = [];
  let acc = 0;
  for (const s of logo.strokes) {
    const start = acc / logo.total;
    acc += s.length;
    spans.push({ start, end: acc / logo.total });
  }
  return spans;
}

/** Index of the last sample whose cumulative length is <= s. */
export function indexAtLength(stroke: LogoStroke, s: number): number {
  const cum = stroke.cum;
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Point on a stroke at arc length s (clamped). Writes [x, y] into out. */
export function pointOnStroke(stroke: LogoStroke, s: number, out: number[]): void {
  const n = stroke.cum.length;
  if (n === 0) {
    out[0] = out[1] = 0;
    return;
  }
  const c = Math.min(Math.max(s, 0), stroke.length);
  const i = Math.min(indexAtLength(stroke, c), n - 2 < 0 ? 0 : n - 2);
  if (n === 1) {
    out[0] = stroke.pts[0];
    out[1] = stroke.pts[1];
    return;
  }
  const seg = stroke.cum[i + 1] - stroke.cum[i] || 1;
  const f = Math.min(Math.max((c - stroke.cum[i]) / seg, 0), 1);
  out[0] = stroke.pts[i * 2] + (stroke.pts[i * 2 + 2] - stroke.pts[i * 2]) * f;
  out[1] = stroke.pts[i * 2 + 1] + (stroke.pts[i * 2 + 3] - stroke.pts[i * 2 + 1]) * f;
}

/**
 * Point at global parameter u in 0..1 across all strokes in drawing order.
 * Returns the stroke index. Used to pair points of two different logos by
 * relative position along the whole signature.
 */
export function pointAtU(logo: SampledLogo, spans: StrokeSpan[], u: number, out: number[]): number {
  const uu = Math.min(Math.max(u, 0), 1);
  let k = spans.length - 1;
  for (let i = 0; i < spans.length; i++) {
    if (uu <= spans[i].end) {
      k = i;
      break;
    }
  }
  const span = spans[k];
  const local = span.end > span.start ? (uu - span.start) / (span.end - span.start) : 0;
  pointOnStroke(logo.strokes[k], local * logo.strokes[k].length, out);
  return k;
}

export function hash1(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
