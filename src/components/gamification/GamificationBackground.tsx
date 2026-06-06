import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

// Palette matches gamification vibes: amber, orange, purple, pink
const PALETTE: [number, number, number][] = [
  [0.961, 0.620, 0.063], // amber
  [0.976, 0.451, 0.086], // orange
  [0.545, 0.361, 0.965], // purple
  [0.925, 0.282, 0.600], // pink
  [0.992, 0.898, 0.306], // gold
];

const COUNT = 70;

function FloatingParticles() {
  const pointsRef  = useRef<THREE.Points>(null);
  const speedsRef  = useRef<Float32Array>(
    Float32Array.from({ length: COUNT }, () => 0.002 + Math.random() * 0.005)
  );
  const phasesRef  = useRef<Float32Array>(
    Float32Array.from({ length: COUNT }, () => Math.random() * Math.PI * 2)
  );

  const geo = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3]     = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t   = clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      // Float upward slowly
      let y = pos.getY(i) + speedsRef.current[i];
      if (y > 12) {
        y = -12;
        pos.setX(i, (Math.random() - 0.5) * 30);
      }
      // Gentle lateral sway
      const sway = Math.sin(t * 0.3 + phasesRef.current[i]) * 0.015;
      pos.setX(i, pos.getX(i) + sway);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.008;
    pointsRef.current.rotation.x = Math.sin(t * 0.05) * 0.05;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.22}
        vertexColors
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function GamificationBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 55 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <FloatingParticles />
        </Suspense>
      </Canvas>
      {/* Background ambient glow matching the palette */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[40%] h-[40%] rounded-full blur-[140px] opacity-[0.08]"
          style={{ background: '#f59e0b' }} />
        <div className="absolute bottom-[0%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-[0.06]"
          style={{ background: '#ec4899' }} />
      </div>
    </div>
  );
}

export default GamificationBackground;
