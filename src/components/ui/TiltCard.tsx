import { Tilt } from './tilt';
import type { CSSProperties, ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tiltIntensity?: number; // degrees of max tilt
  borderGlow?: boolean; // animated gradient border (ignored, deprecated for cleaner UI)
  glareOpacity?: number; // deprecated
  scale?: number; // deprecated
}

export function TiltCard({
  children,
  className = '',
  style,
  tiltIntensity = 8,
}: TiltCardProps) {
  return (
    <Tilt
      rotationFactor={tiltIntensity}
      className={`active:scale-[0.98] transition-transform duration-300 ease-out ${className}`}
      style={style as any}
      springOptions={{ stiffness: 200, damping: 20 }}
    >
      {children}
    </Tilt>
  );
}
