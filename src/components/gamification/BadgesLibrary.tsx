import { useGamificationStore } from '@/store/gamificationStore';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { slideUp } from '@/lib/motionVariants';

const ALL_BADGES = [
  { name: 'Streak Novice', description: 'Hit a 3-day streak on any habit', icon: '🔥' },
  { name: 'Consistency Key', description: 'Hit a 7-day streak', icon: '⭐' },
  { name: 'Unstoppable', description: 'Hit a 30-day streak', icon: '🚀' },
  { name: 'First Steps', description: 'Complete your first habit or task', icon: '🌱' },
];

export function BadgesLibrary() {
  const { userXP } = useGamificationStore();
  const earned = userXP?.badgesEarned || [];

  return (
    <motion.section variants={slideUp} className="card-raised p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={18} className="text-brand-400" />
        <h2 className="font-semibold text-[var(--text-primary)]">Milestone Badges</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ALL_BADGES.map((b, i) => {
          const isEarned = earned.some(e => e.name === b.name);
          return (
            <motion.div
              key={b.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className={`p-4 rounded-xl text-center border transition-all ${
                isEarned
                  ? 'bg-[var(--bg-surface)] border-brand-500/50 shadow-md ring-1 ring-brand-500/20 glow'
                  : 'bg-[var(--bg-overlay)] border-[var(--border-subtle)] opacity-60 grayscale'
              }`}
            >
              <div className="text-3xl mb-2 flex justify-center items-center h-10">
                {isEarned ? b.icon : <Lock size={24} className="text-[var(--text-muted)]" />}
              </div>
              <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{b.name}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-tight">
                {b.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
