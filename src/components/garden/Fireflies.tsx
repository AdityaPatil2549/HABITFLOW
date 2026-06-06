import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 80;

export function Fireflies() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate random initial positions in a torus-like volume around the island
  const data = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 10;
      return {
        x: Math.cos(angle) * radius,
        y: 0.5 + Math.random() * 5,
        z: Math.sin(angle) * radius,
        speed: 0.2 + Math.random() * 0.4,
        offset: i * 0.8,
        amplitude: 0.3 + Math.random() * 0.7,
        orbitR: radius,
        orbitAngle: angle,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      // Gentle orbit + bobbing
      d.orbitAngle += d.speed * 0.005;
      dummy.position.set(
        Math.cos(d.orbitAngle) * d.orbitR,
        d.y + Math.sin(t * d.speed + d.offset) * d.amplitude,
        Math.sin(d.orbitAngle) * d.orbitR
      );
      // Pulse size
      const pulse = 0.04 + Math.abs(Math.sin(t * d.speed + d.offset)) * 0.04;
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#a8ff78"
        emissive="#a8ff78"
        emissiveIntensity={3}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
