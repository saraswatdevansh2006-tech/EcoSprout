"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HealthState } from "@/store/carbon-store";

/* ─── Color Palettes per State ─── */
const PALETTES = {
  thriving: {
    stem: new THREE.Color("#4ade80"),
    stemTop: new THREE.Color("#22c55e"),
    leaf: new THREE.Color("#34d399"),
    leafTip: new THREE.Color("#6ee7b7"),
    pot: new THREE.Color("#78716c"),
    potRim: new THREE.Color("#a8a29e"),
    soil: new THREE.Color("#44403c"),
    flower: new THREE.Color("#fbbf24"),
    flowerCenter: new THREE.Color("#f59e0b"),
  },
  struggling: {
    stem: new THREE.Color("#a3a83a"),
    stemTop: new THREE.Color("#8a9a2e"),
    leaf: new THREE.Color("#bfb034"),
    leafTip: new THREE.Color("#d4c84a"),
    pot: new THREE.Color("#6b6560"),
    potRim: new THREE.Color("#8a8078"),
    soil: new THREE.Color("#3d3832"),
    flower: new THREE.Color("#d4a020"),
    flowerCenter: new THREE.Color("#b8860b"),
  },
  wilting: {
    stem: new THREE.Color("#8B7355"),
    stemTop: new THREE.Color("#6d5a40"),
    leaf: new THREE.Color("#8B6914"),
    leafTip: new THREE.Color("#a0784c"),
    pot: new THREE.Color("#5c5550"),
    potRim: new THREE.Color("#736b64"),
    soil: new THREE.Color("#332e28"),
    flower: new THREE.Color("#8b6914"),
    flowerCenter: new THREE.Color("#6d5a40"),
  },
};

/* ─── Lerp helper for colors ─── */
function lerpColor(current: THREE.Color, target: THREE.Color, t: number) {
  current.lerp(target, t);
}

/* ─── Single Leaf ─── */
function Leaf({
  position,
  rotation,
  scale,
  droopTarget,
  healthState,
  timePhase,
  index,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  droopTarget: number;
  healthState: HealthState;
  timePhase: string;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const currentDroop = useRef(0);
  const fallProgress = useRef(0);

  const targetColor = PALETTES[healthState].leaf;
  const tipColor = PALETTES[healthState].leafTip;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth droop transition
    currentDroop.current = THREE.MathUtils.lerp(currentDroop.current, droopTarget, delta * 1.5);
    meshRef.current.rotation.z = rotation[2] + currentDroop.current;

    // Gentle sway animation - increase if it's day for wind
    const windMultiplier = timePhase === "day" ? 1.8 : 1.0;
    const swaySpeed = (healthState === "thriving" ? 1.5 : healthState === "struggling" ? 0.8 : 0.3) * windMultiplier;
    const swayAmount = (healthState === "thriving" ? 0.06 : healthState === "struggling" ? 0.03 : 0.01) * windMultiplier;
    meshRef.current.rotation.z +=
      Math.sin(state.clock.elapsedTime * swaySpeed + index * 1.5) * swayAmount;

    // Shedding logic for half the leaves
    const shouldShed = healthState === "wilting" && index % 2 !== 0;
    if (shouldShed) {
      // Fall down and shrink
      fallProgress.current = THREE.MathUtils.lerp(fallProgress.current, 1, delta * 2);
    } else {
      // Regrow / Return to normal
      fallProgress.current = THREE.MathUtils.lerp(fallProgress.current, 0, delta * 2);
    }
    
    meshRef.current.position.y = position[1] - fallProgress.current * 1.2;
    meshRef.current.position.x = position[0] + fallProgress.current * (index % 3 === 0 ? 0.5 : -0.5);
    const currentScale = scale * Math.max(0, 1 - fallProgress.current);
    meshRef.current.scale.setScalar(currentScale);

    // Color transition
    if (materialRef.current) {
      lerpColor(materialRef.current.color, targetColor, delta * 2);
      lerpColor(materialRef.current.emissive, tipColor, delta * 2);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} castShadow>
      <sphereGeometry args={[0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      <meshStandardMaterial
        ref={materialRef}
        color={targetColor}
        emissive={tipColor}
        emissiveIntensity={0.08}
        roughness={0.6}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Main Plant Component ─── */
export default function Plant({ healthState, timePhase }: { healthState: HealthState, timePhase: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const stemRef = useRef<THREE.Mesh>(null!);
  const stemMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const potMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const potRimMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const soilMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const flowerMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const flowerCenterMatRef = useRef<THREE.MeshStandardMaterial>(null!);

  const palette = PALETTES[healthState];

  /* Leaf configuration */
  const leaves = useMemo(
    () => [
      { pos: [0.05, 1.0, 0] as [number, number, number], rot: [0.2, 0, 0.6] as [number, number, number], scale: 1.0 },
      { pos: [-0.05, 0.9, 0.1] as [number, number, number], rot: [0.1, 1.2, -0.5] as [number, number, number], scale: 0.9 },
      { pos: [0.08, 0.7, -0.05] as [number, number, number], rot: [-0.1, 2.5, 0.7] as [number, number, number], scale: 1.05 },
      { pos: [-0.06, 0.6, 0.08] as [number, number, number], rot: [0.15, 3.8, -0.6] as [number, number, number], scale: 0.85 },
      { pos: [0.03, 1.15, -0.08] as [number, number, number], rot: [-0.2, 5.0, 0.4] as [number, number, number], scale: 0.75 },
      { pos: [-0.04, 0.5, -0.06] as [number, number, number], rot: [0.1, 0.8, -0.8] as [number, number, number], scale: 0.7 },
    ],
    []
  );

  const droopAmount =
    healthState === "thriving" ? 0 : healthState === "struggling" ? 0.35 : 0.8;

  /* Stem lean */
  const stemLeanTarget = healthState === "thriving" ? 0 : healthState === "struggling" ? 0.06 : 0.15;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Global bounce (thriving) or subtle sway
    const bounceIntensity = healthState === "thriving" ? 0.03 : healthState === "struggling" ? 0.01 : 0.005;
    const bounceSpeed = healthState === "thriving" ? 2.0 : healthState === "struggling" ? 1.0 : 0.5;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * bounceSpeed) * bounceIntensity;

    // Stem lean
    if (stemRef.current) {
      stemRef.current.rotation.z = THREE.MathUtils.lerp(
        stemRef.current.rotation.z,
        stemLeanTarget,
        delta * 2
      );
    }

    // Color transitions for stem, pot, soil
    if (stemMatRef.current) lerpColor(stemMatRef.current.color, palette.stem, delta * 2);
    if (potMatRef.current) lerpColor(potMatRef.current.color, palette.pot, delta * 2);
    if (potRimMatRef.current) lerpColor(potRimMatRef.current.color, palette.potRim, delta * 2);
    if (soilMatRef.current) lerpColor(soilMatRef.current.color, palette.soil, delta * 2);
    if (flowerMatRef.current) lerpColor(flowerMatRef.current.color, palette.flower, delta * 2);
    if (flowerCenterMatRef.current) lerpColor(flowerCenterMatRef.current.color, palette.flowerCenter, delta * 2);
  });

  return (
    <group ref={groupRef}>
      {/* ── Pot ── */}
      <group position={[0, -0.6, 0]}>
        {/* Main pot body */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.38, 0.7, 24]} />
          <meshStandardMaterial ref={potMatRef} color={palette.pot} roughness={0.85} />
        </mesh>
        {/* Pot rim */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.52, 0.1, 24]} />
          <meshStandardMaterial ref={potRimMatRef} color={palette.potRim} roughness={0.7} />
        </mesh>
        {/* Soil */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.08, 24]} />
          <meshStandardMaterial ref={soilMatRef} color={palette.soil} roughness={1} />
        </mesh>
      </group>

      {/* ── Stem ── */}
      <mesh ref={stemRef} position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.2, 8]} />
        <meshStandardMaterial
          ref={stemMatRef}
          color={palette.stem}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* ── Leaves ── */}
      {leaves.map((leaf, i) => (
        <Leaf
          key={i}
          position={leaf.pos}
          rotation={leaf.rot}
          scale={leaf.scale}
          droopTarget={droopAmount * (i % 2 === 0 ? 1 : -0.8)}
          healthState={healthState}
          timePhase={timePhase}
          index={i}
        />
      ))}

      {/* ── Flower / Bud at top ── */}
      <group position={[0, 1.35, 0]}>
        {/* Petals */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={`petal-${i}`}
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 0.12,
              0,
              Math.sin((i / 5) * Math.PI * 2) * 0.12,
            ]}
            rotation={[0.3, (i / 5) * Math.PI * 2, 0]}
            scale={healthState === "wilting" ? 0.6 : 1}
          >
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial
              ref={i === 0 ? flowerMatRef : undefined}
              color={palette.flower}
              emissive={palette.flower}
              emissiveIntensity={healthState === "thriving" ? 0.15 : 0.02}
              roughness={0.5}
            />
          </mesh>
        ))}
        {/* Center */}
        <mesh>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial
            ref={flowerCenterMatRef}
            color={palette.flowerCenter}
            roughness={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}
