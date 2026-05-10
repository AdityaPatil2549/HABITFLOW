import { db, getOrCreateSettings } from '../db';
import { format } from 'date-fns';

class NotificationService {
  private checkInterval: number | null = null;
  private notifiedToday: Set<string> = new Set();
  private lastDate: string = format(new Date(), 'yyyy-MM-dd');

  start() {
    if (this.checkInterval) return;

    // Check every minute
    this.checkInterval = window.setInterval(() => this.checkReminders(), 60_000);

    // Initial check
    this.checkReminders();
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

  private sendNotification(habitName: string, icon: string) {
    new Notification(`Time for your habit: ${habitName}`, {
      body: `Don't forget to ${habitName.toLowerCase()} to keep your streak!`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      silent: false,
    });
  }

  // Used to test the functionality from the settings page
  async sendTestNotification() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('HabitFlow Notifications Enabled!', {
        body: 'You will now receive reminders for your habits.',
        icon: '/vite.svg',
      });
    }
  }
}

export const notificationService = new NotificationService();
