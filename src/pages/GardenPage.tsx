import { useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sky } from '@react-three/drei';
import { useHabitStore } from '../store/habitStore';
import { HabitPlant } from '../components/garden/HabitPlant';
import { motion } from 'framer-motion';

export function GardenPage() {
  const { habits, loadHabits } = useHabitStore();

  useEffect(() => {
    loadHabits();
    document.title = 'Habit Garden — HabitFlow';
  }, [loadHabits]);

  const activeHabits = habits.filter(h => !h.archived);

  // Distribute plants in a circle or grid
  const getPlantPosition = (index: number, total: number): [number, number, number] => {
    if (total === 1) return [0, 0, 0];
    
    // Golden spiral distribution for natural look
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angle = index * goldenRatio * Math.PI * 2;
    const radius = Math.sqrt(index) * 2; // Spread outwards
    
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

            {/* Plants */}
            {activeHabits.map((habit, index) => (
              <HabitPlant 
                key={habit.id} 
                habit={habit} 
                position={getPlantPosition(index, activeHabits.length)} 
              />
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
    </motion.div>
  );
}
