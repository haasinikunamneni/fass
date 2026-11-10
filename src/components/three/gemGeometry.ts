import * as THREE from "three";
import type { Ring } from "@/lib/gemShapes";

/**
 * Builds a faceted gemstone from a stack of outlines (table → keel).
 * Non-indexed, so every facet gets its own flat normal. Triangle winding is
 * corrected to face outward, so outlines can be defined in any direction.
 */
export function buildGemGeometry(rings: Ring[], scale = 1): THREE.BufferGeometry {
  const n = rings[0].pts.length;
  const verts = rings.map((r) =>
    r.pts.map(([x, z]) => new THREE.Vector3(x * scale, r.y * scale, z * scale)),
  );

  const top = rings[0].y * scale;
  const bottom = rings[rings.length - 1].y * scale;
  const center = new THREE.Vector3(0, (top + bottom) / 2, 0);
  const positions: number[] = [];

  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    const normal = new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a));
    const centroid = new THREE.Vector3()
      .add(a)
      .add(b)
      .add(c)
      .divideScalar(3)
      .sub(center);
    if (normal.dot(centroid) < 0) {
      const t = b;
      b = c;
      c = t;
    }
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  for (let k = 0; k < verts.length - 1; k++) {
    const hi = verts[k];
    const lo = verts[k + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      tri(lo[i], lo[j], hi[j]);
      tri(lo[i], hi[j], hi[i]);
    }
  }

  const capTop = new THREE.Vector3(0, top, 0);
  const capBottom = new THREE.Vector3(0, bottom, 0);
  const first = verts[0];
  const last = verts[verts.length - 1];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tri(capTop, first[i], first[j]);
    tri(capBottom, last[i], last[j]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
