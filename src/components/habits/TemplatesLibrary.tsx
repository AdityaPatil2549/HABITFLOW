import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    emoji: '📵',
    description: 'Reclaim your time from screens and scrolling.',
    color: '#10b981',
    category: 'Health',
    habits: [
      { name: 'No screens in bed', icon: 'moon', color: '#8b5cf6', category: 'Health' },
      { name: 'App limit: Social media < 30m', icon: 'smartphone', color: '#f43f5e', category: 'Health' },
      { name: 'Leave phone in another room', icon: 'shield', color: '#06b6d4', category: 'Personal' },
      { name: 'Read instead of scrolling', icon: 'book', color: '#f59e0b', category: 'Learning' },
    ],
  },
  {
    id: 'language',
    name: 'Language Learner',
    emoji: '🌍',
    description: 'Master a new language with daily practice.',
    color: '#8b5cf6',
    category: 'Learning',
    habits: [
      { name: 'Duolingo lesson', icon: 'globe', color: '#22c55e', category: 'Learning' },
      { name: 'Learn 5 new vocabulary words', icon: 'edit3', color: '#f59e0b', category: 'Learning' },
      { name: 'Watch video in target language', icon: 'tv', color: '#6366f1', category: 'Learning' },
      { name: 'Practice speaking (10 min)', icon: 'mic', color: '#f43f5e', category: 'Learning' },
    ],
  },
  {
    id: 'evening-wind-down',
    name: 'Evening Wind-down',
    emoji: '🌙',
    description: 'Prepare for deep sleep and a better tomorrow.',
    color: '#6366f1',
    category: 'Personal',
    habits: [
      { name: 'Stretch for 5 minutes', icon: 'activity', color: '#10b981', category: 'Health' },
      { name: 'Review tomorrow\'s schedule', icon: 'calendar', color: '#f59e0b', category: 'Work' },
      { name: 'Read fiction', icon: 'bookOpen', color: '#8b5cf6', category: 'Personal' },
      { name: 'Lights out by 10:30 PM', icon: 'moon', color: '#06b6d4', category: 'Health' },
    ],
  },
  {
    id: 'creative',
    name: 'Creative Spark',
    emoji: '🎨',
    description: 'Nurture your creativity and imagination.',
    color: '#f43f5e',
    category: 'Personal',
    habits: [
      { name: 'Doodle or sketch (10 min)', icon: 'penTool', color: '#f43f5e', category: 'Personal' },
      { name: 'Write 500 words', icon: 'edit2', color: '#f59e0b', category: 'Personal' },
      { name: 'Listen to a new album', icon: 'music', color: '#8b5cf6', category: 'Personal' },
      { name: 'Brainstorm 10 new ideas', icon: 'zap', color: '#06b6d4', category: 'Work' },
    ],
  },
];

const CATEGORY_FILTERS = ['All', 'Health', 'Work', 'Learning', 'Personal', 'Finance'];

interface TemplatesLibraryProps {
  onClose: () => void;
}

export function TemplatesLibrary({ onClose }: TemplatesLibraryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  const { addHabit } = useHabitStore();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    dialog.showModal();

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

  const visible = TEMPLATE_PACKS.filter(p => {
    const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleExpand = (packId: string) => {
    setExpandedPacks(prev => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  };

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
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm fixed inset-0 flex items-center justify-center open:animate-in open:fade-in duration-300 z-[9997]"
    >
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[640px] mx-4 bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 rounded-[32px] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Decorative Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-500/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between z-10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} className="text-brand-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Habit Templates</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Expert curated habit packs</p>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="relative px-8 py-5 space-y-4 z-10 flex-shrink-0">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-transform group-focus-within:scale-110 group-focus-within:text-brand-400">
              <Search size={18} />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 text-sm font-medium outline-none focus:border-brand-500/50 focus:bg-slate-950/60 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map(f => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'text-brand-300 border border-brand-500/30'
                      : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="filterBg" className="absolute inset-0 bg-brand-500/20 shadow-inner" />
                  )}
                  <span className="relative z-10">{f}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div className="relative overflow-y-auto flex-1 px-8 pb-8 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {visible.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-slate-500">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-bold text-white mb-1">No templates found</p>
              <p className="text-sm font-medium">Try a different search or filter</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visible.map(pack => {
                const isAdded = added.has(pack.id);
                const isAdding = adding === pack.id;
                const isExpanded = expandedPacks.has(pack.id);
                const showExpandButton = pack.habits.length > 3;
                const visibleHabits = isExpanded ? pack.habits : pack.habits.slice(0, 3);

                return (
                  <motion.div
                    key={pack.id}
                    layout
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    className="relative rounded-[24px] border border-white/10 bg-slate-950/40 p-5 flex flex-col gap-5 hover:bg-slate-950/60 hover:border-white/20 transition-all shadow-inner overflow-hidden group"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Pack header */}
                    <motion.div layout="position" className="flex items-start gap-4 z-10">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
                        style={{ background: pack.color + '20', border: `1px solid ${pack.color}40` }}
                      >
                        {pack.emoji}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="font-bold text-white text-base">{pack.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{pack.description}</p>
                      </div>
                    </motion.div>

                    {/* Habit list preview */}
                    <motion.div layout className="space-y-2 z-10 bg-black/20 rounded-xl p-3 border border-white/5">
                      <AnimatePresence initial={false}>
                        {visibleHabits.map((h, i) => (
                          <motion.div 
                            key={h.name}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="flex items-center gap-2.5 overflow-hidden"
                          >
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: h.color, boxShadow: `0 0 6px ${h.color}` }} />
                            <p className="text-xs font-semibold text-slate-300 truncate">{h.name}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {showExpandButton && (
                        <motion.button
                          layout="position"
                          onClick={() => toggleExpand(pack.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-brand-400 transition-colors pt-1 pl-4"
                        >
                          {isExpanded ? (
                            <><ChevronUp size={12} /> Show less</>
                          ) : (
                            <><ChevronDown size={12} /> +{pack.habits.length - 3} more habits</>
                          )}
                        </motion.button>
                      )}
                    </motion.div>

                    {/* CTA */}
                    <motion.button
                      layout="position"
                      onClick={() => !isAdded && !isAdding && addPack(pack)}
                      disabled={isAdding || isAdded}
                      className={`relative w-full py-3 mt-auto rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 z-10 overflow-hidden ${
                        isAdded
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                          : isAdding
                          ? 'bg-brand-500/10 border border-brand-500/20 text-brand-400'
                          : 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20 active:scale-95 border border-white/10 group-hover:shadow-brand-500/30'
                      }`}
                    >
                      {/* Button Hover Effect */}
                      {!isAdded && !isAdding && (
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                      )}
                      
                      <span className="relative flex items-center gap-2">
                        {isAdded ? (
                          <><Check size={14} /> Added to Library</>
                        ) : isAdding ? (
                          <><span className="w-3.5 h-3.5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" /> Adding…</>
                        ) : (
                          <><Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" /> Add {pack.habits.length} Habits</>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </dialog>
  );
}
