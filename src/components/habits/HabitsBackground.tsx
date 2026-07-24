import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

function GalaxyStars() {
  const count = 300;
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 10 + Math.random() * 80;
      const speed = 0.005 + Math.random() / 300;
      const xFactor = -40 + Math.random() * 80;
      const yFactor = -40 + Math.random() * 80;
      const zFactor = -40 + Math.random() * 80;
      // Add a slight color variation for galaxy feel
      const color = new THREE.Color();
      const r = Math.random();
      if (r > 0.8) color.set('#c084fc'); // purple
      else if (r > 0.6) color.set('#34d399'); // emerald
      else color.set('#818cf8'); // indigo
      
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0, color });
    }
    return temp;
  }, [count]);

  const dummy = new THREE.Object3D();
  
  // Set initial colors once
  useEffect(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      mesh.current!.setColorAt(i, p.color);
    });
    mesh.current!.instanceColor!.needsUpdate = true;
  }, [particles]);

  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t) * 0.5 + 0.5;
      
      // Gentle mouse interaction
      particle.mx += (state.pointer.x * 2 - particle.mx) * 0.02;
      particle.my += (state.pointer.y * 2 - particle.my) * 0.02;
      
      dummy.position.set(
        (particle.mx * 5) + a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my * 5) + b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my * 5) + b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      {/* Use icosahedron for cheap, perfectly smooth looking spheres */}
      <icosahedronGeometry args={[0.12, 1]} />
      <meshBasicMaterial transparent opacity={0.6} depthWrite={false} />
    </instancedMesh>
  );
}

export function HabitsBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        dpr={[1, 2]}
      >
        <GalaxyStars />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 pointer-events-none" />
    </div>
  );
}

export default HabitsBackground;
