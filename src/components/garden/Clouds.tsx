import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudData {
  x: number;
  y: number;
  z: number;
  speed: number;
  angle: number;
  radius: number;
  scale: number;
}

/** Low-poly cloud cluster using merged sphere geometries */
function CloudMesh({ scale = 1 }: { scale?: number }) {
  // Fixed puff offsets for this cloud shape
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 1.0],
    [1.1, 0.2, 0, 0.8],
    [-1.0, 0.1, 0.1, 0.75],
    [0.5, 0.55, 0.2, 0.65],
    [-0.4, 0.5, -0.1, 0.55],
    [1.6, -0.1, 0.1, 0.55],
    [-1.5, -0.1, 0, 0.5],
  ];
  return (
    <group scale={scale}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow={false}>
          <sphereGeometry args={[r, 5, 4]} />
          <meshStandardMaterial
            color="#c8dff0"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.82}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

const CLOUD_COUNT = 7;

export function Clouds() {
  const groupRef = useRef<THREE.Group>(null);

  const clouds: CloudData[] = useMemo(() => {
    return Array.from({ length: CLOUD_COUNT }, (_, i) => {
      const angle = (i / CLOUD_COUNT) * Math.PI * 2;
      const radius = 12 + Math.random() * 8;
      return {
        x: Math.cos(angle) * radius,
        y: 6 + Math.random() * 5,
        z: Math.sin(angle) * radius,
        speed: 0.015 + Math.random() * 0.02,
        angle,
        radius,
        scale: 0.6 + Math.random() * 0.9,
      };
    });
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const children = groupRef.current.children;
    clouds.forEach((cloud, i) => {
      cloud.angle += cloud.speed * delta;
      const child = children[i];
      if (child) {
        child.position.x = Math.cos(cloud.angle) * cloud.radius;
        child.position.z = Math.sin(cloud.angle) * cloud.radius;
        // Gentle bob
        child.position.y = cloud.y + Math.sin(cloud.angle * 2.3) * 0.4;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <group key={i} position={[cloud.x, cloud.y, cloud.z]}>
          <CloudMesh scale={cloud.scale} />
        </group>
      ))}
    </group>
  );
}
