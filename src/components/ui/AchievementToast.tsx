import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, X } from 'lucide-react';
import { useCompletionEffects } from './CompletionEffects';

interface AchievementToastProps {
  title: string;
  description: string;
  icon: string; // emoji
  type: 'milestone' | 'badge' | 'level_up';
  onClose: () => void;
}

export function AchievementToast({
  title,
  description,
  icon,
  type,
  onClose,
}: AchievementToastProps) {
  const { fireConfetti } = useCompletionEffects();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Fire confetti on mount
    fireConfetti();
    setTimeout(() => fireConfetti(), 300);

    // Auto-dismiss timer
    const timer = setTimeout(onClose, 4500);
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - 2.5));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fireConfetti, onClose]);

  const bgGradient =
    type === 'level_up'
      ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)'
      : type === 'milestone'
        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)'
        : 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)';

  const TypeIcon = type === 'level_up' ? Star : type === 'milestone' ? Flame : Trophy;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Card */}
        <motion.div
          className="relative z-10 max-w-sm w-full mx-4"
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="rounded-3xl p-1 shadow-2xl" style={{ background: bgGradient }}>
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-[22px] p-8 text-center">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all"
              >
                <X size={16} />
              </button>

              {/* Type badge */}
              <motion.div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                style={{ background: bgGradient, color: '#fff' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              >
                <TypeIcon size={12} />
                {type === 'level_up'
                  ? 'Level Up!'
                  : type === 'milestone'
                    ? 'Milestone!'
                    : 'Badge Earned!'}
              </motion.div>

              {/* Icon */}
              <motion.div
                className="text-7xl mb-4"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 12 }}
              >
                {icon}
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-2xl font-black text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {title}
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-sm text-slate-400 leading-relaxed mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {description}
              </motion.p>

              {/* Progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: bgGradient, width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Achievement Queue Manager ────────────────────────────────
// Manages a queue of achievements to show one at a time

interface QueuedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'milestone' | 'badge' | 'level_up';
}

const achievementQueue: QueuedAchievement[] = [];
let showCallback: ((a: QueuedAchievement | null) => void) | null = null;

export function queueAchievement(achievement: Omit<QueuedAchievement, 'id'>) {
  const item = { ...achievement, id: crypto.randomUUID() };
  achievementQueue.push(item);
  if (achievementQueue.length === 1 && showCallback) {
    showCallback(item);
  }
}

function showNext() {
  achievementQueue.shift();
  if (achievementQueue.length > 0 && showCallback) {
    setTimeout(() => showCallback!(achievementQueue[0]), 500);
  } else if (showCallback) {
    showCallback(null);
  }
}

export function useAchievementToast() {
  const [current, setCurrent] = useState<QueuedAchievement | null>(null);

  useEffect(() => {
    showCallback = setCurrent;
    // Show any queued achievement
    if (achievementQueue.length > 0) {
      setTimeout(() => setCurrent(achievementQueue[0]), 0);
    }
    return () => {
      showCallback = null;
    };
  }, []);

  const dismiss = () => {
    setCurrent(null);
    showNext();
  };

  return { current, dismiss };
}

// ── Streak Milestone Definitions ─────────────────────────────
export const STREAK_MILESTONES = [
  {
    days: 7,
    icon: '🔥',
    title: '1 Week Streak!',
    description: "You've shown up for 7 days straight. The habit is forming!",
  },
  {
    days: 14,
    icon: '⚡',
    title: '2 Week Warrior!',
    description: "14 days of consistency. You're building real momentum.",
  },
  {
    days: 21,
    icon: '💪',
    title: '21 Day Breakthrough!',
    description: 'They say it takes 21 days to form a habit. You just did it!',
  },
  {
    days: 30,
    icon: '🏅',
    title: '30 Day Champion!',
    description: "A full month of dedication. You're in the top 1% of habit builders.",
  },
  {
    days: 60,
    icon: '💎',
    title: '60 Day Diamond!',
    description: 'Two months of pure discipline. This habit is part of who you are.',
  },
  {
    days: 90,
    icon: '👑',
    title: '90 Day Legend!',
    description: 'A quarter of a year. Your consistency is legendary.',
  },
  {
    days: 180,
    icon: '🌟',
    title: 'Half Year Hero!',
    description: "6 months! You've proven this isn't a phase — it's a lifestyle.",
  },
  {
    days: 365,
    icon: '🏆',
    title: 'ONE YEAR!',
    description: '365 days. An entire year. You are extraordinary.',
  },
];

export function checkStreakMilestone(streak: number): (typeof STREAK_MILESTONES)[0] | null {
  return STREAK_MILESTONES.find(m => m.days === streak) ?? null;
}
