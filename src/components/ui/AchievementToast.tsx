import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, X } from 'lucide-react';
import { triggerConfetti } from '../../lib/confetti';

interface AchievementToastProps {
  title: string;
  description: string;
  icon: string;
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
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    triggerConfetti();

    const timer = setTimeout(onClose, 4200);
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - 2.5));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onClose]);

  const TypeIcon = type === 'level_up' ? Star : type === 'milestone' ? Flame : Trophy;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/65" />

        <motion.div
          className="relative z-10 max-w-sm w-full mx-4"
          initial={{ scale: 0.96, y: 8, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 8, opacity: 0 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="card-raised p-7 text-center relative border-[var(--accent)]">
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss achievement notification"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-4 bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]">
              <TypeIcon size={12} />
              <span>
                {type === 'level_up'
                  ? 'Level Up'
                  : type === 'milestone'
                    ? 'Milestone'
                    : 'Badge Earned'}
              </span>
            </div>

            <div className="text-5xl mb-3" aria-hidden="true">
              {type === 'level_up' ? '🏆' : icon}
            </div>

            <h2 className="font-h2 text-[var(--tx-primary)] mb-1.5">{title}</h2>
            <p className="text-xs text-[var(--tx-secondary)] leading-relaxed mb-5">
              {description}
            </p>

            <div className="h-1 bg-[var(--sf-overlay)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
