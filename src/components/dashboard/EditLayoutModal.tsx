import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, GripVertical } from 'lucide-react';
import { getOrCreateSettings } from '../../db';
import { db } from '../../db';
import { motion, AnimatePresence } from 'framer-motion';

export const WIDGET_NAMES: Record<string, string> = {
  header: 'Welcome Header & Stats',
  target: "Today's Target Ring",
  chart: '7-Day Performance',
  tasks: 'Mission Log (Tasks)',
  habits: 'Habit Checklist',
  mood: 'Mood Check-In',
};

interface EditLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: string[];
  onLayoutChange: (layout: string[]) => void;
}

export function EditLayoutModal({
  isOpen,
  onClose,
  currentLayout,
  onLayoutChange,
}: EditLayoutModalProps) {
  const [items, setItems] = useState<string[]>(currentLayout);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setItems(currentLayout);
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  const handleSave = async () => {
    onLayoutChange(items);
    const s = await getOrCreateSettings();
    await db.settings.update(s.id, { dashboardLayout: items });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-card-3d"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Customize Layout</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-slate-400 mb-6">
              Drag and drop to reorder your dashboard widgets.
            </p>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="dashboard-layout">
                {provided => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {items.map((item, index) => (
                      <Draggable key={item} draggableId={item} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-4 p-4 rounded-2xl border ${
                              snapshot.isDragging
                                ? 'bg-brand-500/20 border-brand-500/50 shadow-xl scale-105 z-50'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            } transition-colors`}
                            style={provided.draggableProps.style as React.CSSProperties}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="text-slate-500 hover:text-white cursor-grab active:cursor-grabbing p-1"
                            >
                              <GripVertical size={20} />
                            </div>
                            <span className="font-semibold text-white">
                              {WIDGET_NAMES[item] || item}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button
              onClick={handleSave}
              className="w-full mt-8 py-4 rounded-2xl bg-brand-500 text-white font-bold text-lg hover:bg-brand-400 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
            >
              Save Layout
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
