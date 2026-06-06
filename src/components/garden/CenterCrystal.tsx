import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CenterCrystal — a glowing gem obelisk at the center of the garden.
 * Its color and glow intensity reflect the garden's overall health
 * (proportion of habits completed today).
 */
export function CenterCrystal({
  completionRate,
}: {
  completionRate: number; // 0..1
}) {
  const crystalRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Color gradient: red (0%) → amber (50%) → emerald (100%)
  const hue = completionRate * 150; // 0=red, 75=yellow, 150=green
  const color = `hsl(${hue}, 85%, 60%)`;
  const glowColor = `hsl(${hue}, 90%, 55%)`;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 0.4;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.7;
      innerRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
      // Pulse scale
      const pulse = 1 + Math.sin(t * 2) * 0.06;
      innerRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3;
      ringRef.current.rotation.x = Math.sin(t * 0.4) * 0.15 + Math.PI / 2;
    }
  });

  const emissiveIntensity = 0.4 + completionRate * 1.2;

  return (
    <group position={[0, 0.6, 0]}>
      {/* Base pedestal */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.5, 0.7, 0.35, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.5, 0.2, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} flatShading />
      </mesh>

      {/* Crystal stem */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.16, 0.9, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={emissiveIntensity * 0.5}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Main crystal gem */}
      <Float speed={1.5} floatIntensity={0.3}>
        <mesh ref={crystalRef} position={[0, 1.7, 0]} castShadow>
          <octahedronGeometry args={[0.52, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={glowColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.05}
            metalness={0.2}
            transparent
            opacity={0.88}
            flatShading
          />
        </mesh>

        {/* Inner spinning core */}
        <mesh ref={innerRef} position={[0, 1.7, 0]}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={glowColor}
            emissiveIntensity={emissiveIntensity * 1.5}
            roughness={0}
            metalness={0}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Orbiting ring */}
        <mesh ref={ringRef} position={[0, 1.7, 0]}>
          <torusGeometry args={[0.75, 0.04, 8, 32]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={emissiveIntensity * 0.8}
            roughness={0.2}
            metalness={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Health label */}
        <Html position={[0, 2.7, 0]} center distanceFactor={14}>
          <div
            style={{
              background: 'rgba(8, 11, 18, 0.85)',
              backdropFilter: 'blur(14px)',
              border: `1px solid ${glowColor}55`,
              borderRadius: '12px',
              padding: '5px 12px',
              textAlign: 'center',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: `0 0 16px ${glowColor}44`,
            }}
          >
            <div
              style={{
                color: color,
                fontWeight: 800,
                fontSize: '12px',
                fontFamily: 'Outfit, Inter, sans-serif',
              }}
            >
              {Math.round(completionRate * 100)}% today
            </div>
          </div>
        </Html>
      </Float>

      {/* Ground glow ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 1.8, 32]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={emissiveIntensity * 0.4}
          transparent
          opacity={0.25}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
