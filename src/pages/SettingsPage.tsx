import { useEffect, useState } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  Bell,
  Shield,
  Palette,
  Database,
  Info,
  CheckCircle2,
  Calendar,
  CloudOff,
  Activity,
} from 'lucide-react';
import { db, getOrCreateSettings } from '../db';
import type { Settings, Theme } from '../types';
import { format } from 'date-fns';
import { notificationService } from '../services/notificationService';
import { motion } from 'framer-motion';
import { useGamificationStore } from '../store/gamificationStore';
import { useToast } from '../components/common/Toast';
import { calendarService } from '../services/calendarService';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const THEMES: { value: Theme; label: string; color: string }[] = [
  { value: 'indigo', label: 'Indigo', color: '#6366f1' },
  { value: 'violet', label: 'Violet', color: '#8b5cf6' },
  { value: 'emerald', label: 'Emerald', color: '#10b981' },
  { value: 'rose', label: 'Rose', color: '#f43f5e' },
  { value: 'amber', label: 'Amber', color: '#f59e0b' },
  { value: 'neon', label: 'Neon Pink', color: '#ec4899' },
  { value: 'cyberpunk', label: 'Cyberpunk', color: '#eab308' },
  { value: 'sunset', label: 'Sunset Glow', color: '#f97316' },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [exported, setExported] = useState(false);
  const [csvExported, setCsvExported] = useState(false);
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
    const updated = { ...settings, ...update };
    await db.settings.update(settings.id, update);
    setSettings(updated);

    const root = document.documentElement;
    if (update.darkMode) {
      root.classList.toggle('light', update.darkMode === 'light');
    }
    if (update.theme) {
      if (update.theme === 'indigo') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', update.theme);
    }
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
        l.mood || '',
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
      const hasIds = (arr: any[]) =>
        arr.length === 0 || arr.every((item: any) => item && typeof item.id !== 'undefined');
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
        `Import ${data.habits?.length ?? 0} habits, ${data.tasks?.length ?? 0} tasks, and ${data.habitLogs?.length ?? 0} logs? This will replace all existing data.`,
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
    } catch (err) {
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

  if (!settings) return <div className="text-center py-16 text-slate-500">Loading settings…</div>;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">
          Preferences
        </p>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure your experience and manage your local data.
        </p>
      </div>

      {/* ─── Appearance ─── */}
      <section className="glass-card rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Palette size={18} className="text-brand-400" /> Appearance
        </h2>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
            Color Mode
          </label>
          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-white/10">
            {(
              [
                ['system', Monitor, 'System'],
                ['dark', Moon, 'Dark'],
                ['light', Sun, 'Light'],
              ] as const
            ).map(([v, Icon, l]) => (
              <button
                key={v}
                onClick={() => saveSetting({ darkMode: v as Settings['darkMode'] })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  settings.darkMode === v
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-white hover:bg-slate-950/20'
                }`}
              >
                <Icon size={14} /> <span>{l}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block flex items-center justify-between">
            <span>Accent Color</span>
            <a
              href="/profile"
              className="text-xs text-brand-400 hover:underline flex items-center gap-1.5"
            >
              <Palette size={12} /> Get more themes
            </a>
          </label>
          <div className="flex flex-wrap gap-4">
            {THEMES.filter(t => userXP?.unlockedThemes?.includes(t.value)).map(t => (
              <button
                key={t.value}
                onClick={() => saveSetting({ theme: t.value })}
                title={t.label}
                className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${settings.theme === t.value ? 'scale-110 ring-2 ring-white/20' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                style={{ background: t.color }}
              >
                {settings.theme === t.value && (
                  <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold text-white">Week starts on Monday</p>
            <p className="text-xs text-slate-500">Affects all charts and weekly views.</p>
          </div>
          <button
            onClick={() => saveSetting({ weekStartsOnMonday: !settings.weekStartsOnMonday })}
            className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.weekStartsOnMonday ? 'bg-brand-500' : 'bg-slate-700'}`}
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
            <p className="text-sm font-semibold text-white">Sound Effects</p>
            <p className="text-xs text-slate-500">
              Audible feedback when completing habits and leveling up.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={settings.soundEnabled !== false}
            aria-label="Toggle sound effects"
            onClick={() => {
              const next = !settings.soundEnabled;
              saveSetting({ soundEnabled: next });
              import('../services/soundService').then(m =>
                m.soundService.setEnabled(next, settings.hapticEnabled !== false)
              );
            }}
            className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.soundEnabled !== false ? 'bg-brand-500' : 'bg-slate-700'}`}
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
            <p className="text-sm font-semibold text-white">Haptic Feedback</p>
            <p className="text-xs text-slate-500">Vibration on habit completion (mobile only).</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.hapticEnabled !== false}
            aria-label="Toggle haptic feedback"
            onClick={() => {
              const next = !settings.hapticEnabled;
              saveSetting({ hapticEnabled: next });
              import('../services/soundService').then(m =>
                m.soundService.setEnabled(settings.soundEnabled !== false, next)
              );
            }}
            className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.hapticEnabled !== false ? 'bg-brand-500' : 'bg-slate-700'}`}
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
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Bell size={18} className="text-brand-400" /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Browser Notifications</p>
            <p className="text-xs text-slate-500">Get reminders for your daily habits and tasks.</p>
          </div>
          {!settings.notificationsEnabled ? (
            <button
              className="px-4 py-2 rounded-xl bg-brand-500/20 text-brand-400 text-xs font-bold hover:bg-brand-500/30 transition-all"
              onClick={requestNotificationPermission}
            >
              Enable
            </button>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 size={10} /> Enabled
            </span>
          )}
        </div>
      </section>

      {/* ─── Integrations ─── */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar size={18} className="text-brand-400" /> Integrations
        </h2>
        
        {isGuest ? (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400">
              <CloudOff size={20} />
              <div className="text-sm">
                <p className="font-bold text-white">Google Calendar</p>
                <p className="text-xs">Sign in to sync your habits to your calendar.</p>
              </div>
            </div>
            <button onClick={() => useAuthStore.getState().signInWithGoogle()} className="px-4 py-2 rounded-xl bg-brand-500/20 text-brand-400 text-xs font-bold hover:bg-brand-500/30 transition-colors">
              Sign In
            </button>
          </div>
        ) : !isCalendarConnected ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-bold text-amber-400">Google Calendar Disconnected</p>
              <p className="text-xs text-amber-400/70">Your Google session expired or calendar access was denied. Please sign in again.</p>
            </div>
            <button onClick={() => useAuthStore.getState().signInWithGoogle()} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors whitespace-nowrap">
              Reconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-semibold text-white">Sync Habits to Calendar</p>
                <p className="text-xs text-slate-500">Create recurring events for your habits.</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.googleCalendarSync !== false}
                onClick={() => saveSetting({ googleCalendarSync: !settings.googleCalendarSync })}
                className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.googleCalendarSync !== false ? 'bg-brand-500' : 'bg-slate-700'}`}
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
                <p className="text-sm font-semibold text-white">Log Completions to Calendar</p>
                <p className="text-xs text-slate-500">Create daily events when you complete habits.</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.googleCalendarCompletions !== false}
                onClick={() => saveSetting({ googleCalendarCompletions: !settings.googleCalendarCompletions })}
                className={`relative flex items-center w-11 h-6 rounded-full transition-colors ${settings.googleCalendarCompletions !== false ? 'bg-brand-500' : 'bg-slate-700'}`}
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

      {/* ── Integrations ── */}
      <section className="glass-card rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Activity size={18} className="text-brand-400" /> Integrations
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-white">Google Fit / Health Connect</p>
              <p className="text-[10px] text-slate-400 mt-1">Simulated sync engine for health habits</p>
            </div>
            <button
              onClick={() => {
                toast.success('Simulated Health Sync Connected! Auto-completion enabled.');
              }}
              className="px-4 py-2 bg-brand-500/20 text-brand-400 text-xs font-bold rounded-xl hover:bg-brand-500/30 transition-colors"
            >
              Connect
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl opacity-60">
            <div>
              <p className="text-sm font-bold text-white">Apple Health (iOS)</p>
              <p className="text-[10px] text-slate-400 mt-1">Requires native app installation</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* ── Data ── */}
      <section className="glass-card rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database size={18} className="text-brand-400" /> Data Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Download size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {exported ? 'Exported!' : 'Export JSON'}
              </p>
              <p className="text-[10px] text-slate-500">Backup your data as a file.</p>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Download size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {csvExported ? 'CSV Saved!' : 'Export CSV'}
              </p>
              <p className="text-[10px] text-slate-500">View logs in Excel/Sheets.</p>
            </div>
          </button>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all text-left cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Import Backup</p>
              <p className="text-[10px] text-slate-500">Restore from a JSON file.</p>
            </div>
            <input type="file" accept=".json" className="sr-only" onChange={handleImport} />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Trash2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Reset Data</p>
              <p className="text-[10px] text-red-500/60">Permanently wipe all data.</p>
            </div>
          </button>
        </div>
      </section>

      {/* ─── Privacy ─── */}
      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Privacy First</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              HabitFlow is a local-first application. We don't have servers to store your data.
              Everything is kept securely in your browser's IndexedDB. Your habits, tasks, and
              profile photo never leave your device.
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
        <p className="text-sm font-bold text-white">HabitFlow v1.2</p>
        <p className="text-xs text-slate-500 mt-1">Built with precision for peak performance.</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() =>
              toast.info('HabitFlow is a local-first app. Your data never leaves your device.')
            }
            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-brand-400 transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => toast.info('HabitFlow is free to use. No terms or restrictions apply.')}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-brand-400 transition-colors"
          >
            Terms of Use
          </button>
          <button
            onClick={() => toast.info('HabitFlow is an open-source project.')}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-brand-400 transition-colors"
          >
            Source Code
          </button>
        </div>
      </section>
    </div>
  );
}
