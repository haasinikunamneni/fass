import type { LogoSourceConfig, LogoStroke, SampledLogo } from "./logoMath";

/**
 * Loads an SVG and samples every <path> into a polyline in viewBox space.
 * Browser-only (uses DOMParser + SVG geometry APIs). Paths are traced exactly as
 * authored: direction, order and shape are never altered. Only <path> elements
 * are read; convert other shapes to paths before export.
 */
export async function loadLogo(cfg: LogoSourceConfig, signal?: AbortSignal): Promise<SampledLogo> {
  const res = await fetch(cfg.src, { signal });
  if (!res.ok) throw new Error(`Logo asset failed to load: ${cfg.src} (${res.status})`);
  return sampleLogoFromSvg(await res.text(), cfg);
}

export function sampleLogoFromSvg(svgText: string, cfg: LogoSourceConfig): SampledLogo {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) {
    throw new Error(`Not a valid SVG: ${cfg.src}`);
  }
  const vb = (root.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some((n) => !Number.isFinite(n)) || vb[2] <= 0 || vb[3] <= 0) {
    throw new Error(`SVG needs a valid viewBox: ${cfg.src}`);
  }
  const [vx, vy, vw, vh] = vb;
  const step = cfg.step ?? 2.5;

  // Attach off-screen so the browser resolves transforms (getScreenCTM).
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;visibility:hidden;pointer-events:none";
  const svg = document.importNode(root, true) as unknown as SVGSVGElement;
  svg.setAttribute("width", String(vw));
  svg.setAttribute("height", String(vh));
  host.appendChild(svg);
  document.body.appendChild(host);

  try {
    const rootCtm = svg.getScreenCTM();
    if (!rootCtm) throw new Error(`Cannot resolve SVG geometry: ${cfg.src}`);
    const rootInv = rootCtm.inverse();

    interface Raw {
      stroke: LogoStroke;
      index: number;
      order: number | null;
      minX: number;
      maxX: number;
    }
    const raws: Raw[] = [];

    Array.from(svg.querySelectorAll("path")).forEach((path, index) => {
      if (path.hasAttribute("data-guide")) return;
      const total = path.getTotalLength();
      const pm = path.getScreenCTM();
      if (!pm || !(total > 0.5)) return;
      const m = rootInv.multiply(pm);
      const n = Math.max(2, Math.ceil(total / step) + 1);
      const pts = new Float32Array(n * 2);
      const cum = new Float32Array(n);
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < n; i++) {
        const p = path.getPointAtLength((total * i) / (n - 1));
        const q = new DOMPoint(p.x, p.y).matrixTransform(m);
        const x = q.x - vx;
        const y = q.y - vy;
        pts[i * 2] = x;
        pts[i * 2 + 1] = y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        if (i > 0) {
          cum[i] = cum[i - 1] + Math.hypot(x - pts[i * 2 - 2], y - pts[i * 2 - 1]);
        }
      }
      const width =
        Number(path.getAttribute("data-stroke-width")) ||
        Number(path.getAttribute("stroke-width")) ||
        cfg.strokeWidth ||
        3;
      const orderAttr = path.getAttribute("data-order");
      const order = orderAttr !== null && Number.isFinite(Number(orderAttr)) ? Number(orderAttr) : null;
      raws.push({ stroke: { pts, cum, length: cum[n - 1], width }, index, order, minX, maxX });
    });

    if (raws.length === 0) throw new Error(`No <path> strokes found in ${cfg.src}`);

    const hasExplicit = raws.some((r) => r.order !== null);
    if (hasExplicit) {
      raws.sort((a, b) => (a.order ?? a.index) - (b.order ?? b.index) || a.index - b.index);
    } else if (cfg.ordering === "rtl") {
      raws.sort((a, b) => b.maxX - a.maxX || a.index - b.index);
    } else if (cfg.ordering === "ltr") {
      raws.sort((a, b) => a.minX - b.minX || a.index - b.index);
    }

    const strokes = raws.map((r) => r.stroke);
    return {
      width: vw,
      height: vh,
      strokes,
      total: strokes.reduce((s, k) => s + k.length, 0),
    };
  } finally {
    host.remove();
  }
}
