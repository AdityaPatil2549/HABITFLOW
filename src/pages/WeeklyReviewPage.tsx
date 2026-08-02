import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useProfileStore } from '../store/profileStore';
import { format, subDays, startOfWeek, endOfWeek, getISOWeek } from 'date-fns';
import {
  Trophy, CheckCircle2, Flame, ArrowRight, Share2,
  Target, Star, Zap, TrendingUp, TrendingDown, ChevronDown,
  ChevronRight, Sparkles, Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gamificationService, calculateStats } from '../services/gamificationService';
import { toPng } from 'html-to-image';
import { ShareCard } from '../components/gamification/ShareCard';
import { IconRenderer } from '../components/common/IconRenderer';
import { getOrCreateSettings } from '../db';
import { soundService } from '../services/soundService';
import { useToast } from '../components/common/Toast';
import { cn } from '../lib/utils';
import { useCompletionEffects } from '../components/ui/CompletionEffects';
import { MagneticButton } from '../components/ui/MagneticButton';
import { TextEffect } from '../components/ui/text-effect';

const ReviewBackground = lazy(() => import('../components/review/ReviewBackground'));

// ─────────────────────────────────────────────────────────────────
// ── Helpers ───────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1400, delay = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return value;
}

// 3D tilt wrapper
function ReviewTiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ perspective: 900, rotateX: rotX, rotateY: rotY, ...style }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

// Section divider
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08))' }} />
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 px-2">{label}</span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.08))' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── Chapter 1: Score Gauge ────────────────────────────────────────

const SCORE_COLORS: [number, string, string][] = [
  [80, '#34d399', '#059669'],
  [55, '#818cf8', '#6366f1'],
  [30, '#f97316', '#ea580c'],
  [0,  '#ef4444', '#dc2626'],
];

function getScoreColor(s: number) {
  return (SCORE_COLORS.find(([min]) => s >= min) ?? SCORE_COLORS[SCORE_COLORS.length - 1]);
}

function getHeadline(pct: number, hasHabits: boolean) {
  if (!hasHabits) return "Let's get started! 🌱";
  if (pct >= 85) return '🔥 You absolutely crushed it!';
  if (pct >= 70) return '💪 Excellent week!';
  if (pct >= 50) return '📈 Building momentum!';
  if (pct >= 25) return '💙 Keep pushing forward!';
  return '🌧 Tough week — reset time.';
}

function getQuote(pct: number, hasHabits: boolean) {
  if (!hasHabits) return "The secret of getting ahead is getting started.";
  if (pct >= 85) return "Excellence is not an act, but a habit.";
  if (pct >= 50) return "Motivation gets you going, habit gets you there.";
  return "Fall seven times, stand up eight.";
}

function ScoreGauge({ score, headline, weekLabel }: { score: number; headline: string; weekLabel: string }) {
  const R = 80;
  const CX = 110;
  const CY = 110;
  const C = 2 * Math.PI * R;        // 502.65
  const TRACK = (270 / 360) * C;    // 376.99

  const animatedScore = useCountUp(score, 1600, 500);
  const [, fgColor, glowColor] = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{weekLabel}</p>

      {/* Arc gauge */}
      <div className="relative w-[220px] h-[220px]">
        {/* Ambient glow */}
        <div
          className="absolute inset-6 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-1000"
          style={{ background: glowColor }}
        />
        <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-xl">
          <defs>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fgColor} />
              <stop offset="100%" stopColor={glowColor} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${TRACK} ${C - TRACK}`}
            transform={`rotate(135 ${CX} ${CY})`}
          />
          {/* Progress */}
          <motion.circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            transform={`rotate(135 ${CX} ${CY})`}
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={{ strokeDasharray: `${(score / 100) * TRACK} ${C}` }}
            transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
          />
        </svg>
        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white tabular-nums" style={{ color: fgColor }}>
            {animatedScore}<span className="text-2xl">%</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">this week</span>
        </div>
      </div>

      {/* Headline */}
      <motion.h2
        key={headline}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-black dark:text-white text-slate-900 text-center tracking-tight px-4"
      >
        <TextEffect as="span" per="word" preset="blur">{headline}</TextEffect>
      </motion.h2>
      <p className="text-slate-400 text-sm italic opacity-75 text-center">"{getQuote(score, true)}"</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── Chapter 2: KPI Cards ──────────────────────────────────────────

interface KpiProps { label: string; value: number; suffix?: string; icon: React.ReactNode; color: string; delay: number }

function KpiCard({ label, value, suffix = '', icon, color, delay }: KpiProps) {
  const counted = useCountUp(value, 1200, delay);
  return (
    <ReviewTiltCard className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        className="h-full rounded-2xl p-6 relative overflow-hidden group border dark:border-white/8 border-slate-900/10 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.03)' }}
        whileHover={{ y: -4, boxShadow: `0 16px 40px -8px ${color}30` }}
      >
        {/* BG glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 30% 30%, ${color}15 0%, transparent 70%)` }} />

        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative z-10"
          style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <p className="text-5xl font-black dark:text-white text-slate-900 tracking-tighter mb-1 relative z-10">
          {counted}{suffix}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] relative z-10" style={{ color: `${color}cc` }}>
          {label}
        </p>
      </motion.div>
    </ReviewTiltCard>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── Chapter 3: Habit Bars ─────────────────────────────────────────

interface HabitBarItem {
  id: string;
  name: string;
  icon: string;
  category?: string;
  rate: number;
  streak: number;
  isBest: boolean;
  isStruggling: boolean;
}

function MiniHeatmap({ habitId }: { habitId: string }) {
  const [dayLogs, setDayLogs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
    import('../db').then(({ db }) => {
      db.habitLogs
        .where('habitId').equals(habitId)
        .and(l => days.includes(l.date) && !l.isFrozen && l.value >= 1)
        .toArray()
        .then(ls => {
          const m: Record<string, boolean> = {};
          ls.forEach(l => { m[l.date] = true; });
          setDayLogs(m);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [habitId]);

  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  if (loading) return <div className="h-10 flex items-center justify-center"><div className="w-4 h-4 rounded-full border border-brand-500/30 border-t-brand-400 animate-spin" /></div>;

  return (
    <div className="flex gap-1.5 pt-1">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const done = dayLogs[key];
        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
              style={{
                background: done ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${done ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {done ? '✓' : ''}
            </div>
            <span className="text-[8px] text-slate-600 font-bold">{format(day, 'EEE')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

const ICON_MAP: Record<string, string> = {
  'book': '📚',
  'code': '💻',
  'layers': '🥞',
  'dumbbell': '🏋️',
  'run': '🏃',
  'water': '💧',
  'meditate': '🧘',
  'sun': '☀️',
  'moon': '🌙',
  'star': '⭐',
  'zap': '⚡',
  'heart': '❤️',
  'brain': '🧠',
  'smile': '😊',
};

function HabitBarsSection({ habits }: { habits: HabitBarItem[] }) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleAll = () => {
    const allExpanded = habits.every(h => expandedIds[h.id]);
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      habits.forEach(h => { next[h.id] = true; });
      setExpandedIds(next);
    }
  };

  const toggleOne = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allExpanded = habits.length > 0 && habits.every(h => expandedIds[h.id]);

  if (!habits.length) return (
    <div className="text-center py-8 text-slate-500 text-sm">No active habits yet.</div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-brand-400" />
        <h2 className="text-base font-black dark:text-white text-slate-900">30-Day Completion Rates</h2>
        <button
          onClick={toggleAll}
          className="ml-auto text-[10px] text-brand-300 font-bold uppercase tracking-wider bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-full transition-colors border border-brand-500/20 active:scale-95"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-2">
      {habits.map((h, i) => {
        const [, fg] = getScoreColor(h.rate);
        const isExpanded = !!expandedIds[h.id];
        return (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className={cn(
              'rounded-2xl border p-4 cursor-pointer transition-all duration-300',
              h.isBest      && 'border-amber-500/30 bg-amber-500/5',
              h.isStruggling && 'border-red-500/20 bg-red-500/4',
              !h.isBest && !h.isStruggling && 'dark:border-white/8 border-slate-900/10 dark:bg-white/3 bg-slate-900/5',
            )}
            onClick={() => toggleOne(h.id)}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3">
              {/* 3D Emoji Icon */}
              <ReviewTiltCard className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/10 shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${fg}35 0%, ${fg}10 100%)`,
                    boxShadow: `0 8px 24px -8px ${fg}50`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <span
                    className="drop-shadow-md flex items-center justify-center"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    <IconRenderer name={h.icon || 'zap'} size={24} />
                  </span>
                </div>
              </ReviewTiltCard>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  {h.category && (
                    <span className="text-sm">
                      {({
                        Health: '🍎', Learning: '📚', Work: '💼', Personal: '✨', Finance: '💰', Other: '🌈'
                      } as Record<string, string>)[h.category] || '✨'}
                    </span>
                  )}
                  <p className="text-sm font-bold dark:text-white text-slate-900 truncate">{h.name}</p>
                  {h.isBest      && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">⭐ Star</span>}
                  {h.isStruggling && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">⚠ Needs care</span>}
                </div>
                {/* Animated bar */}
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${fg}cc, ${fg})` }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${h.rate}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.05 + 0.2 }}
                  />
                </div>
              </div>
              {/* Rate + streak */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-black" style={{ color: fg }}>{h.rate}%</span>
                {h.streak > 0 && (
                  <span className="text-[10px] text-orange-400 font-bold">🔥{h.streak}</span>
                )}
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight size={14} className="text-slate-600" />
                </motion.div>
              </div>
            </div>

            {/* Expandable 7-day heatmap */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  key="expand"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-white/6 mt-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Last 7 Days</p>
                    <MiniHeatmap habitId={h.id} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── Chapter 4: Mood & Reflection ──────────────────────────────────

const MOODS = [
  { id: 'fire',     emoji: '🔥', label: 'On Fire',    desc: 'Absolutely smashing it', color: '#f97316' },
  { id: 'good',     emoji: '😊', label: 'Good Week',  desc: 'Steady progress', color: '#34d399' },
  { id: 'tough',    emoji: '😤', label: 'Struggling', desc: 'Facing challenges', color: '#818cf8' },
] as const;
type MoodId = typeof MOODS[number]['id'];

function MoodReflection() {
  const year = format(new Date(), 'yyyy');
  const week = getISOWeek(new Date());
  const STORAGE_KEY = `habitflow-weekly-mood-${year}-W${week}`;
  const { fireConfetti } = useCompletionEffects();
  const toast = useToast();

  const [mood, setMood] = useState<MoodId | null>(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return d.mood ?? null; }
    catch { return null; }
  });
  const [intention, setIntention] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return d.intention ?? ''; }
    catch { return ''; }
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mood, intention }));
      setSaved(true);
      fireConfetti();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Failed to save reflection. Your storage might be full.');
    }
  }

  return (
    <div className="space-y-5">
      {/* Mood selector */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How was this week?</p>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map(m => (
            <motion.button
              key={m.id}
              onClick={() => setMood(m.id)}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all duration-300 relative overflow-hidden',
                mood === m.id
                  ? 'border-opacity-100 shadow-lg'
                  : 'dark:border-white/8 border-slate-900/10 dark:bg-white/3 bg-slate-900/5 hover:dark:bg-white/5 hover:bg-slate-900/10'
              )}
              style={mood === m.id
                ? { background: `${m.color}15`, borderColor: `${m.color}50`, boxShadow: `0 8px 24px ${m.color}25` }
                : {}}
            >
              {mood === m.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(ellipse at center, ${m.color}20 0%, transparent 70%)` }}
                  transition={{ type: 'spring', bounce: 0.2 }}
                />
              )}
              <motion.span
                className="text-3xl relative z-10"
                animate={mood === m.id ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {m.emoji}
              </motion.span>
              <span className="text-xs font-black dark:text-white text-slate-900 relative z-10">{m.label}</span>
              <span className="text-[9px] text-slate-500 relative z-10 text-center leading-tight">{m.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Intention textarea */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          💭 Next week's intention
        </p>
        <textarea
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          placeholder="I will focus on… (e.g. 'Meditate every morning before checking my phone')"
          rows={3}
          value={intention}
          onChange={e => setIntention(e.target.value)}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(var(--brand-500-rgb),0.4)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
      </div>

      {/* Save button */}
      <AnimatePresence mode="wait">
        {saved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-emerald-400"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            ✅ Saved — great reflection!
          </motion.div>
        ) : (
          <motion.button
            key="save"
            onClick={handleSave}
            disabled={!mood}
            whileHover={mood ? { scale: 1.02 } : {}}
            whileTap={mood ? { scale: 0.97 } : {}}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: mood ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' : 'rgba(255,255,255,0.06)',
              boxShadow: mood ? '0 8px 20px rgba(var(--brand-500-rgb),0.3)' : 'none',
            }}
          >
            {mood ? `Save Reflection 💾` : 'Select a mood first'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── Chapter 5: XP Level Card ──────────────────────────────────────

function XpLevelCard({
  xpData, stats, weeklyXp, isGenerating, onShare, onNavigate, cardRef
}: {
  xpData: any; stats: any; weeklyXp: number;
  isGenerating: boolean; onShare: () => void; onNavigate: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const numericLevel = stats?.numericLevel ?? 1;
  const xpPct = stats?.levelProgress ?? 0;

  return (
    <ReviewTiltCard>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(15,23,42,0.8) 60%, rgba(139,92,246,0.2) 100%)',
          border: '1px solid rgba(129,140,248,0.25)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: '#6366f1' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[60px] opacity-15 pointer-events-none" style={{ background: '#a78bfa' }} />

        <div className="relative z-10 flex items-start gap-5 mb-6">
          {/* Trophy */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(129,140,248,0.3)' }}>
            🏆
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-0.5">Level {numericLevel}</p>
            <h2 className="text-xl font-black text-white mb-1">{xpData.level}</h2>
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-amber-400" />
              <p className="text-sm text-slate-300">
                <span className="font-black text-amber-400">+{weeklyXp} XP</span> earned this week
              </p>
            </div>
          </div>
        </div>

        {/* XP Bar with shimmer */}
        <div className="relative z-10 mb-6">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Progress to Level {numericLevel + 1}</span>
            <span className="text-indigo-300">{Math.round(xpPct)}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: 'linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${xpPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
            >
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              />
            </motion.div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onShare}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
          >
            <Share2 size={16} />
            {isGenerating ? 'Generating…' : 'Share Milestone'}
          </button>
          <MagneticButton
            onClick={onNavigate}
            intensity={0.5}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}
          >
            Start Next Week <ArrowRight size={16} />
          </MagneticButton>
        </div>
      </motion.div>
    </ReviewTiltCard>
  );
}

// ─────────────────────────────────────────────────────────────────
// ── Main Page ─────────────────────────────────────────────────────

export function WeeklyReviewPage() {
  const { habits, loadHabits }   = useHabitStore();
  const { tasks, loadTasks }     = useTaskStore();
  const { profile }              = useProfileStore();
  const navigate                 = useNavigate();
  const toast                    = useToast();

  const [xpData,          setXpData]          = useState<any>(null);
  const [theme,           setTheme]           = useState('indigo');
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [weeklyHabitsDone,setWeeklyHabitsDone]= useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadHabits(),
      loadTasks(),
      gamificationService.getUserXP().then(setXpData),
      getOrCreateSettings().then(s => setTheme(s.theme || 'indigo')),
    ]).finally(() => setLoading(false));
  }, [loadHabits, loadTasks]);

  // Accurate weekly habit count from DB
  useEffect(() => {
    if (loading || !habits.length) return;
    const today     = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd   = endOfWeek(today, { weekStartsOn: 1 });
    const startStr  = format(weekStart, 'yyyy-MM-dd');
    const endStr    = format(weekEnd, 'yyyy-MM-dd');
    import('../db').then(({ db }) => {
      db.habitLogs
        .where('date').between(startStr, endStr, true, true)
        .filter(l => l.value >= 1 && !l.isFrozen)
        .toArray()
        .then(logs => setWeeklyHabitsDone(logs.length))
        .catch(() => setWeeklyHabitsDone(0));
    });
  }, [loading, habits]);

  useEffect(() => { document.title = 'Weekly Review — HabitFlow'; }, []);

  // ── Computed values ─────────────────────────────────────────────
  const today        = new Date();
  const weekStart    = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd      = endOfWeek(today, { weekStartsOn: 1 });
  const weekLabel    = `Week of ${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const score        = activeHabits.length ? Math.min(100, Math.round((weeklyHabitsDone / (activeHabits.length * 7)) * 100)) : 0;
  const headline     = getHeadline(score, activeHabits.length > 0);

  const tasksDoneThisWeek = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= weekStart).length;
  const bestStreak        = habits.length ? Math.max(0, ...habits.map(h => h.streak.current)) : 0;
  const xpStats           = xpData ? calculateStats(xpData.total) : null;
  const weeklyXp          = xpData?.weeklyScore ?? 0;

  // Habit bar data
  const habitBars: HabitBarItem[] = useMemo(() => {
    if (!activeHabits.length) return [];
    const sorted = [...activeHabits].sort((a, b) => b.completionRate30Days - a.completionRate30Days);
    const best   = sorted[0];
    const struggling = activeHabits.filter(h => h.completionRate30Days < 0.5)
      .sort((a, b) => a.completionRate30Days - b.completionRate30Days)[0];
    return sorted.slice(0, 12).map(h => {
      const name = h.name;
      let icon = h.icon || '⚡';
      const COMMON_ICONS = [
        'Apple', 'Coffee', 'Activity', 'BookOpen', 'Bike', 'Dumbbell',
        'Target', 'Zap', 'Brain', 'Moon', 'Flame', 'Leaf', 'Stethoscope',
        'Heart', 'Music', 'CheckCircle'
      ];
      for (const ic of COMMON_ICONS) {
        const iconRegex = new RegExp(`^${ic}\\b`, 'i');
        if (iconRegex.test(name)) {
          icon = ic;
          break;
        }
      }

      return {
        id: h.id,
        name: name,
        icon: icon,
        category: h.category,
        rate: Math.round(h.completionRate30Days * 100),
        streak: h.streak.current,
        isBest: h.id === best?.id,
        isStruggling: h.id === struggling?.id && h.completionRate30Days < 0.5,
      };
    });
  }, [activeHabits]);

  // Share card
  const shareMilestone = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      soundService.playLevelUp();
      const link = document.createElement('a');
      link.download = `habitflow-weekly-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="w-full mx-auto px-4 sm:px-8 pb-28 pt-4 relative min-h-[100dvh]">
      <h1 className="sr-only">Weekly Review</h1>
      
      {/* Three.js Particle Constellation Background */}
      {!loading && (
        <Suspense fallback={null}>
          <ReviewBackground score={score} />
        </Suspense>
      )}

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[140px] opacity-15" style={{ background: 'var(--brand-500)' }} />
        <div className="absolute top-[35%] right-[-15%] w-[45%] h-[60%] rounded-full blur-[120px] opacity-10" style={{ background: '#8b5cf6' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-10" style={{ background: '#06b6d4' }} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your weekly review…</p>
        </div>
      ) : (
        <div className="w-full space-y-6">

          {/* ── Steps Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 mb-4">
            {['Recap', 'Habits', 'Reflection', 'Progress'].map((stepName, idx) => (
              <div key={stepName} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-full h-1.5 rounded-full transition-colors duration-500 ${
                  currentStep >= idx ? 'bg-brand-500' : 'dark:bg-white/10 bg-slate-200'
                }`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  currentStep === idx ? 'dark:text-white text-slate-900' : 'text-slate-400'
                }`}>
                  {stepName}
                </span>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden min-h-[500px]">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <section className="flex flex-col items-center py-8">
                    <ScoreGauge score={score} headline={headline} weekLabel={weekLabel} />
                  </section>
                  <SectionDivider label="Stats" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <KpiCard label="Tasks Completed"  value={tasksDoneThisWeek}   icon={<CheckCircle2 size={18} />} color="#34d399" delay={0.0} />
                    <KpiCard label="Best Streak"      value={bestStreak}           icon={<Flame size={18} />}        color="#f97316" delay={0.1} suffix="d" />
                    <KpiCard label="Habits Done"      value={weeklyHabitsDone}    icon={<Target size={18} />}       color="#818cf8" delay={0.2} />
                    <KpiCard label="XP Earned"        value={weeklyXp}            icon={<Zap size={18} />}          color="#fbbf24" delay={0.3} />
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionDivider label="Habit Performance" />
                  <div className="w-full rounded-2xl border dark:border-white/8 border-slate-200/50 p-5 sm:p-6 mt-4" style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)' }}>
                    <HabitBarsSection habits={habitBars} />
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionDivider label="Reflection" />
                  <div className="w-full rounded-2xl border dark:border-white/8 border-slate-900/10 p-5 sm:p-6 relative overflow-hidden mt-4" style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(20px)' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'var(--brand-500)' }} />
                    <div className="flex items-center gap-2 mb-5 relative z-10">
                      <Sparkles size={16} className="text-brand-400" />
                      <h2 className="text-base font-black dark:text-white text-slate-900">Weekly Reflection</h2>
                    </div>
                    <div className="relative z-10">
                      <MoodReflection />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {xpData && xpStats && (
                    <div className="w-full">
                      <SectionDivider label="Level Progress" />
                      <XpLevelCard
                        xpData={xpData}
                        stats={xpStats}
                        weeklyXp={weeklyXp}
                        isGenerating={isGenerating}
                        onShare={shareMilestone}
                        onNavigate={() => navigate('/dashboard')}
                        cardRef={cardRef as React.RefObject<HTMLDivElement>}
                      />
                    </div>
                  )}
                  {!xpData && (
                    <div className="flex justify-center pt-4">
                      <MagneticButton
                        onClick={() => navigate('/dashboard')}
                        intensity={0.4}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-sm active:scale-95"
                        style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 24px rgba(var(--brand-500-rgb),0.4)' }}
                      >
                        Start Next Week Strong <ArrowRight size={16} />
                      </MagneticButton>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Wizard Controls ────────────────────────────────────── */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t dark:border-white/10 border-slate-900/10">
            <button
              onClick={() => setCurrentStep(p => Math.max(0, p - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:pointer-events-none dark:bg-white/5 bg-slate-900/5 hover:bg-brand-500/10 hover:text-brand-500"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (currentStep < 3) setCurrentStep(p => p + 1);
                else navigate('/dashboard');
              }}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}
            >
              {currentStep < 3 ? 'Next Step' : 'Finish Review'} <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Hidden share card */}
      {xpData && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }} aria-hidden="true">
          <ShareCard
            ref={cardRef}
            theme={theme}
            title="Weekly Review"
            subtitle={headline}
            userName={profile?.name || 'HabitFlow User'}
            userAvatar={profile?.avatar}
            userXP={xpData}
            stats={[
              { label: 'Tasks Done', value: tasksDoneThisWeek, icon: 'check' },
              { label: 'Best Streak', value: `${bestStreak}d`, icon: 'flame' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
