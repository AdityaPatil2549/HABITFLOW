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
          <div className="absolute inset-0 bg-black/65" />

          <motion.div
            className="relative z-10 max-w-md w-full mx-4 bg-[var(--sf-raised)] border border-[var(--border-strong)] rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.98, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/25 flex items-center justify-center">
                  <Keyboard size={18} className="text-[var(--accent-ink)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--tx-primary)]">Keyboard Shortcuts</h2>
              </div>
              <button
                type="button"
                aria-label="Close keyboard shortcuts"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="space-y-1">
              {SHORTCUT_DEFINITIONS.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--sf-overlay)] transition-colors"
                >
                  <span className="text-sm text-[var(--tx-secondary)]">{shortcut.description}</span>
                  <kbd className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--sf-overlay)] text-xs font-mono font-bold text-[var(--tx-primary)] border border-[var(--border-default)]">
                    {shortcut.shift && <span className="text-[var(--tx-muted)]">Shift+</span>}
                    {shortcut.key === 'Escape' ? 'Esc' : shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="mt-4 pt-3 border-t border-[var(--border-default)] text-center">
              <p className="text-xs text-[var(--tx-muted)]">
                Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--sf-overlay)] text-[var(--tx-secondary)] font-mono border border-[var(--border-default)]">?</kbd>{' '}
                anytime to toggle this
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
