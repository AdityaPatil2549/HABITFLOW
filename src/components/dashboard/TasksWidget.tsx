import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, GripHorizontal } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { format } from 'date-fns';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { Reorder } from 'framer-motion';

export function TasksWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const navigate = useNavigate();
  const { tasks, completeTask, loading } = useTaskStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayTasks = tasks.filter(
    t => !t.parentId && !t.completed && t.dueDate && t.dueDate <= today
  );

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div data-tour="tasks-widget" className="w-full h-full relative group widget-container">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}
      <TiltCard borderGlow className="w-full h-full">
        <SpotlightCard variants={item} className="h-full rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-400" /> Due & Overdue
            </h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest mr-8"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : todayTasks.length === 0 ? (
              <EmptyState 
                icon={CheckCircle2} 
                title="All clear!" 
                description="No tasks due today. Enjoy your day!" 
                actionLabel="Add a task" 
                onAction={() => navigate('/tasks')} 
                className="my-4"
              />
            ) : (
              <Reorder.Group axis="y" values={todayTasks.slice(0, 5)} onReorder={() => {}}>
                {todayTasks.slice(0, 5).map(t => (
                  <Reorder.Item
                    key={t.id}
                    value={t}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group/item mb-2"
                  >
                    <button
                      onClick={() => completeTask(t.id)}
                      className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0 hover:border-brand-400 hover:bg-brand-500/10 transition-all cursor-pointer"
                    >
                      <CheckCircle2
                        size={11}
                        className="text-transparent group-hover/item:text-brand-400 transition-colors"
                      />
                    </button>
                    <div
                      className={`w-1 h-6 rounded-full flex-shrink-0 ${['bg-red-500', 'bg-orange-500', 'bg-brand-500', 'bg-slate-600'][t.priority]}`}
                    />
                    <div className="flex-1 min-w-0 cursor-grab active:cursor-grabbing">
                      <p className="text-sm font-semibold text-white truncate group-hover/item:text-brand-400 transition-colors">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t.dueDate === today ? 'Due today' : 'Overdue'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 hover:bg-brand-500/10 hover:text-brand-400 hover:border-brand-500/30 transition-all opacity-0 group-hover/item:opacity-100"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
            {todayTasks.length > 5 && (
              <button
                onClick={() => navigate('/tasks')}
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest pt-1 transition-colors mt-2"
              >
                + {todayTasks.length - 5} more tasks
              </button>
            )}
          </div>
        </SpotlightCard>
      </TiltCard>
    </div>
  );
}
