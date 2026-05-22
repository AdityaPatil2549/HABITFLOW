import { db } from '../db';
import { Habit } from '../types';
import { format } from 'date-fns';
import { habitService } from './habitService';
import { useGamificationStore } from '../store/gamificationStore';

/**
 * MOCK Health Sync Service
 * In a real-world PWA, this would interface with the Google Fit API or Health Connect REST API
 * using the Supabase auth token. For this web demonstration, we simulate health data aggregation.
 */

// Generate realistic mock data for health metrics
function getMockHealthData(metric: string): number {
  switch (metric) {
    case 'steps':
      return Math.floor(Math.random() * 5000) + 6000; // 6k - 11k steps
    case 'sleep':
      return (Math.random() * 2 + 6); // 6 - 8 hours
    case 'water':
      return Math.floor(Math.random() * 1000) + 1500; // 1.5L - 2.5L
    case 'calories':
      return Math.floor(Math.random() * 500) + 300; // 300 - 800 kcal
    case 'meditation':
      return Math.floor(Math.random() * 20) + 5; // 5 - 25 mins
    default:
      return 0;
  }
}

export async function syncHealthHabits() {
  console.log('[HealthSync] Starting health sync process...');
  
  try {
    // 1. Find all active habits that have healthSyncEnabled
    const habits = await db.habits
      .filter((h: Habit) => !h.archived && h.healthSyncEnabled === true)
      .toArray();

    if (habits.length === 0) {
      console.log('[HealthSync] No health-synced habits found. Aborting.');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    let syncedCount = 0;

    for (const habit of habits) {
      // 2. Check if already completed today
      const existingLog = await db.habitLogs.get({ habitId: habit.id, date: today });
      
      // We only care if it's completely unlogged OR logged but not complete and not skipped
      if (existingLog && (existingLog.value >= habit.targetValue || existingLog.isFrozen)) {
        continue;
      }

      // 3. Fetch simulated health data
      const currentHealthValue = getMockHealthData(habit.healthMetric || 'steps');
      
      // 4. Compare with target
      if (currentHealthValue >= habit.targetValue) {
        console.log(`[HealthSync] Habit ${habit.name} achieved target! (${currentHealthValue} >= ${habit.targetValue})`);
        
        // Auto-complete the habit
        await habitService.logCompletion(habit.id, today, currentHealthValue, 'Auto-synced from Health data');
        await useGamificationStore.getState().addXP(10);
        
        syncedCount++;
      } else {
        console.log(`[HealthSync] Habit ${habit.name} needs more progress (${currentHealthValue} / ${habit.targetValue})`);
      }
    }

    console.log(`[HealthSync] Sync complete. Auto-completed ${syncedCount} habits.`);
    return syncedCount;
    
  } catch (error) {
    console.error('[HealthSync] Error syncing health data:', error);
    throw error;
  }
}

// Helper to start background polling
export function startHealthSyncPolling(intervalMinutes = 60) {
  // Sync immediately
  syncHealthHabits();
  
  // Setup interval
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(syncHealthHabits, intervalMs);
}
