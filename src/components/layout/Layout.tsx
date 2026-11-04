import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import { useProfileStore } from '../../store/profileStore';
import { CircadianSkybox } from './CircadianSkybox';
import { GoldFoilBurst } from '../common/GoldFoilBurst';
import { ChronoDialHUD } from '../dashboard/ChronoDialHUD';
import { cn } from '../../lib/utils';
import { useGamificationStore } from '../../store/gamificationStore';
import { useFocusStore } from '../../store/focusStore';
import { useAuthStore } from '../../store/authStore';
import { calculateStats } from '../../services/gamificationService';
import { useToast } from '../common/Toast';
import { CommandMenu } from '../common/CommandMenu';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useModalStore } from '../../store/modalStore';
import { IconRenderer } from '../common/IconRenderer';
import { ShortcutsModal } from '../ui/ShortcutsModal';
import { AchievementToast, useAchievementToast } from '../ui/AchievementToast';
import { soundService } from '../../services/soundService';
import {
  Search,
  Settings,
  User,
  LayoutDashboard,
  Target,
  CheckSquare,
  BarChart2,
  Plus,
  LogOut,
  X,
  Zap,
  CheckCircle2,
  Timer,
  Cloud,
  CloudOff,
  Users,
} from 'lucide-react';
import { OnboardingTour } from '../ui/OnboardingTour';

// ── Account dropdown ───────────────────────────────────────────
function AccountDropdown({ onClose, profile }: { onClose: () => void; profile: any }) {
  const { isGuest, signOut } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const menuVariants = {
    hidden: { opacity: 0, rotateX: -15, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      rotateX: 0, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring" as const, stiffness: 300, damping: 24,
        staggerChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
      variants={menuVariants}
      style={{ transformOrigin: 'top right', perspective: 1000 }}
      className="w-full rounded-2xl shadow-2xl shadow-black/60 z-[100] overflow-hidden bg-slate-900 border border-white/10 backdrop-blur-3xl"
    >
      {/* Profile header */}
      <div className="px-5 py-5 border-b border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">
            {profile.avatar ? (
              <img src={profile.avatar} className="w-full h-full object-cover" />
            ) : (
              profile.name[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate group-hover:text-brand-400 transition-colors">
              {isGuest ? 'Guest User' : profile.name}
            </p>
            <p className="text-[10px] font-semibold tracking-wide uppercase text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isGuest ? 'Local Mode Only' : 'Peak Performer'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-2 space-y-1">
        {[
          { icon: Zap, label: 'Rewards Shop', path: '/shop' },
          { icon: Users, label: 'Squad', path: '/squad' },
          { icon: BarChart2, label: 'Analytics', path: '/analytics' },
          { icon: User, label: 'Profile', path: '/profile' },
          { icon: Settings, label: 'Settings', path: '/settings' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <motion.button
              variants={itemVariants}
              key={item.label}
              onClick={() => go(item.path)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:border-brand-500/30 group-hover:text-brand-400 transition-colors shadow-sm">
                <Icon size={16} />
              </div>
              {item.label}
            </motion.button>
          );
        })}
      </div>

      <div className="border-t border-white/10 p-2 space-y-1 bg-black/20">
        {isGuest ? (
          <motion.button
            variants={itemVariants}
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-400">
              <Cloud size={18} className="group-hover:scale-110 transition-transform" />
            </div>
            Sign in to Sync Data
          </motion.button>
        ) : (
          <motion.button
            variants={itemVariants}
            onClick={() => {
              onClose();
              toast.confirm(
                'Are you sure you want to sign out?',
                async () => {
                  try {
                    await signOut();
                    navigate('/login');
                  } catch (err) {
                    toast.error('Failed to sign out. Please try again.');
                  }
                },
                { confirmLabel: 'Sign Out' }
              );
            }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            Sign Out
          </motion.button>
        )}
        <motion.button
          variants={itemVariants}
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
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <LogOut size={16} className="text-red-500/70 group-hover:scale-110 transition-transform" />
          </div>
          Reset All Data
        </motion.button>
      </div>
    </motion.div>
  );
}


import { SmoothScrollProvider } from './SmoothScrollProvider';

// ── Layout ─────────────────────────────────────────────────────
export function Layout() {
  const { setQuickAddOpen, setCommandMenuOpen } = useModalStore();
  const [showAccount, setShowAccount] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { profile } = useProfileStore();
  const { userXP, loadXP } = useGamificationStore();
  const { isActive: focusActive, startFocus, stopFocus, openPicker } = useFocusStore();
  const { user, isGuest, signOut } = useAuthStore();
  const toast = useToast();
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
    onNewTask: () => navigate('/tasks'),
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

  // Close account dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node) &&
        mobileAccountRef.current &&
        !mobileAccountRef.current.contains(e.target as Node)
      ) {
        setShowAccount(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-4 py-2.5 flex items-center gap-3 text-sm font-semibold tracking-wide transition-all rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] mx-2'
      : 'text-slate-400 px-4 py-2.5 flex items-center gap-3 hover:text-white hover:bg-white/[0.04] transition-all text-sm font-medium tracking-wide rounded-xl border border-transparent mx-2';

  return (
    <SmoothScrollProvider>
    <div className="min-h-[100dvh] flex text-slate-50 relative z-0">
      {/* Skip to Content for Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg font-bold">
        Skip to content
      </a>

      {/* High-performance Living Circadian Skybox */}
      <CircadianSkybox />

      {/* Procedural Kinpaku Gold Leaf Foil Burst Overlay */}
      <GoldFoilBurst />

      {/* ── Mobile Top Header (Hidden on Desktop) ── */}
      <nav className="lg:hidden fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-40 bg-slate-950/45 backdrop-blur-3xl border border-white/[0.12] border-t-white/[0.22] rounded-2xl flex items-center justify-between px-5 h-14 shadow-2xl">
        <NavLink
          to="/dashboard"
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img
            src='/brand-lockup-dark.png'
            alt="HabitFlow"
            className="h-7 sm:h-9 w-auto max-w-[140px] sm:max-w-[180px] object-contain"
          />
        </NavLink>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (focusActive) stopFocus();
              else openPicker();
            }}
            aria-label="Toggle Focus Mode"
            className={cn(
              'transition-colors',
              focusActive ? 'text-rose-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Timer size={22} className={focusActive ? 'animate-pulse' : ''} />
          </button>
          <button
            onClick={() => setCommandMenuOpen(true)}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Search size={22} />
          </button>

          <div className="relative ml-2" ref={mobileAccountRef}>
            <button
              onClick={() => {
                setShowAccount(v => !v);
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white border border-white/10 overflow-hidden shadow-lg"
            >
              {user?.photoURL || profile.avatar ? (
                <img
                  src={user?.photoURL || profile.avatar || undefined}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <User size={16} />
              )}
            </button>

            {showAccount && (
              <div className="absolute right-0 top-full mt-2 w-56 z-[100]">
                <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Desktop Sidebar (Hidden on Mobile) ── */}
      <aside data-tour="sidebar-nav" className="fixed left-0 top-0 h-[100dvh] w-64 border-r border-white/[0.1] bg-slate-950/40 backdrop-blur-3xl flex-col py-6 z-40 hidden lg:flex shadow-2xl">
        <div className="px-6 mb-8 flex items-center justify-between">
          <NavLink
            to="/dashboard"
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src='/brand-lockup-dark.png'
              alt="HabitFlow"
              style={{ height: '50px', width: 'auto' }}
              className="object-contain"
            />
          </NavLink>
        </div>

        <nav className="flex-1 space-y-1 px-1">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/habits', icon: Target, label: 'Habits' },
            { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
            { to: '/analytics', icon: BarChart2, label: 'Analytics' },
            { to: '/review', icon: CheckCircle2, label: 'Weekly Review' },
            { to: '/squad', icon: Users, label: 'Squad' },
          ].map(l => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={navLinkClass}
                onMouseEnter={() => soundService.playHover()}
                onClick={() => soundService.playTransition()}
              >
                <Icon size={18} />
                <span>{l.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Actions ── */}
        <div className="px-5 mb-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              if (focusActive) {
                stopFocus();
              } else {
                openPicker();
              }
            }}
            className={cn(
              'py-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer backdrop-blur-xl border',
              focusActive
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-white/[0.04] border-white/[0.08] hover:border-purple-500/40 hover:bg-purple-500/10 text-slate-300 hover:text-purple-300'
            )}
          >
            <Timer size={14} className={focusActive ? 'animate-pulse text-rose-400' : 'text-purple-400'} />
            <span className="relative truncate">{focusActive ? 'End Focus' : 'Focus'}</span>
          </button>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-[11px] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_28px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={14} className="stroke-[3]" />
            <span className="truncate">New Entry</span>
          </button>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto px-5 pb-2">
          <div className="flex items-center justify-between border-t border-white/5 pt-3 pb-1">
            <button
              onClick={() => setCommandMenuOpen(true)}
              title="Command HUD (Cmd+K or /)"
              className="p-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <Search size={18} />
            </button>

            {isGuest ? (
              <Link
                to="/login"
                title="Sign in to sync"
                className="p-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <CloudOff size={18} />
              </Link>
            ) : (
              <button
                onClick={() => {
                  toast.confirm(
                    'Are you sure you want to sign out?',
                    async () => {
                      try {
                        await signOut();
                        navigate('/login');
                      } catch (err) {
                        toast.error('Failed to sign out. Please try again.');
                      }
                    },
                    { confirmLabel: 'Sign Out' }
                  );
                }}
                title={`Synced as ${user?.email}`}
                className="p-2.5 rounded-xl text-emerald-400 hover:bg-white/5 transition-colors"
              >
                <Cloud size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pt-4 border-t border-white/5 mx-3 mt-2">
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => {
                setShowAccount(v => !v);
              }}
              className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-lg shadow-brand-500/20 flex-shrink-0">
                {user?.photoURL || profile.avatar ? (
                  <img
                    src={user?.photoURL || profile.avatar || undefined}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-bold text-white leading-none truncate group-hover:text-brand-400 transition-colors">
                    {profile.name}
                  </p>
                  {xpStats && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 flex-shrink-0">
                      <Zap size={9} />
                      Lv.{xpStats.numericLevel}
                    </span>
                  )}
                </div>
                {xpStats ? (
                  <div className="mt-1.5 w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="xp-bar-fill h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                      style={{ width: `${xpStats.levelProgress}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                    Peak Performer
                  </p>
                )}
              </div>
            </button>
            {showAccount && (
              <div className="absolute left-0 bottom-full mb-4 w-56 z-[100]">
                <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />
              </div>
            )}
          </div>
        </div>

        {/* Legal Links */}
        <div className="px-5 pb-4 mt-2 text-center text-[10px] text-slate-500 flex justify-center gap-3">
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main id="main-content" className="flex-1 lg:ml-64 w-full max-w-[100vw] overflow-x-hidden">
        {/* On mobile, add padding to clear the top nav. On all screens, add bottom padding to clear mobile nav if visible. */}
        <div className="pt-[calc(4.5rem+env(safe-area-inset-top))] lg:pt-8 pb-32 lg:pb-8 px-3 sm:px-4 md:px-8 max-w-7xl mx-auto min-h-[100dvh]">
          <Suspense fallback={<div className="flex items-center justify-center h-[50vh] text-slate-500 font-medium">Loading...</div>}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50">
        <div className="bg-slate-950/50 backdrop-blur-3xl border border-white/[0.12] border-t-white/[0.22] shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-[2rem] h-[4.5rem] px-6 grid grid-cols-5 items-center justify-items-center">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Flow' },
            { to: '/habits', icon: Target, label: 'Habits' },
          ].map((l, i) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => soundService.playTransition()}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-95 ${isActive ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] font-semibold' : 'text-slate-400 hover:text-slate-200'}`
                }
              >
                <Icon size={22} className="" />
              </NavLink>
            );
          })}

          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => {
                soundService.playTransition();
                setQuickAddOpen(true);
              }}
              aria-label="Create new entry"
              className="absolute -top-6 z-[60] w-12 h-12 cursor-pointer bg-gradient-to-tr from-emerald-500 to-teal-400 hover:brightness-110 text-[#07080b] rounded-full flex items-center justify-center border-4 border-[#07080b] shadow-[0_0_24px_rgba(16,185,129,0.5)] active:scale-95 transition-all"
            >
              <Plus size={22} className="stroke-[2.5]" />
            </button>
          </div>

          {[
            { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
            { to: '/analytics', icon: BarChart2, label: 'Stats' },
          ].map((l, i) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => soundService.playTransition()}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-95 ${isActive ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] font-semibold' : 'text-slate-400 hover:text-slate-200'}`
                }
              >
                <Icon size={22} className="" />
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── Overlays ── */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CommandMenu />
      <ChronoDialHUD />
      {achievement && (
        <AchievementToast
          title={achievement.title}
          description={achievement.description}
          icon={achievement.icon}
          type={achievement.type}
          onClose={dismissAchievement}
        />
      )}
      <OnboardingTour />
    </div>
    </SmoothScrollProvider>
  );
}
