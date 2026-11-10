"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { primaryNav } from "@/config/navigation";
import { EASE_LUXE } from "@/lib/animation";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import Wordmark from "@/components/ui/Wordmark";
import { CloseIcon } from "@/components/ui/Icons";
import { brand } from "@/config/brand";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: Props) {
  return (
    <AnimatePresence>{open && <Panel onClose={onClose} />}</AnimatePresence>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(onClose);
  const reduce = useReducedMotion();

  const panel: Variants = reduce
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      }
    : {
        hidden: { clipPath: "inset(0 0 100% 0)" },
        show: {
          clipPath: "inset(0 0 0% 0)",
          transition: { duration: 0.85, ease: EASE_LUXE },
        },
        exit: {
          clipPath: "inset(0 0 100% 0)",
          transition: { duration: 0.6, ease: EASE_LUXE, delay: 0.12 },
        },
      };

  const list: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
    exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  };

  const item: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        hidden: { y: "115%" },
        show: { y: "0%", transition: { duration: 0.9, ease: EASE_LUXE } },
        exit: { y: "115%", transition: { duration: 0.35, ease: EASE_LUXE } },
      };

  const fade: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.8, delay: 0.7 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      variants={panel}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[60] flex flex-col bg-obsidian"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 85% 100%, rgb(var(--c-forest) / 0.9), transparent 70%)",
        }}
      />

      <div className="container-maison relative flex items-center justify-between py-4">
        <Wordmark />
        <button
          type="button"
          aria-label="Close menu"
          data-autofocus
          onClick={onClose}
          className="-mr-3 inline-flex h-11 w-11 items-center justify-center text-ivory/80 transition-colors duration-500 ease-luxe hover:text-champagne"
        >
          <CloseIcon />
        </button>
      </div>

      <nav aria-label="Mobile" className="container-maison relative flex flex-1 flex-col justify-center">
        <motion.ul variants={list} className="space-y-2">
          {primaryNav.map((nav, i) => (
            <li key={nav.href} className="overflow-hidden">
              <motion.a
                variants={item}
                href={nav.href}
                onClick={onClose}
                className="group flex items-baseline gap-5 py-2 font-display text-[clamp(2.5rem,11vw,4.5rem)] font-light leading-[1.05] text-ivory transition-colors duration-500 ease-luxe hover:text-champagne active:text-champagne"
              >
                <span className="text-eyebrow font-medium tracking-[0.3em] text-champagne/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {nav.label}
              </motion.a>
            </li>
          ))}
        </motion.ul>
      </nav>

      <motion.p
        variants={fade}
        className="container-maison relative pb-8 text-eyebrow uppercase text-ivory/40"
      >
        {brand.prefix} {brand.name}
      </motion.p>
    </motion.div>
  );
}
