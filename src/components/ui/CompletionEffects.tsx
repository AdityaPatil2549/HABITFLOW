import confetti from 'canvas-confetti';
import { useCallback, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, animate } from 'framer-motion';

/**
 * Hook that provides confetti + XP animation effects on habit/task completion.
 */
export function useCompletionEffects() {
  const confettiRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireConfetti = useCallback((originElement?: HTMLElement) => {
    // Get the origin position from the element, or default to center
    let x = 0.5;
    let y = 0.5;

    if (originElement) {
      const rect = originElement.getBoundingClientRect();
      x = (rect.left + rect.width / 2) / window.innerWidth;
      y = (rect.top + rect.height / 2) / window.innerHeight;
    }

    // Clear any pending confetti
    if (confettiRef.current) clearTimeout(confettiRef.current);

    // First burst — fast small particles
    confetti({
      particleCount: 40,
      spread: 55,
      startVelocity: 30,
      origin: { x, y },
      colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#fbbf24'],
      ticks: 60,
      gravity: 1.2,
      scalar: 0.8,
      shapes: ['circle', 'square'],
      zIndex: 9999,
    });

    // Second burst — slower larger particles, slight delay
    confettiRef.current = setTimeout(() => {
      confetti({
        particleCount: 20,
        spread: 70,
        startVelocity: 20,
        origin: { x, y: y - 0.05 },
        colors: ['#f59e0b', '#ef4444', '#ec4899', '#14b8a6'],
        ticks: 80,
        gravity: 0.8,
        scalar: 1.2,
        shapes: ['circle'],
        zIndex: 9999,
      });
    }, 120);
  }, []);

  return { fireConfetti };
}

/**
 * Animated XP counter that rolls from one value to another.
 */
export function AnimatedXPCounter({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 80,
    damping: 20,
  });

  // Animate to the new value whenever it changes
  animate(motionValue, value, {
    type: 'spring',
    stiffness: 80,
    damping: 20,
    duration: 1.2,
  });

  return <motion.span className={className}>{springValue}</motion.span>;
}

/**
 * Completion pulse animation wrapper. Wraps a child and pulses on trigger.
 */
export function CompletionPulse({
  children,
  trigger,
}: {
  children: React.ReactNode;
  trigger: boolean;
}) {
  return (
    <motion.div
      animate={
        trigger
          ? {
              scale: [1, 1.15, 0.95, 1.05, 1],
              transition: { duration: 0.5, ease: 'easeOut' },
            }
          : {}
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Rising particle effect — small glowing dots that float upward and fade.
 */
export function RisingParticles({
  active,
  color = '#6366f1',
}: {
  active: boolean;
  color?: string;
}) {
  const [particles] = useState(() => {
    return Array.from({ length: 6 }).map(() => ({
      x: `${20 + Math.random() * 60}%`,
      duration: 1 + Math.random() * 0.6,
    }));
  });

  if (!active) return null;

  return (
    <div
      className="rising-particles-container"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="rising-particle"
          initial={{
            opacity: 0.8,
            scale: 0.5,
            x: p.x,
            y: '80%',
          }}
          animate={{
            opacity: 0,
            scale: 0,
            y: '-20%',
          }}
          transition={{
            duration: p.duration,
            delay: i * 0.08,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}40`,
          }}
        />
      ))}
    </div>
  );
}
