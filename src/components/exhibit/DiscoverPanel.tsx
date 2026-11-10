"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Gemstone } from "@/content/gemstones";
import { EASE_LUXE } from "@/lib/animation";
import { hexToRgb } from "@/lib/color";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { CloseIcon } from "@/components/ui/Icons";

interface Props {
  gem: Gemstone;
  open: boolean;
  onClose: () => void;
}

export default function DiscoverPanel({ gem, open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && <Panel key={gem.id} gem={gem} onClose={onClose} />}
    </AnimatePresence>
  );
}

function Panel({ gem, onClose }: { gem: Gemstone; onClose: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(onClose);
  const reduce = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");

  const sheet = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : wide
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

  const glow = hexToRgb(gem.theme.glow);
  const deep = hexToRgb(gem.theme.deep);

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discover-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_LUXE }}
      className="fixed inset-0 z-[60]"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm"
      />

      <motion.aside
        {...sheet}
        transition={{ duration: 0.9, ease: EASE_LUXE }}
        data-lenis-prevent
        className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto border-t border-ivory/10 bg-obsidian md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(34rem,92vw)] md:border-l md:border-t-0"
        style={{
          backgroundImage: `radial-gradient(90% 60% at 100% 0%, rgb(${glow} / 0.28), transparent 70%), linear-gradient(to bottom, rgb(${deep} / 0.9), rgb(var(--c-obsidian)))`,
        }}
      >
        <div className="flex min-h-full flex-col px-gutter py-8 md:px-12 md:py-12">
          <div className="flex items-start justify-between">
            <p className="eyebrow" style={{ color: gem.theme.accent }}>
              {gem.mineral} &nbsp;·&nbsp; {gem.cut}
            </p>
            <button
              type="button"
              data-autofocus
              aria-label="Close"
              onClick={onClose}
              className="-mr-3 -mt-3 inline-flex h-11 w-11 items-center justify-center text-ivory/80 transition-colors duration-500 ease-luxe hover:text-champagne"
            >
              <CloseIcon />
            </button>
          </div>

          <h2
            id="discover-title"
            className="mt-8 font-display text-display-lg font-light text-ivory"
          >
            {gem.name}
          </h2>

          <div className="mt-8 space-y-5 text-body font-light text-ivory/70">
            {gem.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ivory/10 pt-8">
            {gem.facts.map((f) => (
              <div key={f.label}>
                <dt className="text-eyebrow font-medium uppercase text-champagne/80">
                  {f.label}
                </dt>
                <dd className="mt-2 font-display text-xl text-ivory">{f.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-auto pt-10 text-caption text-ivory/40">
            Cut shown in the exhibit: {gem.cut.toLowerCase()} (illustrative).
          </p>
        </div>
      </motion.aside>
    </motion.div>
  );
}
