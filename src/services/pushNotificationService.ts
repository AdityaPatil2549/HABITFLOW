/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 * Replaces the previous VAPID-based push service with FCM for better
 * cross-platform support and Firebase integration.
 */
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db as firestoreDb, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const FCM_VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSubscribed = false;

  /**
   * Initialize the push notification service.
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[FCM] Push notifications not supported in this browser');
      return;
    }
    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      // Check if already subscribed via local state
      this.isSubscribed = !!localStorage.getItem('fcm_token');
    } catch (error) {
      console.error('[FCM] Failed to initialize push service:', error);
    }
  }

  /**
   * Request permission and register this device with FCM.
   * Saves the token to Firestore so server can send targeted pushes.
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    if (messaging && FCM_VAPID_KEY) {
      try {
        const token = await getToken(messaging, {
          vapidKey: FCM_VAPID_KEY,
          serviceWorkerRegistration: this.swRegistration ?? undefined,
        });

        if (token) {
          localStorage.setItem('fcm_token', token);
          this.isSubscribed = true;

          // Save token to Firestore (for authenticated users)
          const user = auth.currentUser;
          if (user) {
            await setDoc(
              doc(firestoreDb, 'fcm_tokens', user.uid),
              { token, updatedAt: new Date().toISOString(), uid: user.uid },
              { merge: true }
            );
          }

          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            const notificationTitle = payload.notification?.title || 'HabitFlow';
            const notificationOptions = {
              body: payload.notification?.body,
              icon: '/logo.png',
              badge: '/logo.png',
              data: payload.data,
            };
            this.swRegistration?.showNotification(notificationTitle, notificationOptions);
          });

          return true;
        }
      } catch (error) {
        console.warn('[FCM] Token registration failed, using basic notifications:', error);
      }
    }

    // Fallback: basic Notification API
    return true;
  }

  isEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  isPushSubscribed(): boolean {
    return this.isSubscribed;
  }

  getToken(): string | null {
    return localStorage.getItem('fcm_token');
  }

  /**
   * Send a local notification immediately (works even without FCM token).
   */
  async sendLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isEnabled()) return;

    const defaultOptions: NotificationOptions = {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'habitflow-notification',
      ...options,
    };

    if (this.swRegistration) {
      try {
        await this.swRegistration.showNotification(title, defaultOptions);
        return;
      } catch {
        // Fall through
      }
    }
    new Notification(title, defaultOptions);
  }

  /**
   * Schedule a notification for a specific time today.
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
    if (target <= now) return null;
    const delay = target.getTime() - now.getTime();
    return window.setTimeout(() => this.sendLocalNotification(title, options), delay);
  }

  async sendMorningBriefing(habitCount: number, streakCount: number): Promise<void> {
    const messages = [
      `You have ${habitCount} habits to complete today. Let's go! 🚀`,
      `${habitCount} habits waiting. Your best streak is ${streakCount} days! 🔥`,
      `Good morning! ${habitCount} habits on your plate. Keep that ${streakCount}-day streak alive! ⭐`,
    ];
    await this.sendLocalNotification('☀️ Morning Briefing', {
      body: messages[Math.floor(Math.random() * messages.length)],
      tag: 'morning-briefing',
    });
  }

  async sendStreakWarning(habitName: string, streak: number): Promise<void> {
    await this.sendLocalNotification('⚠️ Streak at Risk!', {
      body: `Your ${streak}-day streak for "${habitName}" is about to break! Complete it now.`,
      tag: `streak-warning-${habitName}`,
    });
  }

  async sendCelebration(title: string, body: string): Promise<void> {
    await this.sendLocalNotification(`🎉 ${title}`, { body, tag: 'celebration' });
  }

  async unsubscribe(): Promise<void> {
    localStorage.removeItem('fcm_token');
    this.isSubscribed = false;
    if (!this.swRegistration) return;
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
    } catch (error) {
      console.error('[FCM] Failed to unsubscribe:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
