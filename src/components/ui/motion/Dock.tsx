import React, { createContext, useContext, useRef, useState, useMemo } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { cn } from '../../../lib/utils';

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 120;
const DEFAULT_PANEL_HEIGHT = 56;

export type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
};

export type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
};

export type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};

export type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type DockContextType = {
  mouseX: MotionValue<number>;
  magnification: number;
  distance: number;
};

const DockContext = createContext<DockContextType>({
  mouseX: null as any,
  magnification: DEFAULT_MAGNIFICATION,
  distance: DEFAULT_DISTANCE,
});

export function Dock({
  children,
  className,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  magnification = DEFAULT_MAGNIFICATION,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <DockContext.Provider value={{ mouseX, distance, magnification }}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl px-3 py-2',
          'bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80',
          className
        )}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
}

export function DockItem({ children, className, onClick, active }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { mouseX, distance, magnification } = useContext(DockContext);
  const [isHovered, setIsHovered] = useState(false);

  const baseWidth = 40;
  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [baseWidth, magnification, baseWidth]
  );

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative flex aspect-square cursor-pointer items-center justify-center rounded-xl transition-colors',
        active
          ? 'bg-white/15 text-white shadow-inner shadow-white/20'
          : 'text-slate-400 hover:text-white hover:bg-white/10',
        className
      )}
    >
      {active && (
        <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
      {children}
    </motion.div>
  );
}

export function DockLabel({ children, className }: DockLabelProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-slate-950 px-2 py-0.5 text-[11px] font-medium text-slate-200 border border-white/10 shadow-lg whitespace-nowrap',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DockIcon({ children, className }: DockIconProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {children}
    </div>
  );
}

export default Dock;
