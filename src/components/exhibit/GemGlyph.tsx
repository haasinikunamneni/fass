import { useId, useMemo } from "react";
import type { Gemstone } from "@/content/gemstones";
import { SHAPES, type Pt } from "@/lib/gemShapes";

const pts = (ring: Pt[]) =>
  ring.map(([x, z]) => `${x.toFixed(3)},${z.toFixed(3)}`).join(" ");

/**
 * Plan view of a stone's actual cut, drawn from the same ring data as the 3D
 * geometry. Used as fallback imagery (no WebGL / while loading) and as the
 * small specimen marks in the selector.
 */
export default function GemGlyph({
  gem,
  className,
  detailed = true,
}: {
  gem: Gemstone;
  className?: string;
  detailed?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const shape = SHAPES[gem.id];
  const { hue, sat, lMin, lMax } = gem.theme;

  const { facets, table, pavilion } = useMemo(() => {
    const out: Array<{ points: string; fill: string }> = [];
    for (let k = 0; k < shape.girdle; k++) {
      const hi = shape.rings[k].pts;
      const lo = shape.rings[k + 1].pts;
      for (let i = 0; i < hi.length; i++) {
        const j = (i + 1) % hi.length;
        const l = lMin + (lMax - lMin) * Math.abs(Math.sin((i + 1) * 1.7 + k * 0.9));
        out.push({
          points: pts([hi[i], hi[j], lo[j], lo[i]]),
          fill: `hsl(${hue} ${sat}% ${l.toFixed(1)}%)`,
        });
      }
    }
    return {
      facets: out,
      table: pts(shape.rings[0].pts),
      pavilion: shape.rings.slice(shape.girdle + 1).map((r) => pts(r.pts)),
    };
  }, [shape, hue, sat, lMin, lMax]);

  const mid = `hsl(${hue} ${sat}% ${(lMin + lMax) / 2}%)`;
  const light = `hsl(${hue} ${Math.min(100, sat + 10)}% ${Math.min(92, lMax + 28)}%)`;
  const dark = `hsl(${hue} ${sat}% ${Math.max(4, lMin - 6)}%)`;

  return (
    <svg
      viewBox="-1.05 -1.35 2.1 2.7"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-t`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={light} stopOpacity="0.9" />
          <stop offset="55%" stopColor={mid} stopOpacity="0.6" />
          <stop offset="100%" stopColor={dark} stopOpacity="0.95" />
        </radialGradient>
      </defs>
      {detailed &&
        pavilion.map((p, i) => (
          <polygon
            key={i}
            points={p}
            fill="none"
            stroke="#c8b17c"
            strokeOpacity={0.12}
            strokeWidth={0.006}
          />
        ))}
      {facets.map((f, i) => (
        <polygon
          key={i}
          points={f.points}
          fill={f.fill}
          stroke="#c8b17c"
          strokeOpacity={0.28}
          strokeWidth={detailed ? 0.007 : 0.02}
          strokeLinejoin="round"
        />
      ))}
      <polygon
        points={table}
        fill={`url(#${uid}-t)`}
        stroke="#c8b17c"
        strokeOpacity={0.4}
        strokeWidth={detailed ? 0.008 : 0.022}
        strokeLinejoin="round"
      />
    </svg>
  );
}
