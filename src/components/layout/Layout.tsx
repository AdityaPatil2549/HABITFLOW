import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { QuickAddModal } from '../habits/QuickAddModal';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import { IconRenderer } from '../common/IconRenderer';

// ── Profile storage helpers ──
const PROFILE_KEY = 'habitflow_profile';
const loadProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: 'Alex', bio: '', avatar: null };
};

// ── Notification panel ─────────────────────────────────────────
const DEMO_NOTIFICATIONS = [
  { id: 1, icon: '🔥', title: 'Streak milestone!', body: 'You\'ve kept your "Deep Work" habit for 7 days.', time: '2m ago', unread: true },
  { id: 2, icon: '✅', title: 'Task due soon', body: '"Finalize report" is due in 2 hours.', time: '1h ago', unread: true },
  { id: 3, icon: '📈', title: 'Weekly summary ready', body: 'You completed 84% of habits this week!', time: '1d ago', unread: false },
];

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notes, setNotes] = useState(DEMO_NOTIFICATIONS);
  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl shadow-black/60 z-[100] overflow-hidden"
      style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">Notifications</h3>
        <div className="flex gap-2">
          <button onClick={() => setNotes(n => n.map(x => ({ ...x, unread: false })))}
            className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Mark all read
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors ml-2">✕</button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
        {notes.map(n => (
          <div key={n.id} onClick={() => setNotes(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))}
            className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-white/5 ${n.unread ? 'bg-brand-500/5' : ''}`}>
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
        <button className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">View all notifications</button>
      </div>
    </div>
  );
}

// ── Account dropdown ───────────────────────────────────────────
function AccountDropdown({ onClose, profile }: { onClose: () => void, profile: any }) {
  const navigate = useNavigate();
  const go = (path: string) => { navigate(path); onClose(); };
  return (
    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl shadow-black/60 z-[100] overflow-hidden"
      style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>
      {/* Profile header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
            {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : profile.name[0]}
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
          { icon: 'person', label: 'Profile', path: '/profile' },
          { icon: 'settings', label: 'Settings', path: '/settings' },
          { icon: 'insights', label: 'Analytics', path: '/analytics' },
          { icon: 'help', label: 'Help & Support', path: '/dashboard' },
        ].map(item => (
          <button key={item.label} onClick={() => go(item.path)}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div className="border-t border-white/5 py-2">
        <button onClick={() => { onClose(); localStorage.clear(); window.location.reload(); }}
          className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
          <span className="material-symbols-outlined text-red-500/70" style={{ fontSize: 18 }}>logout</span>
          Log Out
        </button>
      </div>
    </div>
  );
}

// ── Search overlay ─────────────────────────────────────────────
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { habits } = useHabitStore();
  const { tasks } = useTaskStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase().trim();
  const habitResults = q ? habits.filter(h => h.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const taskResults = q ? tasks.filter(t => t.title.toLowerCase().includes(q) && !t.completed).slice(0, 4) : [];
  const hasResults = habitResults.length > 0 || taskResults.length > 0;

  const QUICK_LINKS = [
    { icon: 'grid_view', label: 'Dashboard', path: '/dashboard' },
    { icon: 'cached', label: 'Habits', path: '/habits' },
    { icon: 'check_circle', label: 'Tasks', path: '/tasks' },
    { icon: 'insights', label: 'Analytics', path: '/analytics' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ];

  function go(path: string) { navigate(path); onClose(); }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        style={{ background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search habits, tasks, pages…"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!q && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Quick navigation</p>
              <div className="space-y-1">
                {QUICK_LINKS.map(l => (
                  <button key={l.path} onClick={() => go(l.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
                    <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 18 }}>{l.icon}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-12 text-slate-500">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-sm">No results for "<span className="text-slate-300">{query}</span>"</p>
            </div>
          )}

          {habitResults.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Habits</p>
              {habitResults.map(h => (
                <button key={h.id} onClick={() => go('/habits')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Tasks</p>
              {taskResults.map(t => (
                <button key={t.id} onClick={() => go('/tasks')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
                  <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>check_circle</span>
                  <span className="truncate">{t.title}</span>
                  {t.dueDate && <span className="ml-auto text-[10px] text-slate-500 flex-shrink-0">{t.dueDate}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────
export function Layout() {
  const [quickAdd, setQuickAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [profile, setProfile] = useState(loadProfile());
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = DEMO_NOTIFICATIONS.filter(n => n.unread).length;

  // Sync profile data
  useEffect(() => {
    const sync = () => setProfile(loadProfile());
    window.addEventListener('storage', sync);
    window.addEventListener('profile-updated', sync);
    // Also re-read when dropdown opens to be sure
    if (showAccount) sync();
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('profile-updated', sync);
    };
  }, [showAccount]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccount(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K for search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotifications(false); setShowAccount(false); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-400 border-l-2 border-brand-500 px-6 py-3 flex items-center gap-3 text-sm font-medium tracking-wide transition-all rounded-r-xl'
      : 'text-slate-400 px-6 py-3 flex items-center gap-3 hover:text-slate-100 hover:bg-white/5 transition-all text-sm font-medium tracking-wide rounded-r-xl';

  return (
    <>
      {/* ── Top nav ── */}
      <nav className="sticky top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/8 flex items-center justify-between px-6 h-16">
        {/* Left: Logo + nav links */}
        <div className="flex items-center gap-8">
          <NavLink to="/dashboard" className="text-xl font-black bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">HabitFlow</NavLink>
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/habits', label: 'Habits' },
              { to: '/tasks', label: 'Tasks' },
              { to: '/analytics', label: 'Analytics' },
            ].map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-500/15 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right: Search + icons */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-slate-400 text-sm hover:bg-white/8 hover:text-slate-200 transition-all w-48 justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">search</span>
              <span className="text-slate-500">Search…</span>
            </div>
            <kbd className="text-[10px] border border-white/10 rounded px-1 py-0.5 text-slate-600">⌘K</kbd>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setShowNotifications(v => !v); setShowAccount(false); }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
              <span className="material-symbols-outlined text-xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400 ring-2 ring-slate-950" />
              )}
            </button>
            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
          </div>

          {/* Settings */}
          <button onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* Account avatar */}
          <div className="relative" ref={accountRef}>
            <button onClick={() => { setShowAccount(v => !v); setShowNotifications(false); }}
              className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-transparent hover:ring-brand-400/40 transition-all">
              {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : profile.name[0]}
            </button>
            {showAccount && <AccountDropdown onClose={() => setShowAccount(false)} profile={profile} />}
          </div>
        </div>
      </nav>

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-white/8 bg-slate-900/40 backdrop-blur-2xl flex flex-col py-6 z-40 hidden lg:flex">
        <div className="px-6 mb-8">
          <NavLink to="/dashboard" className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold overflow-hidden shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-lg">fluid</span>}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-none truncate group-hover:text-brand-400 transition-colors">{profile.name}</h1>
              <p className="text-[10px] text-brand-400 uppercase tracking-[0.2em] font-bold mt-0.5">Peak Performer</p>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {[
            { to: '/dashboard', icon: 'grid_view', label: 'Dashboard' },
            { to: '/habits', icon: 'cached', label: 'Habits' },
            { to: '/tasks', icon: 'check_circle', label: 'Tasks' },
            { to: '/analytics', icon: 'insights', label: 'Analytics' },
          ].map(l => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 mb-6">
          <button onClick={() => setQuickAdd(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">add</span>
            New Entry
          </button>
        </div>

        <div className="mt-auto px-3 space-y-0.5">
          {[
            { to: '/profile', icon: 'person', label: 'Profile' },
            { to: '/settings', icon: 'settings', label: 'Settings' },
          ].map(l => (
            <NavLink key={l.to} to={l.to}
              className={navLinkClass}>
              <span className="material-symbols-outlined text-lg">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="lg:ml-64 p-8 min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-2xl border-t border-white/8 px-8 h-16 flex items-center justify-between z-50">
        {[
          { to: '/dashboard', icon: 'grid_view', label: 'Flow' },
          { to: '/habits', icon: 'cached', label: 'Habits' },
        ].map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-brand-400' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{l.icon}</span>
            <span className="text-[10px] font-bold">{l.label}</span>
          </NavLink>
        ))}
        <div onClick={() => setQuickAdd(true)}
          className="-mt-12 w-14 h-14 cursor-pointer bg-gradient-to-tr from-brand-500 to-brand-600 rounded-full flex items-center justify-center shadow-xl shadow-brand-500/40 border-4 border-slate-950">
          <span className="material-symbols-outlined text-white">add</span>
        </div>
        {[
          { to: '/analytics', icon: 'insights', label: 'Stats' },
          { to: '/profile', icon: 'person', label: 'Profile' },
        ].map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-brand-400' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined">{l.icon}</span>
            <span className="text-[10px] font-bold">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Overlays ── */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {quickAdd && <QuickAddModal onClose={() => setQuickAdd(false)} />}
    </>
  );
}
