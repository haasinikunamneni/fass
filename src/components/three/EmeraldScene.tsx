"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Sparkles,
} from "@react-three/drei";
import { heroState } from "@/lib/heroState";
import { createEmeraldGeometry } from "./emeraldGeometry";

export interface EmeraldSceneProps {
  /** Render loop runs only while the hero is on screen. */
  active: boolean;
  lowPower: boolean;
  reducedMotion: boolean;
  onReady: () => void;
  onError: () => void;
}

const damp = THREE.MathUtils.damp;

function Emerald({
  lowPower,
  reducedMotion,
  onReady,
}: Pick<EmeraldSceneProps, "lowPower" | "reducedMotion" | "onReady">) {
  const root = useRef<THREE.Group>(null);
  const yaw = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const signalled = useRef(false);
  const { viewport } = useThree();

  const geometry = useMemo(() => createEmeraldGeometry(), []);
  const core = useMemo(() => createEmeraldGeometry(0.5), []);
  // Colour seen *through* the stone while refracting (the canvas is transparent).
  const refractionBackdrop = useMemo(() => new THREE.Color("#052a1b"), []);

  useEffect(
    () => () => {
      geometry.dispose();
      core.dispose();
    },
    [geometry, core],
  );

  useFrame((state, dt) => {
    const g = root.current;
    const yawG = yaw.current;
    const tiltG = tilt.current;
    if (!g || !yawG || !tiltG) return;

    const t = state.clock.elapsedTime;
    const portrait = viewport.aspect < 0.9;
    const p = heroState.progress;

    // Art direction: right of centre on wide screens, upper centre on phones.
    const targetX = portrait ? 0 : viewport.width * 0.24;
    const targetY = portrait ? viewport.height * 0.17 : 0;
    const targetScale = portrait
      ? viewport.width * 0.36
      : Math.min(viewport.height * 0.3, viewport.width * 0.17);

    const bob = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.07;
    g.position.x = damp(g.position.x, targetX, 3, dt);
    g.position.y = damp(g.position.y, targetY + bob + p * 1.1, 3, dt);
    g.scale.setScalar(damp(g.scale.x, targetScale * (1 - p * 0.25), 2.2, dt));

    // Mouse / touch-drag responsive rotation with smooth damping.
    const idle = reducedMotion ? 0 : Math.sin(t * 0.28) * 0.4;
    yawG.rotation.y = damp(
      yawG.rotation.y,
      0.25 + idle + heroState.pointerX * 0.45 + p * 1.4,
      2.5,
      dt,
    );
    const breathe = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.04;
    tiltG.rotation.x = damp(
      tiltG.rotation.x,
      1.05 - heroState.pointerY * 0.28 + breathe,
      2.5,
      dt,
    );

    if (!signalled.current && t > 0.2) {
      signalled.current = true;
      onReady();
    }
  });

  return (
    <group ref={root} scale={0.001}>
      <group ref={yaw}>
        <group ref={tilt} rotation={[1.05, 0, 0]}>
          <mesh geometry={geometry}>
            <MeshTransmissionMaterial
              color="#2fb27a"
              attenuationColor="#04472b"
              attenuationDistance={0.55}
              thickness={1.3}
              backsideThickness={0.6}
              ior={1.58}
              chromaticAberration={0.04}
              roughness={0.02}
              transmission={1}
              samples={lowPower ? 3 : 8}
              resolution={lowPower ? 256 : 768}
              backside={!lowPower}
              envMapIntensity={1.5}
              background={refractionBackdrop as unknown as THREE.Texture}
            />
          </mesh>
          {/* Inner glow: gives the stone depth and a living green core. */}
          <mesh geometry={core} position={[0, -0.15, 0]}>
            <meshBasicMaterial color="#0a7a4b" toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Slowly orbiting accent lights: the "atmospheric lighting movement". */
function MovingLights({ reducedMotion }: { reducedMotion: boolean }) {
  const green = useRef<THREE.PointLight>(null);
  const warm = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    green.current?.position.set(Math.cos(t * 0.35) * 4, 2 + Math.sin(t * 0.5), 3);
    warm.current?.position.set(-Math.cos(t * 0.3) * 4.5, -1 + Math.sin(t * 0.4) * 1.5, 2.5);
  });

  return (
    <>
      <pointLight ref={green} color="#3df0a2" intensity={45} distance={14} />
      <pointLight ref={warm} color="#f2dcae" intensity={28} distance={14} />
    </>
  );
}

export default function EmeraldScene({
  active,
  lowPower,
  reducedMotion,
  onReady,
  onError,
}: EmeraldSceneProps) {
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
      <ambientLight intensity={0.12} />
      <spotLight position={[0, 7, 4]} angle={0.5} penumbra={1} intensity={90} color="#e8fff4" />
      <MovingLights reducedMotion={reducedMotion} />

      {/* Procedural studio lighting: tall strip lights give the long, clean
          reflections a cut stone needs. No HDR download required. */}
      <Environment resolution={lowPower ? 128 : 256}>
        <Lightformer form="rect" intensity={6} position={[0, 6, 0]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={5} color="#d8fff0" position={[-5, 0, 3]} scale={[1.2, 7, 1]} />
        <Lightformer form="rect" intensity={7} color="#fff1d6" position={[5, 1, 2]} scale={[0.8, 8, 1]} />
        <Lightformer form="rect" intensity={4} color="#18c27d" position={[0, 2, -6]} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#0f7a52" position={[0, -5, 2]} scale={5} />
        <Lightformer form="circle" intensity={3} position={[3, 3, 6]} scale={2} />
      </Environment>

      <Emerald lowPower={lowPower} reducedMotion={reducedMotion} onReady={onReady} />

      {!reducedMotion && (
        <Sparkles
          count={lowPower ? 16 : 40}
          scale={[10, 6, 4]}
          size={1.6}
          speed={0.2}
          opacity={0.35}
          color="#c8b17c"
        />
      )}
    </Canvas>
  );
}
