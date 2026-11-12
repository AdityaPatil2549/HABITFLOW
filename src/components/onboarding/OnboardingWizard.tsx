import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../../store/habitStore';
import { useProfileStore } from '../../store/profileStore';
import { ArrowRight, Check, Sparkles, ChevronRight, Flame } from 'lucide-react';
import { format } from 'date-fns';

const ONBOARDING_KEY = 'habitflow_onboarding_done';

// ── Habit Templates per goal ───────────────────────────────────
const GOAL_TEMPLATES = {
  health: {
    label: 'Get Healthy',
    icon: '🏃',
    color: '#10b981',
    habits: [
      { name: 'Drink 8 glasses of water', icon: '💧', color: '#06b6d4', category: 'Health' },
      { name: 'Exercise for 30 minutes', icon: '🏃', color: '#10b981', category: 'Health' },
      { name: 'Sleep 8 hours', icon: '🌙', color: '#8b5cf6', category: 'Health' },
    ],
  },
  productivity: {
    label: 'Be Productive',
    icon: '🚀',
    color: '#6366f1',
    habits: [
      { name: 'Deep work session (2h)', icon: '⚡', color: '#f59e0b', category: 'Work' },
      { name: 'Plan tomorrow tonight', icon: '📝', color: '#6366f1', category: 'Work' },
      {
        name: 'No social media before noon',
        icon: '🛡️',
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
      { name: 'Read for 30 minutes', icon: '📚', color: '#f59e0b', category: 'Learning' },
      { name: 'Practice a new skill', icon: '💻', color: '#8b5cf6', category: 'Learning' },
      { name: 'Review flashcards', icon: '🥞', color: '#06b6d4', category: 'Learning' },
    ],
  },
  mindfulness: {
    label: 'Find Balance',
    icon: '🧘',
    color: '#8b5cf6',
    habits: [
      { name: 'Meditate for 10 minutes', icon: '🧘', color: '#8b5cf6', category: 'Personal' },
      {
        name: 'Write in gratitude journal',
        icon: '✍️',
        color: '#f59e0b',
        category: 'Personal',
      },
      { name: 'Evening walk', icon: '🚶', color: '#10b981', category: 'Health' },
    ],
  },
  finance: {
    label: 'Build Wealth',
    icon: '💰',
    color: '#22c55e',
    habits: [
      { name: 'Track all expenses', icon: '💰', color: '#22c55e', category: 'Finance' },
      { name: 'Review savings goal', icon: '📈', color: '#6366f1', category: 'Finance' },
      { name: 'No impulse purchases', icon: '🛡️', color: '#f43f5e', category: 'Finance' },
    ],
  },
} as const;

type GoalKey = keyof typeof GOAL_TEMPLATES;

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('skip_onboarding')) return false;
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
        className="m-0 p-0 border-0 outline-none open:animate-in open:fade-in duration-150 z-[9999]"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          boxSizing: 'border-box',
          backgroundColor: 'var(--sf-base)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Centered content wrapper */}
        <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-6 relative z-10 my-auto">
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    i < step
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      : i === step
                      ? 'bg-[var(--sf-overlay)] text-[var(--tx-primary)] border border-[var(--border-strong)]'
                      : 'bg-[var(--sf-raised)] text-[var(--tx-muted)] border border-[var(--border-default)]'
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-6 h-[1px] ${
                      i < step ? 'bg-[var(--accent)]' : 'bg-[var(--border-default)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="w-full min-w-[320px] max-w-[460px] relative mx-auto">

            {/* Main Front Card Container */}
            <div className="relative rounded-2xl border border-[var(--border-strong)] bg-[var(--sf-raised)] px-8 py-10 overflow-hidden shadow-2xl">
              
              <AnimatePresence mode="wait">
                {/* ── Step 0: Welcome ── */}
                {step === 0 && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className="text-center relative z-10 flex flex-col items-center w-full"
                  >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--sf-overlay)] border border-[var(--border-strong)] p-2.5 flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt="HabitFlow"
                        className="w-full h-full object-contain rounded-xl opacity-95"
                      />
                    </div>

                    <h1 className="text-3xl font-bold text-[var(--tx-primary)] mb-4 tracking-tight leading-tight">
                      Welcome to{' '}
                      <span className="text-[var(--accent-ink)]">
                        HabitFlow
                      </span>
                    </h1>

                    <p className="text-[var(--tx-secondary)] text-[14px] leading-relaxed mb-8 w-full">
                      Build powerful daily routines with a system that actually works. Let's get you set up in 60 seconds.
                    </p>

                    <div className="mb-6 w-full flex flex-col items-center">
                      <label className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--tx-muted)] uppercase mb-4 text-center">
                        WHAT SHOULD WE CALL YOU?
                      </label>
                      <input
                        type="text"
                        placeholder="Your name..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && setStep(1)}
                        autoFocus
                        className="input py-3 text-center text-sm"
                      />
                    </div>

                    <button
                      onClick={() => setStep(1)}
                      className="btn-primary w-full py-3 px-5 font-semibold text-sm flex items-center justify-center gap-2 mb-4"
                    >
                      Let's get started <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={onComplete}
                      className="text-xs text-[var(--tx-muted)] hover:text-[var(--tx-secondary)] transition-colors tracking-wide cursor-pointer"
                    >
                      Skip setup
                    </button>
                  </motion.div>
                )}

              {/* ── Step 1: Goal Selection ── */}
              {step === 1 && (
                <motion.div
                  key="goal"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                >
                  <div className="text-center mb-6">
                    <p className="text-[11px] font-bold font-mono tracking-[0.2em] text-[var(--accent-ink)] uppercase mb-2">
                      Step 2 of 4
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--tx-primary)] mb-2">
                      What's your main goal?
                    </h2>
                    <p className="text-[var(--tx-secondary)] text-sm">
                      We'll suggest the perfect starter habits for you.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
                    {(
                      Object.entries(GOAL_TEMPLATES) as [
                        GoalKey,
                        (typeof GOAL_TEMPLATES)[GoalKey],
                      ][]
                    ).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setGoal(key);
                          setSelected([true, true, true]);
                          setStep(2);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group cursor-pointer ${
                          goal === key
                            ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                            : 'border-[var(--border-default)] bg-[var(--sf-overlay)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <span className="text-3xl shrink-0">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold mb-1 transition-colors ${goal === key ? 'text-[var(--accent-ink)]' : 'text-[var(--tx-primary)]'}`}>
                            {t.label}
                          </p>
                          <p className="text-xs text-[var(--tx-muted)]">
                            {t.habits.map(h => h.name.split(' ').slice(0, 3).join(' ')).join(' · ')}
                          </p>
                        </div>
                        <ChevronRight size={18} className={`shrink-0 transition-colors ${goal === key ? 'text-[var(--accent-ink)]' : 'text-[var(--tx-muted)] group-hover:text-[var(--tx-primary)]'}`} />
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => setStep(0)}
                      className="text-xs font-bold tracking-widest uppercase text-[var(--tx-muted)] hover:text-[var(--tx-primary)] cursor-pointer transition-colors"
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] mb-3">
                      <span className="text-3xl">{selectedGoal.icon}</span>
                    </div>
                    <p className="text-[11px] font-bold font-mono tracking-[0.2em] text-[var(--accent-ink)] uppercase mt-2 mb-1">
                      Step 3 of 4
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--tx-primary)] mb-2">
                      Your starter habits
                    </h2>
                    <p className="text-[var(--tx-secondary)] text-sm">
                      Tap to toggle — start with all 3, or pick your favourites.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
                    {selectedGoal.habits.map((h, i) => (
                      <button
                        key={h.name}
                        onClick={() => setSelected(s => s.map((v, idx) => (idx === i ? !v : v)))}
                        className={`flex items-center gap-4 p-4 w-full rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                          selected[i]
                            ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                            : 'border-[var(--border-default)] bg-[var(--sf-overlay)] opacity-65 hover:opacity-100'
                        }`}
                      >
                        <div
                          style={{
                            background: h.color + (selected[i] ? '24' : '12'),
                            color: h.color,
                          }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg transition-colors"
                        >
                          {selected[i] ? <Check size={22} color={h.color} /> : <span>○</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--tx-primary)] text-sm mb-0.5">
                            {h.name}
                          </p>
                          <p className="text-xs text-[var(--tx-muted)]">{h.category} · Daily</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            selected[i]
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                              : 'border-[var(--border-strong)] bg-transparent'
                          }`}
                        >
                          {selected[i] && <Check size={14} strokeWidth={3} />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="btn-secondary px-5 py-3.5 font-semibold text-sm"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={adding || !selected.some(Boolean)}
                      className="btn-primary flex-1 py-3.5 px-5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {adding ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />{' '}
                          Adding habits…
                        </>
                      ) : (
                        <>
                          <Flame size={18} /> Add {selected.filter(Boolean).length} Habit
                          {selected.filter(Boolean).length !== 1 ? 's' : ''} & Start!
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Done ── */}
              {step === 3 && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  className="text-center py-8"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-5xl">
                    🎉
                  </div>
                  <h2 className="text-3xl font-black text-[var(--tx-primary)] mb-3">
                    You're all set!
                  </h2>
                  <p className="text-[var(--tx-secondary)] text-base mb-4">
                    Your habits are ready. Day 1 starts now.
                  </p>
                  <div className="inline-flex items-center justify-center gap-2 text-amber-400 font-bold mt-4 bg-amber-500/15 px-5 py-2.5 rounded-full border border-amber-500/30">
                    <Sparkles size={18} />
                    <span>+10 XP bonus for setting up!</span>
                  </div>
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
