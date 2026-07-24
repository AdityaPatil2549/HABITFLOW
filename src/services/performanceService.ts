/**
 * Firebase Performance Monitoring Service
 * Tracks page load times and custom traces like AI coach latency.
 * Acts as the web equivalent of Firebase Crashlytics.
 */
import { trace } from 'firebase/performance';
import { performance as firebasePerformance, isFirebaseConfigured } from '@/lib/firebase';

export const performanceService = {
  /**
   * Trace a custom operation. Returns a stop function.
   * Usage: const stop = performanceService.startTrace('ai_coach_call');
   *        ... do work ...
   *        stop();
   */
  startTrace(traceName: string): () => void {
    if (!firebasePerformance || !isFirebaseConfigured()) return () => {};
    try {
      const t = trace(firebasePerformance, traceName);
      t.start();
      return () => {
        try { t.stop(); } catch { /* ignore */ }
      };
    } catch {
      return () => {};
    }
  },

  /**
   * Wrap an async operation in a performance trace automatically.
   */
  async traceAsync<T>(traceName: string, fn: () => Promise<T>): Promise<T> {
    const stop = this.startTrace(traceName);
    try {
      const result = await fn();
      return result;
    } finally {
      stop();
    }
  },

  /** Convenience: trace AI Coach calls */
  startAICoachTrace(): () => void {
    return this.startTrace('ai_coach_generate_insights');
  },

  /** Convenience: trace page renders */
  startPageTrace(pageName: string): () => void {
    return this.startTrace(`page_render_${pageName.toLowerCase().replace(/\s/g, '_')}`);
  },

  /** Convenience: trace sync operations */
  startSyncTrace(): () => void {
    return this.startTrace('firestore_sync');
  },
};
