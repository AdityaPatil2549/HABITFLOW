import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Decorative glowing stepping-stone path radiating from the center
 * toward each plant position. Creates a magical garden path feel.
 */
export function SteppingStones({
  plantPositions,
}: {
  plantPositions: [number, number, number][];
}) {
  const stones = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number; color: string }[] = [];
    const COLORS = ['#a78bfa', '#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#818cf8'];

    plantPositions.forEach((plantPos, pi) => {
      const px = plantPos[0];
      const pz = plantPos[2];
      const dist = Math.sqrt(px * px + pz * pz);
      if (dist < 0.5) return; // skip if plant is at center

      const steps = Math.max(2, Math.min(4, Math.floor(dist / 2)));
      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        const x = px * t + (Math.random() - 0.5) * 0.3;
        const z = pz * t + (Math.random() - 0.5) * 0.3;
        result.push({
          pos: [x, 0.08, z],
          scale: 0.16 + Math.random() * 0.12,
          color: COLORS[pi % COLORS.length],
        });
      }
    });

    // Decorative outer ring of stones
    const ringCount = Math.min(plantPositions.length * 2 + 6, 24);
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const r = 1.6 + Math.sin(i * 1.7) * 0.3;
      result.push({
        pos: [Math.cos(angle) * r, 0.06, Math.sin(angle) * r],
        scale: 0.12 + Math.random() * 0.08,
        color: COLORS[i % COLORS.length],
      });
    }

    return result;
  }, [plantPositions]);

  if (stones.length === 0) return null;

  return (
    <group>
      {stones.map((stone, i) => (
        <group key={i} position={stone.pos}>
          {/* Stone disc */}
          <mesh rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]} receiveShadow>
            <cylinderGeometry args={[stone.scale, stone.scale * 0.85, 0.07, 6]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.85}
              metalness={0.1}
              flatShading
            />
          </mesh>
          {/* Glow halo */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[stone.scale * 0.5, stone.scale * 1.4, 12]} />
            <meshBasicMaterial
              color={stone.color}
              transparent
              opacity={0.22}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

