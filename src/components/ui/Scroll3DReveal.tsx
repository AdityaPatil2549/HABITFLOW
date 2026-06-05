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

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, rotateX: 45, y: 60, scale: 0.95, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{
        duration: 0.8,
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 20,
      }}
      style={{ transformPerspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}
