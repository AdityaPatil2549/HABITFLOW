import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Save,
  Award,
  Flame,
  CheckCircle2,
  TrendingUp,
  Star,
  Edit2,
  X,
  Settings,
  Share2,
  Snowflake,
  Palette,
} from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useProfileStore } from '../store/profileStore';
import { useGamificationStore } from '../store/gamificationStore';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';
import { ShareCard } from '../components/gamification/ShareCard';
import { getOrCreateSettings } from '../db';
import { useToast } from '../components/common/Toast';
import { soundService } from '../services/soundService';
import { calculateStats } from '../services/gamificationService';

// All achievable badges (catalogue) — icon + label must match what gamificationService awards
const BADGE_CATALOGUE = [
  { id: 'streak_3', icon: '🔥', label: '3-Day Streak', desc: 'Kept a habit for 3 days in a row' },
  { id: 'streak_7', icon: '🌟', label: '7-Day Streak', desc: 'Completed habits 7 days in a row' },
  { id: 'streak_30', icon: '💪', label: 'Iron Will', desc: '30-day streak on any habit' },
  { id: 'streak_100', icon: '🏆', label: 'Legend', desc: '100-day streak — extraordinary!' },
  { id: 'xp_100', icon: '⚡', label: 'XP Starter', desc: 'Earn your first 100 XP' },
  { id: 'xp_500', icon: '🚀', label: 'Rising Star', desc: 'Accumulate 500 XP' },
  { id: 'xp_1000', icon: '💎', label: 'Diamond', desc: 'Accumulate 1,000 XP' },
  { id: 'tasks_10', icon: '✅', label: 'Task Crusher', desc: 'Complete 10 tasks' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { profile, saveProfile } = useProfileStore();
  const { userXP, loadXP, buyFreeze } = useGamificationStore();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState('indigo');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHabits();
    loadTasks();
    loadXP();
    getOrCreateSettings().then(s => setTheme(s.theme || 'indigo'));
  }, [loadHabits, loadTasks, loadXP]);

  // Draft state (only committed on Save)
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);

  const name = profile.name;
  const bio = profile.bio;
  const avatar = profile.avatar;

  function startEdit() {
    setDraftName(name);
    setDraftBio(bio);
    setDraftAvatar(avatar);
    setEditing(true);
    setSaved(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleSave() {
    saveProfile({ name: draftName.trim() || 'Alex', bio: draftBio.trim(), avatar: draftAvatar });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraftAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Stats
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best)) : 0;
  const totalDone = tasks.filter(t => t.completed).length;
  const avgCompletion = habits.length
    ? Math.round((habits.reduce((s, h) => s + h.completionRate30Days, 0) / habits.length) * 100)
    : 0;
  const earnedBadges = userXP?.badgesEarned?.length ?? 0;

  const shareProfile = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      soundService.playLevelUp();
      const link = document.createElement('a');
      link.download = `habitflow-player-card-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    document.title = 'Profile — HabitFlow';
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 relative">

      {/* Settings / Edit Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-ink)] mb-1">Account</p>
          <h1 className="text-3xl font-bold text-[var(--tx-primary)]">
            My Profile
          </h1>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 size={15} /> Changes saved!
          </div>
        )}
      </div>

      {/* Profile card */}
      <div>
        <div className="card-raised p-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div
            className={`relative flex-shrink-0 ${!editing ? 'cursor-pointer group' : ''}`}
            onClick={() => !editing && startEdit()}
          >
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center transition-transform group-hover:scale-105">
              {editing && draftAvatar ? (
                <img src={draftAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black">
                  {name[0]?.toUpperCase() ?? 'A'}
                </span>
              )}
              {!editing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={20} className="text-white" />
                </div>
              )}
            </div>
            {editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  aria-label="Upload avatar photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-24 h-24 rounded-2xl bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={18} className="text-white" />
                  <span className="text-[10px] text-white font-semibold">Upload</span>
                </button>
                {draftAvatar && (
                  <button
                    type="button"
                    aria-label="Remove uploaded avatar"
                    onClick={() => setDraftAvatar(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <X size={11} className="text-white" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Name / Bio */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--tx-secondary)] uppercase tracking-wider mb-1 block">
                    Display Name
                  </label>
                  <input
                    className="input text-lg font-bold"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Your name"
                    maxLength={32}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--tx-secondary)] uppercase tracking-wider mb-1 block">
                    Bio
                  </label>
                  <textarea
                    className="input text-sm resize-none leading-relaxed"
                    value={draftBio}
                    onChange={e => setDraftBio(e.target.value)}
                    placeholder="Tell us about yourself…"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-[10px] text-[var(--tx-muted)] text-right mt-1">
                    {draftBio.length}/160
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-[var(--tx-primary)]">{name}</h2>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-[var(--accent-ink)] bg-[var(--accent-subtle)] border border-[var(--accent)]/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} /> {userXP ? calculateStats(userXP.total).level : 'Beginner'}
                  </span>
                  <span className="text-xs text-[var(--tx-muted)]">
                    Member since{' '}
                    {habits.length > 0
                      ? format(
                          new Date(Math.min(...habits.map(h => new Date(h.createdAt).getTime()), Date.now())),
                          'MMM yyyy'
                        )
                      : format(new Date(), 'MMM yyyy')}
                  </span>
                </div>
                <p className="text-[var(--tx-secondary)] text-sm leading-relaxed">{bio || 'No bio set yet.'}</p>
              </div>
            )}

            {/* Edit / Save / Cancel buttons */}
            <div className="flex gap-2 mt-6">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                  >
                    <X size={14} /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame size={24} />,
            label: 'Best Streak',
            value: `${bestStreak}d`,
            color: '#f97316',
          },
          {
            icon: <CheckCircle2 size={24} />,
            label: 'Tasks Done',
            value: totalDone,
            color: '#10b981',
          },
          {
            icon: <TrendingUp size={24} />,
            label: '30d Avg',
            value: `${avgCompletion}%`,
            color: '#818cf8',
          },
          {
            icon: <Award size={24} />,
            label: 'Badges',
            value: `${earnedBadges}/${BADGE_CATALOGUE.length}`,
            color: '#f59e0b',
          },
        ].map((s) => (
          <div key={s.label} className="h-full">
            <div>
              <div className="card-raised p-4 text-center h-full">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${s.color}18`, color: s.color }}
                >
                  {s.icon}
                </div>
                <p className="text-xl font-bold text-[var(--tx-primary)] font-mono tabular-nums">{s.value}</p>
                <p className="text-xs text-[var(--tx-muted)] mt-0.5">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Streak Freezes */}
      <div>
        <div className="card-raised p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Snowflake size={120} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Snowflake size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--tx-primary)] mb-1">
                Streak Freezes: <span className="text-blue-400 font-mono">{userXP?.streakFreezes ?? 0}</span>
              </h2>
              <p className="text-sm text-[var(--tx-secondary)]">
                Protects your streak if you miss a day. (Auto-applied)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if ((userXP?.coins ?? 0) < 500) {
                toast.error('Not enough Coins! You need 500 Coins to buy a Streak Freeze.');
                return;
              }
              toast.confirm('Buy 1 Streak Freeze for 500 Coins?', () => {
                buyFreeze(500).then(success => {
                  if (success) {
                    soundService.playLevelUp();
                    toast.success('Streak Freeze purchased! ❄️');
                  }
                });
              });
            }}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-bold text-sm"
          >
            Buy for 500 Coins
          </button>
        </div>
        </div>
      </div>

      {/* Armory & Signal Inks */}
      <div>
        <div className="card-raised p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--tx-primary)] flex items-center gap-2">
              <Palette size={18} className="text-[var(--accent-ink)]" /> Armory & Signal Inks
            </h2>
            <p className="text-xs text-[var(--tx-secondary)] mt-1">
              {userXP?.coins ?? 0} Coins available for Signal Ink cartridges, acoustic packs, and streak protection.
            </p>
          </div>
          <button
            onClick={() => navigate('/hub/shop')}
            className="btn-secondary shrink-0 px-4 py-2 text-xs font-bold"
          >
            Open Armory
          </button>
        </div>
        </div>
      </div>

      <div>
        <div className="card-raised p-6">
          <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[var(--tx-primary)]">Badges & Achievements</h2>
          <span className="text-xs text-[var(--tx-muted)] font-mono">
            {userXP?.badgesEarned?.length ?? 0} of {BADGE_CATALOGUE.length} earned
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGE_CATALOGUE.map((b) => {
            const earnedBadge = userXP?.badgesEarned?.find(
              e => e.id === b.id || e.name === b.label
            );
            const isEarned = !!earnedBadge;
            return (
              <div
                key={b.id}
                className={`rounded-xl p-4 border h-full ${isEarned ? 'border-[var(--border-strong)] bg-[var(--sf-overlay)]' : 'border-[var(--border-default)] bg-[var(--sf-base)] opacity-55'}`}
              >
                  <span className={`text-2xl block mb-2 ${!isEarned && 'grayscale opacity-50'}`}>
                    {b.icon}
                  </span>
                  <p className="text-sm font-semibold text-[var(--tx-primary)] mb-1">{b.label}</p>
                  <p className="text-xs text-[var(--tx-muted)] leading-relaxed">{b.desc}</p>
                  {isEarned && (
                    <span className="mt-2 inline-block text-[10px] font-bold text-emerald-400">
                      ✓ Earned
                      {earnedBadge?.earnedAt
                        ? ` · ${new Date(earnedBadge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : ''}
                    </span>
                  )}
                </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="card-raised p-5 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/hub/settings')}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold"
        >
          <Settings size={16} /> Go to Settings
        </button>
        <button
          disabled={isGenerating}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50"
          onClick={shareProfile}
        >
          {isGenerating ? (
            'Generating...'
          ) : (
            <>
              <Share2 size={16} /> Download Player Card
            </>
          )}
        </button>
      </div>

      {/* Hidden element for Image Generation */}
      {userXP && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }} aria-hidden="true">
          <ShareCard
            ref={cardRef}
            theme={theme}
            title={`${userXP.total} XP`}
            subtitle="Official HabitFlow Player"
            userName={name || 'HabitFlow User'}
            userAvatar={avatar}
            userXP={userXP}
            stats={[
              { label: 'Best Streak', value: `${bestStreak}d`, icon: 'flame' },
              { label: 'Tasks Done', value: totalDone, icon: 'check' },
              { label: 'Avg. Rate', value: `${avgCompletion}%`, icon: 'trending' },
              { label: 'Badges', value: earnedBadges, icon: 'award' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
