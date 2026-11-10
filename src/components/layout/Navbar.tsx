"use client";

import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/config/navigation";
import { cn } from "@/lib/cn";
import Wordmark from "@/components/ui/Wordmark";
import { BagIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";

const iconButton =
  "relative inline-flex h-11 w-11 items-center justify-center text-ivory/80 transition-colors duration-500 ease-luxe hover:text-champagne";

export default function Navbar({ bagCount = 0 }: { bagCount?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the full-screen menu if the viewport grows to the desktop layout.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mql.matches && setMenuOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fade-in fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,padding,backdrop-filter] duration-700 ease-luxe",
          scrolled
            ? "border-ivory/10 bg-obsidian/85 py-2 backdrop-blur-md"
            : "border-transparent bg-transparent py-4 lg:py-6",
        )}
      >
        <div className="container-maison flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <nav aria-label="Primary" className="hidden items-center gap-10 lg:flex">
            {primaryNav.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <Wordmark />

          <div className="-mr-3 flex items-center lg:justify-self-end">
            <button
              type="button"
              className={iconButton}
              aria-label="Search"
              aria-haspopup="dialog"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label={`Shopping bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
            >
              <BagIcon />
              {bagCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[0.625rem] font-medium leading-none text-obsidian">
                  {bagCount}
                </span>
              )}
            </button>
            <button
              ref={menuButton}
              type="button"
              className={cn(iconButton, "lg:hidden")}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
