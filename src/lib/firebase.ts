import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { RemoteConfig } from 'firebase/remote-config';
import type { AI } from 'firebase/ai';
import type { Analytics } from 'firebase/analytics';
import type { Messaging } from 'firebase/messaging';
import type { FirebasePerformance } from 'firebase/performance';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'placeholder',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'placeholder',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

let warnedMissingConfig = false;

/**
 * Check if Firebase is properly configured.
 * Synchronous with zero Firebase SDK import overhead for guest/offline users.
 */
export function isFirebaseConfigured(): boolean {
  const configured = firebaseConfig.apiKey !== 'placeholder' && Boolean(firebaseConfig.apiKey);
  if (!configured && !warnedMissingConfig) {
    warnedMissingConfig = true;
    console.warn(
      'Firebase credentials missing. Cloud sync will be disabled. ' +
        'Set VITE_FIREBASE_* variables in .env.local'
    );
  }
  return configured;
}

let appPromise: Promise<FirebaseApp | null> | null = null;
let authPromise: Promise<Auth | null> | null = null;
let firestorePromise: Promise<Firestore | null> | null = null;
let storagePromise: Promise<FirebaseStorage | null> | null = null;
let remoteConfigPromise: Promise<RemoteConfig | null> | null = null;
let vertexAIPromise: Promise<AI | null> | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;
let performancePromise: Promise<FirebasePerformance | null> | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!isFirebaseConfigured()) return null;
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

      if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        try {
          const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
          initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true,
          });
        } catch {
          // AppCheck optional / offline gracefully tolerated
        }
      }
      return app;
    })();
  }
  return appPromise;
}

export async function getAuthInstance(): Promise<Auth | null> {
  if (!isFirebaseConfigured()) return null;
  if (!authPromise) {
    authPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getAuth } = await import('firebase/auth');
      return getAuth(app);
    })();
  }
  return authPromise;
}

export async function getFirestoreInstance(): Promise<Firestore | null> {
  if (!isFirebaseConfigured()) return null;
  if (!firestorePromise) {
    firestorePromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getFirestore } = await import('firebase/firestore');
      return getFirestore(app);
    })();
  }
  return firestorePromise;
}

export async function getStorageInstance(): Promise<FirebaseStorage | null> {
  if (!isFirebaseConfigured()) return null;
  if (!storagePromise) {
    storagePromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getStorage } = await import('firebase/storage');
      return getStorage(app);
    })();
  }
  return storagePromise;
}

export async function getRemoteConfigInstance(): Promise<RemoteConfig | null> {
  if (!isFirebaseConfigured()) return null;
  if (!remoteConfigPromise) {
    remoteConfigPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getRemoteConfig } = await import('firebase/remote-config');
      return getRemoteConfig(app);
    })();
  }
  return remoteConfigPromise;
}

export async function getVertexAIInstance(): Promise<AI | null> {
  if (!isFirebaseConfigured()) return null;
  if (!vertexAIPromise) {
    vertexAIPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getAI } = await import('firebase/ai');
      return getAI(app);
    })();
  }
  return vertexAIPromise;
}

export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (!isFirebaseConfigured()) return null;
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const supported = await isSupported().catch(() => false);
      return supported ? getAnalytics(app) : null;
    })();
  }
  return analyticsPromise;
}

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isFirebaseConfigured()) return null;
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getMessaging, isSupported } = await import('firebase/messaging');
      const supported = await isSupported().catch(() => false);
      return supported ? getMessaging(app) : null;
    })();
  }
  return messagingPromise;
}

export async function getPerformanceInstance(): Promise<FirebasePerformance | null> {
  if (!isFirebaseConfigured() || typeof window === 'undefined') return null;
  if (!performancePromise) {
    performancePromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;
      const { getPerformance } = await import('firebase/performance');
      return getPerformance(app);
    })();
  }
  return performancePromise;
}
