import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Scroll3DReveal({ children, delay = 0, className = '' }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  // Cap the delay so long lists don't take forever to reveal the bottom elements
  const safeDelay = Math.min(delay, 0.3);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '200px' }}
      transition={{
        duration: 0.4,
        delay: safeDelay,
        type: 'spring',
        stiffness: 250,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  );
}
