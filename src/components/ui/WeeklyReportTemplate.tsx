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
      className="bg-[#0B0B0E] text-[#FAFAFC] p-10 w-[800px] rounded-2xl border border-[#24242C]"
      style={{
        fontFamily: "'Geist Variable', 'Geist', sans-serif",
      }}
    >
      <div className="flex justify-between items-end mb-8 border-b border-[#24242C] pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--accent)]">
            Weekly Progress
          </h1>
          <p className="text-[#9E9EA9] mt-2 text-lg font-medium">
            {format(weekStart, 'MMM do')} - {format(today, 'MMM do, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono tabular-nums text-[#FAFAFC]">{activeHabits.length}</div>
          <div className="text-xs font-mono font-bold text-[#6E6E78] uppercase tracking-widest">
            Active Habits
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {activeHabits.slice(0, 6).map(habit => (
          <div
            key={habit.id}
            className="bg-[#141418] rounded-xl p-5 border border-[#24242C] flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg text-[#FAFAFC]">{habit.name}</h3>
              <span className="text-sm text-[#9E9EA9]">{habit.category}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">{habit.streak.current}d</div>
              <div className="text-xs font-mono font-bold text-[#6E6E78] uppercase tracking-wider">
                Streak
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center border-t border-[#24242C] pt-6">
        <p className="text-[#6E6E78] font-mono font-bold tracking-widest uppercase text-xs">
          HabitFlow · Swiss Kinetic Instrument
        </p>
      </div>
    </div>
  );
});
