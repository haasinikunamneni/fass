/**
 * Mutable animation state. The GSAP choreography tweens these plain objects;
 * the renderers (WebGL scene, 2D signature canvas) only read them every frame.
 * Keeping state outside React means no re-renders during the animation and a
 * clean seam between "what happens when" and "how it is drawn".
 */
export interface SceneState {
  // coal
  assemble: number; // crayon marks gather (0 scattered -> 1 assembled)
  compress: number; // coal contracts and densifies
  frag: number; // crayon surface flakes away
  debris: number; // 0..1 pulse of detaching fragments
  // material
  coalMix: number; // 1 = lumpy coal silhouette, 0 = rough-diamond silhouette
  crystal: number; // crystal growth through the surface
  cut: number; // 0 rough -> 1 brilliant cut
  // object transform
  scale: number;
  rx: number;
  ry: number;
  rz: number;
  spin: number; // continuous yaw rate, rad/s
  // choreography
  pathT: number; // position along the diamond's flight path
  camT: number; // position along the camera's own path
  closeness: number; // 0 = camera on its own path, 1 = macro shot of the stone
  macro: number; // macro camera distance
  follow: number; // how much the camera looks at the stone vs. the scene centre
  approach: number; // final move into the camera
  light: number; // rotation of the studio light rig
  opacity: number;
}

export function createSceneState(): SceneState {
  return {
    assemble: 0,
    compress: 0,
    frag: 0,
    debris: 0,
    coalMix: 1,
    crystal: 0,
    cut: 0,
    scale: 0.8,
    rx: 0.25,
    ry: 0.3,
    rz: 0.08,
    spin: 0,
    pathT: 0,
    camT: 0,
    closeness: 0,
    macro: 1.4,
    follow: 0.2,
    approach: 0,
    light: 0,
    opacity: 1,
  };
}

/** Progress of the 2D signature layer (Arabic strokes -> particles -> English). */
export interface LogoProgress {
  drawA: number; // 0..1 Arabic strokes written by fireflies
  morph: number; // 0..1 Arabic dissolves, particles travel, English forms
  alphaA: number;
  alphaB: number;
}

export function createLogoProgress(): LogoProgress {
  return { drawA: 0, morph: 0, alphaA: 1, alphaB: 1 };
}
