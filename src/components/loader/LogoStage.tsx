"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { COLORS, LOGO_LAYOUT } from "./config";
import {
  hash1,
  pointAtU,
  strokeSpans,
  indexAtLength,
  type LogoStroke,
  type SampledLogo,
  type StrokeSpan,
} from "./logo/logoMath";
import type { LogoProgress } from "./state";

interface Props {
  arabic: SampledLogo | null;
  english: SampledLogo | null;
  progress: MutableRefObject<LogoProgress>;
  /** Logo particles per unit of path length. */
  density: number;
}

interface Fit {
  s: number;
  ox: number;
  oy: number;
}

interface Particle {
  u: number;
  depart: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  size: number;
  bright: number;
}

const FLIGHT = 0.36; // fraction of the morph a particle spends travelling
const SPREAD = 0.56; // fraction of the morph over which departures are spread

function fitLogo(logo: SampledLogo, boxW: number, boxH: number, cx: number, cy: number): Fit {
  const s = Math.min(boxW / logo.width, boxH / logo.height);
  return { s, ox: cx - (logo.width * s) / 2, oy: cy - (logo.height * s) / 2 };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Canvas-2D signature layer. It receives two sampled logos and knows nothing
 * about what they depict: it draws strokes in order with travelling "fireflies",
 * then moves particles from points on logo A to the points at the same relative
 * position along logo B. The transition never alters either letterform.
 */
export default function LogoStage({ arabic, english, progress, density }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ arabic, english, density });
  dataRef.current = { arabic, english, density };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let fitA: Fit | null = null;
    let fitB: Fit | null = null;
    let spansA: StrokeSpan[] = [];
    let spansB: StrokeSpan[] = [];
    let particles: Particle[] = [];
    let builtFor: unknown = null;
    const tmp: number[] = [0, 0];
    const tmp2: number[] = [0, 0];

    const rebuild = () => {
      const { arabic: A, english: B, density: dens } = dataRef.current;
      if (!A || !B || w === 0) return;
      const lay = h > w ? LOGO_LAYOUT.portrait : LOGO_LAYOUT.landscape;
      const boxW = Math.min(w * lay.widthFrac, lay.maxWidth);
      const boxH = boxW * 0.46;
      fitA = fitLogo(A, boxW, boxH, w * lay.cx, h * lay.cy);
      fitB = fitLogo(B, boxW, boxH, w * lay.cx, h * lay.cy);
      spansA = strokeSpans(A);
      spansB = strokeSpans(B);
      const n = Math.max(40, Math.round(((A.total + B.total) / 2) * dens));
      const out: Particle[] = [];
      for (let i = 0; i < n; i++) {
        const u = (i + hash1(i * 3.1)) / n;
        pointAtU(A, spansA, u, tmp);
        const ax = fitA.ox + tmp[0] * fitA.s;
        const ay = fitA.oy + tmp[1] * fitA.s;
        pointAtU(B, spansB, u, tmp);
        const bx = fitB.ox + tmp[0] * fitB.s;
        const by = fitB.oy + tmp[1] * fitB.s;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const lift = (hash1(i * 7.7) - 0.5) * boxW * 0.35;
        out.push({
          u,
          depart: u * SPREAD + (hash1(i * 5.3) - 0.5) * 0.04,
          ax,
          ay,
          bx,
          by,
          cx: mx + (hash1(i * 1.9) - 0.5) * boxW * 0.2,
          cy: my - Math.abs(lift) - boxW * 0.05,
          size: 0.7 + hash1(i * 9.1) * 1.8,
          bright: 0.5 + hash1(i * 2.3) * 0.5,
        });
      }
      particles = out;
      builtFor = [A, B, w, h, dens];
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      builtFor = null;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /** Draw part of a stroke [fromS, toS] in arc length, brightness-modulated. */
    const drawStroke = (
      st: LogoStroke,
      fit: Fit,
      fromS: number,
      toS: number,
      alpha: number,
      t: number,
      headS: number | null,
    ) => {
      if (toS <= fromS || alpha <= 0.002) return;
      const i0 = indexAtLength(st, fromS);
      const i1 = Math.min(indexAtLength(st, toS) + 1, st.cum.length - 1);
      const CH = 6;
      for (let a = i0; a < i1; a += CH) {
        const b = Math.min(a + CH + 1, i1);
        const s = st.cum[a];
        let bri = 0.72 + 0.14 * Math.sin(t * 2.2 + s * 0.045);
        if (headS !== null) {
          const age = headS - s;
          bri = 0.4 + 0.6 * Math.exp(-age / 70);
          bri *= 0.9 + 0.1 * Math.sin(t * 9 + s * 0.2);
        }
        ctx.beginPath();
        ctx.moveTo(fit.ox + st.pts[a * 2] * fit.s, fit.oy + st.pts[a * 2 + 1] * fit.s);
        for (let k = a + 1; k <= b; k++) {
          ctx.lineTo(fit.ox + st.pts[k * 2] * fit.s, fit.oy + st.pts[k * 2 + 1] * fit.s);
        }
        const lw = st.width * fit.s;
        ctx.globalAlpha = alpha * bri * 0.12;
        ctx.strokeStyle = COLORS.reflectionBlue;
        ctx.lineWidth = lw * 3.4;
        ctx.stroke();
        ctx.globalAlpha = alpha * bri * 0.62;
        ctx.strokeStyle = COLORS.diamondBlue;
        ctx.lineWidth = lw;
        ctx.stroke();
        ctx.globalAlpha = alpha * bri * 0.9;
        ctx.strokeStyle = COLORS.iceWhite;
        ctx.lineWidth = Math.max(0.6, lw * 0.38);
        ctx.stroke();
      }
    };

    const glow = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(245,249,255,${a})`);
      g.addColorStop(0.35, `rgba(207,231,255,${a * 0.45})`);
      g.addColorStop(1, "rgba(207,231,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const { arabic: A, english: B } = dataRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!A || !B) return;
      const cur = [A, B, w, h, dataRef.current.density];
      if (!builtFor || (builtFor as unknown[]).some((v, i) => v !== cur[i])) rebuild();
      if (!fitA || !fitB) return;

      const p = progress.current;
      const t = now / 1000;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "lighter";

      // ---- Logo A: written by fireflies, then eroded as particles depart ----
      const eraseFront = p.morph > 0 ? clamp01(p.morph / SPREAD) : 0;
      if (p.alphaA > 0.002 && eraseFront < 1) {
        const writing = p.drawA > 0 && p.drawA < 1;
        A.strokes.forEach((st, k) => {
          const sp = spansA[k];
          const span = sp.end - sp.start || 1;
          const f1 = clamp01((p.drawA - sp.start) / span);
          const f0 = clamp01((eraseFront - sp.start) / span);
          const head = writing && f1 > 0 && f1 < 1 ? f1 * st.length : null;
          drawStroke(st, fitA!, f0 * st.length, f1 * st.length, p.alphaA, t, head);
        });
        if (writing) {
          // The firefly head plus a few lagging fireflies on the same path.
          pointAtU(A, spansA, p.drawA, tmp);
          glow(fitA.ox + tmp[0] * fitA.s, fitA.oy + tmp[1] * fitA.s, 11, 0.9 * p.alphaA);
          for (let j = 1; j <= 7; j++) {
            const u = p.drawA - j * 0.011 - hash1(j) * 0.01;
            if (u < 0) continue;
            pointAtU(A, spansA, u, tmp2);
            const wob = Math.sin(t * 5 + j * 1.7) * 3.5;
            const nx = Math.cos(t * 3 + j) * wob;
            const ny = Math.sin(t * 3.4 + j) * wob;
            const x = fitA.ox + tmp2[0] * fitA.s + nx;
            const y = fitA.oy + tmp2[1] * fitA.s + ny;
            glow(x, y, 2.5 + hash1(j * 2) * 3, (0.8 - j * 0.09) * p.alphaA);
          }
        }
      }

      // ---- Particles carrying logo A into logo B ----
      if (p.morph > 0 && p.morph < 1 && p.alphaA > 0.002) {
        for (const q of particles) {
          const k = (p.morph - q.depart) / FLIGHT;
          if (k <= 0 || k >= 1) continue;
          const e = easeInOut(k);
          const omt = 1 - e;
          const x = omt * omt * q.ax + 2 * omt * e * q.cx + e * e * q.bx;
          const y = omt * omt * q.ay + 2 * omt * e * q.cy + e * e * q.by;
          const k2 = Math.max(0, k - 0.06);
          const e2 = easeInOut(k2);
          const o2 = 1 - e2;
          const x2 = o2 * o2 * q.ax + 2 * o2 * e2 * q.cx + e2 * e2 * q.bx;
          const y2 = o2 * o2 * q.ay + 2 * o2 * e2 * q.cy + e2 * e2 * q.by;
          const fade = Math.sin(Math.PI * k) * 0.8 + 0.2;
          ctx.globalAlpha = fade * q.bright * 0.55 * p.alphaA;
          ctx.strokeStyle = COLORS.diamondBlue;
          ctx.lineWidth = q.size * 0.7;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.globalAlpha = fade * q.bright * p.alphaA;
          ctx.fillStyle = COLORS.iceWhite;
          ctx.beginPath();
          ctx.arc(x, y, q.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- Logo B: revealed where particles have arrived ----
      if (p.morph > 0 && p.alphaB > 0.002) {
        const front = clamp01((p.morph - FLIGHT) / SPREAD);
        const settled = p.morph >= 1;
        const sweep = (t * 0.12) % 1.4;
        B.strokes.forEach((st, k) => {
          const sp = spansB[k];
          const span = sp.end - sp.start || 1;
          const f1 = clamp01((front - sp.start) / span);
          const head = !settled && f1 > 0 && f1 < 1 ? f1 * st.length : null;
          drawStroke(st, fitB!, 0, f1 * st.length, p.alphaB, t, head);
        });
        if (settled) {
          // A slow glint travelling along the finished signature.
          const u = Math.min(sweep, 1);
          if (sweep <= 1) {
            pointAtU(B, spansB, u, tmp);
            glow(fitB.ox + tmp[0] * fitB.s, fitB.oy + tmp[1] * fitB.s, 9, 0.55 * p.alphaB);
          }
        } else if (front > 0 && front < 1) {
          pointAtU(B, spansB, front, tmp);
          glow(fitB.ox + tmp[0] * fitB.s, fitB.oy + tmp[1] * fitB.s, 8, 0.7 * p.alphaB);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

