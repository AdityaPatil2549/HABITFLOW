import React from 'react';
import { Search, X, CheckSquare, Calendar, Clock, CheckCircle } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-white/[0.06]">
      {/* View Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
              currentTab === t.id
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.05]'
            )}
          >
            <span>{t.label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold',
                currentTab === t.id ? 'bg-emerald-500/25 text-emerald-200' : 'bg-white/[0.06] text-slate-400'
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
          className="bg-[#0c0e17]/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40 cursor-pointer backdrop-blur-md"
        >
          <option value="all" className="bg-[#0c0e17] text-white">All Priorities</option>
          <option value="0" className="bg-[#0c0e17] text-rose-400">Urgent</option>
          <option value="1" className="bg-[#0c0e17] text-orange-400">High</option>
          <option value="2" className="bg-[#0c0e17] text-blue-400">Normal</option>
          <option value="3" className="bg-[#0c0e17] text-slate-400">Low</option>
        </select>

        <div className="relative flex-1 sm:w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks... (/)"
            className="w-full bg-[#0c0e17]/60 border border-white/[0.1] focus:border-emerald-500/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-all backdrop-blur-md focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
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
