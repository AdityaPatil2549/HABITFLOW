import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tiltIntensity?: number;   // degrees of max tilt (default 8)
  glareOpacity?: number;    // max glare opacity (default 0.15)
  scale?: number;           // hover scale (default 1.02)
  borderGlow?: boolean;     // animated gradient border
}

export function TiltCard({
  children,
  className = '',
  style,
  tiltIntensity = 8,
  glareOpacity = 0.15,
  scale = 1.02,
  borderGlow = false,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Spring-smoothed tilt values
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [tiltIntensity, -tiltIntensity]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-tiltIntensity, tiltIntensity]), {
    stiffness: 200,
    damping: 20,
  });

  // Glare position
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      className={`tilt-card-wrapper ${borderGlow ? 'tilt-border-glow' : ''} ${className}`}
      style={{
        perspective: 1200,
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="tilt-card-inner"
        style={{
          rotateX,
          rotateY,
          scale: isHovering ? scale : 1,
          width: '100%',
          height: '100%',
          position: 'relative',
          transition: 'scale 0.2s ease-out',
        }}
      >
        {children}

        {/* Glare overlay */}
        <motion.div
          className="tilt-glare"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: isHovering ? glareOpacity : 0,
            background: useTransform(
              [glareX, glareY],
              ([x, y]) =>
                `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`
            ),
            transition: 'opacity 0.3s ease',
            zIndex: 10,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
