"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildDiamond } from "./diamondGeometry";
import { debrisFragment, debrisVertex, fragmentWithPlanes, stoneVertex } from "./shaders";
import type { QualitySettings } from "../config";
import type { SceneState } from "../state";

interface Props {
  state: SceneState;
  quality: QualitySettings;
  onReady: () => void;
  onError: () => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// The stone's flight path and the camera's own path (world units, camera at z ~ 6).
const DIA_PATH = [
  [0, 0.35, 0], [0.9, 0.55, 0.4], [2.0, 0.1, -0.8], [1.6, -0.5, 0.8], [0.2, 0.2, 1.6],
  [-1.2, 0.5, 0.2], [-2.2, -0.2, -1.0], [-0.8, 0.3, -0.2], [0, 0.35, 0.3],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));
const CAM_PATH = [
  [0, 0.1, 6], [0.6, 0.3, 5.5], [1.9, 0.5, 4.3], [0.7, -0.1, 3.4],
  [-0.8, 0.5, 3.8], [-2.2, 0.2, 4.9], [-0.6, 0.2, 5.8], [0, 0.1, 6],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

function Stage({ state: S, quality, onReady, onError }: Props) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const points = useRef<THREE.Points>(null);
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);
  const ready = useRef(false);
  const spin = useRef(0);
  const lowRes = useRef(false);

  const scratch = useMemo(
    () => ({
      dPos: new THREE.Vector3(),
      cBase: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      macroPos: new THREE.Vector3(),
      camPos: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      front: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      m4: new THREE.Matrix4(),
    }),
    [],
  );

  const diaCurve = useMemo(() => new THREE.CatmullRomCurve3(DIA_PATH, false, "centripetal"), []);
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3(CAM_PATH, false, "centripetal"), []);

  const stone = useMemo(() => {
    const data = buildDiamond(2);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
    const planes: THREE.Vector4[] = [];
    for (let i = 0; i < data.planeCount; i++) {
      planes.push(new THREE.Vector4(data.planes[i * 4], data.planes[i * 4 + 1], data.planes[i * 4 + 2], data.planes[i * 4 + 3]));
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: stoneVertex,
      fragmentShader: fragmentWithPlanes(data.planeCount),
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uAssemble: { value: 0 },
        uCompress: { value: 0 },
        uCoalMix: { value: 1 },
        uCrystal: { value: 0 },
        uFrag: { value: 0 },
        uCut: { value: 0 },
        uDpr: { value: 1 },
        uDisperse: { value: quality.dispersion ? 1 : 0 },
        uBounces: { value: quality.bounces },
        uLight: { value: 0 },
        uOpacity: { value: 1 },
        uRot: { value: new THREE.Matrix3() },
        uPlanes: { value: planes },
      },
    });
    return { geometry, material };
  }, [quality.dispersion, quality.bounces]);

  const debris = useMemo(() => {
    const n = quality.debris;
    const pos = new Float32Array(n * 3);
    const dir = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const dx = r * Math.cos(a);
      const dy = u;
      const dz = r * Math.sin(a);
      const rad = 0.7 + Math.random() * 0.35;
      pos.set([dx * rad * 1.1, dy * rad * 0.8, dz * rad * 0.95], i * 3);
      dir.set([dx, dy, dz], i * 3);
      seed[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    const material = new THREE.ShaderMaterial({
      vertexShader: debrisVertex,
      fragmentShader: debrisFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uP: { value: 0 }, uDpr: { value: 1 }, uCrystal: { value: 0 } },
    });
    return { geometry, material };
  }, [quality.debris]);

  useEffect(() => {
    gl.debug.onShaderError = () => onError();
    return () => {
      gl.debug.onShaderError = null;
    };
  }, [gl, onError]);

  useEffect(
    () => () => {
      stone.geometry.dispose();
      stone.material.dispose();
      debris.geometry.dispose();
      debris.material.dispose();
    },
    [stone, debris],
  );

  useFrame((state, dtRaw) => {
    const g = group.current;
    const m = mesh.current;
    if (!g || !m) return;
    const dt = Math.min(dtRaw, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const ax = Math.min(1, aspect / 1.5); // keep the flight inside narrow viewports
    const c = scratch;

    diaCurve.getPoint(clamp01(S.pathT), c.dPos);
    c.dPos.x *= ax;
    camCurve.getPoint(clamp01(S.camT), c.cBase);
    c.cBase.x *= ax;

    // Camera: its own path, blended toward a macro position beside the stone.
    c.dir.copy(c.cBase).sub(c.dPos);
    const dist = c.dir.length() || 1;
    c.dir.divideScalar(dist);
    c.macroPos.copy(c.dPos).addScaledVector(c.dir, S.macro);
    c.camPos.lerpVectors(c.cBase, c.macroPos, S.closeness);
    c.tgt.set(0, 0.2, 0).lerp(c.dPos, S.follow);
    cam.position.copy(c.camPos);
    cam.lookAt(c.tgt);
    const fov = aspect < 1 ? Math.min(75, (35 / Math.max(aspect, 0.35)) * 0.72) : 35;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // Final move: the stone travels into the lens.
    if (S.approach > 0) {
      c.fwd.copy(c.tgt).sub(c.camPos).normalize();
      c.front.copy(c.camPos).addScaledVector(c.fwd, 1.25);
      c.dPos.lerp(c.front, S.approach);
    }

    g.position.copy(c.dPos);
    g.scale.setScalar(S.scale);
    spin.current += dt * S.spin;
    m.rotation.set(S.rx, S.ry + spin.current, S.rz);
    g.updateMatrixWorld(true);
    m.getWorldQuaternion(c.q);
    c.m4.makeRotationFromQuaternion(c.q);

    // Cheaper resolution while the stone fills the screen (heavy per-pixel tracing).
    const wantLow = S.closeness > 0.35 || S.approach > 0.05;
    const deviceDpr = window.devicePixelRatio || 1;
    if (wantLow && !lowRes.current) {
      lowRes.current = true;
      setDpr(Math.min(deviceDpr, quality.closeUpDpr));
    } else if (!wantLow && lowRes.current && S.closeness < 0.1) {
      lowRes.current = false;
      setDpr(Math.min(deviceDpr, quality.maxDpr));
    }
    const dpr = state.gl.getPixelRatio();

    const u = stone.material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uAssemble.value = S.assemble;
    u.uCompress.value = S.compress;
    u.uCoalMix.value = S.coalMix;
    u.uCrystal.value = S.crystal;
    u.uFrag.value = S.frag;
    u.uCut.value = S.cut;
    u.uDpr.value = dpr;
    u.uLight.value = S.light;
    u.uOpacity.value = S.opacity;
    (u.uRot.value as THREE.Matrix3).setFromMatrix4(c.m4);

    const d = debris.material.uniforms;
    d.uP.value = S.debris;
    d.uDpr.value = dpr;
    d.uCrystal.value = S.crystal;
    if (points.current) points.current.visible = S.debris > 0.001 && S.debris < 0.999;

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={stone.geometry} material={stone.material} frustumCulled={false}>
        <points ref={points} geometry={debris.geometry} material={debris.material} frustumCulled={false} />
      </mesh>
    </group>
  );
}

export default function LoaderScene(props: Props) {
  return (
    <Canvas
      dpr={[1, props.quality.maxDpr]}
      camera={{ fov: 35, near: 0.05, far: 60, position: [0, 0.1, 6] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1);
        gl.toneMapping = THREE.NoToneMapping;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          props.onError();
        });
      }}
    >
      <color attach="background" args={["#000000"]} />
      <Stage {...props} />
    </Canvas>
  );
}
