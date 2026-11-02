import React from 'react';

export function TasksBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[400px] bg-indigo-500/[0.02] blur-[120px] rounded-full" />
    </div>
  );
}

export default TasksBackground;
