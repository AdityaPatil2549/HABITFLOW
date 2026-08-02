import { Magnetic } from './magnetic';
import { soundService } from '../../services/soundService';
import type { CSSProperties, ReactNode } from 'react';

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
  return (
    <Magnetic intensity={intensity}>
      <button
        onClick={onClick}
        onMouseEnter={() => soundService.playHover()}
        className={`whitespace-nowrap active:scale-[0.97] transition-all duration-200 ${className}`}
        style={style}
      >
        {children}
      </button>
    </Magnetic>
  );
}
