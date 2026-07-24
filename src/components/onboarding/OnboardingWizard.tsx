import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { GalaxyCanvas } from '../ui/GalaxyCanvas';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../../store/habitStore';
import { useProfileStore } from '../../store/profileStore';
import { ArrowRight, Check, Sparkles, ChevronRight, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { TiltCard } from '../ui/TiltCard';
import { DynamicIcon } from '../ui/DynamicIcon';

const GamificationBackground = lazy(() => import('../gamification/GamificationBackground'));

const ONBOARDING_KEY = 'habitflow_onboarding_done';

// ── Habit Templates per goal ───────────────────────────────────
const GOAL_TEMPLATES = {
  health: {
    label: 'Get Healthy',
    icon: '🏃',
    color: '#10b981',
    habits: [
      { name: 'Drink 8 glasses of water', icon: 'droplet', color: '#06b6d4', category: 'Health' },
      { name: 'Exercise for 30 minutes', icon: 'activity', color: '#10b981', category: 'Health' },
      { name: 'Sleep 8 hours', icon: 'moon', color: '#8b5cf6', category: 'Health' },
    ],
  },
  productivity: {
    label: 'Be Productive',
    icon: '🚀',
    color: '#6366f1',
    habits: [
      { name: 'Deep work session (2h)', icon: 'zap', color: '#f59e0b', category: 'Work' },
      { name: 'Plan tomorrow tonight', icon: 'checkSquare', color: '#6366f1', category: 'Work' },
      {
        name: 'No social media before noon',
        icon: 'shield',
        color: '#f43f5e',
        category: 'Personal',
      },
    ],
  },
  learning: {
    label: 'Learn Something',
    icon: '📚',
    color: '#f59e0b',
    habits: [
      { name: 'Read for 30 minutes', icon: 'book', color: '#f59e0b', category: 'Learning' },
      { name: 'Practice a new skill', icon: 'code', color: '#8b5cf6', category: 'Learning' },
      { name: 'Review flashcards', icon: 'layers', color: '#06b6d4', category: 'Learning' },
    ],
  },
  mindfulness: {
    label: 'Find Balance',
    icon: '🧘',
    color: '#8b5cf6',
    habits: [
      { name: 'Meditate for 10 minutes', icon: 'heart', color: '#8b5cf6', category: 'Personal' },
      {
        name: 'Write in gratitude journal',
        icon: 'feather',
        color: '#f59e0b',
        category: 'Personal',
      },
      { name: 'Evening walk', icon: 'map', color: '#10b981', category: 'Health' },
    ],
  },
  finance: {
    label: 'Build Wealth',
    icon: '💰',
    color: '#22c55e',
    habits: [
      { name: 'Track all expenses', icon: 'dollarSign', color: '#22c55e', category: 'Finance' },
      { name: 'Review savings goal', icon: 'trendingUp', color: '#6366f1', category: 'Finance' },
      { name: 'No impulse purchases', icon: 'shield', color: '#f43f5e', category: 'Finance' },
    ],
  },
} as const;

type GoalKey = keyof typeof GOAL_TEMPLATES;

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem(ONBOARDING_KEY);
    }
    return false;
  });

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  return { show, complete };
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0); // 0=welcome, 1=goal, 2=habits, 3=done
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const [selected, setSelected] = useState<boolean[]>([true, true, true]);
  const [adding, setAdding] = useState(false);

  const { addHabit } = useHabitStore();
  const { saveProfile } = useProfileStore();

  const selectedGoal = goal ? GOAL_TEMPLATES[goal] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  async function handleFinish() {
    if (!goal) return;
    setAdding(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    if (name.trim()) saveProfile({ name: name.trim() });

    const templates = GOAL_TEMPLATES[goal].habits;
    for (let i = 0; i < templates.length; i++) {
      if (!selected[i]) continue;
      const t = templates[i];
      await addHabit({
        name: t.name,
        icon: t.icon,
        color: t.color,
        category: t.category,
        type: 'boolean',
        frequency: 'daily',
        targetValue: 1,
        startDate: today,
        graceDayEnabled: false,
        archived: false,
      });
    }
    setAdding(false);
    setStep(3);
    setTimeout(() => {
      dialogRef.current?.close();
      onComplete();
    }, 2000);
  }

  const STEPS = ['Welcome', 'Your Goal', 'Your Habits', 'Ready!'];

  const STEP_COLORS = [
    'rgba(99,102,241,0.15)',
    'rgba(139,92,246,0.15)',
    'rgba(16,185,129,0.12)',
    'rgba(245,158,11,0.12)',
  ];

  return (
    <AnimatePresence>
      {/* Full-screen backdrop */}
      {/* Full-screen backdrop */}
      <dialog
        ref={dialogRef}
        className="dark-overlay m-0 p-0 border-0 outline-none open:animate-in open:fade-in duration-300 z-[9999]"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          boxSizing: 'border-box',
          backgroundColor: '#030208',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Galaxy Background */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* All-in-one galaxy: nebula clouds + twinkling stars */}
          <GalaxyCanvas />
        </div>

        {/* Centered content wrapper */}
        <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-6 relative z-10 my-auto">
          
          {/* Progress indicator at top, separated from card */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                    i < step
                      ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                      : i === step
                      ? 'bg-indigo-500/30 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-6 h-[1px] transition-all duration-500 ${
                      i < step ? 'bg-indigo-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="w-full min-w-[320px] max-w-[460px] relative mx-auto">
            {/* 3D Stacked Card Effect Backings matching screenshot precisely */}
            {/* Third card (furthest back) */}
            <motion.div 
              animate={{ rotate: [-2, -2.5, -2], y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute inset-0 top-[-12px] left-[-4px] right-[-4px] bottom-[12px] scale-[0.96] rounded-[24px] border border-purple-500/10 bg-[#0c081e]/40 backdrop-blur-md shadow-2xl pointer-events-none" 
            />
            {/* Second card */}
            <motion.div 
              animate={{ rotate: [1.5, 2, 1.5], y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-0 top-[-6px] left-[-2px] right-[-2px] bottom-[6px] scale-[0.98] rounded-[24px] border border-purple-500/20 bg-[#0c081e]/60 backdrop-blur-lg shadow-2xl pointer-events-none" 
            />

            {/* Main Front Card Container */}
            <div className="relative rounded-[24px] border border-purple-500/30 bg-[#070412]/95 backdrop-blur-3xl px-8 py-10 shadow-[0_0_80px_rgba(147,51,234,0.15)] overflow-hidden">
              {/* Inner ambient top glow inside the card */}
              <motion.div 
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-40 bg-purple-500/10 blur-[50px] pointer-events-none rounded-full" 
              />
              
              <AnimatePresence mode="wait">
                {/* ── Step 0: Welcome ── */}
                {step === 0 && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    className="text-center relative z-10 flex flex-col items-center w-full"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    >
                      <div className="w-16 h-16 mx-auto mb-6 rounded-[20px] bg-[#0c081e] border border-purple-500/30 p-2.5 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex items-center justify-center relative group hover:scale-105 transition-transform duration-300">
                        <div className="absolute inset-0 bg-purple-500/10 rounded-[20px] blur-sm group-hover:bg-purple-500/20 transition-all" />
                        <img
                          src="/logo.png"
                          alt="HabitFlow"
                          className="w-full h-full object-contain rounded-xl relative z-10 opacity-90"
                        />
                      </div>
                    </motion.div>

                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight leading-tight">
                      Welcome to{' '}
                      <span className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        HabitFlow
                      </span>
                    </h1>

                    <p className="text-[#8b949e] text-[14px] leading-relaxed mb-8 w-full">
                      Build powerful daily routines with a system that actually works. Let's get you set up in 60 seconds.
                    </p>

                    <div className="mb-6 w-full flex flex-col items-center">
                      <label className="text-[9px] font-bold tracking-[0.25em] text-[#6b7280] uppercase mb-4 text-center">
                        WHAT SHOULD WE CALL YOU?
                      </label>
                      <input
                        type="text"
                        placeholder="Your name..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && setStep(1)}
                        autoFocus
                        className="w-full bg-transparent border border-purple-500/40 shadow-[0_0_15px_rgba(147,51,234,0.15)] focus:border-purple-400 focus:shadow-[0_0_20px_rgba(147,51,234,0.3)] rounded-[14px] px-5 py-3.5 text-slate-300 text-center text-sm outline-none transition-all placeholder:text-[#4b5563]"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(1)}
                      className="relative w-full py-3.5 px-6 rounded-[14px] border border-purple-400/20 bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#3b0764] hover:from-[#3b0764] hover:to-[#4c1d95] text-white font-semibold text-[13px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(109,40,217,0.4)] transition-all overflow-hidden mb-4 group"
                    >
                      {/* Intense glowing lens flare with continuous sweeping animation */}
                      <motion.div 
                        animate={{ x: ['-200%', '400%', '400%'] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", times: [0, 0.4, 1] }}
                        className="absolute top-[-50%] bottom-[-50%] w-[100px] left-0 flex items-center justify-center pointer-events-none mix-blend-overlay rotate-12"
                      >
                        <div className="w-[40px] h-full bg-white opacity-40 blur-[12px]" />
                        <div className="w-[2px] h-full bg-white opacity-80 blur-[1px] absolute" />
                        <div className="w-[8px] h-full bg-purple-200 opacity-60 blur-[4px] absolute" />
                      </motion.div>
                      
                      <span className="relative z-10 flex items-center gap-2 tracking-wide">
                        Let's get started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>

                    <button
                      onClick={onComplete}
                      className="text-[11px] text-[#4b5563] hover:text-[#6b7280] transition-colors tracking-wide"
                    >
                      Skip setup
                    </button>
                  </motion.div>
                )}

              {/* ── Step 1: Goal Selection ── */}
              {step === 1 && (
                <motion.div
                  key="goal"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        color: '#818cf8',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      Step 2 of 4
                    </p>
                    <h2 style={{ fontSize: 30, fontWeight: 900, color: 'white', marginBottom: 8 }}>
                      What's your main goal?
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14 }}>
                      We'll suggest the perfect starter habits for you.
                    </p>
                  </div>

                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}
                  >
                    {(
                      Object.entries(GOAL_TEMPLATES) as [
                        GoalKey,
                        (typeof GOAL_TEMPLATES)[GoalKey],
                      ][]
                    ).map(([key, t], idx) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <TiltCard tiltIntensity={10} className="w-full block">
                          <button
                            onClick={() => {
                              setGoal(key);
                              setSelected([true, true, true]);
                              setStep(2);
                            }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group
                              ${
                                goal === key
                                  ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                                  : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                              }
                            `}
                          >
                            <span style={{ fontSize: 32, flexShrink: 0, transform: 'translateZ(20px)' }} className="group-hover:scale-110 transition-transform">{t.icon}</span>
                            <div style={{ flex: 1, minWidth: 0, transform: 'translateZ(10px)' }}>
                              <p className={`font-bold mb-1 transition-colors ${goal === key ? 'text-indigo-300' : 'text-white'}`}>
                                {t.label}
                              </p>
                              <p style={{ fontSize: 12, color: '#94a3b8' }}>
                                {t.habits.map(h => h.name.split(' ').slice(0, 3).join(' ')).join(' · ')}
                              </p>
                            </div>
                            <div style={{ transform: 'translateZ(10px)' }}>
                              <ChevronRight size={18} className={`transition-colors ${goal === key ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} style={{ flexShrink: 0 }} />
                            </div>
                          </button>
                        </TiltCard>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => setStep(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Habit Selection ── */}
              {step === 2 && selectedGoal && (
                <motion.div
                  key="habits"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <DynamicIcon size={56} tiltIntensity={20} glowColor={selectedGoal.color + '80'} interactive={true}>
                      <span style={{ fontSize: 40 }}>{selectedGoal.icon}</span>
                    </DynamicIcon>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        color: '#818cf8',
                        textTransform: 'uppercase',
                        margin: '8px 0 4px',
                      }}
                    >
                      Step 3 of 4
                    </p>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>
                      Your starter habits
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 14 }}>
                      Tap to toggle — start with all 3, or pick your favourites.
                    </p>
                  </div>

                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}
                  >
                    {selectedGoal.habits.map((h, i) => (
                      <motion.div
                        key={h.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <TiltCard tiltIntensity={10} className="w-full block">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(s => s.map((v, idx) => (idx === i ? !v : v)))}
                            className={`flex items-center gap-4 p-4 w-full rounded-2xl border text-left transition-all duration-300
                              ${
                                selected[i]
                                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 opacity-70 hover:opacity-100'
                              }
                            `}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: h.color + (selected[i] ? '30' : '15'),
                                color: h.color,
                                flexShrink: 0,
                                fontSize: 18,
                                transform: 'translateZ(15px)',
                              }}
                              className="transition-colors"
                            >
                              <AnimatePresence mode="popLayout">
                                {selected[i] ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                  >
                                    <Check size={24} color={h.color} />
                                  </motion.div>
                                ) : (
                                  <motion.span
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                  >
                                    ○
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <div style={{ flex: 1, transform: 'translateZ(5px)' }}>
                              <p
                                style={{
                                  fontWeight: 700,
                                  color: 'white',
                                  fontSize: 15,
                                  marginBottom: 4,
                                }}
                              >
                                {h.name}
                              </p>
                              <p style={{ fontSize: 13, color: '#94a3b8' }}>{h.category} · Daily</p>
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: `2px solid ${selected[i] ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                                background: selected[i] ? '#10b981' : 'transparent',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'translateZ(15px)',
                              }}
                              className="transition-colors"
                            >
                              <AnimatePresence>
                                {selected[i] && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                  >
                                    <Check size={14} color="white" strokeWidth={3} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.button>
                        </TiltCard>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStep(1)}
                      style={{
                        padding: '14px 24px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#cbd5e1',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                      className="hover:bg-white/10 hover:text-white transition-colors"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      whileHover={!adding && selected.some(Boolean) ? { scale: 1.02 } : {}}
                      whileTap={!adding && selected.some(Boolean) ? { scale: 0.98 } : {}}
                      onClick={handleFinish}
                      disabled={adding || !selected.some(Boolean)}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: adding ? 'not-allowed' : 'pointer',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: adding || !selected.some(Boolean) ? 0.5 : 1,
                        boxShadow: '0 12px 40px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                      }}
                    >
                      {adding ? (
                        <>
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: 'white',
                              borderRadius: '50%',
                              display: 'inline-block',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />{' '}
                          Adding habits…
                        </>
                      ) : (
                        <>
                          <Flame size={18} /> Add {selected.filter(Boolean).length} Habit
                          {selected.filter(Boolean).length !== 1 ? 's' : ''} & Start!
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Done ── */}
              {step === 3 && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', padding: '32px 0' }}
                >
                  <TiltCard tiltIntensity={15}>
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{
                        width: 120,
                        height: 120,
                        margin: '0 auto 24px',
                        borderRadius: 32,
                        background: 'linear-gradient(135deg, #34d399, #10b981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 64,
                        boxShadow: '0 30px 80px rgba(52,211,153,0.5), inset 0 2px 0 rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transform: 'translateZ(30px)'
                      }}
                    >
                      🎉
                    </motion.div>
                  </TiltCard>
                  <h2 style={{ fontSize: 36, fontWeight: 900, color: 'white', marginBottom: 12 }}>
                    You're all set!
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 16 }}>
                    Your habits are ready. Day 1 starts now.
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring' }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: '#fbbf24',
                      fontWeight: 800,
                      marginTop: 24,
                      background: 'rgba(251, 191, 36, 0.15)',
                      padding: '12px 24px',
                      borderRadius: 100,
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      boxShadow: '0 0 40px rgba(251, 191, 36, 0.2)'
                    }}
                  >
                    <Sparkles size={20} className="animate-pulse" />
                    <span>+10 XP bonus for setting up!</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </dialog>
  </AnimatePresence>
  );
}
