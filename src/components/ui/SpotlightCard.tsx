import React, { useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SpotlightCard({ children, className, onClick, ...rest }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = divRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden vision-panel group transition-transform duration-200 active:scale-[0.98]',
        onClick ? 'cursor-pointer' : '',
        className
      )}
      {...rest}
    >
      {/* High-Performance CSS variable spotlight — zero React re-renders */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(500px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(16, 185, 129, 0.08), transparent 60%)`,
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

export default SpotlightCard;
