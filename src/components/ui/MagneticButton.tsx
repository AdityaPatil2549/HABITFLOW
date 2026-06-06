import { useRef, useState, ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { soundService } from '../../services/soundService';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  intensity?: number;
  style?: CSSProperties;
}

export function MagneticButton({
  children,
  className = '',
  onClick,
  intensity = 0.3,
  style,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * intensity, y: middleY * intensity });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundService.playHover();
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={reset}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
}
