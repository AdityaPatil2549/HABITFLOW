/**
 * Google Fit / Health Connect Service
 * Reads real health data (steps, sleep) using the Google Fitness REST API.
 * Requires the user to sign in with the fitness scope via Google OAuth.
 */

const FIT_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';
const FIT_SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read';
const TOKEN_KEY = 'google_fit_token';

export interface FitData {
  steps: number;
  sleepHours: number;
  activeMinutes: number;
}

export const healthSyncService = {
  isFitConnected(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Connect Google Fit by signing in with fitness OAuth scopes.
   */
  async connectGoogleFit(): Promise<void> {
    const { auth } = await import('@/lib/firebase');
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.body.read');
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      throw new Error('No Google Fit access token received');
    }
  },

  disconnectFit(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Fetch today's step count from Google Fit.
   */
  async fetchTodaySteps(): Promise<number> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return 0;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;

    const body = {
      aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startOfDay,
      endTimeMillis: endOfDay,
    };

    try {
      const res = await fetch(`${FIT_API_BASE}/dataset:aggregate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        this.disconnectFit();
        return 0;
      }

      const data = await res.json();
      const bucket = data.bucket?.[0];
      const dataset = bucket?.dataset?.[0];
      const point = dataset?.point?.[0];
      return point?.value?.[0]?.intVal ?? 0;
    } catch (e) {
      console.error('[HealthSync] Failed to fetch steps:', e);
      return 0;
    }
  },

  /**
   * Fetch last night's sleep duration in hours from Google Fit.
   */
  async fetchLastNightSleep(): Promise<number> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return 0;

    const now = new Date().getTime();
    const twentyFourHoursAgo = now - 86400000;

    const body = {
      aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: twentyFourHoursAgo,
      endTimeMillis: now,
    };

    try {
      const res = await fetch(`${FIT_API_BASE}/dataset:aggregate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        this.disconnectFit();
        return 0;
      }

      const data = await res.json();
      const bucket = data.bucket?.[0];
      const dataset = bucket?.dataset?.[0];
      let totalMs = 0;

      for (const point of dataset?.point || []) {
        const start = parseInt(point.startTimeNanos) / 1e6;
        const end = parseInt(point.endTimeNanos) / 1e6;
        // Only count sleep (type 1) and light sleep (type 4), deep (type 5), REM (type 6)
        const sleepTypes = [1, 4, 5, 6];
        if (sleepTypes.includes(point.value?.[0]?.intVal)) {
          totalMs += end - start;
        }
      }

      return Math.round((totalMs / 3600000) * 10) / 10; // Return hours with 1 decimal
    } catch (e) {
      console.error('[HealthSync] Failed to fetch sleep:', e);
      return 0;
    }
  },

  /**
   * Get all health data for today.
   */
  async getTodayFitData(): Promise<FitData> {
    const [steps, sleepHours] = await Promise.all([
      this.fetchTodaySteps(),
      this.fetchLastNightSleep(),
    ]);
    return { steps, sleepHours, activeMinutes: Math.floor(steps / 100) };
  },

  /**
   * Check if a step-based habit should be auto-completed.
   * Returns true if the user has walked enough steps.
   */
  async shouldAutoCompleteStepHabit(targetSteps: number): Promise<boolean> {
    const steps = await this.fetchTodaySteps();
    return steps >= targetSteps;
  },
};

// Keep legacy export for backward compatibility
export async function syncHealthHabits() {
  if (!healthSyncService.isFitConnected()) {
    console.log('[HealthSync] Not connected to Google Fit.');
    return 0;
  }
  const data = await healthSyncService.getTodayFitData();
  console.log('[HealthSync] Fetched real health data:', data);
  return data.steps;
}

export function startHealthSyncPolling(intervalMinutes = 60) {
  if (!healthSyncService.isFitConnected()) return;
  setInterval(() => syncHealthHabits(), intervalMinutes * 60000);
}
