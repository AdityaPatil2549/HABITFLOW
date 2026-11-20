import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Users,
  Settings,
  CheckSquare,
  ChevronRight,
  Shield,
  FileText,
  Palette,
  Gauge,
  Smartphone,
  Download,
} from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useGamificationStore } from '../store/gamificationStore';
import { useAuthStore } from '../store/authStore';
import { getOrCreateSettings } from '../db';
import { calculateStats } from '../services/gamificationService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundService } from '../services/soundService';
import {
  ACCENT_CARTRIDGES,
  normalizeAccentTheme,
  resolvePolarityMode,
  resolveTelemetryMode,
} from '../lib/theme';
import type { Settings as SettingsType } from '../types';

const HUB_DESTINATIONS = [
  {
    to: '/hub/profile',
    title: 'Operator Profile',
    description: 'Identity badges, earned streaks, lifetime level progression & stats.',
    icon: User,
  },
  {
    to: '/hub/shop',
    title: 'Armory & Inks',
    description: 'Unlock Signal Ink cartridges, Continuity Shields, and Acoustic Packs.',
    icon: ShoppingBag,
  },
  {
    to: '/hub/squad',
    title: 'Accountability Squad',
    description: 'Synchronize shared execution accountability with trusted partners.',
    icon: Users,
  },
  {
    to: '/hub/tasks',
    title: 'Task Backlog',
    description: 'Full tactical task inbox, priority queues, and scheduled items.',
    icon: CheckSquare,
  },
  {
    to: '/hub/settings',
    title: 'System Preferences',
    description: 'Surface polarity, Telemetry discipline mode, calendars, and audio triggers.',
    icon: Settings,
  },
  {
    to: '/hub/settings',
    title: 'Data Vault & Backups',
    description: 'Export JSON/CSV archives, inspect local IndexedDB storage, and manage cloud sync.',
    icon: Shield,
  },
];

export function HubPage() {
  const { profile } = useProfileStore();
  const { userXP, loadXP } = useGamificationStore();
  const { isGuest } = useAuthStore();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const { canInstall, isInstalled, isIOS, isNativePromptReady, promptInstall, resetDismissal } =
    usePWAInstall();

  useEffect(() => {
    document.title = 'Hub — HabitFlow';
    loadXP();
    getOrCreateSettings().then(setSettings);
  }, [loadXP]);

  const stats = calculateStats(userXP?.total ?? 0);
  const telemetryMode = resolveTelemetryMode(settings, stats.numericLevel);
  const polarityMode = resolvePolarityMode(settings);
  const activeCartridge =
    ACCENT_CARTRIDGES.find(c => c.id === normalizeAccentTheme(settings?.theme)) ??
    ACCENT_CARTRIDGES[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="pb-4 border-b border-[var(--border-default)]">
        <p className="font-label-caps">Workspace / Hub</p>
        <h1 className="font-h1 text-[var(--tx-primary)] mt-1">Command Hub</h1>
        <p className="text-sm text-[var(--tx-secondary)] mt-1">
          Configure instrument behavior, inspect operator credentials, and manage local data.
        </p>
      </div>

      {/* Operator & System Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-raised p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-default)] flex items-center justify-center font-mono font-bold text-sm text-[var(--accent-ink)]">
            {profile.name?.[0]?.toUpperCase() || 'O'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--tx-primary)] truncate">
              {isGuest ? 'Guest Operator' : profile.name}
            </p>
            <p className="text-xs text-[var(--tx-secondary)]">
              {telemetryMode === 'monastic'
                ? 'Monastic Discipline'
                : `Lv.${stats.numericLevel} · ${userXP?.coins ?? 0} Coins`}
            </p>
          </div>
        </div>

        <div className="card-raised p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-ink)]">
            <Palette size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-label-caps">Ink & Polarity</p>
            <p className="text-sm font-semibold text-[var(--tx-primary)] truncate mt-0.5">
              {activeCartridge.label} · {polarityMode}
            </p>
          </div>
        </div>

        <div className="card-raised p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-ink)]">
            <Gauge size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-label-caps">Telemetry Mode</p>
            <p className="text-sm font-semibold text-[var(--tx-primary)] capitalize mt-0.5">
              {telemetryMode}
            </p>
          </div>
        </div>
      </div>

      {/* PWA Native Installation Callout (if uninstalled) */}
      {canInstall && !isInstalled && (
        <div className="card-raised p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--accent)]/40 bg-[var(--accent-subtle)]/15 rounded-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent-ink)] shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--tx-primary)]">
                Install HabitFlow App
              </h3>
              <p className="text-xs text-[var(--tx-secondary)] mt-0.5">
                Install to your home screen for full offline vaults, gesture navigation, and distraction-free tracking.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              soundService.playTick();
              if (isNativePromptReady) {
                await promptInstall();
              } else if (isIOS) {
                resetDismissal();
                alert(
                  'On iOS Safari: Tap the Share button at the bottom of the screen, then choose "Add to Home Screen".'
                );
              }
            }}
            className="btn-primary py-2 px-4 text-xs font-semibold shrink-0 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download size={14} />
            <span>Install Now</span>
          </button>
        </div>
      )}

      {/* Hub Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {HUB_DESTINATIONS.map(dest => {
          const Icon = dest.icon;
          return (
            <Link
              key={dest.to}
              to={dest.to}
              className="card-raised p-4 flex items-center justify-between gap-4 hover:border-[var(--border-strong)] transition-colors group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-ink)] shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--tx-primary)] group-hover:text-[var(--accent-ink)] transition-colors">
                    {dest.title}
                  </h2>
                  <p className="text-xs text-[var(--tx-secondary)] mt-0.5 leading-relaxed">
                    {dest.description}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-[var(--tx-muted)] group-hover:text-[var(--tx-primary)] shrink-0 transition-colors"
              />
            </Link>
          );
        })}
      </div>

      {/* Governance & Legal Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)] text-xs text-[var(--tx-muted)]">
        <span className="font-mono">HabitFlow Local-First Vault</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="inline-flex items-center gap-1 hover:text-[var(--tx-primary)]">
            <Shield size={12} /> Privacy
          </Link>
          <Link to="/terms" className="inline-flex items-center gap-1 hover:text-[var(--tx-primary)]">
            <FileText size={12} /> Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

