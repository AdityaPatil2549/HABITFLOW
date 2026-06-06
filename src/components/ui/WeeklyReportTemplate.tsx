import React from 'react';
import { format, subDays } from 'date-fns';
import { useHabitStore } from '../../store/habitStore';

export const WeeklyReportTemplate = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { habits } = useHabitStore();
  const activeHabits = habits.filter(h => !h.archived);

  const today = new Date();
  const weekStart = subDays(today, 6);

  return (
    <div
      ref={ref}
      className="bg-slate-950 text-white p-10 w-[800px] rounded-3xl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-indigo-500">
            Weekly Progress
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">
            {format(weekStart, 'MMM do')} - {format(today, 'MMM do, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{activeHabits.length}</div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Active Habits
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {activeHabits.slice(0, 6).map(habit => (
          <div
            key={habit.id}
            className="bg-white/5 rounded-2xl p-5 border border-white/5 flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg text-white">{habit.name}</h3>
              <span className="text-sm text-slate-400">{habit.category}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-400">{habit.streak.current}d</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Streak
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center border-t border-white/10 pt-6">
        <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">
          Powered by HabitFlow
        </p>
      </div>
    </div>
  );
});
