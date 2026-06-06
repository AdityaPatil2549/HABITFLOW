import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Layered mist rings at the island base that drift and pulse slowly,
 * creating a magical floating-island effect.
 */
export function IslandMist() {
  const group = useRef<THREE.Group>(null);

  const rings = [
    { radius: 9.5, tube: 2.2, y: -1.2, speed: 0.08, opacity: 0.10 },
    { radius: 11.5, tube: 1.6, y: -1.6, speed: -0.06, opacity: 0.07 },
    { radius: 7.5, tube: 1.4, y: -0.8, speed: 0.12, opacity: 0.09 },
    { radius: 13.0, tube: 1.0, y: -2.0, speed: -0.04, opacity: 0.05 },
  ];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const r = rings[i];
      // Slow rotate
      child.rotation.y = t * r.speed;
      // Gentle breath scale
      const breathe = 1 + Math.sin(t * 0.4 + i * 1.3) * 0.04;
      child.scale.setScalar(breathe);
      // Slight vertical drift
      child.position.y = r.y + Math.sin(t * 0.3 + i * 0.7) * 0.15;
    });
  });

  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, r.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r.radius, r.tube, 8, 48]} />
          <meshStandardMaterial
            color="#a8d8ea"
            emissive="#a8d8ea"
            emissiveIntensity={0.08}
            transparent
            opacity={r.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Dense inner ground fog — flat cylinder ring */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 12, 48]} />
        <meshStandardMaterial
          color="#b8d4e8"
          emissive="#b8d4e8"
          emissiveIntensity={0.05}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
