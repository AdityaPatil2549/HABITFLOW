import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { soundService } from '../../services/soundService';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isDismissed, isIOS, isNativePromptReady, promptInstall, dismissPrompt } =
    usePWAInstall();
  const [showIOSTips, setShowIOSTips] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed or user dismissed it, don't show the banner
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    soundService.playTick();
    if (isNativePromptReady) {
      setInstalling(true);
      try {
        await promptInstall();
      } finally {
        setInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSTips(true);
    }
  };

  const handleDismiss = () => {
    soundService.playUnlatchClick();
    dismissPrompt();
    setShowIOSTips(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
        className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 sm:w-96 card-raised p-4 border border-[var(--border-strong)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
            <Smartphone size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-[var(--tx-primary)] tracking-tight">
                Install HabitFlow
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss install banner"
                className="text-[var(--tx-muted)] hover:text-[var(--tx-primary)] p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] text-[var(--tx-secondary)] mt-0.5 leading-relaxed">
              Launch instantly from your home screen with zero latency, offline vault access, and full-screen focus.
            </p>

            {/* iOS Safari Tip Sheet */}
            {showIOSTips && isIOS && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 p-2.5 rounded-lg bg-[var(--sf-overlay)] border border-[var(--border-default)] space-y-1.5 text-[11px] text-[var(--tx-secondary)]"
              >
                <div className="flex items-center gap-2 text-[var(--tx-primary)] font-medium">
                  <Share size={13} className="text-[var(--accent-ink)] shrink-0" />
                  <span>1. Tap Safari's Share button in bottom toolbar</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--tx-primary)] font-medium">
                  <PlusSquare size={13} className="text-[var(--accent-ink)] shrink-0" />
                  <span>2. Scroll down and choose 'Add to Home Screen'</span>
                </div>
              </motion.div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="btn-primary py-1.5 px-3 text-xs flex-1 flex items-center justify-center gap-1.5 font-semibold"
              >
                <Download size={13} />
                <span>{isIOS ? 'How to Install' : installing ? 'Installing...' : 'Add to Home Screen'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="btn-secondary py-1.5 px-3 text-xs text-[var(--tx-muted)] hover:text-[var(--tx-primary)]"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
