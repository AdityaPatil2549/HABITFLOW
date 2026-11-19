import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Sparkles, ChevronDown, Check, Shapes, Smile } from 'lucide-react';
import {
  HABIT_ICON_CATEGORIES,
  LUCIDE_HABIT_ICONS,
  HABIT_ICONS,
  filterLucideIcons,
  filterEmojiIcons,
  type HabitIconCategory,
} from '../common/habitIcons';
import { IconRenderer } from '../common/IconRenderer';
import { isEmojiIcon, isIconifyId } from '../common/iconUtils';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
  className?: string;
  label?: string;
}

type PickerMode = 'lucide' | 'emoji';

const QUICK_LUCIDE_ANCHORS = [
  'Dumbbell',
  'Droplets',
  'BookOpen',
  'Brain',
  'Code',
  'Rocket',
  'Target',
  'Coins',
];

const QUICK_EMOJI_ANCHORS = ['💧', '🏃', '📚', '🧘', '💻', '⚡', '🎯', '💰'];

export function IconPicker({
  value,
  onChange,
  color,
  className,
  label = 'Habit Icon',
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userModeOverride, setUserModeOverride] = useState<PickerMode | null>(null);
  const mode: PickerMode = userModeOverride ?? (isEmojiIcon(value) ? 'emoji' : 'lucide');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HabitIconCategory | 'all'>('all');
  const [customInput, setCustomInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Filtered items based on active mode
  const filteredLucideIcons = useMemo(() => {
    return filterLucideIcons(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const filteredEmojiIcons = useMemo(() => {
    return filterEmojiIcons(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const activeCount = mode === 'lucide' ? filteredLucideIcons.length : filteredEmojiIcons.length;

  // Selected icon label metadata
  const selectedMeta = useMemo(() => {
    if (mode === 'lucide') {
      const found = LUCIDE_HABIT_ICONS.find(i => i.name.toLowerCase() === value.toLowerCase());
      if (found) return found;
    }
    const foundEmoji = HABIT_ICONS.find(i => i.name === value);
    if (foundEmoji) return foundEmoji;
    return {
      name: value,
      label: isIconifyId(value) ? 'Iconify Vector' : isEmojiIcon(value) ? 'Custom Emoji' : 'Custom Vector',
      category: 'custom' as const,
      keywords: [],
    };
  }, [value, mode]);

  const handleSelect = (iconName: string) => {
    soundService.playTick();
    setUserModeOverride(null);
    onChange(iconName);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    soundService.playTick();
    setUserModeOverride(null);
    onChange(trimmed);
    setCustomInput('');
    setIsOpen(false);
  };

  const activeTint = color || '#22C55E';

  return (
    <div ref={containerRef} className={cn('relative space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-label-caps block text-xs font-semibold text-[var(--tx-secondary)]">
            {label}
          </label>
          <span className="text-[11px] font-mono text-[var(--tx-muted)]">
            {mode === 'lucide' ? 'Lucide Vector' : 'Unicode 3D'}
          </span>
        </div>
      )}

      {/* ── Main Selector Trigger ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            'flex-1 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer',
            'bg-[var(--sf-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-primary)]',
            isOpen && 'ring-2 ring-[var(--accent)] border-[var(--accent)]'
          )}
          style={{
            borderColor: isOpen ? activeTint : undefined,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Live Avatar Preview */}
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200"
              style={{
                backgroundColor: `${activeTint}18`,
                borderColor: `${activeTint}45`,
                boxShadow: `0 0 12px -2px ${activeTint}35`,
              }}
            >
              <IconRenderer name={value} color={activeTint} size={18} />
            </div>

            <div className="text-left min-w-0">
              <div className="text-sm font-semibold truncate leading-tight">
                {selectedMeta.label || value}
              </div>
              <div className="text-[10px] text-[var(--tx-muted)] truncate font-mono mt-0.5">
                {isIconifyId(value)
                  ? `Iconify: ${value}`
                  : mode === 'lucide'
                    ? `Vector: ${value}`
                    : `Emoji: ${value}`}
              </div>
            </div>
          </div>

          <ChevronDown
            size={16}
            className={cn('text-[var(--tx-muted)] transition-transform duration-200 shrink-0', isOpen && 'rotate-180')}
          />
        </button>
      </div>

      {/* ── Quick Anchor Row ── */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--tx-muted)] mr-1 shrink-0">
          Quick
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(mode === 'lucide' ? QUICK_LUCIDE_ANCHORS : QUICK_EMOJI_ANCHORS).map(anchor => {
            const isSelected = value.toLowerCase() === anchor.toLowerCase();
            return (
              <button
                key={anchor}
                type="button"
                onClick={() => handleSelect(anchor)}
                aria-label={`Select ${anchor}`}
                className={cn(
                  'w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-110 active:scale-95',
                  isSelected
                    ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                    : 'bg-[var(--sf-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${activeTint}22`,
                        borderColor: activeTint,
                      }
                    : undefined
                }
              >
                <IconRenderer name={anchor} color={isSelected ? activeTint : 'var(--tx-primary)'} size={15} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Expandable Modal / Popover ── */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 z-50 mt-1.5 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-xl',
            'bg-[var(--sf-overlay)]/95 border-[var(--border-strong)] animate-in fade-in zoom-in-95 duration-150'
          )}
          style={{
            maxHeight: '440px',
            boxShadow: `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px ${activeTint}30`,
          }}
        >
          {/* Header: Mode Segmented Switch + Close Button */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-default)]">
            {/* Segmented Control */}
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--sf-raised)] border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setUserModeOverride('lucide')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  mode === 'lucide'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm'
                    : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                )}
              >
                <Shapes size={13} />
                <span>Vector Icons ({LUCIDE_HABIT_ICONS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUserModeOverride('emoji')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  mode === 'emoji'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm'
                    : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                )}
              >
                <Smile size={13} />
                <span>Emojis ({HABIT_ICONS.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-raised)] cursor-pointer transition-colors"
              aria-label="Close icon gallery"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative my-3">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx-muted)] pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                mode === 'lucide'
                  ? 'Search vectors: workout, run, code, books, sleep...'
                  : 'Search emojis: water, salad, coffee, run...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[var(--sf-raised)] border border-[var(--border-default)] text-[var(--tx-primary)] placeholder-[var(--tx-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--tx-muted)] hover:text-[var(--tx-primary)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors border cursor-pointer shrink-0',
                selectedCategory === 'all'
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                  : 'bg-[var(--sf-raised)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
              )}
            >
              All ({activeCount})
            </button>
            {HABIT_ICON_CATEGORIES.map(cat => {
              const isCatActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors border cursor-pointer shrink-0',
                    isCatActive
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                      : 'bg-[var(--sf-raised)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                  )}
                >
                  <span>{mode === 'lucide' ? <IconRenderer name={cat.lucideIcon} size={12} /> : cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grid of Icons */}
          <div className="overflow-y-auto max-h-[190px] pr-1 py-1 grid grid-cols-7 sm:grid-cols-8 gap-1.5">
            {mode === 'lucide' ? (
              filteredLucideIcons.length > 0 ? (
                filteredLucideIcons.map(item => {
                  const isSelected = value.toLowerCase() === item.name.toLowerCase();
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelect(item.name)}
                      title={`${item.label} (${item.name})`}
                      className={cn(
                        'h-9 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 cursor-pointer group hover:scale-110 active:scale-90 relative',
                        isSelected
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]'
                          : 'bg-[var(--sf-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: `${activeTint}25`,
                              borderColor: activeTint,
                            }
                          : undefined
                      }
                    >
                      <IconRenderer
                        name={item.name}
                        color={isSelected ? activeTint : 'currentColor'}
                        size={18}
                      />
                      {isSelected && (
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: activeTint }}
                        >
                          <Check size={8} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-[var(--tx-muted)]">
                  No vector icons found for &ldquo;{searchQuery}&rdquo;
                </div>
              )
            ) : filteredEmojiIcons.length > 0 ? (
              filteredEmojiIcons.map(item => {
                const isSelected = value === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelect(item.name)}
                    title={item.label}
                    className={cn(
                      'h-9 rounded-xl border flex items-center justify-center text-lg transition-all duration-150 cursor-pointer hover:scale-110 active:scale-90 relative',
                      isSelected
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]'
                        : 'bg-[var(--sf-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${activeTint}25`,
                            borderColor: activeTint,
                          }
                        : undefined
                    }
                  >
                    <span>{item.name}</span>
                    {isSelected && (
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: activeTint }}
                      >
                        <Check size={8} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-[var(--tx-muted)]">
                No emojis found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>

          {/* ── Custom Input / Iconify Universal Bar ── */}
          <form
            onSubmit={handleCustomSubmit}
            className="mt-3 pt-2.5 border-t border-[var(--border-default)] flex items-center gap-2"
          >
            <div className="flex-1 relative flex items-center">
              <Sparkles
                size={13}
                className="absolute left-2.5 text-[var(--tx-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Custom emoji or ID (e.g. Flame, mdi:run, 🔥)"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="w-full pl-8 pr-9 py-1.5 text-xs rounded-lg bg-[var(--sf-raised)] border border-[var(--border-default)] text-[var(--tx-primary)] placeholder-[var(--tx-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              {customInput.trim() && (
                <div className="absolute right-2.5 flex items-center pointer-events-none">
                  <IconRenderer name={customInput.trim()} color={activeTint} size={15} />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
            >
              Apply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default IconPicker;
