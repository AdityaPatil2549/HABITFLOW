import { db, getOrCreateSettings } from '../db';
import { format } from 'date-fns';
import { Habit, HabitLog } from '../types';

class NotificationService {
  private checkInterval: number | null = null;
  private notifiedToday: Set<string> = new Set();
  private lastDate: string = format(new Date(), 'yyyy-MM-dd');

  start() {
    if (this.checkInterval) return;

    // Check every minute
    this.checkInterval = window.setInterval(() => {
      this.checkReminders();
      this.checkSmartNotifications();
    }, 60_000);

    // Initial check
    this.checkReminders();
    this.checkSmartNotifications();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkReminders() {
    try {
      const settings = await getOrCreateSettings();
      if (!settings.notificationsEnabled) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const timeStr = format(now, 'HH:mm'); // e.g. "09:00"
      const currentDay = now.getDay(); // 0-6

      // Reset notified set on a new day
      if (today !== this.lastDate) {
        this.notifiedToday.clear();
        this.lastDate = today;
      }

      const habits = await db.habits.toArray();

      for (const habit of habits) {
        if (habit.archived) continue;

        // Check if habit has a reminder time
        if (!habit.reminderTime) continue;

        // Check if reminder is scheduled for today
        if (
          habit.reminderDays &&
          habit.reminderDays.length > 0 &&
          !habit.reminderDays.includes(currentDay)
        ) {
          continue;
        }

        // Is it the right time? (Checking exact HH:mm)
        if (habit.reminderTime === timeStr) {
          const notifKey = `${habit.id}-${today}`;

          if (!this.notifiedToday.has(notifKey)) {
            // Check if already logged today
            const log = await db.habitLogs.where({ habitId: habit.id, date: today }).first();
            const habitIsDone =
              log && log.value >= (habit.type === 'boolean' ? 1 : habit.targetValue);

            if (!habitIsDone) {
              this.sendNotification(habit.name, habit.icon);
              this.notifiedToday.add(notifKey);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check reminders:', error);
    }
  }

  private async checkSmartNotifications() {
    try {
      const settings = await getOrCreateSettings();
      if (!settings.notificationsEnabled) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentHour = now.getHours();

      const habits = await db.habits.filter(h => !h.archived).toArray();
      if (habits.length === 0) return;

      // Parse configurable briefing time (default: 7 AM–11 AM)
      let briefingStartHour = 7;
      let briefingEndHour = 11;
      if (settings.morningBriefingTime) {
        const [h] = settings.morningBriefingTime.split(':').map(Number);
        if (!isNaN(h)) {
          briefingStartHour = Math.max(0, h - 1);
          briefingEndHour = Math.min(23, h + 1);
        }
      }

      // 1. Morning Briefing (configurable window, default 7–11 AM)
      const briefingKey = `morning-briefing-${today}`;
      if (
        currentHour >= briefingStartHour &&
        currentHour <= briefingEndHour &&
        !this.notifiedToday.has(briefingKey)
      ) {
        const pending = await this.getPendingHabitsForToday(habits, today);
        if (pending.length > 0) {
          this.sendNotification(
            `Good morning! You have ${pending.length} habits to complete today.`,
            '🌅'
          );
          this.notifiedToday.add(briefingKey);
        }
      }

      // 2. Streak Saver (Between 6 PM and 11 PM)
      const streakSaverKey = `streak-saver-${today}`;
      if (currentHour >= 18 && currentHour <= 23 && !this.notifiedToday.has(streakSaverKey)) {
        const pending = await this.getPendingHabitsForToday(habits, today);
        const atRisk = pending.find(h => h.streak.current >= 3);

        if (atRisk) {
          this.sendNotification(
            `You're about to lose your ${atRisk.streak.current}-day "${atRisk.name}" streak! 1 hour left.`,
            '🚨'
          );
          this.notifiedToday.add(streakSaverKey);
        }
      }
    } catch (error) {
      console.error('Failed to check smart notifications:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getPendingHabitsForToday(habits: any[], today: string) {
    const logs = await db.habitLogs.where('date').equals(today).toArray();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    return habits.filter(habit => {
      // Check frequency: weekly habits only fire on their scheduled days
      if (habit.frequency === 'weekly' && Array.isArray(habit.frequencyDays)) {
        if (!habit.frequencyDays.includes(currentDay)) {
          return false;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const log = logs.find((l: any) => l.habitId === habit.id);
      if (!log) return true;
      return log.value < (habit.type === 'boolean' ? 1 : habit.targetValue);
    });
  }

  private sendNotification(title: string, _icon: string) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg && reg.showNotification) {
          reg.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            silent: false,
          });
        }
      });
    } else {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        silent: false,
      });
    }
  }

  // Used to test the functionality from the settings page
  async sendTestNotification() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('HabitFlow Notifications Enabled!', {
        body: 'You will now receive reminders for your habits.',
        icon: '/pwa-192x192.png',
      });
    }
  }
}

export const notificationService = new NotificationService();
