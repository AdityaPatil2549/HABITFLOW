import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { db, getOrCreateSettings } from '../db';

import { FloatingOrbs } from '../components/ui/FloatingOrbs';
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
        // Map any old 'chart' back to 'performance' if needed, depending on existing DB
        setLayout(s.dashboardLayout.map(id => id === 'chart' ? 'performance' : id));
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
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
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
      <FloatingOrbs />

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6 sm:gap-8"
            >
              {layout.map((id, index) => (
                <Draggable key={id} draggableId={id} index={index}>
                  {(provided) => {
                    // For the grid layout to stay intact during drag, we wrap the widget in a div that keeps its column span.
                    // The widgets themselves define their spans (e.g., lg:col-span-3), but here we might need to handle it.
                    // Actually, the widget components have the lg:col-span-x classes on their outer divs.
                    // So we must pass the ref and props to a wrapper or directly to the widget.
                    // Since it's easier to wrap, let's look at the widget components.
                    // Oh, I added lg:col-span-x to the outermost div INSIDE the widget components.
                    // If we wrap them in ANOTHER div for Draggable, that wrapper div won't have the col-span classes, breaking the grid!
                    // Wait, if I render the Widget directly, I can't attach provided.innerRef and provided.draggableProps without passing them.
                    // Let me adjust the wrapper to extract the classes based on id.
                    let spanClass = 'col-span-full';
                    if (id === 'target') spanClass = 'lg:col-span-1 xl:col-span-2';
                    if (id === 'performance') spanClass = 'lg:col-span-2 xl:col-span-4';
                    if (id === 'tasks') spanClass = 'col-span-full xl:col-span-3';
                    if (id === 'habits') spanClass = 'col-span-full xl:col-span-3';
                    // Header and Mood are col-span-full by default.

                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={spanClass}
                        style={{ ...provided.draggableProps.style, zIndex: (provided.draggableProps.style as any)?.zIndex || 1 }}
                      >
                        {renderWidget(id, provided.dragHandleProps)}
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
