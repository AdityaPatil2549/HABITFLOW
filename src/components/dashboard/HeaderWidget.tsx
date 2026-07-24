import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, AlertTriangle, GripHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore } from '../../store/habitStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { calculateStats } from '../../services/gamificationService';
import { habitService } from '../../services/habitService';
import { format } from 'date-fns';
import { DailyQuote } from '../ui/DailyQuote';
import { AICoachCard } from '../coach/AICoachCard';
import { MagneticButton } from '../ui/MagneticButton';

const PROFILE_KEY = 'habitflow_profile';

export function HeaderWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const navigate = useNavigate();
  const { habits } = useHabitStore();
  const { userXP } = useGamificationStore();

  const [userName, setUserName] = useState(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw).name || 'User' : 'User';
    } catch {
      return 'User';
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) {
          setUserName(JSON.parse(raw).name);
        }
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener('storage', sync);
    window.addEventListener('profile-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('profile-updated', sync);
    };
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const scheduled = habits.filter(h => !h.archived && habitService.isScheduledForDate(h, today));
  const done = scheduled.filter(h => !!h.todayLog && h.todayLog.value >= 1).length;

  const hour = new Date().getHours();
  const atRiskHabits = hour >= 20 ? scheduled.filter(h => !h.todayLog && h.streak.current > 0) : [];
  const xpStats = userXP ? calculateStats(userXP.total) : null;
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 relative group widget-container w-full">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute -top-6 right-0 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}

      <motion.div variants={item} className="flex flex-col gap-6 sm:gap-8 w-full">
        <div className="flex flex-col gap-2 relative w-full">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black dark:text-white text-slate-900 tracking-tighter leading-none relative z-10 drop-shadow-2xl">
            {greeting},{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-brand-400 via-brand-500 to-indigo-600">
              {userName}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl font-medium mt-4 w-full">
            {done === scheduled.length && scheduled.length > 0
              ? '🎉 Incredible. You have conquered all habits for today.'
              : done > 0
                ? `${done} of ${scheduled.length} habits logged. Maintain the momentum.`
                : scheduled.length > 0
                  ? `You have ${scheduled.length} targets locked in for today.`
                  : 'Your canvas is empty. Plot your trajectory.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <MagneticButton
            onClick={() => navigate('/habits')}
            className="group relative flex items-center gap-4 pl-6 pr-2 py-2 rounded-full bg-white text-slate-950 font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            intensity={0.2}
          >
            <span>Engage Habit</span>
            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
              <Plus size={20} className="group-hover:rotate-90 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </MagneticButton>

          {xpStats && (
            <div data-tour="stats-widget" className="flex flex-col items-start gap-1 ml-4 px-6 py-3 rounded-2xl vision-panel backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  {userXP?.total ?? 0} XP
                </span>
              </div>
              <div className="w-32 h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                  style={{ width: `${xpStats.levelProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <DailyQuote />
      </motion.div>

      {atRiskHabits.length > 0 && (
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 rounded-[2rem] border border-red-500/30 bg-red-500/10 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(239,68,68,0.3)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-red-400 tracking-tight">
              {atRiskHabits.length === 1
                ? `Critical: "${atRiskHabits[0].name}" streak is at risk!`
                : `Critical: ${atRiskHabits.length} streaks at risk today!`}
            </h3>
            <p className="text-sm font-medium text-red-400/80 mt-1">
              {atRiskHabits.map(h => `${h.name} (${h.streak.current}d)`).join(' · ')}
            </p>
          </div>
          <MagneticButton
            onClick={() => navigate('/habits')}
            className="group flex-shrink-0 flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 transition-colors whitespace-nowrap border border-red-500/30"
            intensity={0.2}
          >
            <span>Avert Crisis</span>
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </MagneticButton>
        </motion.div>
      )}

      <motion.div variants={item}>
        <AICoachCard />
      </motion.div>
    </div>
  );
}
