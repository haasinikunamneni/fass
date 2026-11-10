import { PROFILE, ringPoints } from "@/lib/emeraldProfile";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Static SVG emerald (plan view of the same step cut). Shown instantly, while
 * the 3D scene loads, and permanently when WebGL is unavailable.
 */

const pts = (ring: Array<[number, number]>) =>
  ring.map(([x, z]) => `${x.toFixed(3)},${z.toFixed(3)}`).join(" ");

interface Facet {
  points: string;
  fill: string;
}

const FACETS: Facet[] = [];
for (let k = 0; k < 3; k++) {
  const lo = ringPoints(PROFILE[k].s);
  const hi = ringPoints(PROFILE[k + 1].s);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const light = 13 + 24 * Math.abs(Math.sin((i + 1) * 1.7 + k * 0.9));
    FACETS.push({
      points: pts([lo[i], lo[j], hi[j], hi[i]]),
      fill: `hsl(156 70% ${light.toFixed(1)}%)`,
    });
  }
}
const TABLE = pts(ringPoints(PROFILE[0].s));
const PAVILION = PROFILE.slice(4).map((l) => pts(ringPoints(l.s)));

export default function EmeraldFallback({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-[8%] h-[46%] -translate-x-1/2 transition-opacity duration-[1600ms] ease-luxe md:left-auto md:right-[10%] md:top-1/2 md:h-[62%] md:-translate-y-1/2 md:translate-x-0",
        hidden ? "opacity-0" : "opacity-100",
      )}
      style={{ aspectRatio: "2 / 2.6" }}
    >
      <div
        className="fade-in h-full w-full"
        style={{ "--delay": "0.6s" } as CSSProperties}
      >
        <svg
          viewBox="-1 -1.3 2 2.6"
          className="float-soft h-full w-full drop-shadow-[0_0_60px_rgba(16,140,94,0.35)]"
          role="presentation"
        >
        <defs>
          <radialGradient id="tableGlow" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#7dffc6" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#108c5e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#052a1b" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        {PAVILION.map((p, i) => (
          <polygon
            key={i}
            points={p}
            fill="none"
            stroke="#c8b17c"
            strokeOpacity={0.12}
            strokeWidth={0.006}
          />
        ))}
        {FACETS.map((f, i) => (
          <polygon
            key={i}
            points={f.points}
            fill={f.fill}
            stroke="#c8b17c"
            strokeOpacity={0.28}
            strokeWidth={0.007}
            strokeLinejoin="round"
          />
        ))}
        <polygon
          points={TABLE}
          fill="url(#tableGlow)"
          stroke="#c8b17c"
          strokeOpacity={0.4}
          strokeWidth={0.008}
          strokeLinejoin="round"
        />
        </svg>
      </div>
    </div>
  );
}
