"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Plant from "./Plant";
import SceneEnvironment from "./SceneEnvironment";
import { HealthState, useCarbonStore } from "@/store/carbon-store";

/* ─── Loading Fallback (inside Canvas) ─── */
function CanvasLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#34d399" wireframe />
    </mesh>
  );
}

/* ─── PlantScene — the main R3F Canvas ─── */
export default function PlantScene({ healthState }: { healthState: HealthState }) {
  const timePhase = useCarbonStore((state) => state.timePhase);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.0, 3.5], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <SceneEnvironment healthState={healthState} timePhase={timePhase} />
        <Plant healthState={healthState} timePhase={timePhase} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
        rotateSpeed={0.4}
      />
    </Canvas>
  );
}
