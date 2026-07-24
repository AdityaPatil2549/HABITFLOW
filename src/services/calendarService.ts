import type { Habit } from '../types';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TOKEN_KEY = 'google_calendar_token';

export const calendarService = {
  isCalendarConnected(): boolean {
    if (!isFirebaseConfigured()) return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },

  async connectCalendar(): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    
    // Force prompt to ensure we get a fresh token
    provider.setCustomParameters({
      prompt: 'consent'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      throw error;
    }
  },

  disconnectCalendar(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async syncHabitToCalendar(habit: Habit): Promise<void> {
    if (!this.isCalendarConnected()) return;
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Create an all-day event or a scheduled event based on habit config (simplified to 30 min event for now)
    const startTime = new Date();
    // Default to a 30-minute block for the habit
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const event = {
      summary: `Habit: ${habit.icon} ${habit.name}`,
      description: `Habit tracked via HabitFlow: ${habit.name}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: true,
      },
    };

    try {
      const response = await fetch(CALENDAR_API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (response.status === 401) {
        // Token expired
        this.disconnectCalendar();
        console.warn('Google Calendar token expired. Please reconnect.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to sync habit to calendar:', error);
    }
  },

  async removeCalendarEvent(habitId: string): Promise<void> {
    if (!this.isCalendarConnected()) return;
    // Without storing the Google Calendar Event ID, we can't easily delete it here.
    // A robust implementation would store the calendarEventId alongside the habit in Firestore.
    // For now, this remains a no-op until that DB schema is added.
    console.log(`removeCalendarEvent called for ${habitId}, but event mapping is not yet implemented.`);
  },

  async markHabitDoneInCalendar(
    habitName: string,
    habitIcon: string,
    date: string
  ): Promise<void> {
    if (!this.isCalendarConnected()) return;
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Create an all-day event marking completion
    const event = {
      summary: `✅ Completed: ${habitIcon} ${habitName}`,
      description: 'Habit marked as done in HabitFlow.',
      start: {
        date: date,
      },
      end: {
        date: date,
      }
    };

    try {
      const response = await fetch(CALENDAR_API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (response.status === 401) {
        this.disconnectCalendar();
        console.warn('Google Calendar token expired. Please reconnect.');
        return;
      }
    } catch (error) {
      console.error('Failed to mark habit done in calendar:', error);
    }
  }
};
