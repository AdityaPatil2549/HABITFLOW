import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Search, Sparkles } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { format } from 'date-fns';

// ── Full Template Catalogue ──────────────────────────────────────
const TEMPLATE_PACKS = [
  {
    id: 'morning',
    name: 'Morning Routine',
    emoji: '☀️',
    description: 'Start every day with intention and energy.',
    color: '#f59e0b',
    category: 'Productivity',
    habits: [
      { name: 'Wake up at 6 AM', icon: 'sunrise', color: '#f59e0b', category: 'Personal' },
      { name: 'Drink a glass of water', icon: 'droplet', color: '#06b6d4', category: 'Health' },
      { name: 'Morning meditation', icon: 'heart', color: '#8b5cf6', category: 'Personal' },
      { name: 'Journaling (5 min)', icon: 'feather', color: '#f43f5e', category: 'Personal' },
      { name: 'No phone for first hour', icon: 'shield', color: '#10b981', category: 'Personal' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness Journey',
    emoji: '💪',
    description: 'Build strength, endurance, and healthy habits.',
    color: '#10b981',
    category: 'Health',
    habits: [
      { name: 'Exercise 30 minutes', icon: 'activity', color: '#10b981', category: 'Health' },
      { name: 'Drink 8 glasses of water', icon: 'droplet', color: '#06b6d4', category: 'Health' },
      { name: 'Eat vegetables with lunch', icon: 'leaf', color: '#22c55e', category: 'Health' },
      { name: 'Step count: 10,000', icon: 'map', color: '#f97316', category: 'Health' },
      { name: 'Sleep before 11 PM', icon: 'moon', color: '#8b5cf6', category: 'Health' },
    ],
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    emoji: '🧠',
    description: 'Maximize focus and eliminate distractions.',
    color: '#6366f1',
    category: 'Work',
    habits: [
      { name: 'Deep work session (2h)', icon: 'zap', color: '#6366f1', category: 'Work' },
      { name: 'No social media before noon', icon: 'shield', color: '#f43f5e', category: 'Work' },
      { name: 'Plan tomorrow tonight', icon: 'checkSquare', color: '#f59e0b', category: 'Work' },
      { name: 'Single-task for 90 min', icon: 'target', color: '#8b5cf6', category: 'Work' },
    ],
  },
  {
    id: 'reading',
    name: 'Reading Habit',
    emoji: '📚',
    description: 'Read more, learn faster, grow every day.',
    color: '#f59e0b',
    category: 'Learning',
    habits: [
      { name: 'Read 30 minutes', icon: 'book', color: '#f59e0b', category: 'Learning' },
      { name: 'Summarize what I read', icon: 'fileText', color: '#8b5cf6', category: 'Learning' },
      { name: 'No TV before reading', icon: 'shield', color: '#f43f5e', category: 'Personal' },
    ],
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    emoji: '🧘',
    description: 'Reduce stress and build inner calm.',
    color: '#8b5cf6',
    category: 'Personal',
    habits: [
      { name: 'Meditate (10 min)', icon: 'heart', color: '#8b5cf6', category: 'Personal' },
      { name: 'Gratitude journal', icon: 'feather', color: '#f59e0b', category: 'Personal' },
      { name: 'Digital sunset (9 PM)', icon: 'moon', color: '#6366f1', category: 'Personal' },
      { name: 'Breathing exercise', icon: 'wind', color: '#06b6d4', category: 'Personal' },
    ],
  },
  {
    id: 'finance',
    name: 'Financial Health',
    emoji: '💰',
    description: 'Build wealth with daily money habits.',
    color: '#22c55e',
    category: 'Finance',
    habits: [
      { name: 'Log all expenses', icon: 'dollarSign', color: '#22c55e', category: 'Finance' },
      { name: 'Review budget weekly', icon: 'trendingUp', color: '#6366f1', category: 'Finance' },
      { name: 'No impulse purchases', icon: 'shield', color: '#f43f5e', category: 'Finance' },
      { name: 'Add to savings', icon: 'archive', color: '#f59e0b', category: 'Finance' },
    ],
  },
  {
    id: 'social',
    name: 'Social Battery',
    emoji: '💬',
    description: 'Nurture relationships that matter.',
    color: '#f43f5e',
    category: 'Personal',
    habits: [
      { name: 'Text a friend or family', icon: 'messageCircle', color: '#f43f5e', category: 'Personal' },
      { name: 'Practice active listening', icon: 'users', color: '#8b5cf6', category: 'Personal' },
      { name: 'No phone at dinner', icon: 'shield', color: '#10b981', category: 'Personal' },
    ],
  },
  {
    id: 'coding',
    name: 'Coding Growth',
    emoji: '💻',
    description: 'Level up your engineering skills daily.',
    color: '#06b6d4',
    category: 'Learning',
    habits: [
      { name: 'Code for 1 hour', icon: 'code', color: '#06b6d4', category: 'Learning' },
      { name: 'Solve 1 algorithm problem', icon: 'cpu', color: '#8b5cf6', category: 'Learning' },
      { name: 'Read tech article', icon: 'book', color: '#f59e0b', category: 'Learning' },
      { name: 'Review yesterday\'s code', icon: 'gitBranch', color: '#10b981', category: 'Work' },
    ],
  },
];

const CATEGORY_FILTERS = ['All', 'Health', 'Work', 'Learning', 'Personal', 'Finance'];

interface TemplatesLibraryProps {
  onClose: () => void;
}

export function TemplatesLibrary({ onClose }: TemplatesLibraryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const { addHabit } = useHabitStore();

  const visible = TEMPLATE_PACKS.filter(p => {
    const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  async function addPack(pack: typeof TEMPLATE_PACKS[number]) {
    setAdding(pack.id);
    const today = format(new Date(), 'yyyy-MM-dd');
    for (const h of pack.habits) {
      await addHabit({
        name: h.name,
        icon: h.icon,
        color: h.color,
        category: h.category,
        type: 'boolean',
        frequency: 'daily',
        targetValue: 1,
        startDate: today,
        graceDayEnabled: false,
        archived: false,
      });
    }
    setAdded(prev => new Set([...prev, pack.id]));
    setAdding(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-brand-400" />
              <h2 className="text-lg font-black text-white">Habit Templates</h2>
            </div>
            <p className="text-xs text-slate-400">One-click import curated habit packs built by experts.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="px-6 py-4 space-y-3 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500/40 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {visible.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No templates found</p>
              <p className="text-sm mt-1">Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visible.map(pack => {
                const isAdded = added.has(pack.id);
                const isAdding = adding === pack.id;
                return (
                  <motion.div
                    key={pack.id}
                    layout
                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col gap-4 hover:border-white/15 transition-all"
                  >
                    {/* Pack header */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: pack.color + '15' }}
                      >
                        {pack.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{pack.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{pack.description}</p>
                      </div>
                    </div>

                    {/* Habit list preview */}
                    <div className="space-y-1.5">
                      {pack.habits.slice(0, 3).map(h => (
                        <div key={h.name} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: h.color }} />
                          <p className="text-xs text-slate-400 truncate">{h.name}</p>
                        </div>
                      ))}
                      {pack.habits.length > 3 && (
                        <p className="text-xs text-slate-600 pl-3.5">+{pack.habits.length - 3} more…</p>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => !isAdded && !isAdding && addPack(pack)}
                      disabled={isAdding || isAdded}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
                          : isAdding
                          ? 'bg-brand-500/15 border border-brand-500/30 text-brand-400'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-brand-500/10 hover:border-brand-500/30 hover:text-brand-300'
                      }`}
                    >
                      {isAdded ? (
                        <><Check size={13} /> {pack.habits.length} habits added!</>
                      ) : isAdding ? (
                        <><span className="w-3 h-3 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" /> Adding…</>
                      ) : (
                        <><Plus size={13} /> Add {pack.habits.length} habits</>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
