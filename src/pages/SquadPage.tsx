import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { squadService } from '@/services/squadService';
import type { Squad, SquadMember } from '@/types';
import { Users, Trophy, Flame, Copy, Plus, LogIn, LogOut, Crown, Shield, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useToast } from '@/components/common/Toast';
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
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loadingSquad, setLoadingSquad] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const userId = user?.id || getGuestId();
  const displayName = user?.user_metadata?.full_name || profile.name || 'Anonymous';
  const avatarUrl = user?.user_metadata?.avatar_url || profile.avatar;

  useEffect(() => {
    document.title = 'Squad — HabitFlow';
    async function loadSquad() {
      const s = await squadService.getMySquad();
      setSquad(s);
      setLoadingSquad(false);
    }
    loadSquad();
  }, []);

  async function handleCreate() {
    if (!squadName.trim()) return;
    setLoading(true);
    const newSquad = await squadService.createSquad(squadName.trim(), userId, displayName, avatarUrl);
    setSquad(newSquad);
    setShowCreate(false);
    setSquadName('');
    setLoading(false);
    soundService.playLevelUp();
    toast.success('🎉 Squad created!');
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setLoading(true);
    const joined = await squadService.joinSquad(inviteCode.trim(), userId, displayName, avatarUrl);
    if (joined) {
      setSquad(joined);
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
    if (!squad) return;
    await squadService.leaveSquad(squad.id, userId);
    setSquad(null);
    setConfirmLeave(false);
    toast.info('Left the squad');
  }

  function copyCode() {
    if (!squad) return;
    navigator.clipboard.writeText(squad.invite_code);
    toast.success('Invite code copied!');
  }

  // Sort members by streak descending
  const sortedMembers = squad
    ? [...squad.members].sort((a, b) => b.streak - a.streak)
    : [];

  if (loadingSquad) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Squad</h1>
          <p className="text-sm text-slate-400 mt-1">Accountability through community</p>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 p-8 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent animate-[shimmer_3s_infinite] pointer-events-none" />
          <div className="relative">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-white mb-2">Better Together</h2>
            <p className="text-sm text-slate-300 w-full max-w-[400px] mx-auto mb-6 leading-relaxed">
              You're <span className="text-brand-400 font-bold">65% more likely</span> to reach your goals
              with an accountability partner. Create or join a squad of up to 5 people.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold hover:shadow-lg hover:shadow-brand-500/20 transition-all active:scale-95"
              >
                <Plus size={18} />
                Create a Squad
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95"
              >
                <LogIn size={18} />
                Join a Squad
              </button>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🏋️', title: 'Compete', desc: 'See who has the longest streak in your group' },
            { icon: '📊', title: 'Track', desc: 'View daily completion rates for all members' },
            { icon: '🔥', title: 'Motivate', desc: 'Don\'t let your squad down — stay consistent' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400">{item.desc}</p>
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
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowCreate(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="w-[384px] max-w-[90vw] rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col"
                  style={{ minWidth: '300px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Create Squad</h3>
                    <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={squadName}
                    onChange={e => setSquadName(e.target.value)}
                    placeholder="Squad name..."
                    maxLength={30}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 mb-4"
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!squadName.trim() || loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold disabled:opacity-50 transition-all active:scale-95"
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
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowJoin(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="w-[384px] max-w-[90vw] rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col"
                  style={{ minWidth: '300px' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Join Squad</h3>
                    <button onClick={() => setShowJoin(false)} className="text-slate-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code..."
                    maxLength={6}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 mb-4 text-center tracking-[0.3em] font-mono text-lg"
                    onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={inviteCode.length !== 6 || loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold disabled:opacity-50 transition-all active:scale-95"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{squad.name}</h1>
          <p className="text-sm text-slate-400 mt-1">{squad.members.length} member{squad.members.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <Copy size={14} />
          <span className="font-mono text-sm tracking-wider">{squad.invite_code}</span>
        </button>
      </div>

      {/* Invite friends CTA */}
      {squad.members.length < 5 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-500/10 border border-brand-500/20"
        >
          <UserPlus size={18} className="text-brand-400 flex-shrink-0" />
          <p className="text-xs text-brand-300">
            Share code <span className="font-mono font-bold">{squad.invite_code}</span> with friends to invite them!
          </p>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {sortedMembers.map((member, idx) => {
          const isMe = member.user_id === userId;
          const isOwner = member.user_id === squad.owner_id;
          const medal = idx < 3 ? MEDAL_ICONS[idx] : null;
          const medalColor = idx < 3 ? MEDAL_COLORS[idx] : '';

          return (
            <motion.div
              key={member.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-2xl border ${
                idx < 3
                  ? `bg-gradient-to-r ${medalColor}`
                  : 'bg-white/5 border-white/10'
              } p-4`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {medal || <span className="text-sm text-slate-500 font-bold">#{idx + 1}</span>}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                    <span className="text-sm font-bold text-white truncate">{member.display_name}</span>
                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400 text-[9px] font-bold">YOU</span>
                    )}
                    {isOwner && (
                      <Crown size={12} className="text-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Flame size={12} className="text-orange-400" />
                      {member.streak} day streak
                    </span>
                  </div>
                </div>

                {/* Completion ring */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke="url(#squadGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${member.completion_today * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="squadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--brand-400, #818cf8)" />
                        <stop offset="100%" stopColor="var(--brand-600, #4f46e5)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    {Math.round(member.completion_today * 100)}%
                  </span>
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
            <p className="text-xs text-slate-400">Are you sure?</p>
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all"
            >
              Yes, leave
            </button>
            <button
              onClick={() => setConfirmLeave(false)}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLeave(true)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Leave Squad
          </button>
        )}
      </div>
    </div>
  );
}
