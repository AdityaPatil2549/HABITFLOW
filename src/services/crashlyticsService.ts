import { getApp } from 'firebase/app';
import { getPerformance, trace } from 'firebase/performance';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '../lib/firebase';

/**
 * Firebase Crashlytics equivalent for Web.
 * Since official Firebase Crashlytics is mobile-only, this service acts as a 
 * "compat" layer by catching global errors and reporting them to Firebase Analytics
 * and Performance Monitoring as non-fatal exceptions and custom traces.
 */
class CrashlyticsService {
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    
    // Catch unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('unhandledrejection', event.reason?.message || 'Unknown Promise Rejection');
    });

    // Catch global unhandled errors
    window.addEventListener('error', (event) => {
      this.recordError('window_error', event.message, event.filename, event.lineno);
    });

    this.isInitialized = true;
    console.log('✅ Crashlytics (Compat) initialized');
  }

  recordError(type: string, message: string, file?: string, line?: number) {
    console.error(`[Crashlytics] Caught ${type}: ${message}`);
    
    try {
      const analytics = getAnalytics(app);
      logEvent(analytics, 'exception', {
        description: `${type}: ${message} at ${file}:${line}`,
        fatal: false
      });

      // We can also trace errors in Performance
      const perf = getPerformance(app);
      const errorTrace = trace(perf, `error_${type}`);
      errorTrace.start();
      errorTrace.putAttribute('error_message', message.substring(0, 100)); // limit string length
      errorTrace.stop();
    } catch (e) {
      console.warn('Failed to log error to Firebase', e);
    }
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
