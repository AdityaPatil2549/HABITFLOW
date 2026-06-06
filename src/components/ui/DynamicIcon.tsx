import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface DynamicIconProps {
  children: React.ReactNode;
  tiltIntensity?: number;
  glowColor?: string;
  className?: string;
  size?: number | string;
  onClick?: () => void;
  interactive?: boolean;
}

export function DynamicIcon({
  children,
  tiltIntensity = 30,
  glowColor = 'rgba(99, 102, 241, 0.5)',
  className = '',
  size,
  onClick,
  interactive = true,
}: DynamicIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useSpring(0, { stiffness: 400, damping: 30 });
  const y = useSpring(0, { stiffness: 400, damping: 30 });

  const rotateX = useTransform(y, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !interactive) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.15 } : {}}
      whileTap={interactive ? { scale: 0.9 } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 600,
        rotateX,
        rotateY,
        cursor: onClick ? 'pointer' : interactive ? 'default' : 'inherit',
        fontSize: size,
        width: size,
        height: size,
        position: 'relative',
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {/* Glow effect */}
      {interactive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1.2 : 0.8 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            inset: '-20%',
            background: `radial-gradient(circle closest-side, ${glowColor}, transparent)`,
            filter: 'blur(8px)',
            zIndex: 0,
            transform: 'translateZ(-10px)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ transform: 'translateZ(10px)', position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {children}
      </div>
    </motion.div>
  );
}
