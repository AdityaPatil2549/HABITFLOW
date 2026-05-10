import { useEffect, useState, useRef } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useProfileStore } from '../store/profileStore';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Trophy, CheckCircle2, Flame, ArrowRight, Target, Share2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gamificationService } from '../services/gamificationService';
import { toPng } from 'html-to-image';
import { ShareCard } from '../components/gamification/ShareCard';
import { getOrCreateSettings } from '../db';
import { soundService } from '../services/soundService';

export function WeeklyReviewPage() {
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();
  const [xpData, setXpData] = useState<any>(null);
  const [theme, setTheme] = useState('indigo');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHabits();
    loadTasks();
    gamificationService.getUserXP().then(setXpData);
    getOrCreateSettings().then(s => setTheme(s.theme || 'indigo'));
  }, [loadHabits, loadTasks]);

  // Compute stats for the past 7 days
  const today = new Date();
  const weekStart = subDays(today, 7);
  
  const tasksDoneThisWeek = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= weekStart).length;
  
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.current)) : 0;
  const bestHabit = habits.length ? [...habits].sort((a, b) => b.completionRate30Days - a.completionRate30Days)[0] : null;
  const strugglingHabit = habits.length ? [...habits].sort((a, b) => a.completionRate30Days - b.completionRate30Days)[0] : null;

  const shareMilestone = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      soundService.playLevelUp();
      const link = document.createElement('a');
      link.download = `habitflow-weekly-review-${format(new Date(), 'yyyy-MM-dd')}.png`;
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="text-center py-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Weekly Review</p>
        <h1 className="text-4xl font-bold text-white mb-3">You're doing great!</h1>
        <p className="text-slate-400">Here's a look at what you accomplished over the last 7 days.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6 text-center border-t-2 border-t-emerald-500/50">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-3xl font-black text-white mb-1">{tasksDoneThisWeek}</h3>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tasks Completed</p>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center border-t-2 border-t-amber-500/50">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
            <Flame size={24} />
          </div>
          <h3 className="text-3xl font-black text-white mb-1">{bestStreak} <span className="text-lg text-slate-500 font-medium">days</span></h3>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Best Active Streak</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6 mt-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="text-brand-400" /> Habit Check-in
        </h2>
        
        {bestHabit && (
          <div className="flex gap-4 items-center bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-3xl">🏆</div>
            <div>
              <p className="text-sm text-slate-400 font-medium mb-0.5">Most Consistent</p>
              <p className="text-base font-bold text-white">{bestHabit.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-black text-emerald-400">{Math.round(bestHabit.completionRate30Days * 100)}%</p>
              <p className="text-xs text-slate-500">completion rate</p>
            </div>
          </div>
        )}

        {strugglingHabit && strugglingHabit.completionRate30Days < 0.5 && (
          <div className="flex gap-4 items-center bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-3xl">🌱</div>
            <div>
              <p className="text-sm text-slate-400 font-medium mb-0.5">Needs Attention</p>
              <p className="text-base font-bold text-white">{strugglingHabit.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-black text-amber-400">{Math.round(strugglingHabit.completionRate30Days * 100)}%</p>
              <p className="text-xs text-slate-500">completion rate</p>
            </div>
          </div>
        )}
      </div>

      {xpData && (
        <div className="glass-card rounded-2xl p-6 text-center mt-6">
          <Trophy size={32} className="mx-auto text-brand-400 mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Level {xpData.numericLevel} — {xpData.level}</h2>
          <p className="text-sm text-slate-400 mb-6">You earned {xpData.weeklyScore} XP this week!</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button 
              onClick={shareMilestone}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : <><Share2 size={18} /> Share Milestone</>}
            </button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}>
              Continue to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Hidden element for Image Generation */}
      {xpData && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
          <ShareCard
            ref={cardRef}
            theme={theme}
            title="Weekly Review"
            subtitle="I crushed it this week!"
            userName={profile?.name || 'HabitFlow User'}
            userAvatar={profile?.avatar}
            userXP={xpData}
            stats={[
              { label: 'Tasks Done', value: tasksDoneThisWeek, icon: 'check' },
              { label: 'Best Streak', value: `${bestStreak}d`, icon: 'flame' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
