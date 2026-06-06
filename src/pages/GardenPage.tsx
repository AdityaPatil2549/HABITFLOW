import { useEffect, Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sky } from '@react-three/drei';
import { useHabitStore } from '../store/habitStore';
import { HabitPlant } from '../components/garden/HabitPlant';
import { motion } from 'framer-motion';

// ── Error boundary for WebGL / R3F crashes ──────────────────────────
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0B0E14]">
          <div className="text-6xl">🌱</div>
          <h2 className="text-xl font-bold text-white">3D Garden Unavailable</h2>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Your browser doesn't support WebGL, or the GPU context was lost. Try refreshing or using a different browser.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function GardenPage() {
  const { habits, loadHabits } = useHabitStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadHabits();
    document.title = 'Habit Garden — HabitFlow';
  }, []); // empty deps — loadHabits ref changes every render (Zustand), calling once is correct

  const activeHabits = habits.filter(h => !h.archived);

  // Distribute plants in a golden spiral for natural look
  const getPlantPosition = (index: number, total: number): [number, number, number] => {
    if (total === 1) return [0, 0, 0];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angle = index * goldenRatio * Math.PI * 2;
    const radius = Math.sqrt(index) * 2;
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full"
    >
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-white drop-shadow-lg">Your Habit Garden</h1>
        <p className="text-slate-300 font-medium mt-2 drop-shadow-md">
          {activeHabits.length} habits growing. Keep up your streaks to see them flourish!
        </p>
      </div>

      <CanvasErrorBoundary>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
          <Suspense fallback={null}>
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <ambientLight intensity={0.5} />
            <directionalLight
              castShadow
              position={[10, 20, 10]}
              intensity={1.5}
              shadow-mapSize={[1024, 1024]}
            />
            
            <group position={[0, -1, 0]}>
              {/* The Island */}
              <mesh receiveShadow position={[0, -0.5, 0]}>
                <cylinderGeometry args={[12, 10, 1, 32]} />
                <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
              </mesh>

              {/* Plants — guard against habits with undefined streak data */}
              {activeHabits.map((habit, index) => (
                habit.streak ? (
                  <HabitPlant 
                    key={habit.id} 
                    habit={habit} 
                    position={getPlantPosition(index, activeHabits.length)} 
                  />
                ) : null
              ))}
            </group>

            <ContactShadows
              resolution={1024}
              scale={40}
              blur={2}
              opacity={0.5}
              far={10}
              color="#000000"
            />
            <Environment preset="park" />
            <OrbitControls 
              autoRotate 
              autoRotateSpeed={0.5} 
              maxPolarAngle={Math.PI / 2 - 0.1}
              minDistance={5}
              maxDistance={25}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </motion.div>
  );
}
