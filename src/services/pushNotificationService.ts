/**
 * Push Notification Service for HabitFlow PWA
 *
 * Enhances the existing notification service with true Web Push API support.
 * Falls back gracefully to the existing Notification API when push is unavailable.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSubscribed = false;

  /**
   * Initialize the push notification service.
   * Checks for SW registration, existing subscriptions, and permission state.
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = subscription !== null;
    } catch (error) {
      console.error('Failed to initialize push service:', error);
    }
  }

  /**
   * Request notification permission and subscribe to push.
   * Returns true if successfully subscribed.
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    // If push manager is available and VAPID key is set, subscribe
    if (this.swRegistration && VAPID_PUBLIC_KEY) {
      try {
        const subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
        });

        // Store subscription for server-side push (when Supabase Edge Functions are configured)
        this.saveSubscription(subscription);
        this.isSubscribed = true;
        return true;
      } catch (error) {
        console.warn('Push subscription failed, using basic notifications:', error);
      }
    }

    // Fallback: basic notification permission is granted
    return true;
  }

  /**
   * Check if notifications are currently enabled.
   */
  isEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Check if push subscription is active.
   */
  isPushSubscribed(): boolean {
    return this.isSubscribed;
  }

  /**
   * Send a local notification immediately.
   * Works even without push subscription.
   */
  async sendLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isEnabled()) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultOptions: any = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      tag: 'habitflow-notification',
      renotify: true,
      ...options,
    };

    // Try SW notification first (works in background)
    if (this.swRegistration) {
      try {
        await this.swRegistration.showNotification(title, defaultOptions);
        return;
      } catch {
        // Fall through to basic Notification
      }
    }

    // Fallback to basic Notification API
    new Notification(title, defaultOptions);
  }

  /**
   * Schedule a notification for a specific time today.
   * Uses setTimeout for client-side scheduling.
   */
  scheduleNotification(
    title: string,
    time: string, // HH:MM format
    options?: NotificationOptions
  ): number | null {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, skip
    if (target <= now) return null;

    const delay = target.getTime() - now.getTime();
    const timerId = window.setTimeout(() => {
      this.sendLocalNotification(title, options);
    }, delay);

    return timerId;
  }

  /**
   * Send a morning briefing notification summarizing today's habits.
   */
  async sendMorningBriefing(habitCount: number, streakCount: number): Promise<void> {
    const messages = [
      `You have ${habitCount} habits to complete today. Let's go! 🚀`,
      `${habitCount} habits waiting for you. Your best streak is ${streakCount} days! 🔥`,
      `Good morning! ${habitCount} habits on your plate. Keep that ${streakCount}-day streak alive! ⭐`,
    ];
    const body = messages[Math.floor(Math.random() * messages.length)];

    await this.sendLocalNotification('☀️ Morning Briefing', {
      body,
      tag: 'morning-briefing',
      data: { type: 'morning-briefing', url: '/dashboard' },
    });
  }

  /**
   * Send a streak-at-risk warning notification.
   */
  async sendStreakWarning(habitName: string, streak: number): Promise<void> {
    await this.sendLocalNotification(`⚠️ Streak at Risk!`, {
      body: `Your ${streak}-day streak for "${habitName}" is about to break! Complete it now.`,
      tag: `streak-warning-${habitName}`,
      requireInteraction: true,
      data: { type: 'streak-warning', url: '/habits' },
    });
  }

  /**
   * Send a celebration notification for milestones.
   */
  async sendCelebration(title: string, body: string): Promise<void> {
    await this.sendLocalNotification(`🎉 ${title}`, {
      body,
      tag: 'celebration',
      data: { type: 'celebration' },
    });
  }

  /**
   * Unsubscribe from push notifications.
   */
  async unsubscribe(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      this.isSubscribed = false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private saveSubscription(subscription: PushSubscription): void {
    try {
      localStorage.setItem('habitflow_push_subscription', JSON.stringify(subscription.toJSON()));
    } catch {
      console.warn('Could not save push subscription to localStorage');
    }
  }
}

export const pushNotificationService = new PushNotificationService();
