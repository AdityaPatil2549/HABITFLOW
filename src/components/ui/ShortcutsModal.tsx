import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { SHORTCUT_DEFINITIONS } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            className="relative z-10 max-w-md w-full mx-4 glass-card rounded-2xl p-6 modal-glow"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Keyboard size={18} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="space-y-1">
              {SHORTCUT_DEFINITIONS.map((shortcut, i) => (
                <motion.div
                  key={shortcut.key}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span className="text-sm text-slate-300">{shortcut.description}</span>
                  <kbd className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-slate-300 border border-white/10 shadow-sm">
                    {shortcut.shift && <span className="text-slate-500">Shift+</span>}
                    {shortcut.key === 'Escape' ? 'Esc' : shortcut.key}
                  </kbd>
                </motion.div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="mt-4 pt-3 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono">?</kbd>{' '}
                anytime to toggle this
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
