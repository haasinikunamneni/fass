"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Sparkles,
} from "@react-three/drei";
import { GEMSTONES } from "@/content/gemstones";
import { SHAPES, type GemId, type GemShape } from "@/lib/gemShapes";
import { exhibitState } from "@/lib/exhibitState";
import { heroState } from "@/lib/heroState";
import { buildGemGeometry } from "./gemGeometry";

export interface GemstoneSceneProps {
  /** Render loop runs only while the exhibit is on screen. */
  active: boolean;
  /** Phone layout: stone centred in a short canvas above the copy. */
  compact: boolean;
  lowPower: boolean;
  reducedMotion: boolean;
  onReady: () => void;
  onError: () => void;
}

const damp = THREE.MathUtils.damp;

interface MaterialConfig {
  color: string;
  attenuation: string;
  attenuationDistance: number;
  thickness: number;
  ior: number;
  chromaticAberration: number;
  /** Colour seen through the stone while refracting (canvas is transparent) */
  backdrop: string;
  /** Inner glow colour, if any */
  core?: string;
  envMapIntensity: number;
  /** Thin lacquer-like highlight layer (crown facets catch more light) */
  clearcoat: number;
  clearcoatRoughness: number;
  /** Subtle facet-to-facet sparkle variance */
  anisotropy: number;
}

/** Each stone has its own optical character, not just its own colour. */
const MATERIALS: Record<GemId, MaterialConfig> = {
  emerald: {
    color: "#2fb27a",
    attenuation: "#04472b",
    attenuationDistance: 0.55,
    thickness: 1.3,
    ior: 1.58,
    chromaticAberration: 0.04,
    backdrop: "#052a1b",
    core: "#0a7a4b",
    envMapIntensity: 1.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    anisotropy: 0.15,
  },
  ruby: {
    color: "#d3123f",
    attenuation: "#5a0015",
    attenuationDistance: 0.45,
    thickness: 1.4,
    ior: 1.77,
    chromaticAberration: 0.05,
    backdrop: "#2a050d",
    core: "#a30c2e",
    envMapIntensity: 1.6,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    anisotropy: 0.2,
  },
  sapphire: {
    color: "#2a4fd6",
    attenuation: "#07165c",
    attenuationDistance: 0.5,
    thickness: 1.4,
    ior: 1.77,
    chromaticAberration: 0.05,
    backdrop: "#060d2b",
    core: "#1630a0",
    envMapIntensity: 1.6,
    clearcoat: 0.75,
    clearcoatRoughness: 0.06,
    anisotropy: 0.25,
  },
  diamond: {
    color: "#ffffff",
    attenuation: "#e8f4ff",
    attenuationDistance: 4,
    thickness: 1.0,
    ior: 2.3,
    chromaticAberration: 0.16,
    backdrop: "#3b5360",
    envMapIntensity: 2.2,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    anisotropy: 0.4,
  },
};

function GemModel({
  index,
  shape,
  material,
  geometry,
  compact,
  lowPower,
  reducedMotion,
}: {
  index: number;
  shape: GemShape;
  material: MaterialConfig;
  geometry: THREE.BufferGeometry;
  compact: boolean;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const yaw = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const appear = useRef(0);
  const smoothYaw = useRef(0);
  const { viewport } = useThree();
  const backdrop = useMemo(() => new THREE.Color(material.backdrop), [material.backdrop]);

  useFrame((state, dt) => {
    const g = root.current;
    const yawG = yaw.current;
    const tiltG = tilt.current;
    if (!g || !yawG || !tiltG) return;

    const isActive = exhibitState.index === index;
    appear.current = damp(appear.current, isActive ? 1 : 0, 3.2, dt);
    const a = appear.current;

    // Fully gone: skip all work, and three.js skips the transmission pass too.
    g.visible = a > 0.01;
    if (!g.visible) return;

    const eased = a * a * (3 - 2 * a);
    const t = state.clock.elapsedTime;

    const base = compact
      ? Math.min(viewport.width * 0.28, viewport.height * 0.3)
      : Math.min(viewport.height * 0.3, viewport.width * 0.17);
    const bob = reducedMotion ? 0 : Math.sin(t * 0.7 + index) * 0.06;

    g.position.set(compact ? 0 : viewport.width * 0.22, bob, 0);
    g.scale.setScalar(Math.max(0.0001, base * shape.fit * eased));

    // Entering stones spin in from one side, leaving stones spin out the other.
    const spin = (1 - a) * 1.6 * (isActive ? -exhibitState.dir : exhibitState.dir);
    const idle = reducedMotion ? 0 : Math.sin(t * 0.3 + index * 1.3) * 0.38;
    smoothYaw.current = damp(
      smoothYaw.current,
      0.25 + idle + heroState.pointerX * 0.5 + exhibitState.yaw,
      3,
      dt,
    );
    yawG.rotation.y = smoothYaw.current + spin;

    const breathe = reducedMotion ? 0 : Math.sin(t * 0.4 + index) * 0.04;
    tiltG.rotation.x = damp(
      tiltG.rotation.x,
      shape.tilt - heroState.pointerY * 0.25 + breathe,
      3,
      dt,
    );
  });

  return (
    <group ref={root} visible={false} scale={0.0001}>
      <group ref={yaw}>
        <group ref={tilt} rotation={[shape.tilt, 0, 0]}>
          <mesh geometry={geometry}>
            <MeshTransmissionMaterial
              color={material.color}
              attenuationColor={material.attenuation}
              attenuationDistance={material.attenuationDistance}
              thickness={material.thickness}
              backsideThickness={0.6}
              ior={material.ior}
              chromaticAberration={material.chromaticAberration}
              roughness={0.02}
              transmission={1}
              samples={lowPower ? 3 : 8}
              resolution={lowPower ? 256 : 640}
              backside={!lowPower}
              envMapIntensity={material.envMapIntensity}
              background={backdrop as unknown as THREE.Texture}
              clearcoat={material.clearcoat}
              clearcoatRoughness={material.clearcoatRoughness}
              anisotropicBlur={material.anisotropy}
              distortion={0.1}
              distortionScale={0.3}
              temporalDistortion={0}
            />
          </mesh>
          {material.core && (
            <mesh geometry={geometry} scale={0.5} position={[0, -0.15, 0]}>
              <meshBasicMaterial color={material.core} toneMapped={false} />
            </mesh>
          )}
        </group>
      </group>
      {/* Grounds the stone: a soft contact shadow at the culet, so it reads
          as a solid object resting in the case rather than floating glass. */}
      {!lowPower && (
        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.55}
          scale={4.5}
          blur={2.6}
          far={1.8}
          resolution={256}
          color="#000000"
          frames={reducedMotion ? 1 : Infinity}
        />
      )}
    </group>
  );
}

/**
 * One light rig whose colours ease toward the active stone's theme: this is
 * each gemstone's own lighting environment. A cursor light follows the pointer.
 */
function StageLights({ reducedMotion }: { reducedMotion: boolean }) {
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const cursor = useRef<THREE.PointLight>(null);

  const themes = useMemo(
    () =>
      GEMSTONES.map((g) => ({
        key: new THREE.Color(g.theme.key),
        rim: new THREE.Color(g.theme.rim),
      })),
    [],
  );

  useFrame((state, dt) => {
    const theme = themes[exhibitState.index] ?? themes[0];
    const k = 1 - Math.exp(-3 * dt);
    key.current?.color.lerp(theme.key, k);
    rim.current?.color.lerp(theme.rim, k);

    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    rim.current?.position.set(
      -Math.cos(t * 0.3) * 4.5,
      -1 + Math.sin(t * 0.4) * 1.5,
      2.5,
    );

    const c = cursor.current;
    if (c) {
      c.color.lerp(theme.key, k);
      c.position.x = damp(c.position.x, heroState.pointerX * 3.5, 4, dt);
      c.position.y = damp(c.position.y, heroState.pointerY * 2.5 + 0.5, 4, dt);
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <spotLight
        ref={key}
        position={[0, 7, 4]}
        angle={0.5}
        penumbra={1}
        intensity={100}
        color={GEMSTONES[0].theme.key}
      />
      <pointLight
        ref={rim}
        position={[-4, -1, 2.5]}
        intensity={30}
        distance={14}
        color={GEMSTONES[0].theme.rim}
      />
      <pointLight
        ref={cursor}
        position={[0, 0.5, 3.5]}
        intensity={55}
        distance={12}
        color={GEMSTONES[0].theme.key}
      />
    </>
  );
}

function Stones({
  compact,
  lowPower,
  reducedMotion,
  onReady,
}: Pick<GemstoneSceneProps, "compact" | "lowPower" | "reducedMotion" | "onReady">) {
  const geometries = useMemo(
    () => GEMSTONES.map((g) => buildGemGeometry(SHAPES[g.id].rings)),
    [],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  const signalled = useRef(false);
  useFrame((state) => {
    if (!signalled.current && state.clock.elapsedTime > 0.2) {
      signalled.current = true;
      onReady();
    }
  });

  return (
    <>
      {GEMSTONES.map((g, i) => (
        <GemModel
          key={g.id}
          index={i}
          shape={SHAPES[g.id]}
          material={MATERIALS[g.id]}
          geometry={geometries[i]}
          compact={compact}
          lowPower={lowPower}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}

export default function GemstoneScene({
  active,
  compact,
  lowPower,
  reducedMotion,
  onReady,
  onError,
}: GemstoneSceneProps) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 8], fov: 32 }}
      dpr={lowPower ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: !lowPower,
        alpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onError();
        });
      }}
    >
      <StageLights reducedMotion={reducedMotion} />

      {/* Neutral procedural studio; colour comes from the themed lights. */}
      <Environment resolution={lowPower ? 128 : 256}>
        <Lightformer form="rect" intensity={6} position={[0, 6, 0]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={4} position={[-5, 0, 3]} scale={[1.2, 7, 1]} />
        <Lightformer form="rect" intensity={6} color="#fff1d6" position={[5, 1, 2]} scale={[0.8, 8, 1]} />
        <Lightformer form="rect" intensity={3} position={[0, 2, -6]} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, -5, 2]} scale={5} />
        <Lightformer form="circle" intensity={3} position={[3, 3, 6]} scale={2} />
      </Environment>

      <Stones
        compact={compact}
        lowPower={lowPower}
        reducedMotion={reducedMotion}
        onReady={onReady}
      />

      {!reducedMotion && !lowPower && (
        <Sparkles
          count={30}
          scale={[10, 6, 4]}
          size={1.5}
          speed={0.2}
          opacity={0.3}
          color="#c8b17c"
        />
      )}
    </Canvas>
  );
}
