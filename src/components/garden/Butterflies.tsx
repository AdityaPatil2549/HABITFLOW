import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ButterflyState {
  // Current world position
  pos: THREE.Vector3;
  // Target world position
  target: THREE.Vector3;
  speed: number;
  wingPhase: number;
  color: string;
  waitTimer: number;
  // Next targets to visit (plant positions)
  targets: THREE.Vector3[];
  targetIdx: number;
}

const COLORS = ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa'];

export function Butterflies({
  plantPositions,
}: {
  plantPositions: [number, number, number][];
}) {
  const groupRef = useRef<THREE.Group>(null);

  const butterflies = useMemo<ButterflyState[]>(() => {
    const count = Math.min(plantPositions.length, 5);
    if (count === 0) return [];

    return Array.from({ length: Math.max(count, 3) }, (_, i) => {
      const targets = plantPositions.map(
        p => new THREE.Vector3(p[0], p[1] + 2.5 + Math.random(), p[2])
      );
      const startTarget = targets[i % targets.length];
      return {
        pos: new THREE.Vector3(
          startTarget.x + (Math.random() - 0.5) * 2,
          startTarget.y,
          startTarget.z + (Math.random() - 0.5) * 2
        ),
        target: startTarget.clone(),
        speed: 1.5 + Math.random() * 1.2,
        wingPhase: Math.random() * Math.PI * 2,
        color: COLORS[i % COLORS.length],
        waitTimer: Math.random() * 2,
        targets,
        targetIdx: i % targets.length,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantPositions.length]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;

    butterflies.forEach((b, i) => {
      const child = groupRef.current!.children[i];
      if (!child) return;

      // Wait at current target
      if (b.waitTimer > 0) {
        b.waitTimer -= delta;
        // Hover in place with gentle bob
        child.position.y = b.pos.y + Math.sin(t * 3 + b.wingPhase) * 0.12;
      } else {
        // Move toward target
        const dir = b.target.clone().sub(b.pos);
        const dist = dir.length();
        if (dist < 0.3) {
          // Arrived — pick next target
          b.waitTimer = 1.5 + Math.random() * 2.5;
          b.targetIdx = (b.targetIdx + 1 + Math.floor(Math.random() * (b.targets.length - 1))) % b.targets.length;
          b.target.copy(b.targets[b.targetIdx]);
          // Add some height arc for the flight
          b.target.y += Math.random() * 1.5;
        } else {
          dir.normalize();
          b.pos.addScaledVector(dir, Math.min(b.speed * delta, dist));
          child.position.copy(b.pos);
          // Face direction of travel
          child.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }

      // Wing flapping animation — rotate the wing meshes
      const wingSpeed = b.waitTimer > 0 ? 8 : 14;
      const wingAngle = Math.sin(t * wingSpeed + b.wingPhase) * 0.9;
      const leftWing = child.children[0];
      const rightWing = child.children[1];
      if (leftWing) leftWing.rotation.y = wingAngle;
      if (rightWing) rightWing.rotation.y = -wingAngle;
    });
  });

  if (butterflies.length === 0) return null;

  return (
    <group ref={groupRef}>
      {butterflies.map((b, i) => (
        <group key={i} position={[b.pos.x, b.pos.y, b.pos.z]}>
          {/* Left wing */}
          <mesh position={[-0.18, 0, 0]} rotation={[0.2, 0, 0.3]}>
            <planeGeometry args={[0.32, 0.22]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Right wing */}
          <mesh position={[0.18, 0, 0]} rotation={[0.2, 0, -0.3]}>
            <planeGeometry args={[0.32, 0.22]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Body */}
          <mesh position={[0, 0, 0]}>
            <capsuleGeometry args={[0.025, 0.14, 4, 6]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
