/**
 * MOCK Health Sync Service
 * In a real-world PWA, this would interface with the Google Fit API or Health Connect REST API
 * using the Supabase auth token. For this web demonstration, we simulate health data aggregation.
 */

export async function syncHealthHabits() {
  console.log(
    '[HealthSync] Health Sync is running in Simulated Mode. True Google Fit integration requires a native Android bridge or server-side OAuth pipeline.'
  );
  return 0; // Return 0 synced to prevent random auto-completions
}

// Helper to start background polling
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function startHealthSyncPolling(_intervalMinutes = 60) {
  // Disabled in simulated mode to prevent random auto-completions.
  console.log('[HealthSync] Background polling disabled in Simulated mode.');
}
