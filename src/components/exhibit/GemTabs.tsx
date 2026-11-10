"use client";

import { useRef, type KeyboardEvent } from "react";
import { GEMSTONES } from "@/content/gemstones";
import { cn } from "@/lib/cn";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/Icons";
import GemGlyph from "./GemGlyph";

interface Props {
  index: number;
  onSelect: (i: number) => void;
  onStep: (d: 1 | -1) => void;
}

const arrowBtn =
  "group relative inline-flex h-12 w-12 items-center justify-center border border-ivory/20 text-ivory/80 transition-[color,border-color,transform] duration-500 ease-luxe hover:border-champagne hover:text-champagne active:scale-95";

export default function GemTabs({ index, onSelect, onStep }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const total = GEMSTONES.length;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % total;
    else if (e.key === "ArrowLeft") next = (index - 1 + total) % total;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = total - 1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div
        role="tablist"
        aria-label="Gemstones"
        onKeyDown={onKeyDown}
        className="grid grid-cols-4 gap-2 md:flex md:gap-8"
      >
        {GEMSTONES.map((g, i) => {
          const selected = i === index;
          return (
            <button
              key={g.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`gem-tab-${g.id}`}
              aria-selected={selected}
              aria-controls="gem-panel"
              aria-label={g.name}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(i)}
              className="group flex min-h-14 flex-col items-center gap-3 pb-3 md:flex-row md:items-center md:gap-4"
            >
              <span
                className={cn(
                  "block h-9 w-7 shrink-0 transition-[opacity,transform] duration-700 ease-luxe",
                  selected
                    ? "scale-110 opacity-100"
                    : "opacity-40 group-hover:-translate-y-1 group-hover:opacity-80",
                )}
              >
                <GemGlyph gem={g} className="h-full w-full" detailed={false} />
              </span>
              <span className="hidden text-left md:block">
                <span
                  className={cn(
                    "block text-eyebrow font-medium uppercase transition-colors duration-500 ease-luxe",
                    selected ? "text-champagne" : "text-ivory/50 group-hover:text-ivory",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "mt-1 block font-display text-lg transition-colors duration-500 ease-luxe",
                    selected ? "text-ivory" : "text-ivory/60 group-hover:text-ivory",
                  )}
                >
                  {g.name}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "block h-px w-full origin-left bg-champagne transition-transform duration-700 ease-luxe md:hidden",
                  selected ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-6 md:justify-end">
        <p className="text-eyebrow font-medium uppercase text-ivory/60" aria-hidden>
          <span className="text-champagne">{String(index + 1).padStart(2, "0")}</span>
          &nbsp;/&nbsp;{String(total).padStart(2, "0")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className={arrowBtn}
            aria-label="Previous gemstone"
            onClick={() => onStep(-1)}
          >
            <ArrowLeftIcon className="transition-transform duration-500 ease-luxe group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            className={arrowBtn}
            aria-label="Next gemstone"
            onClick={() => onStep(1)}
          >
            <ArrowRightIcon className="transition-transform duration-500 ease-luxe group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
