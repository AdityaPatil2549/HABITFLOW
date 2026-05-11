import { useEffect, useState, useRef } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useProfileStore } from '../store/profileStore';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Trophy, CheckCircle2, Flame, ArrowRight, Target, Share2, Download, CloudRain, Sprout } from 'lucide-react';
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

  // Calculate XP Progress
  const currentLevelXP = xpData ? 100 * Math.pow(xpData.numericLevel - 1, 2) : 0;
  const nextLevelXP = xpData ? 100 * Math.pow(xpData.numericLevel, 2) : 100;
  const xpProgressPercent = xpData ? Math.min(100, Math.max(0, ((xpData.totalScore - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-8 relative min-h-[90vh]">
      {/* Background Glows matching Stitch design */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0B0E14]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-fuchsia-500/15 rounded-full blur-[120px]" />
      </div>

      <div className="text-center relative mb-10 z-10">
        {(() => {
          const activeHabits = habits.filter(h => !h.archived);
          const weeklyDone = activeHabits.filter(h => h.streak.current >= 1 || (h.completionRate30Days * 30) >= 1).length;
          const pct = activeHabits.length ? Math.round((weeklyDone / activeHabits.length) * 100) : 0;
          
          let headline = "Tough week — let's reset.";
          if (pct >= 70) headline = "You crushed it this week!";
          else if (pct >= 40) headline = "Building momentum!";
          else if (activeHabits.length === 0) headline = "Let's get started!";

          return (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-md shadow-lg">
                {pct >= 70 ? <Trophy size={32} className="text-emerald-400" /> : <CloudRain size={32} className="text-slate-300" />}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight text-white">{headline}</h1>
            </>
          );
        })()}
        <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed italic opacity-80">"Your habits determine your future."</p>
      </div>

      <div className="space-y-6 z-10 relative">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">{tasksDoneThisWeek}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Tasks Completed</p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
              <Flame size={20} />
            </div>
            <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">{bestStreak}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Best Streak (Days)</p>
          </motion.div>
        </div>

        {/* Habit Insights */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Habit Insights</h2>
          </div>
          
          {bestHabit && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400"><Trophy size={18} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Star Performer</p>
                    <p className="text-sm font-bold text-slate-200">{bestHabit.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-amber-400">{Math.round(bestHabit.completionRate30Days * 100)}%</p>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-300 h-1.5 rounded-full" style={{ width: `${Math.round(bestHabit.completionRate30Days * 100)}%` }} />
              </div>
            </div>
          )}

          {strugglingHabit && strugglingHabit.completionRate30Days < 0.5 && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><Sprout size={18} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Needs Attention</p>
                    <p className="text-sm font-bold text-slate-200">{strugglingHabit.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-400">{Math.round(strugglingHabit.completionRate30Days * 100)}%</p>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-1.5 rounded-full" style={{ width: `${Math.round(strugglingHabit.completionRate30Days * 100)}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Level & Rewards */}
        {xpData && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Trophy size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">Level {xpData.numericLevel} — {xpData.level}</h2>
                <p className="text-sm text-slate-400">You earned {xpData.weeklyScore} XP this week!</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Progress to Lvl {xpData.numericLevel + 1}</span>
                <span>{Math.round(xpProgressPercent)}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${xpProgressPercent}%` }} />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
              <button 
                onClick={shareMilestone}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-fuchsia-300 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : <><Share2 size={18} /> Share Milestone</>}
              </button>

              <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all active:scale-95 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

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
