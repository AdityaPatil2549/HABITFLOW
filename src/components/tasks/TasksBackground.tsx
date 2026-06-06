import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

interface ShapeConfig {
  position: [number, number, number];
  color: string;
  type: 'ico' | 'torus' | 'sphere';
  speed: number;
  rot: [number, number, number];
}

const SHAPES: ShapeConfig[] = [
  { position: [-8, 4, -6],  color: '#818cf8', type: 'ico',    speed: 0.40, rot: [0.5, 0.3, 0.0] },
  { position: [ 7, -3, -8], color: '#6366f1', type: 'torus',  speed: 0.30, rot: [0.2, 0.8, 0.0] },
  { position: [-4, -5, -5], color: '#ef4444', type: 'sphere', speed: 0.50, rot: [0.1, 0.5, 0.3] },
  { position: [ 9,  6, -10],color: '#818cf8', type: 'torus',  speed: 0.25, rot: [0.3, 0.2, 0.7] },
  { position: [ 3, -7, -4], color: '#34d399', type: 'ico',    speed: 0.60, rot: [0.6, 0.1, 0.4] },
  { position: [-3,  7, -9], color: '#6366f1', type: 'sphere', speed: 0.35, rot: [0.2, 0.9, 0.1] },
  { position: [ 5,  2, -7], color: '#f97316', type: 'ico',    speed: 0.45, rot: [0.4, 0.3, 0.6] },
  { position: [-7, -1, -12],color: '#818cf8', type: 'torus',  speed: 0.20, rot: [0.1, 0.7, 0.2] },
  { position: [ 1,  9, -11],color: '#a78bfa', type: 'sphere', speed: 0.32, rot: [0.3, 0.4, 0.5] },
  { position: [-6,  1, -7], color: '#34d399', type: 'torus',  speed: 0.55, rot: [0.7, 0.2, 0.3] },
  { position: [ 4,  8, -5], color: '#ef4444', type: 'ico',    speed: 0.38, rot: [0.2, 0.6, 0.1] },
  { position: [-2, -8, -9], color: '#818cf8', type: 'sphere', speed: 0.42, rot: [0.5, 0.3, 0.8] },
];

function FloatingShape({ position, color, type, speed, rot }: ShapeConfig) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.x = rot[0] + Math.sin(t * speed * 0.3) * 0.5;
    ref.current.rotation.y = rot[1] + t * speed * 0.5;
    ref.current.rotation.z = rot[2] + Math.cos(t * speed * 0.2) * 0.3;
    ref.current.position.y = position[1] + Math.sin(t * speed * 0.4) * 0.8;
  });

  return (
    <mesh ref={ref} position={position}>
      {type === 'ico'    && <icosahedronGeometry args={[1, 0]} />}
      {type === 'torus'  && <torusGeometry args={[1, 0.22, 6, 12]} />}
      {type === 'sphere' && <sphereGeometry args={[0.65, 7, 7]} />}
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.13}
        emissive={color}
        emissiveIntensity={0.7}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]}   color="#818cf8" intensity={3} />
      <pointLight position={[-5, -3, 4]} color="#6366f1" intensity={2} />
      <fog attach="fog" args={['#020617', 8, 30]} />
      {SHAPES.map((s, i) => <FloatingShape key={i} {...s} />)}
    </>
  );
}

export function TasksBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none opacity-70">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 65 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default TasksBackground;
