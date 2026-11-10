import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

export default function Wordmark({ className }: { className?: string }) {
  return (
    <a
      href="/"
      aria-label={`${brand.prefix} ${brand.name} — home`}
      className={cn(
        "inline-flex items-baseline gap-[0.7em] whitespace-nowrap font-display text-[0.9375rem] font-medium uppercase tracking-[0.26em] text-ivory sm:text-lg sm:tracking-[0.34em]",
        className,
      )}
    >
      <span>{brand.prefix}</span>
      <span className="text-champagne">{brand.name}</span>
    </a>
  );
}
