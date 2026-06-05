import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Filter, X, MessageSquare } from 'lucide-react';
import { db } from '../../db';
import { IconRenderer } from '../common/IconRenderer';
import type { HabitLog, Habit } from '../../types';
import { format, parseISO } from 'date-fns';

interface JournalEntry extends HabitLog {
  habitName: string;
  habitIcon: string;
  habitColor: string;
}

export function HabitJournal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filterHabit, setFilterHabit] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadEntries = async () => {
      setLoading(true);
      const allHabits = await db.habits.toArray();
      setHabits(allHabits);

      const habitMap = new Map(allHabits.map(h => [h.id, h]));
      const logs = await db.habitLogs.orderBy('date').reverse().limit(200).toArray();

      // Only show logs that have notes
      const withNotes = logs
        .filter(log => log.note && log.note.trim().length > 0)
        .map(log => {
          const habit = habitMap.get(log.habitId);
          return {
            ...log,
            habitName: habit?.name ?? 'Unknown',
            habitIcon: habit?.icon ?? '📝',
            habitColor: habit?.color ?? '#6366f1',
          };
        });

      setEntries(withNotes);
      setLoading(false);
    };

    loadEntries();
  }, [isOpen]);

  const filteredEntries = useMemo(() => {
    if (filterHabit === 'all') return entries;
    return entries.filter(e => e.habitId === filterHabit);
  }, [entries, filterHabit]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9997] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          className="relative z-10 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col glass-card rounded-2xl dark-overlay"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <BookOpen size={18} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Habit Journal</h2>
                <p className="text-xs text-slate-500">{filteredEntries.length} entries</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Filter */}
          <div className="px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <select
                value={filterHabit}
                onChange={(e) => setFilterHabit(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-full outline-none focus:border-indigo-500/50"
              >
                <option value="all">All Habits</option>
                {habits.map(h => (
                  <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {loading ? (
              <div className="text-center py-10 text-slate-500 text-sm">Loading journal...</div>
            ) : groupedEntries.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={40} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium">No journal entries yet</p>
                <p className="text-slate-600 text-sm mt-1">Add notes when logging your habits to see them here</p>
              </div>
            ) : (
              groupedEntries.map(([date, dayEntries]) => (
                <div key={date}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  </h3>
                  <div className="space-y-2">
                    {dayEntries.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        className="flex gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                          style={{ backgroundColor: `${entry.habitColor}20` }}
                        >
                          <IconRenderer name={entry.habitIcon} size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-white">{entry.habitName}</span>
                            {entry.mood && (
                              <span className="text-xs">
                                {['😢', '😕', '😐', '🙂', '😊'][entry.mood - 1]}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">{entry.note}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {format(parseISO(entry.timeStamp), 'h:mm a')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
