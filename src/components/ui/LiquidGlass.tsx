import React from 'react';

interface LiquidGlassProps {
  children?: React.ReactNode;
  className?: string;
  frost?: number;
}

export function LiquidGlass({
  children,
  className = '',
  frost = 10,
}: LiquidGlassProps) {
  // Pure CSS glassmorphism instead of DOM-cloning liquid-gl
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md ${className}`}
      style={{ backdropFilter: `blur(${frost}px)` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
