import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Archive, Trash2, Edit2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import type { HabitWithStreak, HabitType, HabitFrequency } from '../types';
import { format } from 'date-fns';
import { habitSchema } from '../lib/validations';
import { LogHabitModal } from '../components/habits/LogHabitModal';
import { cn } from '../lib/utils';
import { IconRenderer, HABIT_ICONS } from '../components/common/IconRenderer';

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
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (d: number) => setFreqDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const parsed = habitSchema.safeParse({ name: name.trim(), icon, color, category, type, frequency: freq, frequencyDays: freq === 'weekly' ? freqDays : undefined, targetValue: target, startDate: initialHabit?.startDate ?? format(new Date(), 'yyyy-MM-dd'), graceDayEnabled: grace, archived: initialHabit?.archived ?? false });
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

function HabitCard({ habit, onLogClick, onEdit, onDelete }: { habit: HabitWithStreak; onLogClick: (h: HabitWithStreak) => void; onEdit: (h: HabitWithStreak) => void; onDelete: (id: string) => void }) {
  const { archiveHabit } = useHabitStore();
  const [showDetails, setShowDetails] = useState(false);
  const done = !!habit.todayLog && habit.todayLog.value >= (habit.type === 'boolean' ? 1 : habit.targetValue);
  const pct = habit.type !== 'boolean' && habit.todayLog ? Math.min((habit.todayLog.value / habit.targetValue) * 100, 100) : done ? 100 : 0;
  const c = habit.color || '#6366f1';

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
              ? { background: 'linear-gradient(135deg, #10b981, #06b6d4)', borderColor: 'transparent', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }
              : { borderColor: `${c}60`, background: `${c}10` }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center">
              {done ? '✓' : <IconRenderer name={habit.icon} size={20} color={done ? '#fff' : c} />}
            </div>
          </motion.button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold text-sm truncate', done ? 'line-through text-slate-500' : 'text-white')}>{habit.name}</p>
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

        {/* Expanded details */}
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
                  <button onClick={() => onEdit(habit)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors">
                    <Edit2 size={11} /> Edit
                  </button>
                  <button onClick={() => archiveHabit(habit.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors">
                    <Archive size={11} /> Archive
                  </button>
                  <button onClick={() => { if (confirm('Delete this habit and all its history?')) onDelete(habit.id); }}
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

export function HabitsPage() {
  const { habits, loading, loadHabits, logHabit, deleteHabit } = useHabitStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | null>(null);
  const [selectedLog, setSelectedLog] = useState<HabitWithStreak | null>(null);

  useEffect(() => { loadHabits(); }, [loadHabits]);

  const scheduled = habits.filter(h => {
    if (h.archived) return false;
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekly') return (h.frequencyDays ?? []).includes(new Date().getDay());
    return true;
  });
  const done = scheduled.filter(h => !!h.todayLog && h.todayLog.value >= 1).length;
  const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">Habit Tracker</p>
          <h1 className="text-3xl font-bold text-white">My Habits</h1>
          <p className="text-slate-400 text-sm mt-1">
            {done}/{scheduled.length} habits done today
            {pct >= 80 ? ' \u2014 You\u2019re on fire! \uD83D\uDD25' : pct >= 50 ? ' \u2014 Keep pushing! \uD83D\uDCAA' : ' \u2014 Let\u2019s get started! \uD83C\uDF31'}
          </p>
        </div>
        <motion.button onClick={() => setShowAdd(v => !v)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 24px rgba(var(--brand-500-rgb),0.35)' }}>
          <Plus size={16} /> Add Habit
        </motion.button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today', value: `${done}/${scheduled.length}`, sub: 'habits done', color: '#818cf8', icon: '✅' },
          { label: 'Best Streak', value: `${bestStreak}d`, sub: 'all time', color: '#f59e0b', icon: '🏆' },
          { label: 'Completion', value: `${pct}%`, sub: 'today', color: '#10b981', icon: '📈' },
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

      {/* Add form */}
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

      {/* Habit grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading habits…</div>
      ) : habits.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🌱</span>
          <h3 className="text-lg font-semibold text-white mb-2">No habits yet</h3>
          <p className="text-slate-400 text-sm max-w-xs mb-5">Add your first habit and start building a powerful daily routine.</p>
          <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}>
            + Add your first habit
          </button>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          <AnimatePresence mode="popLayout">
            {scheduled.map(h => (
              <HabitCard key={h.id} habit={h}
                onLogClick={hab => hab.type === 'boolean' ? logHabit(hab.id, 1) : setSelectedLog(hab)}
                onEdit={setEditingHabit}
                onDelete={deleteHabit}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {selectedLog && <LogHabitModal habit={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
