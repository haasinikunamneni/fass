import type * as THREE from "three";
import { SHAPES } from "@/lib/gemShapes";
import { buildGemGeometry } from "./gemGeometry";

/** The hero's emerald-cut stone (see lib/gemShapes + emeraldProfile). */
export function createEmeraldGeometry(scale = 1): THREE.BufferGeometry {
  return buildGemGeometry(SHAPES.emerald.rings, scale);
}
