import {
  getAnalyticsInstance,
  getPerformanceInstance,
  isFirebaseConfigured,
} from '../lib/firebase';

/**
 * Firebase Crashlytics equivalent for Web.
 * Since official Firebase Crashlytics is mobile-only, this service acts as a 
 * "compat" layer by catching global errors and reporting them to Firebase Analytics
 * and Performance Monitoring as non-fatal exceptions and custom traces.
 */
class CrashlyticsService {
  private isInitialized = false;

  init() {
    if (this.isInitialized || !isFirebaseConfigured()) return;
    
    // Catch unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('unhandledrejection', event.reason?.message || 'Unknown Promise Rejection');
    });

    // Catch global unhandled errors
    window.addEventListener('error', (event) => {
      this.recordError('window_error', event.message, event.filename, event.lineno);
    });

    this.isInitialized = true;
  }

  recordError(type: string, message: string, file?: string, line?: number) {
    console.error(`[Crashlytics] Caught ${type}: ${message}`);
    if (!isFirebaseConfigured()) return;

    void (async () => {
      try {
        const [analytics, { logEvent }] = await Promise.all([
          getAnalyticsInstance(),
          import('firebase/analytics'),
        ]);
        if (analytics) {
          logEvent(analytics, 'exception', {
            description: `${type}: ${message} at ${file}:${line}`,
            fatal: false,
          });
        }

        const [perf, { trace }] = await Promise.all([
          getPerformanceInstance(),
          import('firebase/performance'),
        ]);
        if (perf) {
          const errorTrace = trace(perf, `error_${type}`);
          errorTrace.start();
          errorTrace.putAttribute('error_message', message.substring(0, 100));
          errorTrace.stop();
        }
      } catch (e) {
        console.warn('Failed to log error to Firebase', e);
      }
    })();
  }

  /**
   * Manually record a non-fatal error (e.g. inside a try/catch block)
   */
  logNonFatalError(error: Error, context?: Record<string, string>) {
    this.recordError('non_fatal_error', error.message);
    if (context) {
      console.info('[Crashlytics] Context:', context);
    }
  }
}

export const crashlyticsService = new CrashlyticsService();
