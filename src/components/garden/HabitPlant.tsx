import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html, useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { HabitWithStreak } from '../../types';

export function HabitPlant({
  habit,
  position
}: {
  habit: HabitWithStreak;
  position: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const isMissed = habit.todayLog?.value === 0 && habit.streak.current === 0;

  // Simple procedural geometry based on streak
  const streak = habit.streak.current;
  let scale = 1;
  let color = habit.color || '#10b981';
  let height = 1;

  if (streak === 0) {
    scale = 0.5; // Seed/Sprout
    height = 0.5;
  } else if (streak < 3) {
    scale = 1; // Sapling
    height = 1.5;
  } else if (streak < 10) {
    scale = 1.5; // Small Tree
    height = 2.5;
  } else {
    scale = 2; // Big Tree
    height = 4;
  }

  if (isMissed) {
    color = '#9ca3af'; // Gray out if missed yesterday/withering
  }

  useFrame((state) => {
    if (group.current && !isMissed) {
      // Gentle wind sway
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
      group.current.rotation.z = Math.cos(state.clock.elapsedTime * 1.5 + position[2]) * 0.05;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Stem/Trunk */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.15 * scale, height, 8]} />
        <meshStandardMaterial color={isMissed ? '#6b7280' : '#8b4513'} roughness={0.9} />
      </mesh>

      {/* Leaves/Canopy */}
      <Float speed={isMissed ? 0 : 2} rotationIntensity={isMissed ? 0 : 0.2} floatIntensity={isMissed ? 0 : 0.2}>
        <mesh position={[0, height, 0]} castShadow>
          {streak >= 10 ? (
            <sphereGeometry args={[1 * scale, 16, 16]} />
          ) : streak >= 3 ? (
            <coneGeometry args={[0.8 * scale, 1.5 * scale, 8]} />
          ) : (
            <sphereGeometry args={[0.4 * scale, 8, 8]} />
          )}
          <meshStandardMaterial 
            color={color} 
            roughness={0.6}
            emissive={isMissed ? '#000000' : color}
            emissiveIntensity={0.2}
          />
        </mesh>
      </Float>

      {/* Soil mound */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.4 * scale, 0.5 * scale, 0.2, 16]} />
        <meshStandardMaterial color="#3f2e1e" roughness={1} />
      </mesh>

      {/* Label */}
      <Html position={[0, height + 1.5 * scale, 0]} center distanceFactor={15}>
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-center pointer-events-none whitespace-nowrap transform transition-all">
          <div className="text-white font-bold text-sm flex items-center gap-1.5 justify-center">
            <span>{habit.icon}</span> {habit.name}
          </div>
          <div className="text-amber-400 font-black text-xs flex justify-center items-center gap-1 mt-0.5">
             {streak}d streak
          </div>
        </div>
      </Html>
    </group>
  );
}
