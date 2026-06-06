import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RibbonProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  speed: number;
  phase: number;
  amplitude: number;
  opacity: number;
  width: number;
  height: number;
}

function AuroraRibbon({
  position,
  rotation = [0, 0, 0],
  color,
  speed,
  phase,
  amplitude,
  opacity,
  width,
  height,
}: RibbonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const SEGS_X = 50;
  const SEGS_Y = 4;

  const { geometry, basePositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, SEGS_X, SEGS_Y);
    const base = new Float32Array(geo.attributes.position.array);
    return { geometry: geo, basePositions: base };
  }, [width, height]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const baseX = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];
      // Only wave upper portion — edgeFactor: 0 at bottom, 1 at top
      const edgeFactor = Math.max(0, (baseY + height / 2) / height);
      const wave1 = Math.sin(baseX * 0.07 + t * speed + phase) * amplitude * edgeFactor;
      const wave2 = Math.sin(baseX * 0.13 + t * speed * 1.4 + phase + 2.1) * amplitude * 0.4 * edgeFactor;
      pos.setY(i, baseY + wave1 + wave2);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function Aurora() {
  const ribbons: RibbonProps[] = [
    {
      position: [0, 28, -55],
      rotation: [0.18, 0, 0],
      color: '#00ffaa',
      speed: 0.4,
      phase: 0,
      amplitude: 5,
      opacity: 0.18,
      width: 120,
      height: 18,
    },
    {
      position: [10, 22, -50],
      rotation: [0.15, 0.15, 0],
      color: '#a855f7',
      speed: 0.3,
      phase: 1.5,
      amplitude: 4,
      opacity: 0.14,
      width: 100,
      height: 14,
    },
    {
      position: [-8, 25, -52],
      rotation: [0.2, -0.1, 0],
      color: '#22d3ee',
      speed: 0.5,
      phase: 3.1,
      amplitude: 3.5,
      opacity: 0.12,
      width: 90,
      height: 12,
    },
    {
      position: [5, 32, -60],
      rotation: [0.12, 0.05, 0],
      color: '#4ade80',
      speed: 0.25,
      phase: 0.8,
      amplitude: 6,
      opacity: 0.10,
      width: 130,
      height: 20,
    },
  ];

  return (
    <>
      {ribbons.map((r, i) => (
        <AuroraRibbon key={i} {...r} />
      ))}
    </>
  );
}
