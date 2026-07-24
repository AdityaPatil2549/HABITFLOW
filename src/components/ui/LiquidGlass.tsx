import React, { useEffect, useId, useRef } from 'react';
import liquidGL from 'liquid-gl';

interface LiquidGlassProps {
  children?: React.ReactNode;
  className?: string;
  // Expose liquidGL options
  resolution?: number;
  refraction?: number;
  bevelDepth?: number;
  bevelWidth?: number;
  frost?: number;
  shadow?: boolean;
  specular?: boolean;
  reveal?: 'fade' | 'instant' | 'none';
  tilt?: boolean;
  tiltFactor?: number;
  magnify?: number;
}

export function LiquidGlass({
  children,
  className = '',
  resolution = 2.0,
  refraction = 0.03,
  bevelDepth = 0.05,
  bevelWidth = 0.1,
  frost = 10,
  shadow = true,
  specular = true,
  reveal = 'fade',
  tilt = true,
  tiltFactor = 5,
  magnify = 1,
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[:]/g, ''); 
  const targetClass = `liquid-glass-target-${id}`;

  useEffect(() => {
    let instance: any = null;

    const timeout = setTimeout(() => {
      if (!containerRef.current) return;
      try {
        instance = liquidGL({
          target: `.${targetClass}`,
          snapshot: 'body',
          resolution,
          refraction,
          bevelDepth,
          bevelWidth,
          frost,
          shadow,
          specular,
          reveal,
          tilt,
          tiltFactor,
          magnify,
        });
      } catch (err) {
        console.error('Failed to initialize liquidGL:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    };
  }, [
    targetClass, resolution, refraction, bevelDepth, bevelWidth, frost,
    shadow, specular, reveal, tilt, tiltFactor, magnify
  ]);

  return (
    <div className={`${targetClass} ${className}`} ref={containerRef}>
      <div className="content relative z-10">
        {children}
      </div>
    </div>
  );
}
