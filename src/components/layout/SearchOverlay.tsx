"use client";

import { AnimatePresence, motion } from "framer-motion";
import { searchSuggestions } from "@/config/navigation";
import { EASE_LUXE } from "@/lib/animation";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  return (
    <AnimatePresence>{open && <Panel onClose={onClose} />}</AnimatePresence>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(onClose);

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, ease: EASE_LUXE } }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE_LUXE } }}
      className="fixed inset-0 z-[60] bg-obsidian/95 backdrop-blur-xl"
    >
      <div className="container-maison flex justify-end py-4">
        <button
          type="button"
          aria-label="Close search"
          onClick={onClose}
          className="-mr-3 inline-flex h-11 w-11 items-center justify-center text-ivory/80 transition-colors duration-500 ease-luxe hover:text-champagne"
        >
          <CloseIcon />
        </button>
      </div>

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { duration: 0.8, delay: 0.1, ease: EASE_LUXE } }}
        className="container-maison mx-auto max-w-3xl pt-[12vh]"
      >
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="site-search" className="eyebrow">
            Search
          </label>
          <div className="mt-4 flex items-center gap-4 border-b border-ivory/25 pb-4 focus-within:border-champagne">
            <SearchIcon className="shrink-0 text-champagne" />
            <input
              id="site-search"
              type="search"
              data-autofocus
              autoComplete="off"
              placeholder="Gemstones, collections, pieces"
              className="w-full bg-transparent font-display text-3xl font-light text-ivory outline-none placeholder:text-ivory/30 sm:text-5xl"
            />
          </div>
        </form>

        <p className="eyebrow mt-12 text-ivory/50">Popular</p>
        <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
          {searchSuggestions.map((s) => (
            <li key={s}>
              <a
                href="#gemstones"
                onClick={onClose}
                className="font-display text-2xl text-ivory/80 transition-colors duration-500 ease-luxe hover:text-champagne"
              >
                {s}
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
