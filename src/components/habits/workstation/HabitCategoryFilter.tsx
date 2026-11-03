import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface HabitCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HabitCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  showArchived,
  onToggleArchived,
  searchInputRef,
}: HabitCategoryFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-white/[0.06]">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            selectedCategory === 'all'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.05]'
          )}
        >
          All
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
              selectedCategory === cat
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.05]'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input & Status Toggle */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 sm:w-60">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search habits... (/)"
            className="w-full bg-[#0c0e17]/60 border border-white/[0.1] focus:border-emerald-500/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-all backdrop-blur-md focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onToggleArchived}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 shadow-sm',
            showArchived
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border-white/[0.08] hover:bg-white/[0.06]'
          )}
        >
          {showArchived ? 'Archived' : 'Active'}
        </button>
      </div>
    </div>
  );
}

export default HabitCategoryFilter;
