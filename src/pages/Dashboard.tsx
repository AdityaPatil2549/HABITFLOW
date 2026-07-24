import { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { db, getOrCreateSettings } from '../db';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';


const HeaderWidget = lazy(() => import('../components/dashboard/HeaderWidget').then(m => ({ default: m.HeaderWidget })));
const TargetWidget = lazy(() => import('../components/dashboard/TargetWidget').then(m => ({ default: m.TargetWidget })));
const PerformanceWidget = lazy(() => import('../components/dashboard/PerformanceWidget').then(m => ({ default: m.PerformanceWidget })));
const TasksWidget = lazy(() => import('../components/dashboard/TasksWidget').then(m => ({ default: m.TasksWidget })));
const HabitsWidget = lazy(() => import('../components/dashboard/HabitsWidget').then(m => ({ default: m.HabitsWidget })));
const MoodWidget = lazy(() => import('../components/dashboard/MoodWidget').then(m => ({ default: m.MoodWidget })));
const AICoachWidget = lazy(() => import('../components/dashboard/AICoachWidget').then(m => ({ default: m.AICoachWidget })));

const DEFAULT_LAYOUT = ['header', 'aicoach', 'target', 'performance', 'tasks', 'habits', 'mood'];

export function Dashboard() {
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  const { loadHabits } = useHabitStore();
  const { loadTasks } = useTaskStore();

  useEffect(() => {
    document.title = 'Dashboard — HabitFlow';
    loadHabits();
    loadTasks();
    const loadLayout = async () => {
      const s = await getOrCreateSettings();
      // If it's an array and not empty, use it, else default
      if (s.dashboardLayout && Array.isArray(s.dashboardLayout) && s.dashboardLayout.length > 0) {
        const VALID_IDS = new Set(DEFAULT_LAYOUT);
        const mappedLayout = s.dashboardLayout
          .map(id => {
            if (id === 'chart' || id === 'stats') return 'performance';
            return id;
          })
          .filter(id => VALID_IDS.has(id));
        
        // Only update if we have valid widgets, otherwise fallback to default
        if (mappedLayout.length > 0) {
          // Deduplicate the layout first
          const uniqueLayout = Array.from(new Set(mappedLayout));
          
          // Append any missing widgets from DEFAULT_LAYOUT
          const mappedSet = new Set(uniqueLayout);
          for (const id of DEFAULT_LAYOUT) {
            if (!mappedSet.has(id)) {
              uniqueLayout.push(id);
            }
          }
          setLayout(uniqueLayout);
        }
      }
    };
    loadLayout();
  }, [loadHabits, loadTasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newLayout = Array.from(layout);
    const [reorderedItem] = newLayout.splice(result.source.index, 1);
    newLayout.splice(result.destination.index, 0, reorderedItem);

    setLayout(newLayout);

    const s = await getOrCreateSettings();
    await db.settings.update(s.id, { dashboardLayout: newLayout });
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.02 } },
  };

  const itemVariant = {
    hidden: { y: 48, filter: 'blur(8px)', opacity: 0 },
    show: { 
      y: 0, 
      filter: 'blur(0px)',
      opacity: 1, 
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 } 
    },
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'header':
        return <HeaderWidget />;
      case 'target':
        return <TargetWidget />;
      case 'performance':
        return <PerformanceWidget />;
      case 'tasks':
        return <TasksWidget />;
      case 'habits':
        return <HabitsWidget />;
      case 'mood':
        return <MoodWidget />;
      case 'aicoach':
        return <AICoachWidget />;
      default:
        return null;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-[100dvh] pb-20">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard">
          {provided => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6 sm:gap-8"
            >
              {layout.map((id, index) => (
                <Draggable key={id} draggableId={id} index={index}>
                  {provided => {
                    let spanClass = 'col-span-full';
                    if (id === 'aicoach') spanClass = 'lg:col-span-2 xl:col-span-4';
                    if (id === 'target') spanClass = 'lg:col-span-1 xl:col-span-2';
                    if (id === 'performance') spanClass = 'lg:col-span-2 xl:col-span-4';
                    if (id === 'tasks') spanClass = 'col-span-full xl:col-span-3';
                    if (id === 'habits') spanClass = 'col-span-full xl:col-span-3';

                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={spanClass}
                        style={{
                          ...provided.draggableProps.style,
                          zIndex: (provided.draggableProps.style as any)?.zIndex || 1,
                        }}
                      >
                        <motion.div variants={itemVariant} className="h-full relative group widget-container">
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-4 right-4 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
                          >
                            <GripHorizontal size={20} />
                          </div>
                          <Suspense fallback={
                            <div className="h-full min-h-[200px] flex items-center justify-center rounded-3xl dark:bg-slate-900/40 bg-white/50 backdrop-blur-xl border dark:border-white/10 border-slate-900/10 shadow-xl">
                              <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                            </div>
                          }>
                            {renderWidget(id)}
                          </Suspense>
                        </motion.div>
                      </div>
                    );
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </motion.div>
  );
}

export default Dashboard;
