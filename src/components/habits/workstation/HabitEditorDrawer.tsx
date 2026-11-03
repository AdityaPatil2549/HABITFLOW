import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Layers, Clock, Hash, CheckSquare } from 'lucide-react';
import type { Habit, HabitType, HabitFrequency, HabitWithStreak } from '../../../types';
import { soundService } from '../../../services/soundService';
import { cn } from '../../../lib/utils';
import { getHabitEmoji } from '../../../lib/emoji';
import { GlassEmojiCapsule } from '../../common/GlassEmojiCapsule';

export interface HabitEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'order'>, habitId?: string) => Promise<void>;
  initialHabit?: HabitWithStreak | null;
}

const CATEGORIES = [
  'Health',
  'Learning',
  'Work',
  'Personal',
  'Finance',
  'Mindfulness',
  'Fitness',
  'Other',
];

const PRESET_ICONS = ['💧', '🏃', '📚', '🧘', '💻', '🍎', '✍️', '⚡', '🎯', '🌿', '💤', '🧠'];

export function HabitEditorDrawer({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}: HabitEditorDrawerProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [category, setCategory] = useState('Health');
  const [type, setType] = useState<HabitType>('boolean');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name);
      setIcon(getHabitEmoji(initialHabit.icon));
      setCategory(initialHabit.category || 'Health');
      setType(initialHabit.type || 'boolean');
      setFrequency(initialHabit.frequency || 'daily');
      setTargetValue(initialHabit.targetValue || 1);
      setUnit(initialHabit.unit || '');
    } else {
      setName('');
      setIcon('🎯');
      setCategory('Health');
      setType('boolean');
      setFrequency('daily');
      setTargetValue(1);
      setUnit('');
    }
  }, [initialHabit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          icon,
          color: '#10b981',
          category,
          type,
          frequency,
          targetValue: type === 'boolean' ? 1 : Math.max(1, targetValue),
          unit: type === 'boolean' ? undefined : unit.trim(),
          startDate: initialHabit?.startDate || new Date().toISOString().split('T')[0],
          graceDayEnabled: true,
          archived: initialHabit?.archived || false,
        },
        initialHabit?.id
      );
      soundService.playTick();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Slide-over Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-md h-full bg-[#0d1017] border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <h2 className="text-base font-semibold text-white">
              {initialHabit ? 'Edit Habit' : 'New Habit'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form id="habit-form" onSubmit={handleSubmit} className="space-y-5 mt-5">
            {/* Habit Name */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Habit Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Read 20 pages, Morning meditation..."
                required
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map(i => (
                  <GlassEmojiCapsule
                    key={i}
                    icon={i}
                    category={category}
                    size="sm"
                    isDone={icon === i}
                    interactive={true}
                    onClick={() => setIcon(i)}
                  />
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                      category === cat
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.05]'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Habit Type (Boolean, Count, Duration) */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Tracking Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'boolean', label: 'Done / Not Done', icon: CheckSquare },
                  { id: 'count', label: 'Count Target', icon: Hash },
                  { id: 'duration', label: 'Duration Target', icon: Clock },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as HabitType)}
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer',
                        type === item.id
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Value & Unit if Count/Duration */}
            {type !== 'boolean' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={e => setTargetValue(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. pages, mins, cups"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="habit-form"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {initialHabit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default HabitEditorDrawer;
