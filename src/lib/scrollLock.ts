import { getLenis } from "./lenis";

let locks = 0;

/** Reference-counted page scroll lock (menus, search overlay). */
export function lockScroll() {
  if (locks++ === 0) {
    document.documentElement.style.overflow = "hidden";
    getLenis()?.stop();
  }
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.documentElement.style.overflow = "";
    getLenis()?.start();
  }
}
