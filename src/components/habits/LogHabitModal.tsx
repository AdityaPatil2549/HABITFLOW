import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import type { HabitWithStreak } from '../../types';
import { IconRenderer } from '../common/IconRenderer';

interface Props {
  habit: HabitWithStreak | null;
  onClose: () => void;
}

export function LogHabitModal({ habit, onClose }: Props) {
  const logHabit = useHabitStore(s => s.logHabit);

  // default to whatever was logged today, or the target value, or 1
  const initialValue =
    habit?.todayLog?.value ?? (habit?.type === 'boolean' ? 1 : habit?.targetValue) ?? 1;
  const [val, setVal] = useState<number>(initialValue);

  // Update val if habit changes
  useEffect(() => {
    if (habit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVal(habit.todayLog?.value ?? (habit.type === 'boolean' ? 1 : habit.targetValue));
    }
  }, [habit]);

  if (!habit) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!habit) return;
    await logHabit(habit.id, val);
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
        >
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-overlay)] text-brand-400">
              <IconRenderer name={habit.icon} size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">{habit.name}</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Target: {habit.targetValue} {habit.type !== 'boolean' && habit.type}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {habit.type === 'boolean' ? (
              <p className="text-sm text-[var(--text-secondary)]">Did you complete this today?</p>
            ) : (
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Log your amount
                </label>
                <input
                  type="number"
                  className="input text-lg font-bold text-center"
                  value={val}
                  onChange={e => setVal(Number(e.target.value))}
                  min={0}
                  autoFocus
                />
              </div>
            )}

            <button type="submit" aria-label="Save habit log" className="btn-primary w-full py-2.5">
              <Check size={18} /> Save Log
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
