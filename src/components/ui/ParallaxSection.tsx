import { useRef, type ReactNode, type CSSProperties } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  speed?: number; // multiplier: 0.3 = slow, 1.5 = fast, negative = reverse
  direction?: 'vertical' | 'horizontal';
  offset?: number; // extra px offset
}

export function ParallaxSection({
  children,
  className = '',
  style,
  speed = 0.3,
  direction = 'vertical',
  offset = 0,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const range = 100 * speed;
  const y = useTransform(scrollYProgress, [0, 1], [-range + offset, range + offset]);
  const x = useTransform(scrollYProgress, [0, 1], [-range + offset, range + offset]);

  return (
    <motion.div
      ref={ref}
      className={`parallax-section ${className}`}
      style={{
        ...(direction === 'vertical' ? { y } : { x }),
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Decorative floating orb element for parallax backgrounds.
 * Pure CSS — no Three.js dependency.
 */
export function ParallaxOrb({
  color = '#6366f1',
  size = 200,
  top,
  left,
  right,
  speed = 0.5,
  blur = 80,
}: {
  color?: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  speed?: number;
  blur?: number;
}) {
  return (
    <ParallaxSection
      speed={speed}
      className="parallax-orb"
      style={{
        position: 'absolute',
        top,
        left,
        right,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blur}px)`,
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div />
    </ParallaxSection>
  );
}
