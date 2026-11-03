import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../../lib/utils';

export type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
};

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(16, 185, 129, 0.12)',
  onClick,
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rectRef = useRef<{ left: number; top: number } | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    rectRef.current = { left, top };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!rectRef.current) {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        rectRef.current = { left, top };
      }
      mouseX.set(e.clientX - rectRef.current.left);
      mouseY.set(e.clientY - rectRef.current.top);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      className={cn(
        'group relative rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-white/20',
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default SpotlightCard;
