/**
 * Firebase Remote Config Service
 * Enables changing app behaviour (feature flags, AI prompts, messages)
 * from the Firebase Console without redeploying the app.
 */
import {
  fetchAndActivate,
  getValue,
  getBoolean,
  getString,
} from 'firebase/remote-config';
import { remoteConfig, isFirebaseConfigured } from '@/lib/firebase';

// Default values — these are used until the first successful fetch
const DEFAULTS: Record<string, string | boolean | number> = {
  ai_coach_enabled: true,
  ai_prompt_style: 'coach',         // 'coach' | 'friend' | 'scientific'
  welcome_message: 'Build habits that stick. 🌱',
  google_fit_enabled: true,
  google_drive_enabled: true,
  youtube_recommendations_enabled: true,
  location_triggers_enabled: true,
  max_habits_free: 10,
  app_version_message: '',
};

// Cache fetch — Remote Config has a minimum fetch interval
let initialized = false;

async function init(): Promise<void> {
  if (!isFirebaseConfigured() || initialized) return;
  try {
    remoteConfig.defaultConfig = DEFAULTS;
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    await fetchAndActivate(remoteConfig);
    initialized = true;
  } catch (e) {
    console.warn('[RemoteConfig] Failed to fetch remote config, using defaults:', e);
  }
}

export const remoteConfigService = {
  init,

  isFeatureEnabled(flag: string): boolean {
    if (!isFirebaseConfigured()) return Boolean(DEFAULTS[flag] ?? true);
    try {
      return getBoolean(remoteConfig, flag);
    } catch {
      return Boolean(DEFAULTS[flag] ?? true);
    }
  },

  getString(key: string): string {
    if (!isFirebaseConfigured()) return String(DEFAULTS[key] ?? '');
    try {
      return getString(remoteConfig, key);
    } catch {
      return String(DEFAULTS[key] ?? '');
    }
  },

  getNumber(key: string): number {
    if (!isFirebaseConfigured()) return Number(DEFAULTS[key] ?? 0);
    try {
      return getValue(remoteConfig, key).asNumber();
    } catch {
      return Number(DEFAULTS[key] ?? 0);
    }
  },

  getAIPromptStyle(): 'coach' | 'friend' | 'scientific' {
    const v = this.getString('ai_prompt_style');
    return (['coach', 'friend', 'scientific'].includes(v) ? v : 'coach') as 'coach' | 'friend' | 'scientific';
  },

  getWelcomeMessage(): string {
    return this.getString('welcome_message');
  },

  isAICoachEnabled(): boolean {
    return this.isFeatureEnabled('ai_coach_enabled');
  },
};
