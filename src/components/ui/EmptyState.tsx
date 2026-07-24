import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", staggerChildren: 0.1 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "bg-white/5 border border-white/10 rounded-2xl glass-card relative overflow-hidden group",
        className
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [-5, 5, -5], opacity: 1 }}
        transition={{ 
          y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
          opacity: { duration: 0.3 }
        }}
        className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-5 border border-brand-500/20 shadow-lg"
      >
        <Icon className="w-10 h-10 text-brand-400 drop-shadow-lg" />
      </motion.div>

      <motion.h3 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight z-10"
      >
        {title}
      </motion.h3>

      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 max-w-[250px] z-10 leading-relaxed"
      >
        {description}
      </motion.p>
      
      {actionLabel && onAction && (
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl z-10 flex items-center gap-2 active:scale-[0.98]"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
