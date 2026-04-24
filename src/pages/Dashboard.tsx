import { useEffect, useState } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, Trophy, ArrowRight, Plus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconRenderer } from '../components/common/IconRenderer';

const PROFILE_KEY = 'habitflow_profile';

export function Dashboard() {
  const navigate = useNavigate();
  const { habits, loadHabits, logHabit, unlogHabit } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const [userName, setUserName] = useState('Alex');

  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    loadHabits();
    loadTasks();
    const sync = () => {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          setUserName(p.name);
          setUserAvatar(p.avatar);
        }
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('profile-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('profile-updated', sync);
    };
  }, [loadHabits, loadTasks]);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Habit progress
  const scheduled = habits.filter(h => {
    if (h.archived) return false;
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekly') return (h.frequencyDays ?? []).includes(new Date().getDay());
    return true;
  });
  const done = scheduled.filter(h => !!h.todayLog && h.todayLog.value >= 1).length;
  const remaining = scheduled.length - done;
  const pct = scheduled.length > 0 ? Math.round((done / scheduled.length) * 100) : 0;

  // Ring math
  const circ = 477;
  const offset = circ - (circ * pct) / 100;

  // Tasks due today
  const todayTasks = tasks.filter(t => !t.parentId && !t.completed && t.dueDate && t.dueDate <= today);
  const urgentTasks = todayTasks.filter(t => t.priority === 0 || t.priority === 1);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-end justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/20 border-2 border-white/10 flex-shrink-0">
            {userAvatar ? (
               <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               <span className="text-2xl font-black text-white">{userName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">{greeting}, {userName}</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {done === scheduled.length && scheduled.length > 0
                ? 'Incredible! All habits completed for today.'
                : done > 0
                ? `You've completed ${done} of ${scheduled.length} habits. Keep it up!`
                : 'Zero habits logged yet. Let\'s get started!'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/habits')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition-all mb-1"
        >
          <Plus size={16} /> New Habit
        </button>
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Ring Card */}
        <motion.div variants={item} className="lg:col-span-1 glass-card rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy size={120} className="text-brand-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-8">Daily Target</h2>
          
          <div className="flex justify-center mb-8 relative">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r="78" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
              <motion.circle
                cx="96" cy="96" r="78" fill="transparent"
                stroke="url(#dash-grad)" strokeWidth="12"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.3))' }}
              />
              <defs>
                <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-400)" />
                  <stop offset="100%" stopColor="var(--brand-600)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{pct}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Consistency</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remaining</p>
              <p className="text-xl font-bold text-white">{remaining}</p>
            </div>
            <div className="text-center border-l border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
              <p className="text-xl font-bold text-emerald-400">{done}</p>
            </div>
          </div>
        </motion.div>

        {/* Vitality / Activity Chart */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-3xl p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-brand-400" /> Performance Index
              </h2>
              <p className="text-slate-400 text-sm mt-1">Your productivity trends over the last 7 days.</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ArrowRight size={12} className="text-emerald-400 -rotate-45" />
              <span className="text-xs font-bold text-emerald-400">+14.2%</span>
            </div>
          </div>

          <div className="h-48 w-full mt-4">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 120">
              <defs>
                <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--brand-400)" />
                </linearGradient>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,100 Q50,95 100,70 T200,40 T300,60 T400,20 L400,120 L0,120 Z" fill="url(#area-grad)" />
              <motion.path 
                d="M0,100 Q50,95 100,70 T200,40 T300,60 T400,20" 
                fill="none" stroke="url(#line-grad)" strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              {[0, 100, 200, 300, 400].map((x, i) => (
                <circle key={i} cx={x} cy={[100, 70, 40, 60, 20][i]} r="4" fill="#0f172a" stroke="var(--brand-400)" strokeWidth="2" />
              ))}
            </svg>
            <div className="flex justify-between mt-4 px-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <span key={d} className="text-[10px] font-bold text-slate-600">{d}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Today's Tasks & Habits Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Due Tasks */}
        <motion.div variants={item} className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-brand-400" /> Focus for Today
            </h2>
            <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic text-sm">
                No tasks due for today. Enjoy!
              </div>
            ) : (
              todayTasks.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                  <div className={`w-1.5 h-8 rounded-full ${['bg-red-500','bg-orange-500','bg-brand-500','bg-slate-600'][t.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-brand-400 transition-colors">{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{t.dueDate === today ? 'Due today' : 'Overdue'}</p>
                  </div>
                  <button 
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:bg-brand-500/10 hover:text-brand-400 hover:border-brand-500/30 transition-all"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))
            )}
            {todayTasks.length > 4 && (
              <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-2">
                + {todayTasks.length - 4} more tasks
              </p>
            )}
          </div>
        </motion.div>

        {/* Habit Checklist */}
        <motion.div variants={item} className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-orange-500" /> Active Habits
            </h2>
            <button onClick={() => navigate('/habits')} className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest">
              Manager
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scheduled.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-500 italic text-sm">
                No habits scheduled for today.
              </div>
            ) : (
              scheduled.slice(0, 6).map(h => (
                <div 
                  key={h.id} 
                  onClick={() => {
                    const isDone = h.todayLog && h.todayLog.value >= 1;
                    if (isDone) unlogHabit(h.id);
                    else logHabit(h.id, 1);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-3 ${
                    h.todayLog && h.todayLog.value >= 1 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-active:scale-90 ${
                    h.todayLog && h.todayLog.value >= 1 ? 'bg-emerald-500/20' : 'bg-white/5'
                  }`}>
                    <IconRenderer name={h.icon} size={20} color={h.todayLog && h.todayLog.value >= 1 ? '#10b981' : 'var(--brand-400)'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${h.todayLog && h.todayLog.value >= 1 ? 'text-emerald-400' : 'text-white'}`}>
                      {h.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame size={10} className={h.streak.current > 0 ? 'text-orange-500' : 'text-slate-600'} />
                      <span className="text-[10px] font-bold text-slate-500">{h.streak.current}</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    h.todayLog && h.todayLog.value >= 1 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'border-white/20 text-transparent'
                  }`}>
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
