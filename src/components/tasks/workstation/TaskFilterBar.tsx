import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Priority } from '../../../types';

export type TaskViewTab = 'all' | 'today' | 'upcoming' | 'completed';

export interface TaskFilterBarProps {
  currentTab: TaskViewTab;
  onSelectTab: (tab: TaskViewTab) => void;
  selectedPriority: Priority | 'all';
  onSelectPriority: (p: Priority | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: { all: number; today: number; upcoming: number; completed: number };
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TaskFilterBar({
  currentTab,
  onSelectTab,
  selectedPriority,
  onSelectPriority,
  searchQuery,
  onSearchChange,
  counts,
  searchInputRef,
}: TaskFilterBarProps) {
  const tabs: { id: TaskViewTab; label: string; count: number }[] = [
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'all', label: 'All Tasks', count: counts.all },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-[var(--border-default)]">
      {/* View Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
              currentTab === t.id
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30'
                : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] border border-[var(--border-default)]'
            )}
          >
            <span>{t.label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-mono font-bold',
                currentTab === t.id ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--sf-overlay)] text-[var(--tx-muted)]'
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Priority & Search */}
      <div className="flex items-center gap-2.5">
        <select
          value={selectedPriority}
          onChange={e => onSelectPriority(e.target.value === 'all' ? 'all' : (parseInt(e.target.value, 10) as Priority))}
          aria-label="Filter by priority"
          className="input w-auto px-3 py-2 text-xs cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="0">Urgent</option>
          <option value="1">High</option>
          <option value="2">Normal</option>
          <option value="3">Low</option>
        </select>

        <div className="relative flex-1 sm:w-56">
          <Search className="w-4 h-4 text-[var(--tx-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks... (/)"
            className="input pl-9 pr-8 py-2 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--tx-muted)] hover:text-[var(--tx-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskFilterBar;
