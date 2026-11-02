import React from 'react';

export function HabitsBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" 
      aria-hidden="true"
    >
      {/* Subtle, luxury dark obsidian ambient gradient - zero GPU load */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-500/[0.03] via-amber-500/[0.02] to-transparent blur-[120px] rounded-full" />
      <div className="absolute -bottom-40 left-1/3 w-[800px] h-[400px] bg-indigo-500/[0.02] blur-[100px] rounded-full" />
    </div>
  );
}

export default HabitsBackground;
