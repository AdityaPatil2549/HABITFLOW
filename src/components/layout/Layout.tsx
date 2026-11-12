import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfileStore } from '../../store/profileStore';
import { HabitFlowLogo } from '../common/HabitFlowLogo';
import { cn } from '../../lib/utils';
import { useGamificationStore } from '../../store/gamificationStore';
import { useFocusStore } from '../../store/focusStore';
import { useAuthStore } from '../../store/authStore';
import { calculateStats } from '../../services/gamificationService';
import { useToast } from '../common/toastStore';
import { CommandMenu } from '../common/CommandMenu';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useModalStore } from '../../store/modalStore';
import { ShortcutsModal } from '../ui/ShortcutsModal';
import { AchievementToast } from '../ui/AchievementToast';
import { useAchievementToast } from '../ui/achievementQueue';
import { soundService } from '../../services/soundService';
import { getOrCreateSettings } from '../../db';
import { resolveTelemetryMode } from '../../lib/theme';
import type { TelemetryMode } from '../../types';
import {
  Search,
  Settings,
  User,
  CircleDot,
  LayoutGrid,
  Diamond,
  Menu,
  Plus,
  LogOut,
  Zap,
  Timer,
  Cloud,
  CloudOff,
  Users,
  ShoppingBag,
} from 'lucide-react';

interface ProfileSummary {
  name: string;
  bio: string;
  avatar: string | null;
}

const WORKSPACES = [
  { to: '/', icon: CircleDot, label: 'Today', end: true },
  { to: '/habits', icon: LayoutGrid, label: 'Plan', end: false },
  { to: '/insights', icon: Diamond, label: 'Insights', end: false },
  { to: '/hub', icon: Menu, label: 'Hub', end: false },
] as const;

// ── Account dropdown ───────────────────────────────────────────
function AccountDropdown({
  onClose,
  profile,
}: {
  onClose: () => void;
  profile: ProfileSummary;
}) {
  const { isGuest, signOut } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      className="w-full rounded-2xl z-[100] overflow-hidden bg-[var(--sf-raised)] border border-[var(--border-strong)]"
    >
      {/* Profile header */}
      <div className="px-4 py-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center font-bold text-base shrink-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.name?.[0]?.toUpperCase() || 'O'
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--tx-primary)] truncate">
              {isGuest ? 'Guest Operator' : profile.name}
            </p>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--tx-secondary)] mt-0.5">
              {isGuest ? 'Local Mode Only' : 'Synced Vault'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-1.5 space-y-0.5">
        {[
          { icon: ShoppingBag, label: 'Armory & Inks', path: '/hub/shop' },
          { icon: Users, label: 'Squad', path: '/hub/squad' },
          { icon: User, label: 'Profile', path: '/hub/profile' },
          { icon: Settings, label: 'Settings', path: '/hub/settings' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => go(item.path)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-[var(--tx-secondary)] hover:bg-[var(--sf-overlay)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
            >
              <Icon size={15} className="text-[var(--accent-ink)] shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--border-default)] p-1.5 space-y-0.5">
        {isGuest ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[var(--accent-ink)] bg-[var(--accent-subtle)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Cloud size={15} />
            <span>Sign in to Sync Data</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              toast.confirm(
                'Are you sure you want to sign out?',
                async () => {
                  try {
                    await signOut();
                    navigate('/login');
                  } catch {
                    toast.error('Failed to sign out. Please try again.');
                  }
                },
                { confirmLabel: 'Sign Out' }
              );
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-[var(--tx-secondary)] hover:bg-[var(--sf-overlay)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            toast.confirm(
              'This will permanently erase ALL your habits, tasks, and progress from this device. This cannot be undone. Are you sure?',
              async () => {
                const { db } = await import('../../db');
                await Promise.all([
                  db.habits.clear(),
                  db.habitLogs.clear(),
                  db.tasks.clear(),
                  db.projects.clear(),
                  db.moods.clear(),
                  db.userXP.clear(),
                  db.settings.clear(),
                ]);
                localStorage.clear();
                window.location.reload();
              },
              { confirmLabel: 'Erase Everything', cancelLabel: 'Keep My Data', danger: true }
            );
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          <span>Reset All Data</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Layout ─────────────────────────────────────────────────────
export function Layout() {
  const { setQuickAddOpen, setCommandMenuOpen } = useModalStore();
  const [showAccount, setShowAccount] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [telemetryMode, setTelemetryMode] = useState<TelemetryMode>('scaffold');
  const { profile } = useProfileStore();
  const { userXP, loadXP } = useGamificationStore();
  const { isActive: focusActive, startFocus, stopFocus, openPicker } = useFocusStore();
  const { user, isGuest } = useAuthStore();
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { current: achievement, dismiss: dismissAchievement } = useAchievementToast();

  useKeyboardShortcuts({
    onSearch: () => setCommandMenuOpen(true),
    onToggleFocus: () =>
      focusActive
        ? stopFocus()
        : startFocus({ id: 'quick', title: 'Quick Focus Session', type: 'habit' }),
    onNewHabit: () => {
      navigate('/habits');
      setQuickAddOpen(true);
    },
    onNewTask: () => navigate('/hub/tasks'),
    onShowShortcuts: () => setShowShortcuts(v => !v),
    onEscape: () => {
      setCommandMenuOpen(false);
      setShowAccount(false);
      setShowShortcuts(false);
    },
  });

  useEffect(() => {
    loadXP();
  }, [loadXP]);

  const xpStats = userXP ? calculateStats(userXP.total) : null;

  useEffect(() => {
    const syncTelemetry = async () => {
      const s = await getOrCreateSettings();
      setTelemetryMode(resolveTelemetryMode(s, xpStats?.numericLevel));
    };
    syncTelemetry();
    window.addEventListener('habitflow-appearance-changed', syncTelemetry);
    return () => window.removeEventListener('habitflow-appearance-changed', syncTelemetry);
  }, [xpStats?.numericLevel]);

  // Close account dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktop = accountRef.current?.contains(target);
      const inMobile = mobileAccountRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setShowAccount(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showXPCapsule = telemetryMode === 'scaffold';

  return (
    <div className="min-h-[100dvh] flex bg-[var(--sf-base)] text-[var(--tx-primary)] relative z-0">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[9999] px-4 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg font-bold"
      >
        Skip to content
      </a>

      {/* ── Mobile Top Header (< 768px) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 px-4 bg-[var(--sf-raised)] border-b border-[var(--border-default)] flex items-center justify-between">
        <NavLink
          to="/"
          end
          aria-label="HabitFlow Today"
          className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <HabitFlowLogo size="sm" showBadge={false} />
        </NavLink>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (focusActive) stopFocus();
              else openPicker();
            }}
            aria-label={focusActive ? 'Stop focus timer' : 'Start focus timer'}
            className={cn(
              'p-2 rounded-lg transition-colors cursor-pointer',
              focusActive
                ? 'text-[var(--accent-ink)] bg-[var(--accent-subtle)]'
                : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
            )}
          >
            <Timer size={19} />
          </button>

          <button
            type="button"
            onClick={() => setCommandMenuOpen(true)}
            aria-label="Open Command HUD"
            className="p-2 rounded-lg text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
          >
            <Search size={19} />
          </button>

          <div className="relative ml-1" ref={mobileAccountRef}>
            <button
              type="button"
              onClick={() => setShowAccount(v => !v)}
              aria-label="Open account menu"
              className="w-8 h-8 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-primary)] overflow-hidden cursor-pointer"
            >
              {user?.photoURL || profile.avatar ? (
                <img
                  src={user?.photoURL || profile.avatar || undefined}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={15} />
              )}
            </button>

            <AnimatePresence>
              {showAccount && (
                <div className="absolute right-0 top-full mt-2 w-56 z-[100]">
                  <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Desktop Left Rail (>= 768px, 220px wide) ── */}
      <aside
        data-tour="sidebar-nav"
        className="hidden md:flex fixed left-0 top-0 h-[100dvh] w-[220px] border-r border-[var(--border-default)] bg-[var(--sf-raised)] flex-col py-5 z-40"
      >
        {/* Brand Header */}
        <div className="px-4 mb-5 flex items-center justify-between">
          <NavLink to="/" end className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
            <HabitFlowLogo size="md" showBadge={true} />
          </NavLink>
        </div>

        {/* Command HUD Button */}
        <div className="px-3 mb-4">
          <button
            type="button"
            onClick={() => setCommandMenuOpen(true)}
            title="Command HUD (⌘K / Ctrl K)"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--sf-base)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors text-xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="shrink-0" />
              <span>Search…</span>
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--sf-overlay)] border border-[var(--border-default)] text-[var(--tx-muted)]">
              {typeof window !== 'undefined' &&
              /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform)
                ? '⌘K'
                : 'Ctrl K'}
            </kbd>
          </button>
        </div>

        {/* 4 Workspaces */}
        <nav aria-label="Primary workspaces" className="flex-1 space-y-1 px-3 overflow-y-auto">
          {WORKSPACES.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onMouseEnter={() => soundService.playHover()}
                onClick={() => soundService.playTransition()}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border',
                    isActive
                      ? 'bg-[var(--sf-overlay)] text-[var(--tx-primary)] border-[var(--border-strong)] font-semibold'
                      : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent)]" />
                    )}
                    <Icon
                      size={17}
                      className={cn(
                        'shrink-0',
                        isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--tx-muted)]'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Actions Dock */}
        <div className="px-3 mb-3 space-y-2 pt-3 border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="w-full py-2.5 px-3 btn-primary text-xs flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            <span>New Entry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (focusActive) stopFocus();
              else openPicker();
            }}
            className={cn(
              'w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-colors cursor-pointer',
              focusActive
                ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-ink)]'
                : 'bg-[var(--sf-base)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
            )}
          >
            <Timer size={15} />
            <span>{focusActive ? 'End Focus' : 'Deep Focus'}</span>
          </button>
        </div>

        {/* Account & Scaffold-Only XP Capsule */}
        <div className="px-3 pt-3 border-t border-[var(--border-default)]">
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setShowAccount(v => !v)}
              aria-label="Account and workspace settings"
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer text-left border border-transparent hover:border-[var(--border-default)]"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center font-bold overflow-hidden shrink-0">
                {user?.photoURL || profile.avatar ? (
                  <img
                    src={user?.photoURL || profile.avatar || undefined}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-mono font-bold">
                    {profile.name?.[0]?.toUpperCase() || 'O'}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-[var(--tx-primary)] leading-tight truncate">
                    {isGuest ? 'Guest' : profile.name}
                  </p>
                  {showXPCapsule && xpStats && (
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-ink)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                      <Zap size={9} />
                      {xpStats.numericLevel}
                    </span>
                  )}
                </div>

                {showXPCapsule && xpStats ? (
                  <div className="mt-1.5 w-full h-1 rounded-full bg-[var(--sf-overlay)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-150"
                      style={{ width: `${xpStats.levelProgress}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--tx-muted)] mt-0.5">
                    {telemetryMode === 'monastic' ? 'Monastic' : 'Instrument'}
                  </p>
                )}
              </div>

              <div className="text-[var(--tx-muted)] shrink-0">
                {isGuest ? <CloudOff size={13} /> : <Cloud size={13} className="text-[var(--accent-ink)]" />}
              </div>
            </button>

            <AnimatePresence>
              {showAccount && (
                <div className="absolute left-0 bottom-full mb-2 w-56 z-[100]">
                  <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legal Links */}
        <div className="px-4 pt-2 flex justify-center gap-3 text-[11px] text-[var(--tx-muted)]">
          <Link to="/privacy" className="hover:text-[var(--tx-primary)] transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-[var(--tx-primary)] transition-colors">
            Terms
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main id="main-content" className="flex-1 md:ml-[220px] w-full max-w-[100vw] overflow-x-hidden">
        <div className="pt-16 md:pt-8 pb-20 md:pb-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto min-h-[100dvh]">
          <Suspense
            fallback={
              <div className="space-y-4 py-8">
                <div className="h-8 w-48 rounded-lg bg-[var(--sf-raised)] border border-[var(--border-default)] animate-pulse" />
                <div className="h-32 rounded-2xl bg-[var(--sf-raised)] border border-[var(--border-default)] animate-pulse" />
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeIn' }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {/* ── Mobile Bottom Dock (< 768px, 56px tall, 4 icon-only destinations) ── */}
      <nav
        aria-label="Mobile workspaces"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-[var(--sf-raised)] border-t border-[var(--border-default)] px-2 grid grid-cols-4 items-center"
      >
        {WORKSPACES.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              onClick={() => soundService.playTransition()}
              className="relative flex flex-col items-center justify-center h-full transition-colors cursor-pointer"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.4 : 1.75}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--tx-muted)]'
                    )}
                  />
                  {isActive && (
                    <span className="absolute bottom-1 w-6 h-[2px] rounded-full bg-[var(--accent)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Overlays ── */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CommandMenu />
      {achievement && telemetryMode === 'scaffold' && (
        <AchievementToast
          title={achievement.title}
          description={achievement.description}
          icon={achievement.icon}
          type={achievement.type}
          onClose={dismissAchievement}
        />
      )}
    </div>
  );
}
