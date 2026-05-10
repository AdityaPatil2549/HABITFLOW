import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Archive, Trash2, Edit2, CheckCircle2, ChevronRight, CalendarDays, Snowflake, GripVertical, Timer, Bell, BarChart2, X, ChevronLeft } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useHabitStore } from '../store/habitStore';
import { useGamificationStore } from '../store/gamificationStore';
import type { HabitWithStreak, HabitType, HabitFrequency } from '../types';
import { format, subDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';
import { habitSchema } from '../lib/validations';
import { LogHabitModal } from '../components/habits/LogHabitModal';
import { cn } from '../lib/utils';
import { IconRenderer, HABIT_ICONS } from '../components/common/IconRenderer';
import { habitService } from '../services/habitService';
import { soundService } from '../services/soundService';
import { useFocusStore } from '../store/focusStore';
import { TemplatesLibrary } from '../components/habits/TemplatesLibrary';
import { useToast } from '../components/common/Toast';
import { db } from '../db';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORIES = [
  { name: 'Health', icon: '🍎' },
  { name: 'Learning', icon: '📚' },
  { name: 'Work', icon: '💼' },
  { name: 'Personal', icon: '✨' },
  { name: 'Finance', icon: '💰' },
  { name: 'Other', icon: '🌈' },
];
const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];

function HabitForm({ onClose, initialHabit }: { onClose: () => void; initialHabit?: HabitWithStreak }) {
  const { addHabit, updateHabit } = useHabitStore();
  const [name, setName] = useState(initialHabit?.name ?? '');
  const [icon, setIcon] = useState(initialHabit?.icon ?? '🎯');
  const [color, setColor] = useState(initialHabit?.color ?? COLORS[0]);
  const [category, setCategory] = useState(initialHabit?.category ?? 'Health');
  const [type, setType] = useState<HabitType>(initialHabit?.type ?? 'boolean');
  const [freq, setFreq] = useState<HabitFrequency>(initialHabit?.frequency ?? 'daily');
  const [freqDays, setFreqDays] = useState<number[]>(initialHabit?.frequencyDays ?? [1, 2, 3, 4, 5]);
  const [target, setTarget] = useState(initialHabit?.targetValue ?? 1);
  const [grace, setGrace] = useState(initialHabit?.graceDayEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialHabit?.reminderTime ?? '');
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (d: number) => setFreqDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const parsed = habitSchema.safeParse({ name: name.trim(), icon, color, category, type, frequency: freq, frequencyDays: freq === 'weekly' ? freqDays : undefined, targetValue: target, startDate: initialHabit?.startDate ?? format(new Date(), 'yyyy-MM-dd'), graceDayEnabled: grace, archived: initialHabit?.archived ?? false, reminderTime: reminderTime || undefined });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    if (initialHabit) await updateHabit(initialHabit.id, parsed.data);
    else await addHabit(parsed.data);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

      {/* Name + emoji */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Name & Icon</p>
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95" style={{ background: color + '15', border: `2px solid ${color}30`, color: color }}>
            <IconRenderer name={icon} size={24} />
          </div>
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-base font-medium outline-none focus:border-brand-500/50 transition-all"
            placeholder="Habit name…" value={name} onChange={e => setName(e.target.value)} autoFocus required
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3 bg-white/5 rounded-2xl p-3 border border-white/5">
          {HABIT_ICONS.map(item => (
            <button key={item.name} type="button" onClick={() => setIcon(item.name)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${icon === item.name ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}>
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
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'scale-125' : 'hover:scale-110'}`}
                style={{ background: c, boxShadow: color === c ? `0 0 10px ${c}80` : 'none' }} />
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
                <span>{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Habit Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([['boolean','✅ Yes/No'],['count','🔢 Count'],['duration','⏱ Duration'],['rating','⭐ Rating']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setType(v as HabitType)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${type === v ? 'text-brand-300 scale-[1.03]' : 'border-white/8 text-slate-400 hover:border-white/20'}`}
              style={type === v ? { borderColor: 'rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.1)' } : {}}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Frequency</p>
        <div className="flex gap-2 mb-2">
          {(['daily','weekly'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFreq(f)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${freq === f ? 'text-brand-300' : 'border-white/8 text-slate-400'}`}
              style={freq === f ? { borderColor: 'rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.1)' } : {}}>
              {f === 'daily' ? '📅 Every day' : '📆 Specific days'}
            </button>
          ))}
        </div>
        {freq === 'weekly' && (
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button key={d} type="button" onClick={() => toggleDay(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${freqDays.includes(i) ? 'text-brand-300' : 'border-white/8 text-slate-500'}`}
                style={freqDays.includes(i) ? { borderColor: 'rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.15)' } : {}}>
                {d[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {type !== 'boolean' && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Daily Target</p>
          <input type="number" min={1} value={target} onChange={e => setTarget(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all" />
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer py-1">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${grace ? 'border-brand-500 bg-brand-500' : 'border-white/20'}`}
          onClick={() => setGrace(v => !v)}>
          {grace && <CheckCircle2 size={12} className="text-white" />}
        </div>
        <span className="text-sm text-slate-300">Enable grace day <span className="text-slate-500">(1 free miss/week)</span></span>
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
          <button type="button" onClick={() => setReminderTime('')} className="text-slate-500 hover:text-white transition-colors text-xs">
            ✕
          </button>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 20px ${color}40` }}>
          {initialHabit ? '✓ Save Changes' : '🔥 Create Habit'}
        </button>
      </div>
    </form>
  );
}

function HabitCard({ habit, onLogClick, onEdit, onDelete, canFreeze, onFreeze }: { habit: HabitWithStreak; onLogClick: (h: HabitWithStreak) => void; onEdit: (h: HabitWithStreak) => void; onDelete: (id: string) => void; canFreeze?: boolean; onFreeze?: (h: HabitWithStreak) => void }) {
  const { archiveHabit } = useHabitStore();
  const { startFocus } = useFocusStore();
  const toast = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Record<string, boolean>>({});
  const done = !!habit.todayLog && (habit.todayLog.isFrozen || habit.todayLog.value >= (habit.type === 'boolean' ? 1 : habit.targetValue));
  const pct = habit.type !== 'boolean' && habit.todayLog ? Math.min((habit.todayLog.value / habit.targetValue) * 100, 100) : done ? 100 : 0;
  const c = habit.color || '#6366f1';

  async function loadHistory() {
    const logs = await db.habitLogs
      .where('habitId').equals(habit.id)
      .filter(l => l.value >= 1 || !!l.isFrozen)
      .toArray();
    const map: Record<string, boolean> = {};
    logs.forEach(l => { map[l.date] = true; });
    setHistory(map);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card rounded-2xl overflow-hidden transition-all group"
      whileHover={{ y: -2, boxShadow: `0 12px 40px ${c}20` }}
    >
      {/* Progress bar top */}
      <div className="h-0.5 w-full bg-white/5">
        <motion.div className="h-full" style={{ background: `linear-gradient(90deg, ${c}, ${c}99)` }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          {/* Check button */}
          <motion.button onClick={() => onLogClick(habit)}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl flex-shrink-0 transition-all"
            style={done
              ? { background: habit.todayLog?.isFrozen ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #10b981, #06b6d4)', borderColor: 'transparent', boxShadow: habit.todayLog?.isFrozen ? '0 4px 16px rgba(59,130,246,0.3)' : '0 4px 16px rgba(16,185,129,0.3)' }
              : { borderColor: `${c}60`, background: `${c}10` }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white">
              {done ? (habit.todayLog?.isFrozen ? <Snowflake size={20} /> : '✓') : <IconRenderer name={habit.icon} size={20} color={c} />}
            </div>
          </motion.button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <button
              className={cn('font-semibold text-sm truncate w-full text-left hover:underline transition-all', done ? 'line-through text-slate-500' : 'text-white')}
              onClick={() => {
                setShowHistory(v => {
                  if (!v) loadHistory();
                  return !v;
                });
              }}
              title="View 30-day history"
            >
              {habit.name}
            </button>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c}15`, color: c }}>{habit.category}</span>
              {habit.streak.current > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                  <Flame size={10} className="animate-pulse" /> {habit.streak.current}d
                </span>
              )}
            </div>
          </div>

          {/* Best streak + expand */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-500">Best</p>
              <p className="text-sm font-bold text-white">{habit.streak.best}d</p>
            </div>
            <button onClick={() => setShowDetails(v => !v)} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 transition-colors">
              <ChevronRight size={15} className={cn('transition-transform', showDetails && 'rotate-90')} />
            </button>
          </div>
        </div>

        {/* Progress bar (for non-boolean) */}
        {habit.type !== 'boolean' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{habit.todayLog?.value ?? 0} / {habit.targetValue}</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5">
              <motion.div className="h-full rounded-full" style={{ background: c }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        )}

        {/* 30-day streak history drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><BarChart2 size={10} /> 30-Day History</p>
                  <span className="text-[10px] text-slate-600">{Object.keys(history).length} days completed</span>
                </div>
                <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                  {Array.from({ length: 30 }, (_, i) => {
                    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
                    const done = !!history[d];
                    return (
                      <div key={d} title={d}
                        className="aspect-square rounded-[3px] transition-all"
                        style={{ background: done ? c : 'rgba(255,255,255,0.05)', boxShadow: done ? `0 0 4px ${c}60` : 'none', opacity: done ? 1 : 0.4 }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded action details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Type', val: habit.type },
                    { label: 'Target', val: habit.targetValue },
                    { label: '30d Rate', val: `${Math.round(habit.completionRate30Days * 100)}%` },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-2" style={{ background: `${c}08` }}>
                      <p className="text-[10px] text-slate-500 mb-0.5">{s.label}</p>
                      <p className="text-sm font-bold text-white">{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startFocus({ id: habit.id, title: habit.name, type: 'habit' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-400 hover:bg-brand-500/20 transition-colors">
                    <Timer size={11} /> Focus
                  </button>
                  <button onClick={() => onEdit(habit)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors">
                    <Edit2 size={11} /> Edit
                  </button>
                  {canFreeze && onFreeze ? (
                    <button onClick={() => onFreeze(habit)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors">
                      <Snowflake size={11} /> Use Freeze
                    </button>
                  ) : (
                    <button onClick={() => archiveHabit(habit.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors">
                      <Archive size={11} /> Archive
                    </button>
                  )}
                  <button onClick={() => {
                    toast.confirm(
                      `Delete "${habit.name}" and all its history? This cannot be undone.`,
                      () => onDelete(habit.id),
                      { confirmLabel: 'Delete', danger: true }
                    );
                  }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Skeleton shimmer card ───────────────────────────────────────
function HabitSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-0.5 w-full bg-white/5" />
      <div className="p-5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-white/8 rounded-full w-3/4" />
          <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
        </div>
        <div className="w-16 h-8 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export function HabitsPage() {
  const { habits, loading, loadHabits, logHabit, applyFreeze, deleteHabit, selectedDate, setSelectedDate, reorderHabits } = useHabitStore();
  const { userXP, buyFreeze, useFreeze } = useGamificationStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showView, setShowView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date());
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | null>(null);
  const [selectedLog, setSelectedLog] = useState<HabitWithStreak | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showCelebration, setShowCelebration] = useState(false);
  const prevDoneRef = useRef(0);

  const toast = useToast();

  const handleUseFreeze = async (habit: HabitWithStreak) => {
    if ((userXP?.streakFreezes ?? 0) <= 0) {
      toast.error("You don't have any Streak Freezes! Buy them from your Profile.");
      return;
    }
    toast.confirm(
      `Use 1 Streak Freeze to protect "${habit.name}" today?`,
      async () => {
        const success = await useFreeze();
        if (success) {
          await applyFreeze(habit.id);
          toast.success('Streak Freeze applied! ❄️');
        }
      },
      { confirmLabel: 'Use Freeze' }
    );
  };

  // Build last-7-days date strip
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE'), num: format(d, 'd') };
  });

  // Load habits whenever selected date changes
  useEffect(() => { loadHabits(); }, [loadHabits, selectedDate]);

  // Scheduled for selected date
  const scheduled = habits.filter(h => {
    if (h.archived) return false;
    return habitService.isScheduledForDate(h, selectedDate);
  });

  // Category list from real habits
  const categories = ['All', ...Array.from(new Set(habits.filter(h => !h.archived).map(h => h.category))).sort()];

  // Apply category filter
  const visible = activeCategory === 'All'
    ? scheduled
    : scheduled.filter(h => h.category === activeCategory);

  const done = scheduled.filter(h => !!h.todayLog && (h.todayLog.isFrozen || h.todayLog.value >= 1)).length;
  const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best)) : 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  // Fire celebration when all habits for today are completed
  useEffect(() => {
    if (isToday && scheduled.length > 0 && done === scheduled.length && prevDoneRef.current < scheduled.length) {
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
    const destIdx = result.destination.index;
    if (sourceIdx === destIdx) return;
    // Get the current visible list, reorder it
    const newVisible = Array.from(visible);
    const [removed] = newVisible.splice(sourceIdx, 1);
    newVisible.splice(destIdx, 0, removed);
    // Build the full ordered ID list (keep habits not in visible unchanged)
    const visibleIds = new Set(visible.map(h => h.id));
    const otherHabits = habits.filter(h => !visibleIds.has(h.id));
    const orderedIds = [...newVisible.map(h => h.id), ...otherHabits.map(h => h.id)];
    reorderHabits(orderedIds);
  };

  return (
    <div className="space-y-5 relative">
      {/* ── All Done Celebration Overlay ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-x-4 top-24 z-[999] flex justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/40 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              All habits done! You're amazing!
              <span className="text-2xl">🔥</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">Habit Tracker</p>
          <h1 className="text-3xl font-bold text-white">My Habits</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isToday ? (
              <>
                {done}/{scheduled.length} done today
                {pct >= 80 ? ' — You\'re on fire! 🔥' : pct >= 50 ? ' — Keep pushing! 💪' : ' — Let\'s get started! 🌱'}
              </>
            ) : (
              <>Viewing {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMM d')}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            <button
              onClick={() => setShowView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showView === 'list' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <BarChart2 size={12} /> List
            </button>
            <button
              onClick={() => { setShowView('calendar'); setCalMonth(new Date()); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showView === 'calendar' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <CalendarDays size={12} /> Calendar
            </button>
          </div>
          <motion.button
            onClick={() => setShowTemplates(true)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-brand-300 border border-brand-500/30 hover:bg-brand-500/10 transition-all"
          >
            ✨ Templates
          </motion.button>
          <motion.button onClick={() => setShowAdd(v => !v)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 24px rgba(var(--brand-500-rgb),0.35)' }}>
            <Plus size={16} /> Add Habit
          </motion.button>
        </div>
      </div>

      {/* ── Retroactive Date Picker Strip ── */}
      <div className="glass-card rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2 px-1">
          <CalendarDays size={13} className="text-brand-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log for date</span>
        </div>
        <div className="flex gap-1.5">
          {dateStrip.map(({ date, day, num }) => {
            const isSelected = date === selectedDate;
            const isCurrentDay = date === today;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all text-center border',
                  isSelected
                    ? 'text-white border-brand-500/50'
                    : 'border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                )}
                style={isSelected ? { background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 4px 12px rgba(var(--brand-500-rgb),0.4)' } : {}}
              >
                <span className="text-[10px] font-bold uppercase">{day}</span>
                <span className={cn('text-base font-black mt-0.5', isSelected ? 'text-white' : isCurrentDay ? 'text-brand-400' : '')}>{num}</span>
                {isCurrentDay && !isSelected && <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today', value: `${done}/${scheduled.length}`, sub: 'habits done', icon: '✅' },
          { label: 'Best Streak', value: `${bestStreak}d`, sub: 'all time', icon: '🏆' },
          { label: 'Completion', value: `${pct}%`, sub: isToday ? 'today' : 'that day', icon: '📈' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-2xl p-4 text-center">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-xl font-bold text-white mt-2">{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {scheduled.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span className="font-semibold">Daily Progress</span>
            <span className="font-bold" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#818cf8' }}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: pct >= 80 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
        </div>
      )}

      {/* Add / Edit forms */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Flame size={16} className="text-brand-400" />
              </div>
              <h2 className="text-base font-bold text-white">New Habit</h2>
            </div>
            <HabitForm onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
        {editingHabit && (
          <motion.div className="glass-card rounded-2xl p-6" style={{ borderLeft: `3px solid ${editingHabit.color}` }}
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                <IconRenderer name={editingHabit.icon} size={20} />
              </div>
              <h2 className="text-base font-bold text-white">Edit — {editingHabit.name}</h2>
            </div>
            <HabitForm initialHabit={editingHabit} onClose={() => setEditingHabit(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Filter Tabs ── */}
      {!loading && habits.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                activeCategory === cat
                  ? 'border-brand-500/50 text-brand-300'
                  : 'border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
              )}
              style={activeCategory === cat ? { background: 'rgba(var(--brand-500-rgb),0.15)' } : {}}
            >
              {CATEGORIES.find(c => c.name === cat)?.icon ?? '🔖'} {cat}
            </button>
          ))}
        </div>
      )}

      {/* Habit grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <HabitSkeleton key={i} />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🌱</span>
          <h3 className="text-lg font-semibold text-white mb-2">No habits yet</h3>
          <p className="text-slate-400 text-sm w-full max-w-xs px-4 mb-6 leading-relaxed">Add your first habit and start building a powerful daily routine.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-brand-300 border border-brand-500/30 hover:bg-brand-500/10 transition-all">
              ✨ Browse Templates
            </button>
            <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}>
              + Create Custom
            </button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-14 text-center">
          <span className="text-4xl mb-3">🎉</span>
          <h3 className="text-base font-semibold text-white mb-1">
            {activeCategory !== 'All' ? `No ${activeCategory} habits scheduled` : 'No habits scheduled'}
          </h3>
          <p className="text-slate-500 text-sm">
            {activeCategory !== 'All' ? (
              <button onClick={() => setActiveCategory('All')} className="text-brand-400 hover:text-brand-300 transition-colors">Show all categories</button>
            ) : 'Nothing scheduled for this day.'}
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="habits-list" direction="vertical">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 gap-4"
              >
                {visible.map((h, index) => (
                  <Draggable key={h.id} draggableId={h.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={cn('relative', snapshot.isDragging && 'z-50 opacity-90 scale-[1.02]')}
                      >
                        {/* Drag handle */}
                        <div
                          {...dragProvided.dragHandleProps}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
                        >
                          <GripVertical size={14} />
                        </div>
                        <div className="pl-6">
                          <HabitCard habit={h}
                            onLogClick={hab => hab.type === 'boolean' ? logHabit(hab.id, 1) : setSelectedLog(hab)}
                            onEdit={setEditingHabit}
                            onDelete={deleteHabit}
                            canFreeze={!isToday && selectedDate < today && (!h.todayLog || h.todayLog.value === 0) && (userXP?.streakFreezes ?? 0) > 0}
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

      {selectedLog && <LogHabitModal habit={selectedLog} onClose={() => setSelectedLog(null)} />}
      {showTemplates && <TemplatesLibrary onClose={() => setShowTemplates(false)} />}

      {/* ── Calendar Month View ── */}
      <AnimatePresence mode="wait">
        {showView === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-2xl p-5 mt-2"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-base font-bold text-white">{format(calMonth, 'MMMM yyyy')}</h2>
              <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            {(() => {
              const start = startOfMonth(calMonth);
              const end = endOfMonth(calMonth);
              const days = eachDayOfInterval({ start, end });
              const startPad = getDay(start);
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              return (
                <div className="grid grid-cols-7 gap-1">
                  {/* leading padding */}
                  {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
                  {days.map(day => {
                    const ds = format(day, 'yyyy-MM-dd');
                    const dayHabits = habits.filter(h => !h.archived && habitService.isScheduledForDate(h, ds));
                    const dayDone = dayHabits.filter(h => {
                      // Check if there's a log for this date — use todayLog if same as today
                      if (ds === selectedDate) return !!h.todayLog && h.todayLog.value >= 1;
                      return false; // simplified: real log check needs separate query
                    }).length;
                    const isSelected = ds === selectedDate;
                    const isTodayDay = ds === todayStr;
                    const isFuture = ds > todayStr;
                    const allDone = dayHabits.length > 0 && dayDone === dayHabits.length;
                    return (
                      <button
                        key={ds}
                        onClick={() => { setSelectedDate(ds); setShowView('list'); }}
                        className={`relative flex flex-col items-center justify-center rounded-xl p-1.5 min-h-[44px] transition-all ${
                          isSelected ? 'ring-2 ring-brand-500 bg-brand-500/15' :
                          isTodayDay ? 'bg-white/8 font-bold' :
                          isFuture ? 'opacity-40 cursor-default' :
                          'hover:bg-white/5'
                        }`}
                        disabled={isFuture}
                      >
                        <span className={`text-xs font-semibold ${
                          isSelected ? 'text-brand-300' :
                          isTodayDay ? 'text-white' :
                          isFuture ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayHabits.length > 0 && !isFuture && (
                          <div className="flex gap-[2px] mt-0.5 flex-wrap justify-center max-w-[28px]">
                            {dayHabits.slice(0, 4).map((h, i) => (
                              <div key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: allDone ? '#10b981' : (h.color || 'var(--brand-500)'), opacity: isTodayDay ? 1 : 0.7 }}
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

            <p className="text-center text-xs text-slate-600 mt-3">Tap any past day to view &amp; log habits for that date</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
