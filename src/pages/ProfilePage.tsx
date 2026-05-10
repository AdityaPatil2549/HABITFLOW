import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Award, Flame, CheckCircle2, TrendingUp, Star, Edit2, X, Settings, Share2, Snowflake, Palette } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useProfileStore } from '../store/profileStore';
import { useGamificationStore } from '../store/gamificationStore';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';
import { ShareCard } from '../components/gamification/ShareCard';
import { getOrCreateSettings } from '../db';
import { soundService } from '../services/soundService';

const BADGES = [
  { icon: '🔥', label: '7-Day Streak', desc: 'Completed habits 7 days in a row', earned: true },
  { icon: '💪', label: 'Iron Will', desc: '30-day streak on any habit', earned: true },
  { icon: '🏆', label: 'Overachiever', desc: '100% completion for a full week', earned: false },
  { icon: '⚡', label: 'Speed Demon', desc: 'Complete all tasks before noon', earned: false },
  { icon: '🌙', label: 'Night Owl', desc: 'Log a habit after 10 PM for 5 days', earned: true },
  { icon: '📚', label: 'Scholar', desc: 'Read habit completed 30 times', earned: false },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { habits } = useHabitStore();
  const { tasks } = useTaskStore();
  const { profile, saveProfile } = useProfileStore();
  const { userXP, buyFreeze } = useGamificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState('indigo');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrCreateSettings().then(s => setTheme(s.theme || 'indigo'));
  }, []);

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
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
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
  const earnedBadges = BADGES.filter(b => b.earned).length;

  const shareProfile = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      soundService.playLevelUp();
      const link = document.createElement('a');
      link.download = `habitflow-player-card-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 relative">
      {/* Settings / Edit Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">Account</p>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 size={15} /> Changes saved!
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className={`relative flex-shrink-0 ${!editing ? 'cursor-pointer group' : ''}`} onClick={() => !editing && startEdit()}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-105">
              {editing && draftAvatar ? (
                <img src={draftAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-white">{name[0]?.toUpperCase() ?? 'A'}</span>
              )}
              {!editing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit2 size={20} className="text-white" />
                </div>
              )}
            </div>
            {editing && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-24 h-24 rounded-2xl bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={18} className="text-white" />
                  <span className="text-[10px] text-white font-semibold">Upload</span>
                </button>
                {draftAvatar && (
                  <button
                    onClick={() => setDraftAvatar(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow"
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Display Name</label>
                  <input
                    className="w-full bg-white/5 border border-brand-500/40 rounded-xl px-4 py-2.5 text-white text-lg font-bold outline-none focus:border-brand-400 transition-all"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Your name"
                    maxLength={32}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Bio</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-sm outline-none focus:border-brand-500/50 transition-all resize-none leading-relaxed"
                    value={draftBio}
                    onChange={e => setDraftBio(e.target.value)}
                    placeholder="Tell us about yourself…"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-[10px] text-slate-600 text-right mt-1">{draftBio.length}/160</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{name}</h2>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} /> Peak Performer
                  </span>
                  <span className="text-xs text-slate-500">Member since Apr 2026</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{bio || 'No bio set yet.'}</p>
              </div>
            )}

            {/* Edit / Save / Cancel buttons */}
            <div className="flex gap-2 mt-4">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 6px 20px rgba(var(--brand-500-rgb),0.3)' }}
                  >
                    <Save size={14} /> Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Flame size={18} />, label: 'Best Streak', value: `${bestStreak}d`, color: '#f97316' },
          { icon: <CheckCircle2 size={18} />, label: 'Tasks Done', value: totalDone, color: '#10b981' },
          { icon: <TrendingUp size={18} />, label: '30d Avg', value: `${avgCompletion}%`, color: '#818cf8' },
          { icon: <Award size={18} />, label: 'Badges', value: `${earnedBadges}/${BADGES.length}`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Streak Freezes */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Snowflake size={120} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-blue-400">
              <Snowflake size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Streak Freezes: <span className="text-blue-400">{userXP?.streakFreezes ?? 0}</span>
              </h2>
              <p className="text-sm text-slate-400">Protects your streak if you miss a day. (Auto-applied)</p>
            </div>
          </div>
          <button
            onClick={() => {
              if ((userXP?.total ?? 0) < 500) {
                alert('Not enough XP! You need 500 XP to buy a Streak Freeze.');
                return;
              }
              if (confirm('Buy 1 Streak Freeze for 500 XP?')) {
                buyFreeze(500).then(success => {
                  if (success) {
                    import('../services/soundService').then(m => m.soundService.playLevelUp());
                  }
                });
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-blue-100 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}
          >
            Buy for 500 XP
          </button>
        </div>
      </div>

      {/* Theme Shop */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Palette size={18} className="text-brand-400" /> Premium Themes
          </h2>
          <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-1 rounded-md">
            {userXP?.total ?? 0} XP
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'neon', label: 'Neon Pink', cost: 1000, color: '#ec4899' },
            { id: 'cyberpunk', label: 'Cyberpunk', cost: 1500, color: '#eab308' },
            { id: 'sunset', label: 'Sunset Glow', cost: 2000, color: '#f97316' },
          ].map(t => {
            const unlocked = userXP?.unlockedThemes?.includes(t.id);
            return (
              <div key={t.id} className="rounded-xl p-4 border border-white/5 bg-white/[0.02] flex flex-col gap-3 transition-all hover:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full shadow" style={{ background: t.color }} />
                    <p className="text-sm font-bold text-white">{t.label}</p>
                  </div>
                </div>
                {unlocked ? (
                  <button disabled className="w-full py-2 rounded-lg bg-white/5 text-slate-500 text-xs font-bold cursor-default">
                    Unlocked
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if ((userXP?.total ?? 0) < t.cost) {
                        alert(`You need ${t.cost} XP to unlock this theme!`);
                        return;
                      }
                      if (confirm(`Unlock ${t.label} theme for ${t.cost} XP?`)) {
                        useGamificationStore.getState().unlockTheme(t.id, t.cost).then(success => {
                          if (success) {
                            import('../services/soundService').then(m => m.soundService.playLevelUp());
                            alert('Theme unlocked! Go to Settings to equip it.');
                          }
                        });
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-bold hover:bg-brand-500/20 transition-all active:scale-95 border border-brand-500/20"
                  >
                    Unlock {t.cost} XP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Badges & Achievements</h2>
          <span className="text-xs text-slate-500">{earnedBadges} of {BADGES.length} earned</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map(b => (
            <div key={b.label}
              className={`rounded-xl p-4 border transition-all ${b.earned ? 'border-brand-500/20 bg-brand-500/5' : 'border-white/5 bg-white/[0.02] opacity-50'}`}>
              <span className={`text-2xl block mb-2 ${!b.earned && 'grayscale opacity-50'}`}>{b.icon}</span>
              <p className="text-sm font-semibold text-white mb-1">{b.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
              {b.earned && <span className="mt-2 inline-block text-[10px] font-bold text-emerald-400">✓ Earned</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/settings')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
          <Settings size={16} /> Go to Settings
        </button>
        <button
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}
          onClick={shareProfile}
        >
          {isGenerating ? 'Generating...' : <><Share2 size={16} /> Download Player Card</>}
        </button>
      </div>

      {/* Hidden element for Image Generation */}
      {userXP && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
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
