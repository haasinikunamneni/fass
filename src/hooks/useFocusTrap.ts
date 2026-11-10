"use client";

import { useEffect, useRef } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for a mounted dialog: locks page scroll, moves focus in,
 * traps Tab, closes on Escape and restores focus to the opener on unmount.
 * Mount the dialog only while it is open.
 */
export function useFocusTrap<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const opener = document.activeElement as HTMLElement | null;
    lockScroll();

    const items = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    const initial =
      node.querySelector<HTMLElement>("[data-autofocus]") ?? items()[0];
    initial?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!node.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
      opener?.focus({ preventScroll: true });
    };
  }, []);

  return ref;
}
