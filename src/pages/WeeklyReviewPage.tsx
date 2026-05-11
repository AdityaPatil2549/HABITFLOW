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
import { useToast } from '../components/common/Toast';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function WeeklyReviewPage() {
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();
  const [xpData, setXpData] = useState<any>(null);
  const [theme, setTheme] = useState('indigo');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

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
  
  const bestStreak = habits.length ? Math.max(0, ...habits.map(h => h.streak.current)) : 0;
  const bestHabit = habits.length ? [...habits].sort((a, b) => b.completionRate30Days - a.completionRate30Days)[0] : null;
  const strugglingHabit = habits.length ? [...habits].filter(h => h.completionRate30Days < 0.5).sort((a, b) => a.completionRate30Days - b.completionRate30Days)[0] ?? null : null;

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
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-4">
      <div className="text-center relative">
        <div className="absolute inset-0 blur-3xl opacity-10 bg-brand-500 rounded-full scale-150 -z-10" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-400 mb-4 drop-shadow-sm">Weekly Review</p>
        {(() => {
          const activeHabits = habits.filter(h => !h.archived);
          const weeklyDone = activeHabits.filter(h =>
            h.streak.current >= 1 || (h.completionRate30Days * 30) >= 1
          ).length;
          const pct = activeHabits.length
            ? Math.round((weeklyDone / activeHabits.length) * 100)
            : 0;
          const { headline, emoji, colorClass } = pct >= 70
            ? { headline: "You crushed it this week!", emoji: "🔥", colorClass: "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400" }
            : pct >= 40
            ? { headline: "Building momentum!", emoji: "💪", colorClass: "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400" }
            : activeHabits.length === 0
            ? { headline: "Let's get started!", emoji: "🌱", colorClass: "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400" }
            : { headline: "Tough week — let's reset.", emoji: "🌧️", colorClass: "text-slate-300" };
          return (
            <>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl mb-6">{emoji}</motion.div>
              <h1 className={cn("text-5xl font-black mb-4 tracking-tight leading-tight", colorClass)}>{headline}</h1>
            </>
          );
        })()}
        <p className="text-slate-400 text-base font-medium max-w-md mx-auto leading-relaxed italic opacity-80">"Your habits determine your future."</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div 
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="glass-card rounded-3xl p-8 text-center relative overflow-hidden group kpi-card-emerald"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-125 transition-transform duration-700">
            <CheckCircle2 size={120} />
          </div>
          <h3 className="text-6xl font-black text-white mb-2 tracking-tighter">{tasksDoneThisWeek}</h3>
          <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Tasks Completed</p>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="glass-card rounded-3xl p-8 text-center relative overflow-hidden group kpi-card-amber"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-125 transition-transform duration-700">
            <Flame size={120} />
          </div>
          <h3 className="text-6xl font-black text-white mb-2 tracking-tighter">{bestStreak}</h3>
          <p className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Best Streak (Days)</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        className="glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Target size={20} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Habit Insights</h2>
        </div>
        
        {bestHabit && (
          <div className="group flex gap-5 items-center bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-6 border border-white/5 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏆</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Star Performer</p>
              <p className="text-lg font-bold text-white leading-tight">{bestHabit.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400 leading-none">{Math.round(bestHabit.completionRate30Days * 100)}%</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase mt-1">Consistency</p>
            </div>
          </div>
        )}

        {strugglingHabit && strugglingHabit.completionRate30Days < 0.5 && (
          <div className="group flex gap-5 items-center bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-6 border border-white/5 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🌱</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Needs Attention</p>
              <p className="text-lg font-bold text-white leading-tight">{strugglingHabit.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-rose-400 leading-none">{Math.round(strugglingHabit.completionRate30Days * 100)}%</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase mt-1">Consistency</p>
            </div>
          </div>
        )}
      </motion.div>

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
