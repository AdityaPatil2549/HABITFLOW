/* eslint-disable react-hooks/purity */
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, Suspense, useEffect } from 'react';
import * as THREE from 'three';

interface ConstellationProps { score: number }

function Constellation({ score }: ConstellationProps) {
  const pointsRef  = useRef<THREE.Points>(null);
  const linesRef   = useRef<THREE.LineSegments>(null);
  const COUNT = 90;

  const { pointsGeo, linesGeo } = useMemo(() => {
    // Random particle positions
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }

    // Connect nearby particles â€” density scales with score
    const threshold = 2.5 + (score / 100) * 2.5;
    const lineArr: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = pos[i*3] - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        if (dx*dx + dy*dy + dz*dz < threshold * threshold) {
          lineArr.push(
            pos[i*3], pos[i*3+1], pos[i*3+2],
            pos[j*3], pos[j*3+1], pos[j*3+2],
          );
        }
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const lGeo = new THREE.BufferGeometry();
    if (lineArr.length) {
      lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineArr), 3));
    }

    return { pointsGeo: pGeo, linesGeo: lineArr.length ? lGeo : null };
  }, [score]);

  useEffect(() => {
    return () => {
      pointsGeo.dispose();
      if (linesGeo) linesGeo.dispose();
    };
  }, [pointsGeo, linesGeo]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const rot = { y: t * 0.022, x: Math.sin(t * 0.014) * 0.055 };
    if (pointsRef.current)  { pointsRef.current.rotation.y  = rot.y; pointsRef.current.rotation.x  = rot.x; }
    if (linesRef.current)   { linesRef.current.rotation.y   = rot.y; linesRef.current.rotation.x   = rot.x; }
  });

  return (
    <>
      <points ref={pointsRef} geometry={pointsGeo}>
        <pointsMaterial size={0.075} color="#818cf8" transparent opacity={0.55} sizeAttenuation />
      </points>
      {linesGeo && (
        <lineSegments ref={linesRef} geometry={linesGeo}>
          <lineBasicMaterial color="#6366f1" transparent opacity={0.14} />
        </lineSegments>
      )}
    </>
  );
}

export function ReviewBackground({ score = 0 }: { score?: number }) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.05} />
          <pointLight position={[0, 0, 8]} color="#818cf8" intensity={2} />
          <Constellation score={score} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default ReviewBackground;
