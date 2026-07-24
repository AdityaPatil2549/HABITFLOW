import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAI } from 'firebase/ai';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as messagingSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import { getRemoteConfig } from 'firebase/remote-config';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'placeholder',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'placeholder',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

if (firebaseConfig.apiKey === 'placeholder') {
  console.warn(
    'Firebase credentials missing. Cloud sync will be disabled. ' +
      'Set VITE_FIREBASE_* variables in .env.local'
  );
}

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const remoteConfig = getRemoteConfig(app);

// App Check (reCAPTCHA v3) — runs only in browser
let appCheckInstance;
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}
export const appCheck = appCheckInstance;

// Vertex AI (Gemini) — requires Firebase configured
export const vertexAI = getAI(app);

// Analytics — only available in browsers that support it
export let analytics: ReturnType<typeof getAnalytics> | null = null;
analyticsSupported().then((yes) => {
  if (yes && firebaseConfig.apiKey !== 'placeholder') {
    analytics = getAnalytics(app);
  }
});

// Firebase Cloud Messaging — only in supported browsers (not Safari < 16)
export let messaging: ReturnType<typeof getMessaging> | null = null;
messagingSupported().then((yes) => {
  if (yes && firebaseConfig.apiKey !== 'placeholder') {
    messaging = getMessaging(app);
  }
});

// Firebase Performance Monitoring
export let performance: ReturnType<typeof getPerformance> | null = null;
if (typeof window !== 'undefined' && firebaseConfig.apiKey !== 'placeholder') {
  performance = getPerformance(app);
}

/**
 * Check if Firebase is properly configured.
 * Returns false when running in local-only / guest mode.
 */
export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== 'placeholder' && !!firebaseConfig.apiKey;
}
