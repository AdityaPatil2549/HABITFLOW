import { X, Plus, Flame, Check, Cloud, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import type { Habit, HabitType, HabitFrequency, Priority } from '../../types';
import { format, parseISO } from 'date-fns';
import { HABIT_ICONS } from '../common/IconRenderer';
import { getHabitEmoji } from '../../lib/emoji';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
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

type TimeOfDay = NonNullable<Habit['timeOfDay']>;
type HealthMetric = NonNullable<Habit['healthMetric']>;

interface Props {
  onClose: () => void;
}

export function QuickAddModalFixed({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [tab, setTab] = useState<'habit' | 'task'>('habit');

  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('Target');
  const [habitCategory, setHabitCategory] = useState('Health');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitTimeOfDay, setHabitTimeOfDay] = useState<TimeOfDay>('morning');
  const [stackAfterHabitId, setStackAfterHabitId] = useState<string>('');
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  const [healthMetric, setHealthMetric] = useState<HealthMetric>('steps');

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
      color: '#EF6443',
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
      className="bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-black/75 fixed inset-0 flex items-end md:items-center justify-center z-[9999]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[512px] md:mx-4 bg-[var(--sf-raised)] border-t md:border border-[var(--border-strong)] rounded-t-2xl md:rounded-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[var(--border-default)]">
          <div>
            <p className="font-label-caps">Quick Entry</p>
            <h2 className="font-h2 text-[var(--tx-primary)] mt-0.5">Create New</h2>
          </div>
          <button
            type="button"
            aria-label="Close quick entry modal"
            onClick={() => dialogRef.current?.close()}
            className="w-9 h-9 rounded-lg bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-[var(--sf-overlay)] rounded-xl border border-[var(--border-default)]">
            {(['habit', 'task'] as const).map(t => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer',
                    isActive
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                  )}
                >
                  {t === 'habit' ? <Flame size={14} /> : <Check size={14} />}
                  <span>{t === 'habit' ? 'Build Habit' : 'Add Task'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Forms Container */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {tab === 'habit' ? (
            <form onSubmit={handleHabitSubmit} className="space-y-5">
              {/* Icon Picker */}
              <div>
                <label className="font-label-caps mb-2 block">Icon</label>
                <div className="grid grid-cols-7 gap-1.5 bg-[var(--sf-base)] rounded-xl p-2.5 border border-[var(--border-default)] max-h-40 overflow-y-auto">
                  {HABIT_ICONS.map(item => {
                    const isActive = habitIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        title={item.label}
                        aria-label={`Select icon ${item.label}`}
                        onClick={() => setHabitIcon(item.name)}
                        className={cn(
                          'p-2 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer border',
                          isActive
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)]'
                            : 'border-transparent hover:bg-[var(--sf-overlay)]'
                        )}
                      >
                        <span>{getHabitEmoji(item.name)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="font-label-caps mb-2 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => {
                    const isActive = habitCategory === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setHabitCategory(c.name)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer',
                          isActive
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                            : 'bg-[var(--sf-overlay)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                        )}
                      >
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Habit Name */}
              <div>
                <label className="font-label-caps mb-2 block">Habit Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-lg">
                    {getHabitEmoji(habitIcon)}
                  </div>
                  <input
                    className="input w-full pl-12 pr-4 py-3 text-sm font-medium"
                    placeholder="e.g. Read 20 pages"
                    value={habitName}
                    onChange={e => setHabitName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Type & Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps mb-2 block">Type</label>
                  <select
                    className="input w-full cursor-pointer"
                    value={habitType}
                    onChange={e => setHabitType(e.target.value as HabitType)}
                  >
                    <option value="boolean">Yes / No</option>
                    <option value="count">Count (reps, pages…)</option>
                    <option value="duration">Duration (min)</option>
                    <option value="rating">Rating (1-5)</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-caps mb-2 block">Frequency</label>
                  <select
                    className="input w-full cursor-pointer"
                    value={habitFreq}
                    onChange={e => setHabitFreq(e.target.value as HabitFrequency)}
                  >
                    <option value="daily">Every day</option>
                    <option value="weekly">Specific days</option>
                  </select>
                </div>
              </div>

              {habitType !== 'boolean' && (
                <div>
                  <label className="font-label-caps mb-2 block">Daily Target</label>
                  <input
                    type="number"
                    className="input w-full font-data font-bold"
                    value={habitTarget}
                    min={1}
                    onChange={e => setHabitTarget(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Health Sync Toggle */}
              <div className="bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl p-3.5 space-y-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={healthSyncEnabled}
                  onClick={() => setHealthSyncEnabled(!healthSyncEnabled)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-[var(--tx-primary)] flex items-center gap-1.5">
                      <Cloud size={14} className="text-[var(--accent-ink)]" />
                      Health Sync (Auto-Complete)
                    </p>
                    <p className="text-[11px] text-[var(--tx-secondary)] mt-0.5">
                      Sync progress from Google Fit when enabled.
                    </p>
                  </div>
                  <span
                    className={cn(
                      'w-10 h-5 rounded-full transition-colors p-0.5 flex items-center shrink-0',
                      healthSyncEnabled
                        ? 'bg-[var(--accent)] justify-end'
                        : 'bg-[var(--sf-dim)] justify-start'
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-[var(--sf-raised)] border border-[var(--border-default)]" />
                  </span>
                </button>

                {healthSyncEnabled && (
                  <div className="pt-2 border-t border-[var(--border-default)]">
                    <label className="font-label-caps mb-1.5 block">Sync Metric</label>
                    <select
                      className="input w-full text-xs cursor-pointer"
                      value={healthMetric}
                      onChange={e => setHealthMetric(e.target.value as HealthMetric)}
                    >
                      <option value="steps">Steps (Google Fit)</option>
                      <option value="sleep">Sleep Duration (hrs)</option>
                      <option value="water">Water Intake (ml)</option>
                      <option value="calories">Active Calories (kcal)</option>
                      <option value="meditation">Mindful Minutes</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Ritual Window */}
              <div>
                <label className="font-label-caps mb-2 block">Ritual Window</label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'morning', label: 'Morning', icon: '🌅' },
                      { id: 'afternoon', label: 'Midday', icon: '☀️' },
                      { id: 'evening', label: 'Evening', icon: '🌙' },
                      { id: 'anytime', label: 'Anytime', icon: '📌' },
                    ] as const
                  ).map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setHabitTimeOfDay(slot.id)}
                      className={cn(
                        'py-2 px-1.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-colors cursor-pointer',
                        habitTimeOfDay === slot.id
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--tx-primary)]'
                          : 'bg-[var(--sf-overlay)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                      )}
                    >
                      <span className="text-sm">{slot.icon}</span>
                      <span className="text-[11px] font-semibold">{slot.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Atomic Habit Stacking */}
              <div className="p-3.5 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] space-y-2">
                <div className="flex items-center gap-1.5">
                  <Zap size={13} className="text-[var(--accent-ink)]" />
                  <span className="text-xs font-semibold text-[var(--tx-primary)]">
                    Habit Stacking Anchor
                  </span>
                </div>
                <select
                  value={stackAfterHabitId}
                  onChange={e => setStackAfterHabitId(e.target.value)}
                  aria-label="Select anchor habit"
                  className="input w-full text-xs cursor-pointer"
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

              <button
                type="submit"
                className="w-full py-3 rounded-xl btn-primary text-sm flex items-center justify-center gap-2"
              >
                <Flame size={15} />
                <span>Create Habit</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleTaskSubmit} className="space-y-5">
              <div>
                <label className="font-label-caps mb-2 block">Task Title</label>
                <input
                  className="input w-full py-3"
                  placeholder="e.g. Review weekly targets"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps mb-2 block">Due Date</label>
                  <DatePicker
                    date={taskDueDate ? parseISO(taskDueDate) : undefined}
                    onDateChange={d => setTaskDueDate(d ? format(d, 'yyyy-MM-dd') : '')}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="font-label-caps mb-2 block">Priority</label>
                  <select
                    className="input w-full cursor-pointer"
                    value={taskPriority}
                    onChange={e => setTaskPriority(Number(e.target.value) as Priority)}
                  >
                    <option value={0}>Urgent</option>
                    <option value={1}>High</option>
                    <option value={2}>Normal</option>
                    <option value={3}>Low</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl btn-primary text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Add Task</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </dialog>
  );
}
