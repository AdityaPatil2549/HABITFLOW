/**
 * Firebase Analytics Service
 * Tracks user behaviour events with typed helpers.
 * All calls are no-ops when Analytics is unavailable (e.g. guest mode).
 */
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

function track(event: string, params?: Record<string, string | number | boolean>) {
  if (!analytics) return;
  try {
    logEvent(analytics, event, params);
  } catch (e) {
    // Silently fail — analytics should never break the app
  }
}

export const analyticsService = {
  /** Call once per page navigation */
  trackPageView(pageName: string) {
    track('page_view', { page_title: pageName, page_location: window.location.href });
  },

  /** When the user completes a habit */
  trackHabitCompleted(habitName: string, category: string) {
    track('habit_completed', { habit_name: habitName, category });
  },

  /** When a habit is created */
  trackHabitCreated(habitName: string, type: string) {
    track('habit_created', { habit_name: habitName, type });
  },

  /** When a streak milestone is reached */
  trackStreakMilestone(days: number, habitName: string) {
    track('streak_milestone', { days, habit_name: habitName });
  },

  /** When the AI Coach tab is opened */
  trackAICoachUsed() {
    track('ai_coach_opened');
  },

  /** When a notification permission is granted */
  trackNotificationEnabled() {
    track('notification_permission_granted');
  },

  /** When user signs in */
  trackSignIn(method: string) {
    track('login', { method });
  },

  /** When user signs up */
  trackSignUp(method: string) {
    track('sign_up', { method });
  },

  /** When a backup is exported */
  trackExport(format: 'json' | 'csv' | 'drive') {
    track('data_exported', { format });
  },

  /** Generic event for anything else */
  trackEvent(event: string, params?: Record<string, string | number | boolean>) {
    track(event, params);
  },
};
