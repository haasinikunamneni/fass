/**
 * Mutable state shared between the DOM (pointer, ScrollTrigger) and the
 * WebGL scene. Written outside React so it never triggers re-renders.
 */
export const heroState = {
  /** Pointer position, -1..1. +y is up. */
  pointerX: 0,
  pointerY: 0,
  /** Hero scroll progress, 0 (top) .. 1 (scrolled past). */
  progress: 0,
};
