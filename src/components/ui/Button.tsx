import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps {
  /** Renders a link when given, otherwise a <button>. */
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  children: ReactNode;
  className?: string;
  "aria-haspopup"?: "dialog";
}

/**
 * Primary: hairline champagne frame that fills upward on hover/press.
 * Ghost: text link with a drawn rule that extends on hover.
 * Touch devices get :active feedback instead of sticky hover.
 */
export default function Button({
  href,
  onClick,
  variant = "primary",
  children,
  className,
  "aria-haspopup": haspopup,
}: ButtonProps) {
  const ghost = variant === "ghost";

  const classes = ghost
    ? cn(
        "group inline-flex min-h-11 items-center gap-4 text-eyebrow font-medium uppercase text-ivory/80 transition-colors duration-500 ease-luxe hover:text-ivory active:text-ivory",
        className,
      )
    : cn(
        "group relative inline-flex min-h-12 items-center justify-center overflow-hidden border border-champagne/70 px-8 py-4 text-eyebrow font-medium uppercase text-champagne transition-[color,transform] duration-500 ease-luxe hover:text-obsidian active:scale-[0.985] active:text-obsidian",
        className,
      );

  const content = ghost ? (
    <>
      <span>{children}</span>
      <span
        aria-hidden
        className="block h-px w-8 bg-champagne transition-[width] duration-500 ease-luxe group-hover:w-14 group-active:w-14"
      />
    </>
  ) : (
    <>
      <span
        aria-hidden
        className="absolute inset-0 origin-bottom scale-y-0 bg-champagne transition-transform duration-500 ease-luxe group-hover:scale-y-100 group-active:scale-y-100"
      />
      <span className="relative">{children}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-haspopup={haspopup} className={classes}>
      {content}
    </button>
  );
}
