"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HealthState } from "@/store/carbon-store";

/* ─── Deterministic Pseudo-Random Number Generator ─── */
const createRandom = (seed: number) => {
  let s = seed;
  return () => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
};

/* ─── Sky/Fog Colors per State & Time ─── */
const ENV_COLORS = {
  day: {
    thriving: { top: "#1a6fc9", bottom: "#87ceeb", ambient: "#c9e6ff", sun: "#fff5d6", sunInt: 2.2 },
    struggling: { top: "#5a5e6e", bottom: "#8a8d9a", ambient: "#9a9daa", sun: "#e8dcc0", sunInt: 1.2 },
    wilting: { top: "#2a2a2f", bottom: "#4a4045", ambient: "#6a5a5f", sun: "#c0a080", sunInt: 0.5 },
  },
  evening: {
    thriving: { top: "#2c1b4d", bottom: "#e07a5f", ambient: "#f4a261", sun: "#ffb703", sunInt: 1.5 },
    struggling: { top: "#3a2a40", bottom: "#a05b4b", ambient: "#a67b5b", sun: "#d4a373", sunInt: 0.8 },
    wilting: { top: "#1f1a24", bottom: "#4a2a2a", ambient: "#5c4033", sun: "#8b5a2b", sunInt: 0.3 },
  },
  night: {
    thriving: { top: "#03071e", bottom: "#1a1a2e", ambient: "#2b2d42", sun: "#a8dadc", sunInt: 0.4 },
    struggling: { top: "#02040f", bottom: "#0f172a", ambient: "#1e293b", sun: "#64748b", sunInt: 0.2 },
    wilting: { top: "#000000", bottom: "#0a0908", ambient: "#11151c", sun: "#4a4e69", sunInt: 0.1 },
  }
};

const GROUND_COLORS = {
  thriving: new THREE.Color("#2d5a27"),
  struggling: new THREE.Color("#4a4a30"),
  wilting: new THREE.Color("#3a3028"),
};

/* ─── Ground Plane ─── */
function Ground({ healthState }: { healthState: HealthState }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const target = GROUND_COLORS[healthState];

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.color.lerp(target, delta * 2);
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]} receiveShadow>
      <circleGeometry args={[5, 48]} />
      <meshStandardMaterial ref={matRef} color={target} roughness={1} />
    </mesh>
  );
}

/* ─── Floating Particles ─── */
function Particles({ healthState }: { healthState: HealthState }) {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const positions = useMemo(() => {
    const rand = createRandom(1);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 6;
      arr[i * 3 + 1] = rand() * 4 - 0.5;
      arr[i * 3 + 2] = (rand() - 0.5) * 6;
    }
    return arr;
  }, []);

  const speeds = useMemo(() => {
    const rand = createRandom(2);
    return Array.from({ length: count }, () => 0.2 + rand() * 0.6);
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const speedMul = healthState === "thriving" ? 1 : healthState === "struggling" ? 0.5 : 0.2;
    const targetOpacity = healthState === "wilting" ? 0.15 : healthState === "struggling" ? 0.3 : 0.5;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.02);

    const targetColor = healthState === "thriving" ? new THREE.Color("#a7f3d0") : healthState === "struggling" ? new THREE.Color("#fde68a") : new THREE.Color("#aaa");
    mat.color.lerp(targetColor, 0.02);

    for (let i = 0; i < count; i++) {
      const speed = speeds[i] * speedMul;
      dummy.position.set(
        positions[i * 3] + Math.sin(t * speed + i) * 0.3,
        ((positions[i * 3 + 1] + t * speed * 0.15) % 4) - 0.5,
        positions[i * 3 + 2] + Math.cos(t * speed + i) * 0.3
      );
      dummy.scale.setScalar(0.015 + Math.sin(t * 2 + i) * 0.005);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.4} color="#a7f3d0" />
    </instancedMesh>
  );
}

/* ─── Butterflies (Day Only) ─── */
function Butterflies() {
  const count = 5;
  const groupRef = useRef<THREE.Group>(null!);
  
  const butterflyData = useMemo(() => {
    const rand = createRandom(3);
    return Array.from({ length: count }, () => ({
      speed: 0.5 + rand() * 0.5,
      offset: rand() * Math.PI * 2,
      radius: 1.5 + rand() * 1.5,
      yOffset: rand() * 2
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    
    groupRef.current.children.forEach((mesh, i) => {
      const data = butterflyData[i];
      const angle = t * data.speed + data.offset;
      mesh.position.x = Math.cos(angle) * data.radius;
      mesh.position.z = Math.sin(angle) * data.radius;
      mesh.position.y = 0.5 + data.yOffset + Math.sin(t * 2 + i) * 0.3;
      
      // Face direction of travel
      mesh.rotation.y = -angle + Math.PI;
      // Flap wings
      mesh.scale.y = 0.05 + Math.abs(Math.sin(t * 15 + i)) * 0.1;
      mesh.scale.x = 0.1;
      mesh.scale.z = 0.1;
    });
  });

  return (
    <group ref={groupRef}>
      {butterflyData.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Moon (Night Only) ─── */
function Moon() {
  return (
    <mesh position={[-4, 4, -5]}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshBasicMaterial color="#fef08a" />
      {/* Fake glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.2} />
      </mesh>
    </mesh>
  );
}

/* ─── Sky Dome ─── */
function SkyDome({ healthState, timePhase }: { healthState: HealthState, timePhase: string }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  
  const colors = ENV_COLORS[timePhase as keyof typeof ENV_COLORS][healthState];
  const targetTop = useMemo(() => new THREE.Color(colors.top), [colors.top]);
  const targetBottom = useMemo(() => new THREE.Color(colors.bottom), [colors.bottom]);

  const uniforms = useMemo(
    () => ({
      uTopColor: { value: targetTop.clone() },
      uBottomColor: { value: targetBottom.clone() },
    }),
    [targetTop, targetBottom]
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    uniforms.uTopColor.value.lerp(targetTop, delta * 1.5);
    uniforms.uBottomColor.value.lerp(targetBottom, delta * 1.5);
  });

  return (
    <mesh scale={[1, 1, 1]}>
      <sphereGeometry args={[12, 32, 16]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uTopColor;
          uniform vec3 uBottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            float t = max(0.0, h);
            gl_FragColor = vec4(mix(uBottomColor, uTopColor, t), 1.0);
          }
        `}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ─── Lighting Rig ─── */
function LightingRig({ healthState, timePhase }: { healthState: HealthState, timePhase: string }) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null!);
  const ambientRef = useRef<THREE.AmbientLight>(null!);

  const colors = ENV_COLORS[timePhase as keyof typeof ENV_COLORS][healthState];
  const targetSunColor = useMemo(() => new THREE.Color(colors.sun), [colors.sun]);
  const targetAmbientColor = useMemo(() => new THREE.Color(colors.ambient), [colors.ambient]);

  useFrame((_, delta) => {
    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(targetSunColor, delta * 2);
      dirLightRef.current.intensity = THREE.MathUtils.lerp(
        dirLightRef.current.intensity,
        colors.sunInt,
        delta * 2
      );
    }
    if (ambientRef.current) {
      ambientRef.current.color.lerp(targetAmbientColor, delta * 2);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight
        ref={dirLightRef}
        position={timePhase === "evening" ? [-4, 2, 2] : [3, 5, 2]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={15}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      {timePhase === "night" && <pointLight position={[-2, 2, -2]} intensity={0.5} color="#818cf8" />}
    </>
  );
}

/* ─── Exported Scene Environment ─── */
export default function SceneEnvironment({ healthState, timePhase }: { healthState: HealthState, timePhase: string }) {
  return (
    <>
      <SkyDome healthState={healthState} timePhase={timePhase} />
      <LightingRig healthState={healthState} timePhase={timePhase} />
      <Ground healthState={healthState} />
      <Particles healthState={healthState} />
      {timePhase === "day" && healthState === "thriving" && <Butterflies />}
      {timePhase === "night" && <Moon />}
    </>
  );
}
