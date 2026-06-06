import {
  useEffect,
  Suspense,
  Component,
  type ReactNode,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, Stars, ContactShadows, CameraControls } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import { useHabitStore } from '../store/habitStore';
import { useModalStore } from '../store/modalStore';
import { HabitPlant } from '../components/garden/HabitPlant';
import { FloatingIsland } from '../components/garden/FloatingIsland';
import { Fireflies } from '../components/garden/Fireflies';
import { Clouds } from '../components/garden/Clouds';
import { Butterflies } from '../components/garden/Butterflies';
import { CenterCrystal } from '../components/garden/CenterCrystal';
import { Aurora } from '../components/garden/Aurora';
import { IslandMist } from '../components/garden/IslandMist';
import { SteppingStones } from '../components/garden/SteppingStones';
import { motion, AnimatePresence } from 'framer-motion';
import type { HabitWithStreak } from '../types';
import { format } from 'date-fns';


// ── Error boundary ─────────────────────────────────────────────────────
class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#080b12]">
          <div className="text-7xl">🌱</div>
          <h2 className="text-2xl font-black text-white">3D Garden Unavailable</h2>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Your browser doesn't support WebGL. Try refreshing in Chrome or Edge.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function getPlantPosition(index: number, total: number): [number, number, number] {
  if (total === 1) return [3, 0, 0];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angle = index * goldenRatio * Math.PI * 2;
  const radius = 2.0 + Math.sqrt(index / Math.max(total, 1)) * 7;
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
}

// ── Habit detail panel (HTML overlay) ─────────────────────────────────
function HabitDetailPanel({
  habit,
  onClose,
  onLog,
  onUnlog,
}: {
  habit: HabitWithStreak;
  onClose: () => void;
  onLog: () => void;
  onUnlog: () => void;
}) {
  const streak = habit.streak?.current ?? 0;
  const color = habit.color || '#10b981';
  const isLogged = !!habit.todayLog;
  const completionRate = habit.completionRate30Days ?? 0;

  const stageName =
    streak === 0
      ? 'Seed'
      : streak < 3
        ? 'Sapling'
        : streak < 10
          ? 'Young Tree'
          : 'Ancient Tree';
  const stageEmoji =
    streak === 0 ? '🌱' : streak < 3 ? '🌿' : streak < 10 ? '🌳' : '🌲';

  const nextMilestone =
    streak < 3 ? 3 : streak < 10 ? 10 : streak < 30 ? 30 : streak + 10;
  const toNext = nextMilestone - streak;

  return (
    <motion.div
      initial={{ y: 30, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{
        position: 'absolute',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 340,
        background: 'rgba(8, 11, 20, 0.92)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${color}44`,
        borderRadius: '24px',
        padding: '24px',
        boxShadow: `0 0 40px ${color}22, 0 24px 48px rgba(0,0,0,0.5)`,
        zIndex: 30,
        pointerEvents: 'all',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          background: 'rgba(255,255,255,0.07)',
          border: 'none',
          borderRadius: '50%',
          width: 28,
          height: 28,
          color: '#9ca3af',
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            background: `${color}22`,
            border: `2px solid ${color}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            boxShadow: `0 0 16px ${color}33`,
          }}
        >
          {habit.icon}
        </div>
        <div>
          <h3
            style={{
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
              fontFamily: 'Outfit, Inter, sans-serif',
              margin: 0,
            }}
          >
            {habit.name}
          </h3>
          <div style={{ color, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
            {stageEmoji} {stageName}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {[
          { label: 'Streak', value: `${streak}d`, color: '#fbbf24' },
          { label: 'Best', value: `${habit.streak?.best ?? 0}d`, color: '#a78bfa' },
          { label: '30d Rate', value: `${Math.round(completionRate * 100)}%`, color },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: '10px 8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: stat.color,
                fontWeight: 800,
                fontSize: 18,
                textShadow: `0 0 10px ${stat.color}66`,
              }}
            >
              {stat.value}
            </div>
            <div style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress to next milestone */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#6b7280',
            marginBottom: 6,
          }}
        >
          <span>Next stage in {toNext} day{toNext !== 1 ? 's' : ''}</span>
          <span>
            {streak} / {nextMilestone}d
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((streak / nextMilestone) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            style={{
              height: '100%',
              borderRadius: 6,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}88`,
            }}
          />
        </div>
      </div>

      {/* Log / Unlog button */}
      {isLogged ? (
        <button
          onClick={onUnlog}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.1)',
            color: '#f87171',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Outfit, Inter, sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e =>
            ((e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)')
          }
          onMouseLeave={e =>
            ((e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)')
          }
        >
          ✓ Logged Today — Undo
        </button>
      ) : (
        <button
          onClick={onLog}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            border: `1px solid ${color}66`,
            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Outfit, Inter, sans-serif',
            boxShadow: `0 0 20px ${color}33`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e =>
            ((e.target as HTMLButtonElement).style.boxShadow = `0 0 30px ${color}55`)
          }
          onMouseLeave={e =>
            ((e.target as HTMLButtonElement).style.boxShadow = `0 0 20px ${color}33`)
          }
        >
          🌿 Complete Today's Habit
        </button>
      )}
    </motion.div>
  );
}

// ── Stats sidebar ──────────────────────────────────────────────────────
const STAGES = [
  { emoji: '🌱', label: 'Seed', streak: '0d' },
  { emoji: '🌿', label: 'Sapling', streak: '1–2d' },
  { emoji: '🌳', label: 'Young Tree', streak: '3–9d' },
  { emoji: '🌲', label: 'Ancient Tree', streak: '10d+' },
];

function StatsSidebar({ habits }: { habits: HabitWithStreak[] }) {
  const active = habits.filter(h => !h.archived);
  const topHabits = [...active]
    .sort((a, b) => (b.streak?.current ?? 0) - (a.streak?.current ?? 0))
    .slice(0, 5);

  const totalStreak = active.reduce((s, h) => s + (h.streak?.current ?? 0), 0);
  const avgStreak = active.length > 0 ? (totalStreak / active.length).toFixed(1) : '0';
  const thriving = active.filter(h => (h.streak?.current ?? 0) >= 3).length;

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
      className="absolute right-5 top-5 bottom-5 w-68 flex flex-col gap-3 z-10 pointer-events-none"
      style={{ width: 264 }}
    >
      {/* Health */}
      <div
        style={{
          background: 'rgba(8, 11, 18, 0.82)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px',
          padding: '18px',
        }}
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Garden Health
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Plants', value: active.length, color: '#34d399' },
            { label: 'Thriving', value: thriving, color: '#a78bfa' },
            { label: 'Avg Streak', value: `${avgStreak}d`, color: '#fbbf24' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl font-black"
                style={{ color: stat.color, textShadow: `0 0 12px ${stat.color}88` }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div
        style={{
          background: 'rgba(8, 11, 18, 0.82)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px',
          padding: '18px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Tallest Trees 🏆
        </h3>
        <div className="flex flex-col gap-2.5">
          {topHabits.map((habit, i) => {
            const streak = habit.streak?.current ?? 0;
            const color = habit.color || '#10b981';
            return (
              <div key={habit.id} className="flex items-center gap-2.5">
                <div
                  className="text-xs font-black w-4 text-center flex-shrink-0"
                  style={{ color: i === 0 ? '#fbbf24' : '#475569' }}
                >
                  {i + 1}
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: color + '25', border: `1px solid ${color}55` }}
                >
                  {habit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{habit.name}</div>
                  <div className="h-1 rounded-full bg-slate-800 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((streak / 30) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: `0 0 6px ${color}66`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs font-bold flex-shrink-0" style={{ color }}>
                  {streak}d
                </div>
              </div>
            );
          })}
          {topHabits.length === 0 && (
            <p className="text-slate-500 text-xs text-center py-4">
              Add habits to grow your garden!
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          background: 'rgba(8, 11, 18, 0.82)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '14px 18px',
        }}
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
          Growth Stages
        </h3>
        <div className="flex flex-col gap-1.5">
          {STAGES.map(s => (
            <div key={s.label} className="flex items-center gap-2.5">
              <span className="text-base">{s.emoji}</span>
              <span className="text-xs text-slate-300 font-medium">{s.label}</span>
              <span className="text-xs text-slate-600 ml-auto">{s.streak}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Camera fly-to rig ─────────────────────────────────────────────────────
function CameraRig({
  selectedPos,
  autoRotate,
}: {
  selectedPos: [number, number, number] | null;
  autoRotate: boolean;
}) {
  const controlsRef = useRef<CameraControls>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    if (selectedPos) {
      const [x, y, z] = selectedPos;
      const dist = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(x, z);
      // Orbit to a position facing the plant from outside
      const camX = x + Math.sin(angle) * 5;
      const camZ = z + Math.cos(angle) * 5;
      void controlsRef.current.setLookAt(camX, y + 4, camZ, x, y + 1.5, z, true);
    } else {
      void controlsRef.current.setLookAt(0, 7, 14, 0, 1, 0, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPos]);

  // Manual auto-rotate via azimuth in useFrame
  useFrame((_, delta) => {
    if (!controlsRef.current || !autoRotate) return;
    void controlsRef.current.rotate(0.003 * delta * 60, 0, false);
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={5}
      maxDistance={30}
      polarRotateSpeed={0.6}
      azimuthRotateSpeed={0.6}
      truckSpeed={0}
    />
  );
}

// ── 3D scene ─────────────────────────────────────────────────────
function GardenScene({
  habits,
  selectedId,
  onSelect,
  completionRate,
  autoRotate,
  plantPositions,
}: {
  habits: HabitWithStreak[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  completionRate: number;
  autoRotate: boolean;
  plantPositions: [number, number, number][];
}) {
  const activeHabits = habits.filter(h => !h.archived);

  // Find selected plant world position for camera fly-to
  const selectedPos = useMemo<[number, number, number] | null>(() => {
    if (!selectedId) return null;
    const idx = activeHabits.findIndex(h => h.id === selectedId);
    return idx >= 0 ? plantPositions[idx] : null;
  }, [selectedId, activeHabits, plantPositions]);

  // Dynamic sky color based on completion rate
  const skyHue = Math.round(200 + completionRate * 60);
  const skyColor = `hsl(${skyHue}, 70%, 8%)`;

  // Butterflies only visit thriving plants (streak ≥ 3)
  const thrivingPositions = useMemo(
    () =>
      activeHabits
        .filter(h => (h.streak?.current ?? 0) >= 3)
        .map((_, i) => plantPositions[i]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeHabits.length]
  );

  return (
    <>
      <color attach="background" args={[skyColor]} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        castShadow
        position={[15, 25, 10]}
        intensity={1.8}
        color="#fff8e7"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[0, -4, 0]} intensity={0.4} color="#2d6a4f" />
      <pointLight position={[-8, 6, 8]} intensity={0.5} color="#ffb347" />

      {/* Sky & atmosphere */}
      <Stars radius={120} depth={60} count={3000} factor={4} saturation={0.2} fade speed={0.4} />
      <Aurora />
      <Clouds />

      {/* Island + mist */}
      <FloatingIsland />
      <IslandMist />
      <Fireflies />

      {/* Island content */}
      <group position={[0, 0.5, 0]}>
        {/* Stepping stones */}
        <SteppingStones plantPositions={plantPositions} />

        {/* Center crystal */}
        <CenterCrystal completionRate={completionRate} />

        {/* Plants */}
        {activeHabits.map((habit, index) => (
          <HabitPlant
            key={habit.id}
            habit={habit}
            position={plantPositions[index]}
            selected={selectedId === habit.id}
            onSelect={onSelect}
          />
        ))}
      </group>

      {/* Butterflies */}
      {thrivingPositions.length > 0 && (
        <Butterflies plantPositions={thrivingPositions} />
      )}

      <ContactShadows
        position={[0, -0.1, 0]}
        resolution={1024}
        scale={30}
        blur={3}
        opacity={0.5}
        far={8}
        color="#000000"
      />

      <Environment preset="night" />

      {/* Camera rig with fly-to */}
      <CameraRig selectedPos={selectedPos} autoRotate={autoRotate} />

      <EffectComposer>
        <Bloom intensity={1.6} luminanceThreshold={0.42} luminanceSmoothing={0.8} mipmapBlur />
        <DepthOfField focusDistance={0} focalLength={0.06} bokehScale={2.2} height={480} />
      </EffectComposer>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export function GardenPage() {
  const { habits, loadHabits, logHabit, unlogHabit } = useHabitStore();
  const { setQuickAddOpen } = useModalStore();
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

  // Compute plant positions once, shared between React UI and 3D scene
  const plantPositions = useMemo<[number, number, number][]>(
    () => activeHabits.map((_, i) => getPlantPosition(i, activeHabits.length)),
    [activeHabits.length]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadHabits();
    document.title = 'Habit Garden — HabitFlow';
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Daily completion rate
  const today = format(new Date(), 'yyyy-MM-dd');
  const completionRate = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    const done = activeHabits.filter(h => {
      if (!h.todayLog) return false;
      return h.todayLog.value >= (h.type === 'boolean' ? 1 : h.targetValue);
    }).length;
    return done / activeHabits.length;
  }, [activeHabits]);

  const selectedHabit = useMemo(
    () => habits.find(h => h.id === selectedId) ?? null,
    [habits, selectedId]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  }, []);

  const handleLog = useCallback(async () => {
    if (!selectedId) return;
    await logHabit(selectedId, 1);
    await loadHabits();
    // Keep panel open so user can see the celebration
  }, [selectedId, logHabit, loadHabits]);

  const handleUnlog = useCallback(async () => {
    if (!selectedId) return;
    await unlogHabit(selectedId);
    await loadHabits();
  }, [selectedId, unlogHabit, loadHabits]);

  const handleClose = useCallback(() => setSelectedId(null), []);



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: '#060912' }}
    >
      {/* ── Header ── */}
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute top-5 left-5 z-10 pointer-events-none"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🌿</span>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
                Habit Garden
              </h1>
            </div>
            <p className="text-slate-400 font-medium text-sm ml-1 drop-shadow-md">
              {activeHabits.length === 0
                ? 'Add your first habit to plant a seed!'
                : `${activeHabits.length} plants growing · ${Math.round(completionRate * 100)}% complete today`}
            </p>
            <p className="text-slate-600 text-xs mt-1 ml-1">
              Orbit · Zoom · Click a plant to log
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Today badge ── */}
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute top-5 z-10 pointer-events-none"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div
              style={{
                background: 'rgba(8,11,20,0.82)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '20px',
                padding: '6px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: completionRate >= 1 ? '#34d399' : completionRate > 0.5 ? '#fbbf24' : '#f87171',
                  boxShadow: `0 0 8px ${completionRate >= 1 ? '#34d399' : completionRate > 0.5 ? '#fbbf24' : '#f87171'}`,
                }}
              />
              <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'Outfit, Inter, sans-serif' }}>
                {today} ·{' '}
                <strong style={{ color: '#e2e8f0' }}>
                  {activeHabits.filter(h => !!h.todayLog).length}/{activeHabits.length}
                </strong>{' '}
                habits done
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Plant a Seed button ── */}
      {ready && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => setQuickAddOpen(true)}
          className="absolute bottom-6 left-6 z-10"
          style={{
            background: 'rgba(8,11,20,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(52,211,153,0.35)',
            borderRadius: '16px',
            padding: '10px 18px',
            color: '#34d399',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'Outfit, Inter, sans-serif',
            boxShadow: '0 0 18px rgba(52,211,153,0.15)',
            transition: 'all 0.2s',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 28px rgba(52,211,153,0.35)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 16 }}>🌱</span>
          Plant a Seed
        </motion.button>
      )}

      {/* ── Right sidebar ── */}

      {ready && <StatsSidebar habits={habits} />}

      {/* ── 3D Canvas ── */}
      <CanvasErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 7, 14], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <GardenScene
              habits={habits}
              selectedId={selectedId}
              onSelect={handleSelect}
              completionRate={completionRate}
              autoRotate={selectedId === null}
              plantPositions={plantPositions}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* ── Habit detail panel ── */}
      <AnimatePresence>
        {selectedHabit && (
          <HabitDetailPanel
            habit={selectedHabit}
            onClose={handleClose}
            onLog={handleLog}
            onUnlog={handleUnlog}
          />
        )}
      </AnimatePresence>

      {/* ── Loading overlay ── */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: 'rgba(6,9,18,0.96)' }}
          >
            <div className="text-6xl mb-4 animate-bounce">🌱</div>
            <p className="text-slate-400 text-sm font-medium">Growing your garden…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
