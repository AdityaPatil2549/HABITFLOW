import { motion } from 'framer-motion';
import { Trophy, GripHorizontal } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { habitService } from '../../services/habitService';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';

export function TargetWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const { habits } = useHabitStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const scheduled = habits.filter(h => !h.archived && habitService.isScheduledForDate(h, today));
  const done = scheduled.filter(h => !!h.todayLog && h.todayLog.value >= 1).length;
  const remaining = scheduled.length - done;
  const pct = scheduled.length > 0 ? Math.round((done / scheduled.length) * 100) : 0;

  const circ = 2 * Math.PI * 78;
  const offset = circ - (circ * pct) / 100;

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="h-full relative group widget-container">
      {dragHandleProps && (
        <div 
          {...dragHandleProps} 
          className="absolute top-2 right-2 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}
      <TiltCard borderGlow className="h-full">
        <SpotlightCard
          variants={item}
          className="h-full rounded-[2.5rem] p-6 sm:p-10 relative"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Trophy size={100} className="text-brand-400" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white mb-4 sm:mb-6">Today's Target</h2>

          <div className="flex justify-center mb-4 sm:mb-6 relative group/ring">
            <div
              className={cn(
                'absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000',
                pct >= 100 ? 'bg-rose-500 scale-110 opacity-30' : 'bg-brand-500'
              )}
            />

            <svg
              className="w-36 h-36 sm:w-48 sm:h-48 -rotate-90 relative z-10"
              viewBox="0 0 192 192"
            >
              <circle
                cx="96"
                cy="96"
                r="78"
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="12"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="78"
                fill="transparent"
                stroke="url(#alive-ring-grad)"
                strokeWidth="12"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.8, ease: 'circOut' }}
                strokeLinecap="round"
                className={cn(pct >= 100 && 'animate-pulse')}
                style={{
                  filter: `drop-shadow(0 0 12px ${pct >= 100 ? 'rgba(244,63,94,0.5)' : 'rgba(139,92,246,0.4)'})`,
                }}
              />
              <defs>
                <linearGradient id="alive-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-4xl sm:text-5xl font-black text-white tracking-tighter flex items-baseline"
              >
                <AnimatedNumber value={pct} />
                <span className="text-xl sm:text-2xl text-slate-500 ml-0.5">%</span>
              </motion.span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                Complete
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Done
              </p>
              <p className="text-base sm:text-lg font-bold text-emerald-400">
                <AnimatedNumber value={done} />
              </p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Left
              </p>
              <p className="text-base sm:text-lg font-bold text-white">
                <AnimatedNumber value={remaining} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total
              </p>
              <p className="text-base sm:text-lg font-bold text-white">
                <AnimatedNumber value={scheduled.length} />
              </p>
            </div>
          </div>
        </SpotlightCard>
      </TiltCard>
    </div>
  );
}
