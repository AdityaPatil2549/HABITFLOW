import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../../store/habitStore';
import { useProfileStore } from '../../store/profileStore';
import { format } from 'date-fns';
import {
  ArrowRight, Check, Sparkles, Heart, Brain, Briefcase,
  TrendingUp, Smile, ChevronRight, Flame
} from 'lucide-react';

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
      { name: 'No social media before noon', icon: 'shield', color: '#f43f5e', category: 'Personal' },
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
      { name: 'Write in gratitude journal', icon: 'feather', color: '#f59e0b', category: 'Personal' },
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
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShow(true);
  }, []);

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  return { show, complete };
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=goal, 2=habits, 3=done
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const [selected, setSelected] = useState<boolean[]>([true, true, true]);
  const [adding, setAdding] = useState(false);

  const { addHabit } = useHabitStore();
  const { saveProfile } = useProfileStore();

  const selectedGoal = goal ? GOAL_TEMPLATES[goal] : null;

  async function handleFinish() {
    if (!goal) return;
    setAdding(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Save profile name
    if (name.trim()) saveProfile({ name: name.trim() });

    // Add selected habits
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
    setTimeout(() => { onComplete(); }, 2000);
  }

  const STEPS = ['Welcome', 'Your Goal', 'Your Habits', 'Ready!'];

  // Step-based backgrounds
  const BACKGROUNDS = [
    'radial-gradient(ellipse at 40% 20%, rgba(99,102,241,0.15) 0%, #020617 70%)', // Welcome: Indigo
    'radial-gradient(ellipse at 40% 20%, rgba(139,92,246,0.15) 0%, #020617 70%)', // Goal: Violet
    'radial-gradient(ellipse at 40% 20%, rgba(16,185,129,0.12) 0%, #020617 70%)', // Habits: Emerald
    'radial-gradient(ellipse at 40% 20%, rgba(245,158,11,0.12) 0%, #020617 70%)', // Done: Amber
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BACKGROUNDS[step] || BACKGROUNDS[0],
          transition: 'background 1s ease-in-out',
          overflowY: 'auto',
        }}
      >
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: 40, left: '33%', width: 384, height: 384, borderRadius: '50%', background: 'rgba(99,102,241,0.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 80, right: '25%', width: 256, height: 256, borderRadius: '50%', background: 'rgba(139,92,246,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div className="relative z-10 w-full max-w-lg mx-auto px-6">

          {/* Progress steps */}
          <div className="flex items-center gap-2 justify-center mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  i < step ? 'bg-emerald-500 text-white' :
                  i === step ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40' :
                  'bg-white/5 text-slate-500'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${i < step ? 'bg-emerald-500' : 'bg-white/8'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <motion.div key="welcome"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
                className="text-center space-y-8"
              >
                <div>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-4xl shadow-2xl shadow-brand-500/30">
                    🌟
                  </div>
                  <h1 className="text-4xl font-black text-white mb-3">Welcome to<br />
                    <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">HabitFlow</span>
                  </h1>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Build powerful daily routines with a system that actually works.<br />
                    Let's get you set up in 60 seconds.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">What should we call you?</p>
                  <input
                    type="text"
                    placeholder="Your name…"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setStep(1)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-semibold placeholder-slate-600 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all text-center"
                  />
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-bold text-base shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {name.trim() ? `Let's go, ${name.split(' ')[0]}!` : "Let's get started"} <ArrowRight size={20} />
                </button>

                <button onClick={onComplete} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Skip setup
                </button>
              </motion.div>
            )}

            {/* ── Step 1: Goal Selection ── */}
            {step === 1 && (
              <motion.div key="goal"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Step 2 of 4</p>
                  <h2 className="text-3xl font-black text-white mb-2">What's your main goal?</h2>
                  <p className="text-slate-400 text-sm">We'll suggest the perfect starter habits for you.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(Object.entries(GOAL_TEMPLATES) as [GoalKey, typeof GOAL_TEMPLATES[GoalKey]][]).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setGoal(key);
                        setSelected([true, true, true]); // Reset selection for new goal
                        setStep(2);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-98 hover:scale-[1.01] ${
                        goal === key
                          ? 'border-brand-500/40 bg-brand-500/10'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-3xl flex-shrink-0">{t.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-white">{t.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t.habits.map(h => h.name.split(' ').slice(0, 3).join(' ')).join(' · ')}</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="pt-4 flex justify-center">
                  <button onClick={() => setStep(0)} className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors flex items-center gap-2">
                    ← Back to Welcome
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Habit Selection ── */}
            {step === 2 && selectedGoal && (
              <motion.div key="habits"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="text-4xl">{selectedGoal.icon}</span>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mt-2 mb-1">Step 3 of 4</p>
                  <h2 className="text-3xl font-black text-white mb-2">Your starter habits</h2>
                  <p className="text-slate-400 text-sm">Tap to toggle — start with all 3, or pick your favourites.</p>
                </div>

                <div className="space-y-3">
                  {selectedGoal.habits.map((h, i) => (
                    <button
                      key={h.name}
                      onClick={() => setSelected(s => s.map((v, idx) => idx === i ? !v : v))}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-98 ${
                        selected[i]
                          ? 'border-emerald-500/30 bg-emerald-500/8'
                          : 'border-white/8 bg-white/[0.02] opacity-50'
                      }`}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: h.color + '20', color: h.color }}
                      >
                        {selected[i] ? <Check size={20} /> : <span className="text-lg opacity-50">○</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{h.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{h.category} · Daily</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected[i] ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                      }`}>
                        {selected[i] && <Check size={11} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={adding || !selected.some(Boolean)}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-brand-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adding ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding habits…</>
                    ) : (
                      <><Flame size={18} /> Add {selected.filter(Boolean).length} Habit{selected.filter(Boolean).length !== 1 ? 's' : ''} & Start!</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-brand-500 flex items-center justify-center text-5xl shadow-2xl shadow-emerald-500/40"
                >
                  🎉
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">You're all set!</h2>
                  <p className="text-slate-400">Your habits are ready. Day 1 starts now.</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 text-amber-400 font-bold"
                >
                  <Sparkles size={18} />
                  <span>+10 XP bonus for setting up!</span>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
