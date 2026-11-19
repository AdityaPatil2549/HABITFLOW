import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Hash, CheckSquare, Zap } from 'lucide-react';
import type { Habit, HabitType, HabitFrequency, HabitWithStreak } from '../../../types';
import { soundService } from '../../../services/soundService';
import { useHabitStore } from '../../../store/habitStore';
import { cn } from '../../../lib/utils';
import { getHabitEmoji } from '../../../lib/emoji';
import { IconPicker } from '../IconPicker';

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

const COLOR_PRESETS = [
  '#22C55E', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Cobalt
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EF6443', // Ember
  '#F43F5E', // Rose
  '#EC4899', // Pink
];

export function HabitEditorDrawer(props: HabitEditorDrawerProps) {
  if (!props.isOpen) return null;
  return <HabitEditorDrawerInner key={props.initialHabit?.id ?? 'new'} {...props} />;
}

function HabitEditorDrawerInner({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}: HabitEditorDrawerProps) {
  const { habits } = useHabitStore();
  const [name, setName] = useState(() => initialHabit?.name ?? '');
  const [icon, setIcon] = useState(() => initialHabit?.icon || 'Target');
  const [color, setColor] = useState(() => initialHabit?.color || '#22C55E');
  const [category, setCategory] = useState(() => initialHabit?.category || 'Health');
  const [type, setType] = useState<HabitType>(() => initialHabit?.type || 'boolean');
  const [frequency] = useState<HabitFrequency>(() => initialHabit?.frequency || 'daily');
  const [targetValue, setTargetValue] = useState(() => initialHabit?.targetValue || 1);
  const [unit, setUnit] = useState(() => initialHabit?.unit || '');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>(
    () => initialHabit?.timeOfDay || 'morning'
  );
  const [stackAfterHabitId, setStackAfterHabitId] = useState<string>(
    () => initialHabit?.stackAfterHabitId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

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
          color: color || '#22C55E',
          category,
          type,
          frequency,
          timeOfDay,
          stackAfterHabitId: stackAfterHabitId || undefined,
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
        transition={{ duration: 0.14 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />

      {/* Slide-over Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="relative w-full max-w-md h-full bg-[var(--sf-raised)] border-l border-[var(--border-strong)] shadow-2xl p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col justify-between overflow-y-auto z-10"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
            <h2 className="text-base font-semibold text-[var(--tx-primary)]">
              {initialHabit ? 'Edit Habit' : 'New Habit'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close habit editor"
              className="p-1 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form id="habit-form" onSubmit={handleSubmit} className="space-y-5 mt-5">
            {/* Habit Name */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
                Habit Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Read 20 pages, Morning meditation..."
                required
                className="input"
              />
            </div>

            {/* Icon Gallery Picker */}
            <IconPicker
              value={icon}
              onChange={setIcon}
              color={color}
              label="Habit Icon"
            />

            {/* Accent Color Swatch Selector */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map(c => {
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Select color ${c}`}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border transition-all duration-150 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: c,
                        borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: isSelected ? `0 0 10px 1px ${c}80` : undefined,
                        transform: isSelected ? 'scale(1.15)' : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
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
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/35'
                        : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] border border-[var(--border-default)]'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Habit Type (Boolean, Count, Duration) */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
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
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)]/40 text-[var(--accent-ink)]'
                          : 'bg-[var(--sf-overlay)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
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
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)]">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--tx-muted)] mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={e => setTargetValue(parseInt(e.target.value, 10) || 1)}
                    className="input px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--tx-muted)] mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. pages, mins, cups"
                    className="input px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Ritual Window */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
                Ritual Window
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  { id: 'morning', label: 'Morning', icon: '🌅' },
                  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
                  { id: 'evening', label: 'Evening', icon: '🌙' },
                  { id: 'anytime', label: 'Anytime', icon: '✨' },
                ] as const).map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setTimeOfDay(slot.id)}
                    className={cn(
                      'py-2 px-1.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer',
                      timeOfDay === slot.id
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent)]/40 text-[var(--accent-ink)]'
                        : 'bg-[var(--sf-overlay)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                    )}
                  >
                    <span className="text-sm">{slot.icon}</span>
                    <span className="text-[10px] font-medium">{slot.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Atomic Habit Stacking */}
            <div className="p-3.5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[var(--accent-ink)]" />
                  <span className="text-xs font-bold text-[var(--tx-primary)] tracking-wide">Atomic Habit Stacking</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--accent-ink)] bg-[var(--sf-raised)] px-2 py-0.5 rounded-full border border-[var(--accent)]/30">
                  Chain Link
                </span>
              </div>
              <p className="text-[11px] text-[var(--tx-secondary)] leading-relaxed">
                Stack this ritual immediately after an anchor habit so it primes right when the anchor finishes.
              </p>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--tx-muted)] mb-1">
                  Anchor Habit (Trigger):
                </label>
                <select
                  value={stackAfterHabitId}
                  onChange={e => setStackAfterHabitId(e.target.value)}
                  className="input px-3 py-2 text-xs cursor-pointer"
                >
                  <option value="">None (Independent Ritual)</option>
                  {habits
                    .filter(h => !h.archived && h.id !== initialHabit?.id)
                    .map(h => (
                      <option key={h.id} value={h.id}>
                        {getHabitEmoji(h.icon)} {h.name} ({h.category || 'Ritual'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="habit-form"
            disabled={isSubmitting || !name.trim()}
            className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {initialHabit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default HabitEditorDrawer;
