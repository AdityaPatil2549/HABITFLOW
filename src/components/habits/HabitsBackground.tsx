import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

// Palette matches habit COLORS: indigo, violet, emerald, rose, amber, cyan
const PALETTE: [number, number, number][] = [
  [0.388, 0.4,  0.945],
  [0.545, 0.361,0.965],
  [0.063, 0.714,0.506],
  [0.957, 0.259,0.361],
  [0.961, 0.620,0.063],
  [0.024, 0.714,0.831],
];

const COUNT = 60;

function FloatingParticles() {
  const pointsRef  = useRef<THREE.Points>(null);
  const speedsRef  = useRef<Float32Array>(
    Float32Array.from({ length: COUNT }, () => 0.003 + Math.random() * 0.006)
  );
  const phasesRef  = useRef<Float32Array>(
    Float32Array.from({ length: COUNT }, () => Math.random() * Math.PI * 2)
  );

  const geo = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
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
      // Float upward
      let y = pos.getY(i) + speedsRef.current[i];
      if (y > 10) {
        y = -10;
        pos.setX(i, (Math.random() - 0.5) * 26);
      }
      // Gentle lateral sway
      const sway = Math.sin(t * 0.4 + phasesRef.current[i]) * 0.012;
      pos.setX(i, pos.getX(i) + sway);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    // Very slow global rotation
    pointsRef.current.rotation.y = t * 0.012;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.18}
        vertexColors
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function HabitsBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <FloatingParticles />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HabitsBackground;
