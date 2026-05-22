import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import { useProfileStore } from '../../store/profileStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { useFocusStore } from '../../store/focusStore';
import { useAuthStore } from '../../store/authStore';
import { calculateStats } from '../../services/gamificationService';
import { useToast } from '../common/Toast';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useModalStore } from '../../store/modalStore';
import { IconRenderer } from '../common/IconRenderer';
import {
  Search,
  Bell,
  Settings,
  User,
  LayoutDashboard,
  Target,
  CheckSquare,
  BarChart2,
  Plus,
  LogOut,
  HelpCircle,
  X,
  Zap,
  CheckCircle2,
  Timer,
  Sun,
  Moon,
  Cloud,
  CloudOff,
} from 'lucide-react';

// ── Notification panel ─────────────────────────────────────────
// Demo notifications — will be replaced with real event-driven notifications in a future update
const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    icon: '🔥',
    title: 'Streak milestone!',
    body: 'You\'ve kept your "Deep Work" habit for 7 days.',
    time: '2m ago',
    unread: true,
  },
  {
    id: 2,
    icon: '✅',
    title: 'Task due soon',
    body: '"Finalize report" is due in 2 hours.',
    time: '1h ago',
    unread: true,
  },
  {
    id: 3,
    icon: '📈',
    title: 'Weekly summary ready',
    body: 'You completed 84% of habits this week!',
    time: '1d ago',
    unread: false,
  },
];

function NotificationPanel({
  onClose,
  notes,
  setNotes,
  onViewAll,
}: {
  onClose: () => void;
  notes: typeof DEMO_NOTIFICATIONS;
  setNotes: React.Dispatch<React.SetStateAction<typeof DEMO_NOTIFICATIONS>>;
  onViewAll: () => void;
}) {
  return (
    <div className="fixed left-0 right-0 top-14 sm:absolute sm:left-full sm:right-auto sm:top-12 lg:left-0 lg:top-auto lg:bottom-12 mx-2 sm:ml-2 sm:mx-0 lg:ml-0 w-auto sm:w-80 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 z-[100] overflow-hidden bg-slate-900 border border-white/10 backdrop-blur-xl max-h-[70vh] sm:max-h-none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">Notifications</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setNotes(n => n.map(x => ({ ...x, unread: false })))}
            className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors ml-2"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
        {notes.map(n => (
          <div
            key={n.id}
            onClick={() =>
              setNotes(ns => ns.map(x => (x.id === n.id ? { ...x, unread: false } : x)))
            }
            className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-white/5 ${n.unread ? 'bg-brand-500/5' : ''}`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                {n.unread && <span className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-[10px] text-slate-600 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-white/5 text-center">
        <button
          onClick={onViewAll}
          className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}

// ── All Notifications Modal ──────────────────────────────────────
function AllNotificationsModal({
  onClose,
  notes,
  setNotes,
}: {
  onClose: () => void;
  notes: typeof DEMO_NOTIFICATIONS;
  setNotes: React.Dispatch<React.SetStateAction<typeof DEMO_NOTIFICATIONS>>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialogRef.current?.close();
    }
  }

  const filteredNotes = notes.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'read') return !n.unread;
    return true;
  });

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm fixed inset-0 flex items-center justify-center p-4 z-[9999] open:animate-in open:fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[550px] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden bg-slate-900 border border-white/10 backdrop-blur-xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell size={20} className="text-brand-400" />
              Notification Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage all your updates and milestones</p>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters & Quick Action */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/40 border-b border-white/5 flex-shrink-0">
          <div className="flex gap-1">
            {(['all', 'unread', 'read'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-brand-500/20 text-brand-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setNotes(ns => ns.map(x => ({ ...x, unread: false })))}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 min-h-[300px]">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <Bell size={40} className="opacity-20 mb-3" />
              <p className="text-sm font-medium">No notifications found</p>
              <p className="text-xs text-slate-600 mt-1">You're all caught up!</p>
            </div>
          ) : (
            filteredNotes.map(n => (
              <div
                key={n.id}
                onClick={() =>
                  setNotes(ns => ns.map(x => (x.id === n.id ? { ...x, unread: false } : x)))
                }
                className={`flex gap-4 px-6 py-5 cursor-pointer transition-all hover:bg-white/5 relative ${
                  n.unread ? 'bg-brand-500/5' : ''
                }`}
              >
                {n.unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400" />}
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {n.time}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </dialog>
  );
}

// ── Account dropdown ───────────────────────────────────────────
function AccountDropdown({ onClose, profile }: { onClose: () => void; profile: any }) {
  const navigate = useNavigate();
  const toast = useToast();
  const go = (path: string) => {
    navigate(path);
    onClose();
  };
  return (
    <div className="absolute left-full lg:left-0 top-12 lg:top-auto lg:bottom-12 ml-2 lg:ml-0 w-56 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 z-[100] overflow-hidden bg-slate-900 border border-white/10 backdrop-blur-xl">
      {/* Profile header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
            {profile.avatar ? (
              <img src={profile.avatar} className="w-full h-full object-cover" />
            ) : (
              profile.name[0]
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{profile.name}</p>
            <p className="text-[10px] text-slate-400">Peak Performer</p>
          </div>
        </div>
      </div>
      {/* Menu items */}
      <div className="py-2">
        {[
          { icon: User, label: 'Profile', path: '/profile' },
          { icon: Settings, label: 'Settings', path: '/settings' },
          { icon: BarChart2, label: 'Analytics', path: '/analytics' },
          { icon: HelpCircle, label: 'Help & Support', path: '/dashboard' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => go(item.path)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Icon size={18} className="text-slate-500" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="border-t border-white/5 py-2">
        <button
          onClick={() => {
            toast.confirm(
              'This will permanently erase ALL your habits, tasks, and progress from this device. This cannot be undone. Are you sure?',
              async () => {
                onClose();
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
          className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} className="text-red-500/70" />
          Reset All Data
        </button>
      </div>
    </div>
  );
}

// ── Search overlay ─────────────────────────────────────────────
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  useEffect(() => {
    inputRef.current?.focus();
    // Ensure data is loaded when the search modal opens
    loadHabits();
    loadTasks();
  }, [loadHabits, loadTasks]);

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialogRef.current?.close();
    }
  }

  const q = query.toLowerCase().trim();
  const habitResults = q
    ? habits.filter(h => !h.archived && h.name.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const taskResults = q
    ? tasks.filter(t => t.title.toLowerCase().includes(q) && !t.completed).slice(0, 4)
    : [];
  const hasResults = habitResults.length > 0 || taskResults.length > 0;

  const QUICK_LINKS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Target, label: 'Habits', path: '/habits' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: CheckCircle2, label: 'Weekly Review', path: '/review' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  function go(path: string) {
    navigate(path);
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm fixed inset-0 flex items-start justify-center pt-[10vh] z-[9999] open:animate-in open:fade-in duration-200"
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-[calc(100%-2rem)] max-w-[500px] rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/80 overflow-hidden bg-slate-900 border border-white/10 backdrop-blur-xl"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search habits, tasks, pages…"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!q && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Quick navigation
              </p>
              <div className="space-y-1">
                {QUICK_LINKS.map(l => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={l.path}
                      onClick={() => go(l.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                    >
                      <Icon size={18} className="text-slate-500" />
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-12 text-slate-500">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No results for "<span className="text-slate-300">{query}</span>"
              </p>
            </div>
          )}

          {habitResults.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Habits
              </p>
              {habitResults.map(h => (
                <button
                  key={h.id}
                  onClick={() => go('/habits')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-brand-400">
                    <IconRenderer name={h.icon} size={16} />
                  </div>
                  <span>{h.name}</span>
                  <span className="ml-auto text-[10px] text-slate-500">{h.category}</span>
                </button>
              ))}
            </div>
          )}

          {taskResults.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Tasks
              </p>
              {taskResults.map(t => (
                <button
                  key={t.id}
                  onClick={() => go('/tasks')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <CheckSquare size={16} className="text-slate-500" />
                  <span className="truncate">{t.title}</span>
                  {t.dueDate && (
                    <span className="ml-auto text-[10px] text-slate-500 flex-shrink-0">
                      {t.dueDate}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

// ── Layout ─────────────────────────────────────────────────────
export function Layout() {
  const setQuickAddOpen = useModalStore(s => s.setQuickAddOpen);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [notes, setNotes] = useState(DEMO_NOTIFICATIONS);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const { profile } = useProfileStore();
  const { userXP, loadXP } = useGamificationStore();
  const { isActive: focusActive, startFocus, stopFocus, openPicker } = useFocusStore();
  const { user, isGuest, signOut } = useAuthStore();
  const toast = useToast();
  // Read persisted darkMode preference — avoid DOM-read race with App.tsx's useEffect
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains('light'));
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function toggleDark() {
    const root = document.documentElement;
    const nowDark = !root.classList.contains('light');
    root.classList.toggle('light', nowDark);
    setIsDark(!nowDark);
    const newMode = nowDark ? 'light' : 'dark';
    import('../../db').then(({ db }) =>
      db.settings
        .toCollection()
        .first()
        .then(s => s && db.settings.update(s.id!, { darkMode: newMode }))
    );
  }

  useKeyboardShortcuts({
    onSearch: () => setShowSearch(true),
    onToggleFocus: () =>
      focusActive
        ? stopFocus()
        : startFocus({ id: 'quick', title: 'Quick Focus Session', type: 'habit' }),
    onNewHabit: () => {
      navigate('/habits');
      setQuickAddOpen(true);
    },
    onNewTask: () => navigate('/tasks'),
    onEscape: () => {
      setShowSearch(false);
      setShowNotifications(false);
      setShowAccount(false);
    },
  });

  useEffect(() => {
    loadXP();
  }, [loadXP]);

  const unreadCount = notes.filter(n => n.unread).length;
  const xpStats = userXP ? calculateStats(userXP.total) : null;

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const isOutsideMobile =
        mobileNotifRef.current && !mobileNotifRef.current.contains(e.target as Node);
      const isOutsideDesktop =
        desktopNotifRef.current && !desktopNotifRef.current.contains(e.target as Node);
      if (isOutsideMobile && isOutsideDesktop) setShowNotifications(false);

      if (accountRef.current && !accountRef.current.contains(e.target as Node) &&
          mobileAccountRef.current && !mobileAccountRef.current.contains(e.target as Node)) {
        setShowAccount(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-400 border-l-2 border-brand-500 px-6 py-3 flex items-center gap-3 text-sm font-medium tracking-wide transition-all rounded-r-xl'
      : 'text-slate-400 px-6 py-3 flex items-center gap-3 hover:text-slate-100 hover:bg-white/5 transition-all text-sm font-medium tracking-wide rounded-r-xl';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 flex">
      {/* ── Mobile Top Header (Hidden on Desktop) ── */}
      <nav className="lg:hidden fixed top-0 w-full z-40 bg-slate-950 border-b border-white/8 flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]">
        <NavLink
          to="/dashboard"
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img
            src={isDark ? '/brand-lockup-dark.png' : '/brand-lockup-light.png'}
            alt="HabitFlow"
            className="h-7 sm:h-9 w-auto max-w-[140px] sm:max-w-[180px] object-contain"
          />
        </NavLink>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSearch(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Search size={22} />
          </button>
          <div className="relative" ref={mobileNotifRef}>
            <button
              onClick={() => {
                setShowNotifications(v => !v);
                setShowAccount(false);
              }}
              aria-label="Toggle notifications"
              className="relative text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-400 ring-2 ring-slate-950" />
              )}
            </button>
            {showNotifications && (
              <NotificationPanel
                onClose={() => setShowNotifications(false)}
                notes={notes}
                setNotes={setNotes}
                onViewAll={() => {
                  setShowNotifications(false);
                  setShowAllNotifications(true);
                }}
              />
            )}
          </div>
          <div className="relative ml-2" ref={mobileAccountRef}>
            {isGuest ? (
              <Link 
                to="/login" 
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-white/10 hover:text-white transition-colors"
              >
                 <User size={16} />
              </Link>
            ) : (
              <button
                onClick={() => {
                   setShowAccount(v => !v);
                   setShowNotifications(false);
                }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white border border-white/10 overflow-hidden shadow-lg"
              >
                {(user?.user_metadata?.avatar_url || profile.avatar) ? (
                  <img src={user?.user_metadata?.avatar_url || profile.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={16} />
                )}
              </button>
            )}
            
            {showAccount && (
              <div className="absolute right-0 top-full mt-2 w-56 z-[100]">
                <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Desktop Sidebar (Hidden on Mobile) ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/8 bg-slate-900 flex-col py-6 z-40 hidden lg:flex">
        <div className="px-6 mb-8 flex items-center justify-between">
          <NavLink
            to="/dashboard"
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={isDark ? '/brand-lockup-dark.png' : '/brand-lockup-light.png'}
              alt="HabitFlow"
              style={{ height: '50px', width: 'auto' }}
              className="object-contain"
            />
          </NavLink>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/habits', icon: Target, label: 'Habits' },
            { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
            { to: '/analytics', icon: BarChart2, label: 'Analytics' },
            { to: '/review', icon: CheckCircle2, label: 'Weekly Review' },
          ].map(l => {
            const Icon = l.icon;
            return (
              <NavLink key={l.to} to={l.to} className={navLinkClass}>
                <Icon size={18} />
                <span>{l.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Focus Mode Button ── */}
        <div className="px-5 mb-3">
          <button
            onClick={() => {
              if (focusActive) {
                stopFocus();
              } else {
                openPicker();
              }
            }}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 relative overflow-hidden ${
              focusActive
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'border border-brand-500/30 text-brand-300 hover:bg-brand-500/10'
            }`}
            style={
              !focusActive
                ? {
                    background:
                      'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                  }
                : {}
            }
          >
            {!focusActive && (
              <span
                className="absolute inset-0 rounded-xl"
                style={{
                  boxShadow: 'inset 0 0 20px rgba(99,102,241,0.08)',
                  background:
                    'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
                }}
              />
            )}
            <Timer size={16} className={focusActive ? 'animate-pulse' : ''} />
            <span className="relative">{focusActive ? 'End Focus' : 'Focus Mode'}</span>
            {focusActive && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
          </button>
        </div>

        <div className="px-5 mb-6">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            New Entry
          </button>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto px-5 space-y-2 pb-2">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-left group"
          >
            <Search size={18} />
            <span className="flex-1">Search</span>
            <kbd className="text-[10px] font-sans font-medium border border-white/10 rounded px-1.5 h-5 flex items-center justify-center text-slate-500 group-hover:text-slate-400 transition-colors">
              ⌘K
            </kbd>
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={toggleDark}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-left"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="flex-1">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            <div
              className={`relative flex items-center w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-brand-500'}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mx-1 shadow-sm transition-transform ${isDark ? 'translate-x-0' : 'translate-x-5'}`}
              />
            </div>
          </button>

          <div className="relative" ref={desktopNotifRef}>
            <button
              onClick={() => {
                setShowNotifications(v => !v);
                setShowAccount(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <div className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-400 ring-2 ring-slate-900" />
                )}
              </div>
              <span>Notifications</span>
            </button>
            {showNotifications && (
              <NotificationPanel
                onClose={() => setShowNotifications(false)}
                notes={notes}
                setNotes={setNotes}
                onViewAll={() => {
                  setShowNotifications(false);
                  setShowAllNotifications(true);
                }}
              />
            )}
          </div>

          {/* Sync Status / Auth */}
          {isGuest ? (
            <Link
              to="/login"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <CloudOff size={18} />
              <span className="flex-1">Sign in to sync</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-emerald-400 hover:bg-white/5 transition-colors text-left"
            >
              <Cloud size={18} />
              <span className="flex-1 truncate">{user?.email ?? 'Synced'}</span>
            </button>
          )}
        </div>

        <div className="px-5 pt-4 border-t border-white/5 mx-3 mt-2">
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => {
                setShowAccount(v => !v);
                setShowNotifications(false);
              }}
              className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-lg shadow-brand-500/20 flex-shrink-0">
                {(user?.user_metadata?.avatar_url || profile.avatar) ? (
                  <img src={user?.user_metadata?.avatar_url || profile.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h1 className="text-sm font-bold text-white leading-none truncate group-hover:text-brand-400 transition-colors">
                    {profile.name}
                  </h1>
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
              <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64 w-full max-w-full">
        {/* On mobile, add padding to clear the top nav. On all screens, add bottom padding to clear mobile nav if visible. */}
        <div className="pt-20 lg:pt-8 pb-28 lg:pb-8 px-3 sm:px-4 md:px-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-white/8 px-4 pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))] flex items-center justify-between z-50">
        {[
          { to: '/dashboard', icon: LayoutDashboard, label: 'Flow' },
          { to: '/habits', icon: Target, label: 'Habits' },
        ].map(l => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 ${isActive ? 'text-brand-400' : 'text-slate-500'}`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold">{l.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setQuickAddOpen(true)}
          aria-label="Create new entry"
          className="relative z-[60] -mt-8 w-14 h-14 cursor-pointer bg-gradient-to-r from-brand-500 to-brand-600 rounded-full flex items-center justify-center shadow-xl shadow-brand-500/40 border-4 border-slate-950 active:scale-95 transition-transform"
        >
          <Plus size={24} className="text-white" />
        </button>
        {/* Focus button - mobile */}
        <button
          onClick={() => {
            if (focusActive) stopFocus();
            else openPicker();
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            focusActive ? 'text-red-400' : 'text-slate-500 hover:text-brand-400'
          }`}
        >
          <Timer size={20} className={focusActive ? 'animate-pulse' : ''} />
          <span className="text-[10px] font-bold">{focusActive ? 'End' : 'Focus'}</span>
        </button>
        {[
          { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
          { to: '/analytics', icon: BarChart2, label: 'Stats' },
        ].map(l => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 ${isActive ? 'text-brand-400' : 'text-slate-500'}`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold">{l.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Overlays ── */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {showAllNotifications && (
        <AllNotificationsModal
          onClose={() => setShowAllNotifications(false)}
          notes={notes}
          setNotes={setNotes}
        />
      )}
    </div>
  );
}
