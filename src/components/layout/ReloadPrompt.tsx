import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // Service worker registered silently
    },
    onRegisterError(error: Error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[100] card-raised p-4 w-[calc(100vw-2rem)] sm:w-80 border border-[var(--border-strong)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.14 }}
        >
          <div className="mb-3">
            {offlineReady ? (
              <p className="text-sm font-medium text-[var(--tx-primary)]">
                App ready to work offline
              </p>
            ) : (
              <p className="text-sm font-medium text-[var(--tx-primary)] mb-1">
                New content available
              </p>
            )}
            <p className="text-xs text-[var(--tx-secondary)]">
              {offlineReady
                ? 'HabitFlow can now be used without an internet connection.'
                : 'Click reload to update HabitFlow to the latest version.'}
            </p>
          </div>

          <div className="flex gap-2">
            {needRefresh && (
              <button
                className="btn-primary text-xs py-1.5 px-3 flex-1"
                onClick={() => updateServiceWorker(true)}
              >
                Reload
              </button>
            )}
            <button className="btn-secondary text-xs py-1.5 px-3 flex-1" onClick={close}>
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
