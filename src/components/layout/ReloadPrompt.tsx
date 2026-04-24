import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
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
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 card-raised p-4 max-w-sm border border-brand-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="mb-3">
            {offlineReady ? (
              <p className="text-sm font-medium text-[var(--text-primary)]">
                App ready to work offline
              </p>
            ) : (
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                New content available
              </p>
            )}
            <p className="text-xs text-[var(--text-secondary)]">
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
