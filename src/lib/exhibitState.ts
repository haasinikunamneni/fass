/**
 * Mutable state shared between the exhibit UI (React) and the WebGL scene.
 * Written outside React so selection, dragging and swiping never force the
 * canvas to re-render.
 */
export const exhibitState = {
  /** Active gemstone index */
  index: 0,
  /** +1 when moving forward, -1 backward (drives the transition spin) */
  dir: 1 as 1 | -1,
  /** Extra yaw added by mouse dragging, radians */
  yaw: 0,
};
