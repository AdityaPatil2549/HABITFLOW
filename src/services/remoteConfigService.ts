/**
 * Firebase Remote Config Service
 * Enables changing app behaviour (feature flags, AI prompts, messages)
 * from the Firebase Console without redeploying the app.
 */
import { getRemoteConfigInstance, isFirebaseConfigured } from '@/lib/firebase';
import type { RemoteConfig } from 'firebase/remote-config';

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

let initialized = false;
let cachedConfig: RemoteConfig | null = null;
let rcModule: typeof import('firebase/remote-config') | null = null;

async function init(): Promise<void> {
  if (!isFirebaseConfigured() || initialized) return;
  try {
    const [remoteConfig, mod] = await Promise.all([
      getRemoteConfigInstance(),
      import('firebase/remote-config'),
    ]);
    if (!remoteConfig) return;
    remoteConfig.defaultConfig = DEFAULTS;
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
    await mod.fetchAndActivate(remoteConfig);
    cachedConfig = remoteConfig;
    rcModule = mod;
    initialized = true;
  } catch (e) {
    console.warn('[RemoteConfig] Failed to fetch remote config, using defaults:', e);
  }
}

export const remoteConfigService = {
  init,

  isFeatureEnabled(flag: string): boolean {
    if (!cachedConfig || !rcModule) return Boolean(DEFAULTS[flag] ?? true);
    try {
      return rcModule.getBoolean(cachedConfig, flag);
    } catch {
      return Boolean(DEFAULTS[flag] ?? true);
    }
  },

  getString(key: string): string {
    if (!cachedConfig || !rcModule) return String(DEFAULTS[key] ?? '');
    try {
      return rcModule.getString(cachedConfig, key);
    } catch {
      return String(DEFAULTS[key] ?? '');
    }
  },

  getNumber(key: string): number {
    if (!cachedConfig || !rcModule) return Number(DEFAULTS[key] ?? 0);
    try {
      return rcModule.getValue(cachedConfig, key).asNumber();
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
