import { useEffect, useState, useRef } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Bell,
  Shield,
  Palette,
  Database,
  Calendar,
  CloudOff,
  Activity,
  HardDrive,
  Zap,
  Camera,
  MapPin,
  Youtube,
} from 'lucide-react';
import { db, getOrCreateSettings } from '../db';
import type { PolarityMode, Settings, TelemetryMode, Theme } from '../types';
import {
  ACCENT_CARTRIDGES,
  applyAppearanceToDocument,
  getEffectivePolarity,
  normalizeAccentTheme,
  normalizeUnlockedThemes,
  resolvePolarityMode,
  resolveTelemetryMode,
} from '../lib/theme';
import { Sun, Moon, Monitor, Lock as CartridgeLock, Gauge } from 'lucide-react';
import { format } from 'date-fns';
import { notificationService } from '../services/notificationService';
import { motion } from 'framer-motion';
import { useGamificationStore } from '../store/gamificationStore';
import { calculateStats } from '../services/gamificationService';
import { useToast } from '../components/common/toastStore';
import { calendarService } from '../services/calendarService';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { driveService } from '../services/driveService';
import { healthSyncService } from '../services/healthSyncService';
import { storageService } from '../services/storageService';

const POLARITY_OPTIONS: { value: PolarityMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Carbon Dark', icon: Moon },
  { value: 'light', label: 'Warm Paper', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

const TELEMETRY_OPTIONS: { value: TelemetryMode; label: string; detail: string }[] = [
  { value: 'scaffold', label: 'Scaffold', detail: 'XP bar, coins, celebration toasts & milestone feedback.' },
  { value: 'instrument', label: 'Instrument', detail: 'Momentum %, continuity tape & streaks. Rewards accumulate silently.' },
  { value: 'monastic', label: 'Monastic', detail: 'Pure execution checklist. No scores, flames, or XP telemetry.' },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [exported, setExported] = useState(false);
  const [csvExported, setCsvExported] = useState(false);
  const [driveConnected, setDriveConnected] = useState(driveService.isDriveConnected());
  const [fitConnected, setFitConnected] = useState(healthSyncService.isFitConnected());
  const [driveLoading, setDriveLoading] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { isGuest } = useAuthStore();
  const isCalendarConnected = calendarService.isCalendarConnected();

  const { userXP, loadXP } = useGamificationStore();

  useEffect(() => {
    getOrCreateSettings().then(setSettings);
    loadXP();
  }, [loadXP]);

  useEffect(() => {
    document.title = 'Settings — HabitFlow';
  }, []);

  async function saveSetting(update: Partial<Settings>) {
    if (!settings) return;
    const syncedUpdate: Partial<Settings> = { ...update };
    if (update.polarity) {
      syncedUpdate.darkMode = update.polarity;
    }
    const updated = { ...settings, ...syncedUpdate };
    await db.settings.update(settings.id, syncedUpdate);
    setSettings(updated);

    const nextPolarity = resolvePolarityMode(updated);
    const nextTheme = normalizeAccentTheme(updated.theme);
    applyAppearanceToDocument(nextPolarity, nextTheme);
    window.dispatchEvent(new CustomEvent('habitflow-appearance-changed'));
  }

  async function handleExport() {
    const [habits, habitLogs, tasks, projects, moods, userXP] = await Promise.all([
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.tasks.toArray(),
      db.projects.toArray(),
      db.moods.toArray(),
      db.userXP.toArray(),
    ]);
    const blob = new Blob(
      [
        JSON.stringify(
          {
            habits,
            habitLogs,
            tasks,
            projects,
            moods,
            userXP,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  async function handleConnectDrive() {
    if (isGuest) { toast.error('Sign in to use Google Drive backup'); return; }
    setDriveLoading(true);
    try {
      if (driveConnected) {
        driveService.disconnectDrive();
        setDriveConnected(false);
        toast.success('Google Drive disconnected');
      } else {
        await driveService.connectDrive();
        setDriveConnected(true);
        toast.success('Google Drive connected! 🎉');
      }
    } catch {
      toast.error('Failed to connect Google Drive. Please try again.');
    } finally {
      setDriveLoading(false);
    }
  }

  async function handleDriveBackup() {
    if (!driveConnected) { toast.error('Connect Google Drive first'); return; }
    setDriveLoading(true);
    try {
      const [habits, habitLogs, tasks, projects, moods] = await Promise.all([
        db.habits.toArray(), db.habitLogs.toArray(),
        db.tasks.toArray(), db.projects.toArray(), db.moods.toArray(),
      ]);
      await driveService.saveBackupToDrive({ habits, habitLogs, tasks, projects, moods, app: 'HabitFlow', exportedAt: new Date().toISOString() });
      toast.success('Backup saved to Google Drive! ☁️');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Drive backup failed');
    } finally {
      setDriveLoading(false);
    }
  }

  async function handleConnectFit() {
    setFitLoading(true);
    try {
      if (fitConnected) {
        healthSyncService.disconnectFit();
        setFitConnected(false);
        toast.success('Google Fit disconnected');
      } else {
        await healthSyncService.connectGoogleFit();
        setFitConnected(true);
        toast.success('Google Fit connected! Steps & sleep will now sync. 🏃');
      }
    } catch {
      toast.error('Failed to connect Google Fit. Please try again.');
    } finally {
      setFitLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isGuest) { toast.error('Sign in to upload a profile photo'); return; }
    setPhotoUploading(true);
    try {
      await storageService.uploadProfilePhoto(file);
      toast.success('Profile photo updated! 📸');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Photo upload failed');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }

  async function handleExportCSV() {
    const habits = await db.habits.toArray();
    const logs = await db.habitLogs.toArray();
    const habitMap = new Map(habits.map(h => [h.id, h]));
    const headers = ['Date', 'Habit Name', 'Category', 'Type', 'Value', 'Mood (1-5)', 'Note'];
    const rows = logs.map(l => {
      const h = habitMap.get(l.habitId);
      const escape = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
      return [
        l.date,
        escape(h?.name || 'Unknown Habit'),
        escape(h?.category || ''),
        escape(h?.type || ''),
        l.value,
        '',
        escape(l.note || ''),
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitflow-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvExported(true);
    setTimeout(() => setCsvExported(false), 2000);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate required data shape
      const isValid =
        data &&
        typeof data === 'object' &&
        (!data.habits || Array.isArray(data.habits)) &&
        (!data.habitLogs || Array.isArray(data.habitLogs)) &&
        (!data.tasks || Array.isArray(data.tasks)) &&
        (!data.projects || Array.isArray(data.projects)) &&
        (!data.moods || Array.isArray(data.moods)) &&
        (!data.userXP || Array.isArray(data.userXP));

      if (!isValid) {
        toast.error('Invalid backup file: unexpected data format.');
        e.target.value = '';
        return;
      }

      // Check that arrays contain objects with id fields
      const hasIds = (arr: unknown[]) =>
        arr.length === 0 ||
        arr.every(
          (item): item is { id: unknown } =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            (item as { id?: unknown }).id !== undefined
        );
      if (
        (data.habits && !hasIds(data.habits)) ||
        (data.tasks && !hasIds(data.tasks)) ||
        (data.habitLogs && !hasIds(data.habitLogs))
      ) {
        toast.error('Invalid backup file: records missing required ID fields.');
        e.target.value = '';
        return;
      }

      toast.confirm(
        `Import ${data.habits?.length ?? 0} habits, ${data.tasks?.length ?? 0} tasks, and ${data.habitLogs?.length ?? 0} logs? This will overwrite existing data for the imported categories.`,
        async () => {
          await db.transaction(
            'rw',
            [db.habits, db.habitLogs, db.tasks, db.projects, db.moods, db.userXP],
            async () => {
              if (data.habits) {
                await db.habits.clear();
                await db.habits.bulkAdd(data.habits);
              }
              if (data.habitLogs) {
                await db.habitLogs.clear();
                await db.habitLogs.bulkAdd(data.habitLogs);
              }
              if (data.tasks) {
                await db.tasks.clear();
                await db.tasks.bulkAdd(data.tasks);
              }
              if (data.projects) {
                await db.projects.clear();
                await db.projects.bulkAdd(data.projects);
              }
              if (data.moods) {
                await db.moods.clear();
                await db.moods.bulkAdd(data.moods);
              }
              if (data.userXP) {
                await db.userXP.clear();
                await db.userXP.bulkAdd(data.userXP);
              }
            }
          );
          toast.success('Import successful! Reloading…');
          setTimeout(() => window.location.reload(), 1200);
        },
        { confirmLabel: 'Import & Replace', cancelLabel: 'Cancel', danger: true }
      );
    } catch {
      toast.error('Import failed: could not parse file as valid JSON.');
    }
    e.target.value = '';
  }

  async function handleReset() {
    toast.confirm(
      'This will permanently delete ALL your HabitFlow data. Are you sure?',
      async () => {
        await Promise.all([
          db.habits.clear(),
          db.habitLogs.clear(),
          db.tasks.clear(),
          db.projects.clear(),
          db.moods.clear(),
          db.userXP.clear(),
        ]);
        localStorage.clear();
        toast.success('All data cleared.');
        setTimeout(() => window.location.reload(), 1000);
      },
      { confirmLabel: 'Delete Everything', danger: true }
    );
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      toast.error('Browser does not support notifications');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await saveSetting({ notificationsEnabled: true });
      notificationService.sendTestNotification();
      toast.success('Notifications enabled! Test sent.');
    } else {
      toast.warning('Notification permission denied. Please enable in browser settings.');
    }
  }

  if (!settings) return <div className="text-center py-16 text-[var(--tx-muted)]">Loading settings…</div>;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1">
          Preferences
        </p>
        <h1 className="text-3xl font-bold text-[var(--tx-primary)]">
          Settings
        </h1>
        <p className="text-[var(--tx-secondary)] text-sm mt-1">
          Configure your experience and manage your local data.
        </p>
      </div>

      {/* ─── Appearance ─── */}
      <section className="card-raised p-6 space-y-6">
        <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
          <Palette size={18} className="text-[var(--accent-ink)]" /> Appearance & Telemetry
        </h2>

        {/* Polarity Selector */}
        <div>
          <span className="font-label-caps mb-3 block">Surface Polarity</span>
          <div className="grid grid-cols-3 gap-2">
            {POLARITY_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const activePolarity = resolvePolarityMode(settings);
              const isSelected = activePolarity === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => saveSetting({ polarity: opt.value })}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                      : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Ink Cartridges */}
        <div>
          <label className="font-label-caps mb-3 flex items-center justify-between">
            <span>Accent Ink Cartridge</span>
            <Link
              to="/hub/shop"
              className="text-xs text-[var(--accent-ink)] hover:underline flex items-center gap-1.5 normal-case tracking-normal"
            >
              <Palette size={12} /> Armory Inks
            </Link>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            {ACCENT_CARTRIDGES.map(t => {
              const unlockedSet = normalizeUnlockedThemes(userXP?.unlockedThemes);
              const isUnlocked = unlockedSet.includes(t.id);
              const activeTheme = normalizeAccentTheme(settings.theme);
              const isSelected = activeTheme === t.id;
              const effectivePolarity = getEffectivePolarity(resolvePolarityMode(settings));
              const swatch = effectivePolarity === 'light' ? t.swatchLight : t.swatchDark;

              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && saveSetting({ theme: t.id as Theme })}
                  title={isUnlocked ? t.label : `${t.label} — Unlock in Armory`}
                  aria-label={isUnlocked ? `Select ${t.label}` : `${t.label} (locked)`}
                  className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-transform ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--sf-overlay)] scale-105'
                      : isUnlocked
                        ? 'border-[var(--border-default)] bg-[var(--sf-base)] hover:border-[var(--border-strong)] cursor-pointer'
                        : 'border-[var(--border-default)] bg-[var(--sf-base)] opacity-45 cursor-not-allowed'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-[var(--border-strong)] flex items-center justify-center"
                    style={{ backgroundColor: swatch }}
                  >
                    {isSelected && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            t.id === 'obsidian'
                              ? effectivePolarity === 'dark'
                                ? '#0B0B0E'
                                : '#FFFFFF'
                              : '#FFFFFF',
                        }}
                      />
                    )}
                    {!isUnlocked && <CartridgeLock size={10} className="text-white" />}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--tx-secondary)] truncate w-full text-center">
                    {t.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Telemetry Discipline Mode */}
        <div className="pt-2 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={14} className="text-[var(--accent-ink)]" />
            <span className="font-label-caps">Telemetry Mode</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TELEMETRY_OPTIONS.map(opt => {
              const numericLevel = calculateStats(userXP?.total ?? 0).numericLevel;
              const currentMode = resolveTelemetryMode(settings, numericLevel);
              const isSelected = currentMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => saveSetting({ telemetryMode: opt.value })}
                  className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border-default)] bg-[var(--sf-overlay)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <p className="text-xs font-bold text-[var(--tx-primary)]">{opt.label}</p>
                  <p className="text-[11px] text-[var(--tx-secondary)] mt-0.5 leading-snug">
                    {opt.detail}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold text-[var(--tx-primary)]">Week starts on Monday</p>
            <p className="text-xs text-[var(--tx-muted)]">Affects all charts and weekly views.</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.weekStartsOnMonday}
            aria-label="Toggle week starts on Monday"
            onClick={() => saveSetting({ weekStartsOnMonday: !settings.weekStartsOnMonday })}
            className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.weekStartsOnMonday ? 'bg-[var(--accent)]' : 'bg-[var(--sf-dim)] border border-[var(--border-default)]'}`}
          >
            <motion.div
              layout
              className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"
              animate={{ x: settings.weekStartsOnMonday ? 20 : 0 }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold text-[var(--tx-primary)]">Sound Effects</p>
            <p className="text-xs text-[var(--tx-secondary)]">
              Audible feedback when completing habits and leveling up.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={settings.soundEnabled !== false}
            aria-label="Toggle sound effects"
            onClick={() => {
              const current = settings.soundEnabled !== false;
              const next = !current;
              saveSetting({ soundEnabled: next });
              import('../services/soundService').then(m =>
                m.soundService.setEnabled(next, settings.hapticEnabled !== false)
              );
            }}
            className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.soundEnabled !== false ? 'bg-[var(--accent)]' : 'bg-[var(--sf-dim)] border border-[var(--border-default)]'}`}
          >
            <motion.div
              layout
              className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"
              animate={{ x: settings.soundEnabled !== false ? 20 : 0 }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold text-[var(--tx-primary)]">Haptic Feedback</p>
            <p className="text-xs text-[var(--tx-secondary)]">Vibration on habit completion (mobile only).</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.hapticEnabled !== false}
            aria-label="Toggle haptic feedback"
            onClick={() => {
              const current = settings.hapticEnabled !== false;
              const next = !current;
              saveSetting({ hapticEnabled: next });
              import('../services/soundService').then(m =>
                m.soundService.setEnabled(settings.soundEnabled !== false, next)
              );
            }}
            className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.hapticEnabled !== false ? 'bg-[var(--accent)]' : 'bg-[var(--sf-dim)] border border-[var(--border-default)]'}`}
          >
            <motion.div
              layout
              className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"
              animate={{ x: settings.hapticEnabled !== false ? 20 : 0 }}
            />
          </button>
        </div>
      </section>

      {/* ─── Notifications ─── */}
      <section className="card-raised p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
          <Bell size={18} className="text-[var(--accent)]" /> Notifications & Reminders
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--tx-primary)]">Daily Habit Reminders</p>
            <p className="text-xs text-[var(--tx-muted)]">
              Receive smart morning briefings, streak savers, and individual ritual reminders.
            </p>
          </div>
          {!settings.notificationsEnabled ? (
            <button
              className="px-4 py-2 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 text-xs font-bold hover:opacity-90 transition-all cursor-pointer self-start sm:self-auto"
              onClick={requestNotificationPermission}
            >
              Enable Notifications
            </button>
          ) : (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={async () => {
                  const sent = await notificationService.sendTestNotification();
                  if (sent) toast.success('Test notification dispatched!');
                  else toast.warning('Could not trigger notification. Check browser permissions.');
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--sf-overlay)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] border border-[var(--border-default)] text-xs font-medium cursor-pointer"
              >
                Send Test
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveSetting({ notificationsEnabled: false });
                  toast.info('Notifications paused.');
                }}
                className="px-3 py-1.5 rounded-lg text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 cursor-pointer"
              >
                Disable
              </button>
            </div>
          )}
        </div>

        {settings.notificationsEnabled && (
          <div className="pt-3 border-t border-[var(--border-default)] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="morning-briefing-time" className="text-xs font-medium text-[var(--tx-secondary)] block mb-1">
                Morning Briefing Time
              </label>
              <input
                id="morning-briefing-time"
                type="time"
                value={settings.morningBriefingTime || '08:00'}
                onChange={e => saveSetting({ morningBriefingTime: e.target.value })}
                className="input py-1.5 px-3 text-xs w-full font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)]">
              <div>
                <p className="text-xs font-medium text-[var(--tx-primary)]">Evening Streak Saver</p>
                <p className="text-[11px] text-[var(--tx-muted)]">Alert before day ends if streaks are at risk</p>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent-ink)] px-2 py-0.5 rounded bg-[var(--accent-subtle)]">
                Active
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ─── Integrations ─── */}
      <section className="card-raised p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
          <Calendar size={18} className="text-[var(--accent)]" /> Calendar Sync
        </h2>

        {isGuest ? (
          <div className="p-4 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[var(--tx-secondary)]">
              <CloudOff size={20} />
              <div className="text-sm">
                <p className="font-bold text-[var(--tx-primary)]">Google Calendar</p>
                <p className="text-xs">Sign in to sync your habits to your calendar.</p>
              </div>
            </div>
            <button
              onClick={() => useAuthStore.getState().signInWithGoogle()}
              className="px-4 py-2 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 text-xs font-bold hover:opacity-90 transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : !isCalendarConnected ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-bold text-amber-400">Google Calendar Disconnected</p>
              <p className="text-xs text-amber-400/70">
                Your Google session expired or calendar access was denied. Please sign in again.
              </p>
            </div>
            <button
              onClick={() => useAuthStore.getState().signInWithGoogle()}
              className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors whitespace-nowrap"
            >
              Reconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-semibold text-[var(--tx-primary)]">Sync Habits to Calendar</p>
                <p className="text-xs text-[var(--tx-muted)]">Create recurring events for your habits.</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.googleCalendarSync !== false}
                onClick={() => saveSetting({ googleCalendarSync: !settings.googleCalendarSync })}
                className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.googleCalendarSync !== false ? 'bg-[var(--accent)]' : 'bg-[var(--sf-dim)] border border-[var(--border-default)]'}`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"
                  animate={{ x: settings.googleCalendarSync !== false ? 20 : 0 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-semibold text-[var(--tx-primary)]">Log Completions to Calendar</p>
                <p className="text-xs text-[var(--tx-muted)]">
                  Create daily events when you complete habits.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.googleCalendarCompletions !== false}
                onClick={() =>
                  saveSetting({ googleCalendarCompletions: !settings.googleCalendarCompletions })
                }
                className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.googleCalendarCompletions !== false ? 'bg-[var(--accent)]' : 'bg-[var(--sf-dim)] border border-[var(--border-default)]'}`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"
                  animate={{ x: settings.googleCalendarCompletions !== false ? 20 : 0 }}
                />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Health & Fitness ── */}
      <section className="card-raised p-6 space-y-6">
        <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
          <Activity size={18} className="text-[var(--accent)]" /> Health & Fitness
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl">
            <div>
              <p className="text-sm font-bold text-[var(--tx-primary)]">Google Fit / Health Connect</p>
              <p className="text-xs text-[var(--tx-secondary)] mt-1">
                {fitConnected ? '✅ Connected — steps & sleep syncing' : 'Auto-complete fitness habits from your phone data'}
              </p>
            </div>
            <button
              onClick={handleConnectFit}
              disabled={fitLoading}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                fitConnected
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 hover:opacity-90'
              }`}
            >
              {fitLoading ? '…' : fitConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl opacity-60">
            <div>
              <p className="text-sm font-bold text-[var(--tx-primary)]">Apple Health (iOS)</p>
              <p className="text-xs text-[var(--tx-secondary)] mt-1">Requires native app installation</p>
            </div>
            <button disabled className="px-4 py-2 bg-[var(--sf-overlay)] text-[var(--tx-muted)] border border-[var(--border-default)] text-xs font-bold rounded-xl">Coming Soon</button>
          </div>
        </div>
      </section>

      {/* ── Google Integrations ── */}
      <section className="card-raised p-6 space-y-6">
        <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" /> Google Integrations
        </h2>
        <div className="space-y-3">

          {/* Google Drive Backup */}
          <div className="flex items-center justify-between p-4 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <HardDrive size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--tx-primary)]">Google Drive Backup</p>
                <p className="text-xs text-[var(--tx-secondary)] mt-0.5">
                  {driveConnected ? '✅ Connected — auto-backup ready' : 'Save & restore backups to your Drive'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {driveConnected && (
                <button
                  onClick={handleDriveBackup}
                  disabled={driveLoading}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  {driveLoading ? '…' : 'Backup Now'}
                </button>
              )}
              <button
                onClick={handleConnectDrive}
                disabled={driveLoading}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  driveConnected
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {driveLoading ? '…' : driveConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div className="flex items-center justify-between p-4 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Camera size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--tx-primary)]">Profile Photo</p>
                <p className="text-xs text-[var(--tx-secondary)] mt-0.5">Upload to Firebase Cloud Storage</p>
              </div>
            </div>
            <label className={`px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg cursor-pointer hover:bg-purple-500/30 transition-colors ${photoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {photoUploading ? 'Uploading…' : 'Upload Photo'}
              <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} />
            </label>
          </div>

          {/* Google Maps — Location Triggers */}
          <div className="flex items-center justify-between p-4 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MapPin size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--tx-primary)]">Location Triggers</p>
                <p className="text-xs text-[var(--tx-secondary)] mt-0.5">Remind me when I arrive at a location</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg">
              {import.meta.env.VITE_MAPS_API_KEY && import.meta.env.VITE_MAPS_API_KEY !== 'YOUR_MAPS_API_KEY_HERE' ? '✅ Active' : 'Add API Key'}
            </div>
          </div>

          {/* YouTube Recommendations */}
          <div className="flex items-center justify-between p-4 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Youtube size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--tx-primary)]">YouTube Recommendations</p>
                <p className="text-xs text-[var(--tx-secondary)] mt-0.5">Habit videos in your AI Coach tab</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg">
              {import.meta.env.VITE_YOUTUBE_API_KEY && import.meta.env.VITE_YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY_HERE' ? '✅ Active' : 'Add API Key'}
            </div>
          </div>

        </div>
      </section>

      {/* ── Data ── */}
      <section id="data" className="card-raised p-6 space-y-6">
        <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
          <Database size={18} className="text-[var(--accent)]" /> Data Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Download size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--tx-primary)]">
                {exported ? 'Exported!' : 'Export JSON'}
              </p>
              <p className="text-xs text-[var(--tx-secondary)]">Backup your data as a file.</p>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Download size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--tx-primary)]">
                {csvExported ? 'CSV Saved!' : 'Export CSV'}
              </p>
              <p className="text-xs text-[var(--tx-secondary)]">View logs in Excel/Sheets.</p>
            </div>
          </button>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all text-left cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--tx-primary)]">Import Backup</p>
              <p className="text-xs text-[var(--tx-secondary)]">Restore from a JSON file.</p>
            </div>
            <input type="file" accept=".json" className="sr-only" onChange={handleImport} />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Trash2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Reset Data</p>
              <p className="text-xs text-red-400/80">Permanently wipe all data.</p>
            </div>
          </button>
        </div>
      </section>

      {/* ─── Privacy ─── */}
      <section className="card-raised p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--tx-primary)]">Privacy & Security</h2>
            <p className="text-xs text-[var(--tx-secondary)] mt-1 leading-relaxed">
              HabitFlow uses secure cloud sync so your data is backed up and available across your devices.
              All syncing happens securely through our database infrastructure, ensuring your habits and progress
              remain private to you.
            </p>
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section className="text-center py-8">
        <img
          src="/logo.png"
          alt="HabitFlow Logo"
          className="h-20 w-auto mx-auto mb-4 object-contain drop-shadow-xl"
        />
        <p className="text-sm font-bold text-[var(--tx-primary)]">HabitFlow v1.2</p>
        <p className="text-xs text-[var(--tx-muted)] mt-1">Built with precision for peak performance.</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Link
            to="/privacy"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--tx-secondary)] hover:text-[var(--accent-ink)] transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--tx-secondary)] hover:text-[var(--accent-ink)] transition-colors"
          >
            Terms of Use
          </Link>
          <button
            onClick={() => toast.info('HabitFlow is an open-source project.')}
            className="text-xs font-semibold uppercase tracking-wider text-[var(--tx-secondary)] hover:text-[var(--accent-ink)] transition-colors"
          >
            Source Code
          </button>
        </div>
      </section>
    </div>
  );
}
