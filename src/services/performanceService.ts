/**
 * Firebase Performance Monitoring Service
 * Tracks page load times and custom traces like AI coach latency.
 * Acts as the web equivalent of Firebase Crashlytics.
 */
import { getPerformanceInstance, isFirebaseConfigured } from '@/lib/firebase';

export const performanceService = {
  /**
   * Trace a custom operation. Returns a stop function.
   * Usage: const stop = performanceService.startTrace('ai_coach_call');
   *        ... do work ...
   *        stop();
   */
  startTrace(traceName: string): () => void {
    if (!isFirebaseConfigured()) return () => {};
    let stopped = false;
    let traceHandle: { stop: () => void } | null = null;
    void (async () => {
      try {
        const [perf, { trace }] = await Promise.all([
          getPerformanceInstance(),
          import('firebase/performance'),
        ]);
        if (!perf || stopped) return;
        const t = trace(perf, traceName);
        t.start();
        traceHandle = t;
      } catch {
        // ignore telemetry errors
      }
    })();
    return () => {
      stopped = true;
      try {
        traceHandle?.stop();
      } catch {
        /* ignore */
      }
    };
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
