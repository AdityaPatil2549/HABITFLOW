import { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
      <dialog
        ref={dialogRef}
        className="dark-overlay bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950 open:animate-in open:fade-in duration-300 z-[9999]"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'transparent',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 3D Immersive Background */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <Suspense fallback={null}>
            <GamificationBackground />
          </Suspense>
          <div
            className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(ellipse at 40% 20%, ${STEP_COLORS[step]} 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Centered content wrapper */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
          }}
        >
          <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 10 }}>
            {/* Progress indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 40,
              }}
            >
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                      transition: 'all 0.3s',
                      background:
                        i < step ? '#10b981' : i === step ? '#6366f1' : 'rgba(255,255,255,0.06)',
                      color: i <= step ? 'white' : '#64748b',
                      boxShadow: i === step ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
                    }}
                  >
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        width: 32,
                        height: 2,
                        borderRadius: 1,
                        transition: 'all 0.5s',
                        background: i < step ? '#10b981' : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step 0: Welcome ── */}
              {step === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  style={{ textAlign: 'center' }}
                >
                  <TiltCard tiltIntensity={20}>
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        margin: '0 auto 24px',
                        borderRadius: 24,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 60px rgba(99,102,241,0.4)',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <img
                        src="/logo.png"
                        alt="HabitFlow"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'translateZ(20px)' }}
                      />
                    </div>
                  </TiltCard>

                  <h1
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: 'white',
                      marginBottom: 12,
                      lineHeight: 1.15,
                    }}
                  >
                    Welcome to{' '}
                    <span
                      style={{
                        background: 'linear-gradient(to right, #818cf8, #c4b5fd)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      HabitFlow
                    </span>
                  </h1>
                  <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                    Build powerful daily routines with a system that actually works. Let's get you
                    set up in 60 seconds.
                  </p>

                  <div style={{ marginBottom: 24 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: 12,
                      }}
                    >
                      What should we call you?
                    </p>
                    <input
                      type="text"
                      placeholder="Your name…"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && setStep(1)}
                      autoFocus
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: '16px 20px',
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 600,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(1)}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      boxShadow: '0 10px 40px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                      marginBottom: 16,
                    }}
                  >
                    {name.trim() ? `Let's go, ${name.split(' ')[0]}!` : "Let's get started"}{' '}
                    <ArrowRight size={20} />
                  </motion.button>

                  <button
                    onClick={onComplete}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#475569',
                      fontSize: 12,
                      transition: 'color 0.2s',
                    }}
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
      </dialog>
    </AnimatePresence>
  );
}
