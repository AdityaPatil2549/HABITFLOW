import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { squadService } from '@/services/squadService';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { Squad } from '@/types';
import {
  Flame,
  Copy,
  Plus,
  LogIn,
  LogOut,
  Crown,
  UserPlus,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useToast } from '@/components/common/toastStore';
import { soundService } from '@/services/soundService';

/** Get or create a stable anonymous guest ID stored in localStorage */
function getGuestId(): string {
  const KEY = 'habitflow_guest_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'guest_' + crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = [
  'from-amber-400/20 to-amber-500/10 border-amber-400/30',
  'from-slate-300/20 to-slate-400/10 border-slate-300/30',
  'from-orange-400/20 to-orange-500/10 border-orange-400/30',
];

export function SquadPage() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const toast = useToast();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [loadingSquad, setLoadingSquad] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const cloudRequiresAuth = isFirebaseConfigured() && !user?.uid;
  const userId = user?.uid || (isFirebaseConfigured() ? '' : getGuestId());
  const displayName = user?.displayName || profile.name || 'Anonymous';
  const avatarUrl = user?.photoURL || profile.avatar || undefined;

  useEffect(() => {
    document.title = 'Squad — HabitFlow';
    if (cloudRequiresAuth) return;
    let cancelled = false;
    async function loadSquads() {
      const s = await squadService.getMySquads();
      if (cancelled) return;
      setSquads(s);
      if (s.length > 0) setActiveSquadId(s[0].id);
      setLoadingSquad(false);
    }
    loadSquads();
    return () => {
      cancelled = true;
    };
  }, [cloudRequiresAuth]);

  // Subscribe to real-time Firestore updates for the active squad
  useEffect(() => {
    if (!activeSquadId || cloudRequiresAuth) return;

    const { unsubscribe } = squadService.subscribeToSquad(activeSquadId, async () => {
      // When another member updates their progress, re-fetch the squad data
      const s = await squadService.getMySquads();
      setSquads(s);
    });

    return () => unsubscribe();
  }, [activeSquadId, cloudRequiresAuth]);

  async function handleCreate() {
    if (!isFirebaseConfigured()) {
      toast.error('Firebase is not configured. Multiplayer features are disabled.');
      return;
    }
    if (!user?.uid) {
      toast.error('Please sign in to create a squad.');
      return;
    }
    if (!squadName.trim()) return;
    setLoading(true);
    const newSquad = await squadService.createSquad(
      squadName.trim(),
      userId,
      displayName,
      avatarUrl
    );
    if (!newSquad) {
      toast.error('Failed to create squad.');
      setLoading(false);
      return;
    }
    setSquads(prev => [...prev, newSquad]);
    setActiveSquadId(newSquad.id);
    setShowCreate(false);
    setSquadName('');
    setLoading(false);
    soundService.playLevelUp();
    toast.success('🎉 Squad created!');
  }

  async function handleJoin() {
    if (!isFirebaseConfigured()) {
      toast.error('Firebase is not configured. Multiplayer features are disabled.');
      return;
    }
    if (!user?.uid) {
      toast.error('Please sign in to join a squad.');
      return;
    }
    if (!inviteCode.trim()) return;
    setLoading(true);
    const joined = await squadService.joinSquad(inviteCode.trim(), userId, displayName, avatarUrl);
    if (joined) {
      if (!squads.find(s => s.id === joined.id)) {
        setSquads(prev => [...prev, joined]);
      }
      setActiveSquadId(joined.id);
      setShowJoin(false);
      setInviteCode('');
      soundService.playCelebration();
      toast.success('✅ Joined the squad!');
    } else {
      toast.error('Invalid code or squad is full');
    }
    setLoading(false);
  }

  async function handleLeave() {
    const squad = squads.find(s => s.id === activeSquadId);
    if (!squad) return;
    await squadService.leaveSquad(squad.id, userId);
    const newSquads = squads.filter(s => s.id !== squad.id);
    setSquads(newSquads);
    if (newSquads.length > 0) {
      setActiveSquadId(newSquads[0].id);
    } else {
      setActiveSquadId(null);
    }
    setConfirmLeave(false);
    toast.info('Left the squad');
  }

  const activeSquad = squads.find(s => s.id === activeSquadId);

  function copyCode() {
    if (!activeSquad) return;
    navigator.clipboard.writeText(activeSquad.invite_code);
    toast.success('Invite code copied!');
  }

  // Sort members by streak descending
  const sortedMembers = activeSquad ? [...activeSquad.members].sort((a, b) => b.streak - a.streak) : [];

  if (cloudRequiresAuth) {
    return (
      <div className="space-y-8 pb-16 max-w-4xl mx-auto pt-4">
        {/* ── Page Header ── */}
        <div className="border-b border-[var(--border-default)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-[var(--accent-ink)] bg-[var(--accent-subtle)] border border-[var(--accent)]/25 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>Multiplayer Momentum • Social Accountability Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--tx-primary)] tracking-tight">
            Accountability Squads
          </h1>
          <p className="text-sm text-[var(--tx-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Consistency compounds 65% faster when verified by peers. Form private circles of up to 5 performers to lock in unbroken discipline and shared momentum.
          </p>
        </div>

        {/* ── Value Proposition & Science Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-raised p-5 rounded-2xl border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold font-mono text-xs">
              +65%
            </div>
            <h3 className="text-sm font-bold text-[var(--tx-primary)]">Higher Adherence</h3>
            <p className="text-xs text-[var(--tx-secondary)] leading-relaxed">
              Clinical studies from ASTD show a 65% increase in habit completion when committed to peer accountability partners.
            </p>
          </div>

          <div className="card-raised p-5 rounded-2xl border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Flame size={18} className="fill-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-[var(--tx-primary)]">Shared Streak Heat</h3>
            <p className="text-xs text-[var(--tx-secondary)] leading-relaxed">
              Maintain an unbroken squad chain. When all members execute their daily habits, the squad unlocks collective multiplier bonuses.
            </p>
          </div>

          <div className="card-raised p-5 rounded-2xl border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 font-mono text-xs font-bold">
              SYNC
            </div>
            <h3 className="text-sm font-bold text-[var(--tx-primary)]">Zero-Guilt Comebacks</h3>
            <p className="text-xs text-[var(--tx-secondary)] leading-relaxed">
              Continuity shields and grace protocols ensure one tough day doesn't shatter team morale or momentum.
            </p>
          </div>
        </div>

        {/* ── Demo Squad Leaderboard Roster ── */}
        <div className="card-raised p-6 rounded-2xl border border-[var(--border-default)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)] pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)] font-bold">
                Live Squad Protocol Preview
              </span>
              <h2 className="text-base font-bold text-[var(--tx-primary)] mt-0.5">
                Apex Squad Roster (4 / 5 Operators Active)
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Realtime Synced
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { rank: '1', name: 'Alex Vance (Lead)', streak: 42, completion: '100%', badge: '🥇', tag: 'Unbroken' },
              { rank: '2', name: 'Elena Rostova', streak: 28, completion: '86%', badge: '🥈', tag: 'High Velocity' },
              { rank: '3', name: 'Marcus Kane', streak: 19, completion: '71%', badge: '🥉', tag: 'Consistent' },
              { rank: '4', name: 'You (Operator)', streak: 0, completion: 'Pending', badge: '⚡', tag: 'Ready to Deploy' },
            ].map(m => (
              <div
                key={m.name}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[var(--sf-base)] border border-[var(--border-default)] flex items-center justify-center font-mono text-xs font-bold text-[var(--tx-primary)]">
                    {m.badge}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--tx-primary)]">{m.name}</h4>
                    <span className="text-[10px] font-mono text-[var(--tx-muted)]">{m.tag}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-data text-xs font-bold text-[var(--tx-primary)] flex items-center justify-end gap-1">
                      <Flame size={12} className="text-amber-500 fill-amber-500" />
                      {m.streak}d
                    </span>
                    <span className="text-[10px] font-mono text-[var(--tx-muted)]">
                      {m.completion} today
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="p-5 rounded-xl bg-[var(--sf-base)] border border-[var(--border-strong)] text-center space-y-3">
            <h3 className="text-sm font-bold text-[var(--tx-primary)]">
              Ready to verify your habits with your inner circle?
            </h3>
            <p className="text-xs text-[var(--tx-secondary)] max-w-md mx-auto leading-relaxed">
              Sign in with your HabitFlow account to instantly create your private circle, invite up to 4 trusted peers, and sync progress.
            </p>
            <div className="pt-1">
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-md"
              >
                <LogIn size={15} />
                <span>Sign in to Launch or Join a Squad</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingSquad) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        {/* loading */}
        <div className="w-8 h-8 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (squads.length === 0) {
    return (
      <div className="space-y-6 relative pb-10">
        {/* loading */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-[var(--accent-ink)] bg-[var(--accent-subtle)] border border-[var(--accent)]/25 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>Multiplayer Momentum</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Accountability Squads
          </h1>
          <p className="text-sm text-[var(--tx-secondary)] mt-1">Consistency compounds faster when shared with peers.</p>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="card-raised relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent)]/25 flex items-center justify-center mx-auto mb-5 text-4xl">
                  👥
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Better Together</h2>
                <p className="text-sm text-[var(--tx-secondary)] w-full max-w-md mx-auto mb-8 leading-relaxed">
                  You're <span className="text-emerald-400 font-bold">65% more likely</span> to maintain atomic habits with an accountability squad. Form or join a private circle of up to 5 performers.
                </p>

                <div className="flex flex-col sm:flex-row gap-3.5 justify-center relative z-20">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="btn-primary flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    Create a Squad
                  </button>
                  <button
                    onClick={() => setShowJoin(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] active:scale-95 transition-all font-semibold text-sm cursor-pointer"
                  >
                    <LogIn size={18} />
                    Join a Squad
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🏋️', title: 'Compete', desc: 'See who maintains unbroken discipline and leading streak heat' },
            { icon: '📊', title: 'Track', desc: 'View live ritual completion rates across your inner circle' },
            { icon: '🔥', title: 'Motivate', desc: "Shared momentum pool — don't break the squad chain" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <div className="h-full">
                <div className="card-raised rounded-2xl p-6 text-center h-full relative z-10">
                  <div className="text-3xl mb-3 drop-shadow-md">{item.icon}</div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[var(--tx-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Modal */}
        {createPortal(
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/65 flex items-center justify-center p-4"
                onClick={() => setShowCreate(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="w-[400px] max-w-[90vw] rounded-2xl bg-[var(--sf-raised)] border border-[var(--border-strong)] p-7 flex flex-col shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-black text-white">Create Squad</h3>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="w-8 h-8 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={squadName}
                    onChange={e => setSquadName(e.target.value)}
                    placeholder="Squad name (e.g. 5AM Club)..."
                    maxLength={30}
                    autoFocus
                    className="input mb-5"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!squadName.trim() || loading}
                    className="btn-primary w-full py-3.5 font-bold disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Squad'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Join Modal */}
        {createPortal(
          <AnimatePresence>
            {showJoin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/65 flex items-center justify-center p-4"
                onClick={() => setShowJoin(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="w-[400px] max-w-[90vw] rounded-2xl bg-[var(--sf-raised)] border border-[var(--border-strong)] p-7 flex flex-col shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-black text-white">Join Squad</h3>
                    <button
                      onClick={() => setShowJoin(false)}
                      className="w-8 h-8 rounded-full bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    autoFocus
                    className="input mb-5 text-center tracking-[0.3em] font-mono text-lg"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleJoin();
                    }}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={inviteCode.length !== 6 || loading}
                    className="btn-primary w-full py-3.5 font-bold disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join Squad'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }

  // ─── In a Squad ────────────────────────────────────────────
  return (
    <div className="space-y-6 relative pb-10">
      {/* Tabs for multiple squads */}
      {squads.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {squads.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSquadId(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                s.id === activeSquadId
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={() => setShowJoin(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 hover:opacity-90 transition-all flex items-center gap-1"
          >
            <Plus size={14} /> Join Another
          </button>
        </div>
      )}

      {squads.length === 1 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowJoin(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 hover:opacity-90 transition-all flex items-center gap-1"
          >
            <Plus size={12} /> Join Another Squad
          </button>
        </div>
      )}

      {activeSquad && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-all">
                  {activeSquad.name}
                </h1>
              </div>
              <p className="text-sm text-[var(--tx-secondary)] mt-1">
                {activeSquad.members.length} member{activeSquad.members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              aria-label={`Copy squad invite code ${activeSquad.invite_code}`}
              className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto"
            >
              <Copy size={14} />
              <span className="font-mono text-sm tracking-wider">{activeSquad.invite_code}</span>
            </button>
          </div>

          {/* Invite friends CTA */}
          {activeSquad.members.length < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/25"
            >
              <UserPlus size={18} className="text-[var(--accent)] flex-shrink-0" />
              <p className="text-xs text-[var(--accent)]">
                Share code <span className="font-mono font-bold">{activeSquad.invite_code}</span> with friends
                to invite them!
              </p>
            </motion.div>
          )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {sortedMembers.map((member, idx) => {
          const isMe = member.user_id === userId;
          const isOwner = member.user_id === activeSquad.owner_id;
          const medal = idx < 3 ? MEDAL_ICONS[idx] : null;
          const medalColor = idx < 3 ? MEDAL_COLORS[idx] : '';

          return (
            <motion.div
              key={member.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div>
                <div className={`relative overflow-hidden rounded-2xl border ${
                  idx < 3 ? `bg-gradient-to-r ${medalColor}` : 'bg-[var(--sf-raised)] border-[var(--border-default)]'
                } p-4`}
                >
                  <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {medal || <span className="text-sm text-[var(--tx-muted)] font-bold font-mono">#{idx + 1}</span>}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {member.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--tx-primary)] truncate">
                      {member.display_name}
                    </span>
                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent-ink)] text-[9px] font-bold">
                        YOU
                      </span>
                    )}
                    {isOwner && <Crown size={12} className="text-amber-400" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-[var(--tx-secondary)]">
                      <Flame size={12} className="text-orange-400" />
                      {member.streak} day streak
                    </span>
                  </div>
                </div>

                {/* Completion ring */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      className="text-[var(--sf-dim)]"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="url(#squadGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${member.completion_today * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="squadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--accent)" />
                        <stop offset="100%" stopColor="var(--accent-hover)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--tx-primary)] font-mono">
                    {Math.round(member.completion_today * 100)}%
                  </span>
                </div>
              </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Leave Squad */}
      <div className="pt-4 border-t border-white/5">
        {confirmLeave ? (
          <div className="flex items-center gap-3">
            <p className="text-xs text-[var(--tx-secondary)]">Are you sure?</p>
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all"
            >
              Yes, leave
            </button>
            <button
              onClick={() => setConfirmLeave(false)}
              className="btn-secondary px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLeave(true)}
            className="flex items-center gap-2 text-xs text-[var(--tx-muted)] hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Leave Squad
          </button>
        )}
      </div>
        </>
      )}
    </div>
  );
}
