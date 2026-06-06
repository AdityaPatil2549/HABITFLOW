import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { db, getOrCreateSettings } from '../db';


import { HeaderWidget } from '../components/dashboard/HeaderWidget';
import { TargetWidget } from '../components/dashboard/TargetWidget';
import { PerformanceWidget } from '../components/dashboard/PerformanceWidget';
import { TasksWidget } from '../components/dashboard/TasksWidget';
import { HabitsWidget } from '../components/dashboard/HabitsWidget';
import { MoodWidget } from '../components/dashboard/MoodWidget';

const DEFAULT_LAYOUT = ['header', 'target', 'performance', 'tasks', 'habits', 'mood'];

export function Dashboard() {
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);

  useEffect(() => {
    document.title = 'Dashboard — HabitFlow';
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
          setLayout(mappedLayout);
        }
      }
    };
    loadLayout();
  }, []);

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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariant = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    show: { 
      y: 0, 
      opacity: 1, 
      scale: 1, 
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 } 
    },
  };

  const renderWidget = (id: string, dragHandleProps: any) => {
    switch (id) {
      case 'header':
        return <HeaderWidget dragHandleProps={dragHandleProps} />;
      case 'target':
        return <TargetWidget dragHandleProps={dragHandleProps} />;
      case 'performance':
        return <PerformanceWidget dragHandleProps={dragHandleProps} />;
      case 'tasks':
        return <TasksWidget dragHandleProps={dragHandleProps} />;
      case 'habits':
        return <HabitsWidget dragHandleProps={dragHandleProps} />;
      case 'mood':
        return <MoodWidget dragHandleProps={dragHandleProps} />;
      default:
        return null;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen pb-20">


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
                        <motion.div variants={itemVariant} className="h-full">
                          {renderWidget(id, provided.dragHandleProps)}
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
