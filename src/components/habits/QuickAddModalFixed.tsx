import { X, Plus, Flame, Check, Cloud, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import type { HabitType, HabitFrequency, Priority } from '../../types';
import { format, parseISO } from 'date-fns';
import { IconRenderer, HABIT_ICONS } from '../common/IconRenderer';
import { getHabitEmoji } from '../../lib/emoji';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { habitSchema } from '../../lib/validations';
import { DatePicker } from '../ui/date-picker';

const CATEGORIES = [
  { name: 'Health', icon: '🍎' },
  { name: 'Learning', icon: '📚' },
  { name: 'Work', icon: '💼' },
  { name: 'Personal', icon: '✨' },
  { name: 'Finance', icon: '💰' },
  { name: 'Other', icon: '🌈' },
];

interface Props {
  onClose: () => void;
}

/**
 * Uses native <dialog> + showModal() which renders in the browser's TOP LAYER.
 * Upgraded with premium Tailwind CSS and Framer Motion animations.
 */
export function QuickAddModalFixed({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [tab, setTab] = useState<'habit' | 'task'>('habit');

  // Habit form
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('Target');
  const [habitCategory, setHabitCategory] = useState('Health');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitTimeOfDay, setHabitTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('morning');
  const [stackAfterHabitId, setStackAfterHabitId] = useState<string>('');
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  const [healthMetric, setHealthMetric] = useState<
    'steps' | 'sleep' | 'water' | 'calories' | 'meditation'
  >('steps');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [taskPriority, setTaskPriority] = useState<Priority>(2);

  const habits = useHabitStore(s => s.habits);
  const addHabit = useHabitStore(s => s.addHabit);
  const addTask = useTaskStore(s => s.addTask);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Handle clicking the backdrop
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialogRef.current?.close();
    }
  }

  async function handleHabitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;
    const habitData = {
      name: habitName.trim(),
      icon: habitIcon,
      color: '#6366f1',
      category: habitCategory,
      type: habitType,
      frequency: habitFreq,
      timeOfDay: habitTimeOfDay,
      stackAfterHabitId: stackAfterHabitId || undefined,
      frequencyDays: habitFreq === 'weekly' ? [1, 2, 3, 4, 5] : undefined,
      targetValue: habitTarget,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      graceDayEnabled: false,
      archived: false,
      healthSyncEnabled,
      healthMetric: healthSyncEnabled ? healthMetric : undefined,
    };
    const result = habitSchema.safeParse(habitData);
    if (!result.success) {
      console.warn('Habit validation:', result.error.issues);
    }
    await addHabit(habitData);
    dialogRef.current?.close();
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addTask({
      title: taskTitle.trim(),
      priority: taskPriority,
      dueDate: taskDueDate,
      labels: [],
      recurring: 'none',
      completed: false,
    });
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="dark-overlay bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm fixed inset-0 flex items-end md:items-center justify-center open:animate-in open:fade-in duration-300 z-[9999]"
    >
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[512px] md:mx-4 bg-neutral-900 border-t md:border border-white/10 shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Create New</h2>
            <p className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              What's your next move?
            </p>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Animated Tabs */}
        <div className="relative px-8 mb-6 z-10">
          <div className="flex p-1.5 bg-slate-950/50 rounded-2xl border border-white/5">
            {(['habit', 'task'] as const).map(t => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative flex-1 py-3 text-sm font-bold transition-colors z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="quickAddTab"
                      className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center justify-center gap-2">
                    {t === 'habit' ? (
                      <Flame size={16} className={isActive ? 'text-brand-400' : ''} />
                    ) : (
                      <Check size={16} className={isActive ? 'text-emerald-400' : ''} />
                    )}
                    {t === 'habit' ? 'Build Habit' : 'Add Task'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Forms Container */}
        <div className="relative px-8 pb-8 z-10 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            {tab === 'habit' ? (
              <motion.form
                key="habit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleHabitSubmit}
                className="space-y-6"
              >
                {/* 3D Glass Icon Picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                      Icon
                    </label>
                  </div>
                  <div className="grid grid-cols-7 gap-2 bg-neutral-950/60 rounded-xl p-3 border border-white/10 max-h-48 overflow-y-auto">
                    {HABIT_ICONS.map(item => {
                      const isActive = habitIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          title={item.label}
                          onClick={() => setHabitIcon(item.name)}
                          className={cn(
                            'relative p-2 rounded-lg flex items-center justify-center text-lg transition-colors cursor-pointer',
                            isActive
                              ? 'ring-2 ring-white/40 bg-white/15'
                              : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                          )}
                        >
                          <span>{getHabitEmoji(item.name)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Picker */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => {
                      const isActive = habitCategory === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setHabitCategory(c.name)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                            isActive
                              ? 'bg-white/15 border-white/30 text-white'
                              : 'bg-neutral-950/40 border-white/10 text-neutral-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="text-sm">{c.icon}</span>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2 block">
                      Habit Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-lg">
                        {getHabitEmoji(habitIcon)}
                      </div>
                      <input
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white placeholder-slate-600 text-base font-medium outline-none focus:border-emerald-500/50 focus:bg-slate-950/60 transition-all shadow-inner"
                        placeholder="e.g. Read 20 pages"
                        value={habitName}
                        onChange={e => setHabitName(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                        Type
                      </label>
                      <select
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                        value={habitType}
                        onChange={e => setHabitType(e.target.value as HabitType)}
                      >
                        <option value="boolean" className="bg-slate-900">
                          Yes / No
                        </option>
                        <option value="count" className="bg-slate-900">
                          Count (reps, pages…)
                        </option>
                        <option value="duration" className="bg-slate-900">
                          Duration (min)
                        </option>
                        <option value="rating" className="bg-slate-900">
                          Rating (1-5)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                        Frequency
                      </label>
                      <select
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                        value={habitFreq}
                        onChange={e => setHabitFreq(e.target.value as HabitFrequency)}
                      >
                        <option value="daily" className="bg-slate-900">
                          Every day
                        </option>
                        <option value="weekly" className="bg-slate-900">
                          Specific days
                        </option>
                      </select>
                    </div>
                  </div>

                  {habitType !== 'boolean' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block mt-1">
                        Daily Target
                      </label>
                      <input
                        type="number"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-brand-300 text-lg font-bold outline-none focus:border-brand-500/50 transition-all shadow-inner"
                        value={habitTarget}
                        min={1}
                        onChange={e => setHabitTarget(Number(e.target.value))}
                      />
                    </motion.div>
                  )}

                  {/* Health Sync Toggle */}
                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setHealthSyncEnabled(!healthSyncEnabled)}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Cloud size={16} className="text-brand-400" />
                          Health Sync (Auto-Complete)
                        </h4>
                        <p className="text-xs text-slate-300 mt-1">
                          Automatically sync progress from Google Fit or Apple Health.
                        </p>
                      </div>
                      <div
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${healthSyncEnabled ? 'bg-brand-500' : 'bg-slate-800'}`}
                      >
                        <motion.div
                          layout
                          className="w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: healthSyncEnabled ? 24 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {healthSyncEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-white/5 mt-1"
                        >
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                            Sync Metric
                          </label>
                          <select
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                            value={healthMetric}
                            onChange={e => setHealthMetric(e.target.value as any)}
                          >
                            <option value="steps">Steps (Google Fit / Health)</option>
                            <option value="sleep">Sleep Duration (hrs)</option>
                            <option value="water">Water Intake (ml)</option>
                            <option value="calories">Active Calories (kcal)</option>
                            <option value="meditation">Mindful Minutes</option>
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ritual Window */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                      Ritual Window
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'morning', label: 'Morning', icon: '🌅' },
                        { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
                        { id: 'evening', label: 'Evening', icon: '🌙' },
                        { id: 'anytime', label: 'Anytime', icon: '✨' },
                      ].map(slot => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setHabitTimeOfDay(slot.id as any)}
                          className={cn(
                            'py-2.5 px-1.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer',
                            habitTimeOfDay === slot.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-inner'
                              : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          <span className="text-base">{slot.icon}</span>
                          <span className="text-xs font-bold">{slot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Atomic Habit Stacking (James Clear Protocol) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.03] border border-teal-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-teal-400 fill-teal-400/30" />
                        <span className="text-xs font-bold text-white tracking-wide">Atomic Habit Stacking</span>
                      </div>
                      <span className="text-xs font-mono text-teal-300 bg-teal-500/15 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                        James Clear
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Stack this ritual immediately after an anchor habit to ignite a kinetic synaptic laser spark when the anchor finishes.
                    </p>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 block">
                        Anchor Habit:
                      </label>
                      <select
                        value={stackAfterHabitId}
                        onChange={e => setStackAfterHabitId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-400/50 focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Independent Ritual)</option>
                        {habits
                          .filter(h => !h.archived)
                          .map(h => (
                            <option key={h.id} value={h.id}>
                              {getHabitEmoji(h.icon)} {h.name} ({h.category})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Flame size={16} />
                  Create Habit
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="task"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleTaskSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                    Task Title
                  </label>
                  <input
                    className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-base font-medium outline-none focus:border-emerald-500/50 focus:bg-slate-950/60 transition-all shadow-inner"
                    placeholder="e.g. Project presentation"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                      Due Date
                    </label>
                    <DatePicker
                      date={taskDueDate ? parseISO(taskDueDate) : undefined}
                      onDateChange={(d) => setTaskDueDate(d ? format(d, 'yyyy-MM-dd') : '')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 block">
                      Priority
                    </label>
                    <select
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                      value={taskPriority}
                      onChange={e => setTaskPriority(Number(e.target.value) as Priority)}
                    >
                      <option value={0} className="bg-slate-900">
                        Urgent 🔴
                      </option>
                      <option value={1} className="bg-slate-900">
                        High 🟠
                      </option>
                      <option value={2} className="bg-slate-900">
                        Normal 🔵
                      </option>
                      <option value={3} className="bg-slate-900">
                        Low ⚪
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="group relative w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all overflow-hidden border border-white/10"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Plus
                      size={20}
                      className="group-hover:rotate-90 transition-transform duration-300"
                    />
                    Add Task
                  </span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </dialog>
  );
}
