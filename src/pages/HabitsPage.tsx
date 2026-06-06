import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useCompletionEffects } from '../components/ui/CompletionEffects';
import { Scroll3DReveal } from '../components/ui/Scroll3DReveal';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from 'framer-motion';
import {
  Plus,
  Flame,
  Archive,
  Trash2,
  Edit2,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  Snowflake,
  GripVertical,
  Timer,
  BarChart2,
  ChevronLeft,
  BookOpen,
  Bell,
  X,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useHabitStore } from '../store/habitStore';
import { useGamificationStore } from '../store/gamificationStore';
import type { HabitWithStreak, HabitType, HabitFrequency } from '../types';
import {
  format,
  subDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import { habitSchema } from '../lib/validations';
import { LogHabitModal } from '../components/habits/LogHabitModal';
import { HabitJournal } from '../components/habits/HabitJournal';
import { MagneticButton } from '../components/ui/MagneticButton';
import { cn } from '../lib/utils';
import { IconRenderer, HABIT_ICONS } from '../components/common/IconRenderer';
import { habitService } from '../services/habitService';
import { soundService } from '../services/soundService';
import { useFocusStore } from '../store/focusStore';
import { TemplatesLibrary } from '../components/habits/TemplatesLibrary';
import { useToast } from '../components/common/Toast';
import { db } from '../db';
import { exportHabitToCalendar } from '../lib/calendarSync';

const HabitsBackground = lazy(() => import('../components/habits/HabitsBackground'));

// ─── constants ────────────────────────────────────────────────────
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CATEGORIES = [
  { name: 'Health',   icon: '🍎' },
  { name: 'Learning', icon: '📚' },
  { name: 'Work',     icon: '💼' },
  { name: 'Personal', icon: '✨' },
  { name: 'Finance',  icon: '💰' },
  { name: 'Other',    icon: '🌈' },
];
const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];

// ─── useCountUp ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, delayMs = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    setValue(0);
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delayMs]);
  return value;
}

// ─── KpiRing ─────────────────────────────────────────────────────
interface KpiRingProps {
  label: string;
  emoji: string;
  value: number;
  suffix?: string;
  max?: number;
  color: string;
  delay?: number;
}

function KpiRing({ label, emoji, value, suffix = '', max = 100, color, delay = 0 }: KpiRingProps) {
  const R   = 31;
  const C   = 2 * Math.PI * R;
  const pct = max > 0 ? Math.min(value / max, 1) : value / 100;
  const counted = useCountUp(value, 1000, delay * 120);
  const filterId = `kpi-glow-${label.replace(/\s+/g, '')}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        <svg width={80} height={80} viewBox="0 0 80 80">
          <defs>
            <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx={40} cy={40} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
          {/* Progress */}
          <motion.circle
            cx={40} cy={40} r={R}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={{ strokeDasharray: `${pct * C} ${C}` }}
            transition={{ duration: 1.3, ease: 'easeOut', delay: delay * 0.1 + 0.15 }}
            filter={`url(#${filterId})`}
          />
        </svg>
        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-base font-black text-white leading-none tabular-nums">{counted}{suffix}</span>
          <span className="text-sm leading-none">{emoji}</span>
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center leading-tight max-w-[68px]">{label}</p>
    </motion.div>
  );
}

// ─── HabitForm (UNCHANGED from original) ─────────────────────────
function HabitForm({
  onClose,
  initialHabit,
}: {
  onClose: (reason?: string) => void;
  initialHabit?: HabitWithStreak;
}) {
  const { addHabit, updateHabit } = useHabitStore();
  const [name, setName]         = useState(initialHabit?.name ?? '');
  const [icon, setIcon]         = useState(initialHabit?.icon ?? '🎯');
  const [color, setColor]       = useState(initialHabit?.color ?? COLORS[0]);
  const [category, setCategory] = useState(initialHabit?.category ?? 'Health');
  const [type, setType]         = useState<HabitType>(initialHabit?.type ?? 'boolean');
  const [freq, setFreq]         = useState<HabitFrequency>(initialHabit?.frequency ?? 'daily');
  const [freqDays, setFreqDays] = useState<number[]>(initialHabit?.frequencyDays ?? [1, 2, 3, 4, 5]);
  const [target, setTarget]     = useState(initialHabit?.targetValue ?? 1);
  const [grace, setGrace]       = useState(initialHabit?.graceDayEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialHabit?.reminderTime ?? '');
  const [error, setError]       = useState<string | null>(null);

  const toggleDay = (d: number) =>
    setFreqDays(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (freq === 'weekly' && freqDays.length === 0) {
      setError('Please select at least one day for weekly habits.');
      return;
    }
    const parsed = habitSchema.safeParse({
      name: name.trim(),
      icon,
      color,
      category,
      type,
      frequency: freq,
      frequencyDays: freq === 'weekly' ? freqDays : undefined,
      targetValue: target,
      startDate: initialHabit?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
      graceDayEnabled: grace,
      archived: initialHabit?.archived ?? false,
      reminderTime: reminderTime || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (initialHabit) await updateHabit(initialHabit.id, parsed.data);
    else await addHabit(parsed.data);
    onClose('created');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Name + emoji */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Name & Icon</p>
        <div className="flex gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
            style={{ background: color + '15', border: `2px solid ${color}30`, color: color }}
          >
            <IconRenderer name={icon} size={24} />
          </div>
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-base font-medium outline-none focus:border-brand-500/50 transition-all"
            placeholder="Habit name…"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3 bg-white/5 rounded-2xl p-3 border border-white/5">
          {HABIT_ICONS.map(item => (
            <button
              key={item.name}
              type="button"
              onClick={() => setIcon(item.name)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${icon === item.name ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
            >
              <item.icon size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Color + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Color</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'scale-125' : 'hover:scale-110'}`}
                style={{ background: c, boxShadow: color === c ? `0 0 10px ${c}80` : 'none' }}
              />
            ))}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === c.name
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                }`}
              >
                <span>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Habit Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              ['boolean', '✅ Yes/No'],
              ['count',   '🔢 Count'],
              ['duration','⏱ Duration'],
              ['rating',  '⭐ Rating'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v as HabitType)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${type === v ? 'text-brand-300 scale-[1.03]' : 'border-white/8 text-slate-400 hover:border-white/20'}`}
              style={type === v ? { borderColor: 'rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.1)' } : {}}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Frequency</p>
        <div className="flex gap-2 mb-2">
          {(['daily', 'weekly'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFreq(f)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${freq === f ? 'text-brand-300' : 'border-white/8 text-slate-400'}`}
              style={freq === f ? { borderColor: 'rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.1)' } : {}}
            >
              {f === 'daily' ? '📅 Every day' : '📆 Specific days'}
            </button>
          ))}
        </div>
        {freq === 'weekly' && (
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${freqDays.includes(i) ? 'text-brand-300' : 'border-white/8 text-slate-500'}`}
                style={freqDays.includes(i) ? { borderColor: 'rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.15)' } : {}}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {type !== 'boolean' && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">
            Daily Target {type === 'duration' ? '(minutes)' : type === 'rating' ? '(out of 5)' : '(count)'}
          </p>
          <input
            type="number"
            min={1}
            max={type === 'rating' ? 5 : undefined}
            value={target}
            onChange={e => setTarget(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer py-1">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${grace ? 'border-brand-500 bg-brand-500' : 'border-white/20'}`}
          onClick={() => setGrace(v => !v)}
        >
          {grace && <CheckCircle2 size={12} className="text-white" />}
        </div>
        <span className="text-sm text-slate-300">
          Enable grace day <span className="text-slate-500">(1 free miss/week)</span>
        </span>
      </label>

      {/* Reminder time */}
      <div className="flex items-center gap-3 py-1 rounded-xl bg-white/3 border border-white/5 px-4">
        <Bell size={16} className="text-brand-400 flex-shrink-0" />
        <span className="text-sm text-slate-300 flex-1">Daily reminder</span>
        <input
          type="time"
          value={reminderTime}
          onChange={e => setReminderTime(e.target.value)}
          className="bg-transparent text-sm text-white outline-none cursor-pointer [color-scheme:dark]"
        />
        {reminderTime && (
          <button type="button" onClick={() => setReminderTime('')} className="text-slate-500 hover:text-white transition-colors text-xs">✕</button>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => onClose()}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 8px 20px ${color}40`,
          }}
        >
          {initialHabit ? '✓ Save Changes' : '🔥 Create Habit'}
        </button>
      </div>
    </form>
  );
}

// ─── Bottom Sheet wrapper ──────────────────────────────────────────
function BottomSheet({
  open,
  onClose,
  title,
  accentColor,
  accentIcon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;
  accentIcon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[92vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, rgba(12,8,28,0.98) 0%, rgba(5,3,15,0.99) 100%)',
              border: `1px solid ${accentColor ? accentColor + '25' : 'rgba(255,255,255,0.1)'}`,
              borderBottom: 'none',
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* Drag pill */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="w-full px-5 pb-10 max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {accentIcon && (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: accentColor ? `${accentColor}20` : 'rgba(99,102,241,0.15)' }}
                    >
                      {accentIcon}
                    </div>
                  )}
                  <h2 className="text-lg font-black text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── 3D HabitCard ─────────────────────────────────────────────────
function HabitCard({
  habit,
  onLogClick,
  onEdit,
  onDelete,
  canFreeze,
  onFreeze,
}: {
  habit: HabitWithStreak;
  onLogClick: (h: HabitWithStreak) => void;
  onEdit: (h: HabitWithStreak) => void;
  onDelete: (id: string) => void;
  canFreeze?: boolean;
  onFreeze?: (h: HabitWithStreak) => void;
}) {
  const { archiveHabit } = useHabitStore();
  const { openPicker }   = useFocusStore();
  const toast            = useToast();

  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history,     setHistory]     = useState<Record<string, boolean>>({});
  const [checkFlash,  setCheckFlash]  = useState(false);

  // 3D Tilt
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [ 5, -5]), { stiffness: 400, damping: 40 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5,  5]), { stiffness: 400, damping: 40 });

  const done =
    !!habit.todayLog &&
    (habit.todayLog.isFrozen ||
      habit.todayLog.value >= (habit.type === 'boolean' ? 1 : habit.targetValue));
  const pct =
    habit.type !== 'boolean' && habit.todayLog
      ? Math.min((habit.todayLog.value / habit.targetValue) * 100, 100)
      : done ? 100 : 0;
  const c            = habit.color || '#6366f1';
  const hasHotStreak = habit.streak.current >= 3;

  async function loadHistory() {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const todayStr      = format(new Date(), 'yyyy-MM-dd');
    const logs = await db.habitLogs
      .where('[habitId+date]')
      .between([habit.id, thirtyDaysAgo], [habit.id, todayStr], true, true)
      .filter(l => l.value >= 1 || !!l.isFrozen)
      .toArray();
    const map: Record<string, boolean> = {};
    logs.forEach(l => { map[l.date] = true; });
    setHistory(map);
  }

  return (
    <div
      ref={cardRef}
      style={{ perspective: 1000 }}
      onMouseMove={e => {
        const r = cardRef.current?.getBoundingClientRect();
        if (!r) return;
        mouseX.set((e.clientX - r.left) / r.width  - 0.5);
        mouseY.set((e.clientY - r.top)  / r.height - 0.5);
      }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ rotateX, rotateY }}
        className={cn('relative rounded-2xl overflow-hidden group', done && 'opacity-80')}
        whileHover={{ boxShadow: `0 24px 48px -12px ${c}30` }}
      >
        {/* Glass card background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${c}`,
            backdropFilter: 'blur(20px)',
          }}
        />

        {/* Hot-streak pulse aura */}
        {hasHotStreak && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: `inset 0 0 28px ${c}20, 0 0 14px ${c}18` }}
          />
        )}

        {/* Top shimmer progress bar */}
        <div className="h-[3px] w-full absolute top-0 left-0 bg-white/5 z-10 overflow-hidden">
          <motion.div
            className="h-full relative overflow-hidden"
            style={{ background: `linear-gradient(90deg, ${c}70, ${c})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {done && (
              <motion.div
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
              />
            )}
          </motion.div>
        </div>

        <div className="p-3 sm:p-5 relative z-10 pt-4">
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-3">

            {/* 3D Check button */}
            <motion.button
              onClick={() => {
                onLogClick(habit);
                if (!done) { setCheckFlash(true); setTimeout(() => setCheckFlash(false), 500); }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center flex-shrink-0 relative overflow-hidden transition-all',
                done && 'animate-check-pop'
              )}
              style={
                done
                  ? {
                      background: habit.todayLog?.isFrozen
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : `linear-gradient(135deg, ${c}, ${c}dd)`,
                      borderColor: 'transparent',
                      boxShadow: `0 8px 24px ${c}50, 0 0 0 1px ${c}30`,
                    }
                  : { borderColor: `${c}50`, background: `${c}10` }
              }
            >
              {/* Flash ripple on check */}
              {checkFlash && !done && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0.6, scale: 0.5 }}
                  animate={{ opacity: 0, scale: 2.5 }}
                  transition={{ duration: 0.45 }}
                  style={{ background: `radial-gradient(circle, ${c} 0%, transparent 70%)` }}
                />
              )}
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-white">
                {done ? (
                  habit.todayLog?.isFrozen ? (
                    <Snowflake size={18} className="sm:w-6 sm:h-6" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                      className="w-4 h-4 sm:w-6 sm:h-6" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        d="M20 6L9 17l-5-5"
                      />
                    </svg>
                  )
                ) : (
                  <IconRenderer name={habit.icon} size={20} color={c} />
                )}
              </div>
            </motion.button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <button
                className={cn(
                  'font-bold text-sm sm:text-base truncate w-full text-left transition-all block',
                  done ? 'line-through text-slate-500' : 'text-white hover:text-brand-300'
                )}
                onClick={() => {
                  setShowHistory(v => { if (!v) loadHistory(); return !v; });
                }}
                title="View 30-day history"
              >
                {habit.name}
              </button>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{ background: `${c}20`, color: c }}
                >
                  {habit.category}
                </span>
                {habit.streak.current > 0 && (
                  <span className="flex items-center gap-1 text-xs font-black text-amber-400 animate-flame">
                    <Flame size={12} fill="currentColor" /> {habit.streak.current}d
                  </span>
                )}
                {hasHotStreak && (
                  <motion.span
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  >
                    🔥 Hot
                  </motion.span>
                )}
              </div>
            </div>

            {/* Best streak + expand chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Best</p>
                <p className="text-lg font-black text-white leading-none">{habit.streak.best}d</p>
              </div>
              <button
                onClick={() => setShowDetails(v => !v)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                <motion.div animate={{ rotate: showDetails ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight size={18} />
                </motion.div>
              </button>
            </div>
          </div>

          {/* Mini SVG arc + bar for non-boolean */}
          {habit.type !== 'boolean' && (
            <div className="mb-3 flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg viewBox="0 0 40 40" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={20} cy={20} r={15} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
                  <motion.circle
                    cx={20} cy={20} r={15}
                    fill="none" stroke={c} strokeWidth={4} strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${2 * Math.PI * 15}` }}
                    animate={{ strokeDasharray: `${(pct / 100) * 2 * Math.PI * 15} ${2 * Math.PI * 15}` }}
                    transition={{ duration: 0.8 }}
                    style={{ filter: `drop-shadow(0 0 3px ${c}80)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-black text-white">{Math.round(pct)}%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{habit.todayLog?.value ?? 0} / {habit.targetValue}</span>
                  <span className="font-bold" style={{ color: c }}>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${c}70, ${c})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 30-day history grid (unchanged logic) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <BarChart2 size={10} /> 30-Day History
                    </p>
                    <span className="text-[10px] text-slate-600">{Object.keys(history).length} days completed</span>
                  </div>
                  <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const d    = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
                      const isDone = !!history[d];
                      return (
                        <motion.div
                          key={d}
                          title={d}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.012, duration: 0.2 }}
                          className="aspect-square rounded-[3px]"
                          style={{
                            background: isDone ? c : 'rgba(255,255,255,0.05)',
                            boxShadow:  isDone ? `0 0 4px ${c}60` : 'none',
                            opacity:    isDone ? 1 : 0.4,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded action details (unchanged logic) */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Type',   val: habit.type },
                      { label: 'Target', val: habit.targetValue },
                      { label: '30d Rate', val: `${Math.round(habit.completionRate30Days * 100)}%` },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-2" style={{ background: `${c}08` }}>
                        <p className="text-[10px] text-slate-500 mb-0.5">{s.label}</p>
                        <p className="text-sm font-bold text-white capitalize">{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPicker({ id: habit.id, title: habit.name, type: 'habit' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-400 hover:bg-brand-500/20 transition-colors"
                    >
                      <Timer size={11} /> Focus
                    </button>
                    <button
                      onClick={() => exportHabitToCalendar(habit)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
                      title="Export .ics to your Calendar"
                    >
                      <CalendarDays size={11} /> Sync
                    </button>
                    <button
                      onClick={() => onEdit(habit)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    {canFreeze && onFreeze ? (
                      <button
                        onClick={() => onFreeze(habit)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
                      >
                        <Snowflake size={11} /> Freeze
                      </button>
                    ) : (
                      <button
                        onClick={() => archiveHabit(habit.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
                      >
                        <Archive size={11} /> Archive
                      </button>
                    )}
                    <button
                      onClick={() => {
                        toast.confirm(
                          `Delete "${habit.name}" and all its history? This cannot be undone.`,
                          () => onDelete(habit.id),
                          { confirmLabel: 'Delete', danger: true }
                        );
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
function HabitSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="h-[3px] w-full bg-white/5" />
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-white/8 rounded-full w-2/3" />
          <div className="h-3 bg-white/5 rounded-full w-1/4" />
        </div>
        <div className="w-14 h-8 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

// ─── 3D Empty State ───────────────────────────────────────────────
function EmptyState3D({ onTemplates, onCreate }: { onTemplates: () => void; onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Orbiting rings */}
      <div className="relative w-28 h-28 mb-8">
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-6 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #a5b4fc, #6366f1 50%, #4338ca)',
            boxShadow: '0 0 40px rgba(99,102,241,0.65)',
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full"
          style={{ border: '1.5px dashed rgba(129,140,248,0.35)' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 13, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[6px] rounded-full"
          style={{ border: '1px dashed rgba(167,139,250,0.2)' }}
        />
        {/* Orbiting dot */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/60" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-purple-400 shadow shadow-purple-500/50" />
        </motion.div>
      </div>

      <h3 className="text-xl font-black text-white mb-2">No habits yet</h3>
      <p className="text-slate-400 text-sm max-w-[280px] mb-8 leading-relaxed">
        Add your first habit and start building a powerful daily routine. 🌱
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onTemplates}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-brand-300 border border-brand-500/30 hover:bg-brand-500/10 transition-all"
        >
          ✨ Browse Templates
        </button>
        <MagneticButton
          onClick={onCreate}
          intensity={0.4}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            boxShadow: '0 8px 24px rgba(var(--brand-500-rgb),0.4)',
          }}
        >
          <Plus size={16} /> Create Custom
        </MagneticButton>
      </div>
    </motion.div>
  );
}

// ─── Main HabitsPage ──────────────────────────────────────────────
export function HabitsPage() {
  const {
    habits,
    loading,
    loadHabits,
    logHabit,
    unlogHabit,
    applyFreeze,
    deleteHabit,
    selectedDate,
    setSelectedDate,
    reorderHabits,
  } = useHabitStore();
  const { userXP, consumeFreeze } = useGamificationStore();

  const [showAdd,       setShowAdd]       = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showView,      setShowView]      = useState<'list' | 'calendar'>('list');
  const [calMonth,      setCalMonth]      = useState(new Date());
  const [calLogs,       setCalLogs]       = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (selectedDate !== today) setSelectedDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCalendarLogs(month: Date) {
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end   = format(endOfMonth(month),   'yyyy-MM-dd');
    const logs  = await db.habitLogs
      .where('date').between(start, end, true, true)
      .filter(l => l.value >= 1 || !!l.isFrozen)
      .toArray();
    const map: Record<string, Set<string>> = {};
    logs.forEach(l => {
      if (!map[l.date]) map[l.date] = new Set();
      map[l.date].add(l.habitId);
    });
    setCalLogs(map);
  }

  const [editingHabit,   setEditingHabit]   = useState<HabitWithStreak | null>(null);
  const [selectedLog,    setSelectedLog]    = useState<HabitWithStreak | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showCelebration,setShowCelebration]= useState(false);
  const [showJournal,    setShowJournal]    = useState(false);
  const prevDoneRef = useRef(0);

  const toast          = useToast();
  const { fireConfetti } = useCompletionEffects();

  const handleUseFreeze = async (habit: HabitWithStreak) => {
    if ((userXP?.streakFreezes ?? 0) <= 0) {
      toast.error("You don't have any Streak Freezes! Buy them from your Profile.");
      return;
    }
    toast.confirm(
      `Use 1 Streak Freeze to protect "${habit.name}" today?`,
      async () => {
        const success = await consumeFreeze();
        if (success) {
          await applyFreeze(habit.id);
          toast.success('Streak Freeze applied! ❄️');
        }
      },
      { confirmLabel: 'Use Freeze' }
    );
  };

  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE'), num: format(d, 'd') };
  });

  useEffect(() => { loadHabits(); }, [loadHabits, selectedDate]);

  const scheduled = habits.filter(h => {
    if (h.archived) return false;
    return habitService.isScheduledForDate(h, selectedDate);
  });

  const categories = [
    'All',
    ...Array.from(new Set(habits.filter(h => !h.archived).map(h => h.category))).sort(),
  ];

  const visible =
    activeCategory === 'All' ? scheduled : scheduled.filter(h => h.category === activeCategory);

  const done = scheduled.filter(
    h => !!h.todayLog && (h.todayLog.isFrozen || h.todayLog.value >= 1)
  ).length;
  const pct        = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best ?? 0)) : 0;
  const today      = format(new Date(), 'yyyy-MM-dd');
  const isToday    = selectedDate === today;

  useEffect(() => {
    if (
      isToday &&
      scheduled.length > 0 &&
      done === scheduled.length &&
      prevDoneRef.current < scheduled.length
    ) {
      soundService.playCelebration();
      soundService.haptic([40, 30, 40, 30, 80]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    prevDoneRef.current = done;
  }, [done, scheduled.length, isToday]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceIdx = result.source.index;
    const destIdx   = result.destination.index;
    if (sourceIdx === destIdx) return;
    const newVisible = Array.from(visible);
    const [removed]  = newVisible.splice(sourceIdx, 1);
    newVisible.splice(destIdx, 0, removed);
    const visibleIdSet     = new Set(visible.map(h => h.id));
    const fullOrder        = habits.map(h => h.id);
    const nonVisibleOrder  = fullOrder.filter(id => !visibleIdSet.has(id));
    const firstVisibleIdx  = fullOrder.findIndex(id => visibleIdSet.has(id));
    const insertIdx        = firstVisibleIdx >= 0 ? firstVisibleIdx : 0;
    const orderedIds = [
      ...nonVisibleOrder.slice(0, insertIdx),
      ...newVisible.map(h => h.id),
      ...nonVisibleOrder.slice(insertIdx),
    ];
    reorderHabits(orderedIds);
  };

  const handleLogClick = (hab: HabitWithStreak) => {
    const isDone =
      !!hab.todayLog &&
      (hab.todayLog.isFrozen ||
        hab.todayLog.value >= (hab.type === 'boolean' ? 1 : hab.targetValue));
    if (isDone) {
      unlogHabit(hab.id);
    } else if (hab.type === 'boolean') {
      logHabit(hab.id, 1);
      fireConfetti();
    } else {
      setSelectedLog(hab);
    }
  };

  useEffect(() => { document.title = 'My Habits — HabitFlow'; }, []);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5 relative">
      {/* Three.js floating particles background */}
      <Suspense fallback={null}>
        <HabitsBackground />
      </Suspense>

      {/* Soft ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-8%] right-[-6%] w-[40%] h-[50%] rounded-full blur-[130px] opacity-10"
          style={{ background: 'var(--brand-500)' }} />
        <div className="absolute bottom-[10%] left-[-8%] w-[35%] h-[45%] rounded-full blur-[110px] opacity-8"
          style={{ background: '#8b5cf6' }} />
      </div>

      {/* ── All Done Celebration ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-x-4 z-[999] flex justify-center pointer-events-none"
            style={{ top: 'max(96px, calc(env(safe-area-inset-top, 0px) + 24px))' }}
          >
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/40 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              All habits done! You're amazing!
              <span className="text-2xl">🔥</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">Habit Tracker</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white text-gradient">My Habits</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isToday ? (
              <>
                {done}/{scheduled.length} done today
                {pct >= 80 ? " — You're on fire! 🔥" : pct >= 50 ? ' — Keep pushing! 💪' : " — Let's get started! 🌱"}
              </>
            ) : (
              <>Viewing {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMM d')}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            <button
              onClick={() => setShowView('list')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showView === 'list' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <BarChart2 size={12} /> List
            </button>
            <button
              onClick={() => {
                setShowView('calendar');
                const m = new Date();
                setCalMonth(m);
                loadCalendarLogs(m);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showView === 'calendar' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <CalendarDays size={12} /> Calendar
            </button>
          </div>
          <button
            onClick={() => setShowJournal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-sm font-medium ml-2 mr-2"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Journal</span>
          </button>
          <motion.button
            onClick={() => setShowTemplates(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-brand-300 border border-brand-500/30 hover:bg-brand-500/10 transition-all"
          >
            ✨ Templates
          </motion.button>
          <MagneticButton
            onClick={() => setShowAdd(v => !v)}
            intensity={0.4}
            className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl font-bold text-sm text-white flex-shrink-0 ml-auto sm:ml-0 active:scale-95 transition-transform shadow-xl shadow-brand-500/40"
            style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Habit</span>
            <span className="sm:hidden">Add</span>
          </MagneticButton>
        </div>
      </div>

      {/* ── KPI Rings ── */}
      <div
        className="flex items-center justify-around py-5 px-2 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <KpiRing label="Done Today"  emoji="✅" value={done}       max={scheduled.length || 1} color="#34d399" delay={0} />
        <div className="w-px h-16 bg-white/8" />
        <KpiRing label="Best Streak" emoji="🏆" value={bestStreak} max={bestStreak || 1}        color="#f97316" delay={1} suffix="d" />
        <div className="w-px h-16 bg-white/8" />
        <KpiRing label="Completion"  emoji="📈" value={pct}        max={100}                    color="#818cf8" delay={2} suffix="%" />
      </div>

      {/* ── Date Strip ── */}
      <div
        className="rounded-2xl p-2.5 sm:p-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <CalendarDays size={13} className="text-brand-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log for date</span>
        </div>
        <div className="flex gap-1 sm:gap-1.5">
          {dateStrip.map(({ date, day, num }) => {
            const isSelected   = date === selectedDate;
            const isCurrentDay = date === today;
            return (
              <motion.button
                key={date}
                onClick={() => setSelectedDate(date)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center h-[56px] sm:h-[68px] rounded-xl text-center border transition-colors relative overflow-hidden',
                  isSelected
                    ? 'text-white border-brand-500/50'
                    : 'border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                )}
                style={isSelected ? {
                  background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                  boxShadow: '0 4px 18px rgba(var(--brand-500-rgb),0.5)',
                } : {}}
              >
                {isSelected && (
                  <motion.div
                    layoutId="date-selected-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  />
                )}
                <span className="text-[9px] sm:text-[10px] font-bold uppercase relative z-10">{day}</span>
                <span className={cn(
                  'text-sm sm:text-base font-black mt-0.5 relative z-10',
                  isSelected ? 'text-white' : isCurrentDay ? 'text-brand-400' : ''
                )}>
                  {num}
                </span>
                {isCurrentDay && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5 relative z-10" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Add Habit Bottom Sheet ── */}
      <BottomSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New Habit"
        accentIcon={<Flame size={18} className="text-brand-400" />}
      >
        <HabitForm
          onClose={reason => {
            setShowAdd(false);
            if (reason === 'created') setActiveCategory('All');
          }}
        />
      </BottomSheet>

      {/* ── Edit Habit Bottom Sheet ── */}
      <BottomSheet
        open={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        title={editingHabit ? `Edit — ${editingHabit.name}` : ''}
        accentColor={editingHabit?.color}
        accentIcon={editingHabit ? <IconRenderer name={editingHabit.icon} size={20} color={editingHabit.color} /> : null}
      >
        {editingHabit && (
          <HabitForm initialHabit={editingHabit} onClose={() => setEditingHabit(null)} />
        )}
      </BottomSheet>

      {/* ── Category Filter Tabs ── */}
      {!loading && habits.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'relative px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                activeCategory === cat
                  ? 'text-white border-transparent'
                  : 'border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
              )}
            >
              {activeCategory === cat && (
                <motion.div
                  layoutId="category-active"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(var(--brand-500-rgb),0.18)',
                    border: '1px solid rgba(var(--brand-500-rgb),0.4)',
                  }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">
                {CATEGORIES.find(c => c.name === cat)?.icon ?? '🔖'} {cat}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Habit List ── */}
      {showView === 'list' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3, 4].map(i => <HabitSkeleton key={i} />)}
            </div>
          ) : habits.length === 0 ? (
            <EmptyState3D
              onTemplates={() => setShowTemplates(true)}
              onCreate={() => setShowAdd(true)}
            />
          ) : visible.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-center rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-4xl mb-3">🎉</span>
              <h3 className="text-base font-semibold text-white mb-1">
                {activeCategory !== 'All'
                  ? `No ${activeCategory} habits scheduled`
                  : 'No habits scheduled for this day'}
              </h3>
              <p className="text-slate-500 text-sm">
                {activeCategory !== 'All' ? (
                  <button
                    onClick={() => setActiveCategory('All')}
                    className="text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Show all categories
                  </button>
                ) : (
                  'Try selecting a different date or check "All My Habits" below.'
                )}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="habits-list" direction="vertical">
                {provided => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 gap-2 sm:gap-3"
                  >
                    {visible.map((h, index) => (
                      <Draggable key={h.id} draggableId={h.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={cn(
                              'relative',
                              snapshot.isDragging && 'z-50 opacity-90 scale-[1.02]'
                            )}
                          >
                            {/* Drag handle */}
                            <div
                              {...dragProvided.dragHandleProps}
                              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
                            >
                              <GripVertical size={16} />
                            </div>
                            <div className="pl-10">
                              <HabitCard
                                habit={h}
                                onLogClick={handleLogClick}
                                onEdit={setEditingHabit}
                                onDelete={deleteHabit}
                                canFreeze={
                                  isToday &&
                                  (!h.todayLog || h.todayLog.value === 0) &&
                                  !h.todayLog?.isFrozen &&
                                  h.streak.current > 0 &&
                                  (userXP?.streakFreezes ?? 0) > 0
                                }
                                onFreeze={handleUseFreeze}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* ── Not Scheduled Today ── */}
          {!loading &&
            habits.filter(h => !h.archived).length > 0 &&
            (() => {
              const allActive    = habits.filter(h => !h.archived);
              const scheduledIds = new Set(scheduled.map(h => h.id));
              const unscheduled  = allActive.filter(h => !scheduledIds.has(h.id));
              if (unscheduled.length === 0) return null;
              return (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                      <Archive size={12} className="text-slate-500" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Not Scheduled Today
                    </h2>
                    <span className="text-[10px] text-slate-600 font-bold">
                      {unscheduled.length} habit{unscheduled.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 opacity-70">
                    {unscheduled.map((h, i) => (
                      <Scroll3DReveal key={h.id} delay={i * 0.05}>
                        <HabitCard
                          habit={h}
                          onLogClick={handleLogClick}
                          onEdit={setEditingHabit}
                          onDelete={deleteHabit}
                        />
                      </Scroll3DReveal>
                    ))}
                  </div>
                </div>
              );
            })()}
        </>
      )}

      {selectedLog    && <LogHabitModal habit={selectedLog} onClose={() => setSelectedLog(null)} />}
      {showTemplates  && <TemplatesLibrary onClose={() => setShowTemplates(false)} />}

      {/* ── Calendar Month View (UNCHANGED logic) ── */}
      <AnimatePresence mode="wait">
        {showView === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-5 mt-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { const m = subMonths(calMonth, 1); setCalMonth(m); loadCalendarLogs(m); }}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-base font-bold text-white">{format(calMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => { const m = addMonths(calMonth, 1); setCalMonth(m); loadCalendarLogs(m); }}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            {(() => {
              const start    = startOfMonth(calMonth);
              const end      = endOfMonth(calMonth);
              const days     = eachDayOfInterval({ start, end });
              const startPad = getDay(start);
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              return (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
                  {days.map(day => {
                    const ds        = format(day, 'yyyy-MM-dd');
                    const dayHabits = habits.filter(h => !h.archived && habitService.isScheduledForDate(h, ds));
                    const donIds    = calLogs[ds] ?? new Set<string>();
                    const dayDone   = dayHabits.filter(h => donIds.has(h.id)).length;
                    const isSelected  = ds === selectedDate;
                    const isTodayDay  = ds === todayStr;
                    const isFuture    = ds > todayStr;
                    const allDone     = dayHabits.length > 0 && dayDone === dayHabits.length;
                    return (
                      <button
                        key={ds}
                        onClick={() => { setSelectedDate(ds); setShowView('list'); }}
                        className={`relative flex flex-col items-center justify-center rounded-xl p-1.5 min-h-[44px] transition-all ${
                          isSelected ? 'ring-2 ring-brand-500 bg-brand-500/15'
                            : isTodayDay ? 'bg-white/8 font-bold'
                            : isFuture  ? 'opacity-40 cursor-default'
                            : 'hover:bg-white/5'
                        }`}
                        disabled={isFuture}
                      >
                        <span className={`text-xs font-semibold ${
                          isSelected ? 'text-brand-300'
                            : isTodayDay ? 'text-white'
                            : isFuture  ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayHabits.length > 0 && !isFuture && (
                          <div className="flex gap-[2px] mt-0.5 flex-wrap justify-center max-w-[28px]">
                            {dayHabits.slice(0, 4).map((h, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: donIds.has(h.id) ? h.color || 'var(--brand-500)' : 'rgba(255,255,255,0.15)',
                                  opacity: isTodayDay ? 1 : 0.7,
                                  boxShadow: allDone ? '0 0 3px #10b981' : 'none',
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            <p className="text-center text-xs text-slate-600 mt-3">
              Tap any past day to view &amp; log habits for that date
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <HabitJournal isOpen={showJournal} onClose={() => setShowJournal(false)} />
    </div>
  );
}
