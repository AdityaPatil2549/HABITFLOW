import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Star } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import type { HabitWithStreak } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent } from '../ui/morphing-popover';

interface Props {
  habit: HabitWithStreak | null;
  onClose: () => void;
}

export function LogHabitModal({ habit, onClose }: Props) {
  const logHabit = useHabitStore(s => s.logHabit);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // default to whatever was logged today, or the target value, or 1
  const initialValue =
    habit?.todayLog?.value ?? (habit?.type === 'boolean' ? 1 : habit?.targetValue) ?? 1;
  const [val, setVal] = useState<number>(initialValue);
  const [note, setNote] = useState<string>(habit?.todayLog?.note ?? '');

  // Update val if habit changes
  useEffect(() => {
    if (habit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVal(habit.todayLog?.value ?? (habit.type === 'boolean' ? 1 : habit.targetValue));
      setNote(habit.todayLog?.note ?? '');
    }
  }, [habit]);

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

  if (!habit) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!habit) return;
    await logHabit(habit.id, val, note);
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="dark-overlay bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm fixed inset-0 flex items-center justify-center open:animate-in open:fade-in duration-300 z-[9999]"
    >
      <AnimatePresence>
        <motion.div
          className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl mx-4 modal-glow"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => dialogRef.current?.close()}
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
            ) : habit.type === 'rating' ? (
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block text-center">
                  Rate your session
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setVal(star)}
                      className={`p-2 transition-transform active:scale-90 ${val >= star ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-600'}`}
                    >
                      <Star size={32} fill={val >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Log your amount
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="input text-lg font-bold text-center flex-1"
                    value={val}
                    onChange={e => setVal(Number(e.target.value))}
                    min={0}
                    autoFocus
                  />
                  {(habit.type === 'duration' || habit.unit) && (
                    <span className="text-slate-400 font-medium">
                      {habit.unit || (habit.type === 'duration' ? 'min' : '')}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-start">
              <MorphingPopover>
                <MorphingPopoverTrigger className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-brand-400/10 transition-colors">
                  <Plus size={14} /> {note ? 'Edit Note' : 'Add Note'}
                </MorphingPopoverTrigger>
                <MorphingPopoverContent className="w-64 p-3 flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Note (Optional)</label>
                  <textarea
                    className="input w-full min-h-24 resize-none text-sm"
                    placeholder="How did it go? (e.g. Felt great today!)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    autoFocus
                  />
                </MorphingPopoverContent>
              </MorphingPopover>
            </div>

            <button type="submit" aria-label="Save habit log" className="btn-primary w-full py-2.5">
              <Check size={18} /> Save Log
            </button>
          </form>
        </motion.div>
      </AnimatePresence>
    </dialog>
  );
}
