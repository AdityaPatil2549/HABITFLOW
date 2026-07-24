import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speed: number;
  phase: number;         // twinkle phase offset
  phaseSpeed: number;    // twinkle speed
  hue: number;           // color hue (270=purple, 220=blue, 300=pink, 0=white)
  saturation: number;
}

export function StarField({ count = 200 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      starsRef.current = Array.from({ length: count }, () => {
        const hueChoice = Math.random();
        let hue = 0;
        let saturation = 0;
        if (hueChoice < 0.55) {
          // pure white
          hue = 0; saturation = 0;
        } else if (hueChoice < 0.75) {
          // soft purple
          hue = 270; saturation = 60;
        } else if (hueChoice < 0.88) {
          // blue-indigo
          hue = 220; saturation = 70;
        } else {
          // soft pink
          hue = 310; saturation = 50;
        }

        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.9 + 0.3,        // 0.3–1.2px radius
          opacity: Math.random() * 0.5 + 0.3,   // 0.3–0.8 base opacity
          speed: Math.random() * 0.06 + 0.02,   // very slow drift
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: Math.random() * 0.008 + 0.003,
          hue,
          saturation,
        };
      });
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      timeRef.current += 1;

      // Clear with full transparency
      ctx.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        // Twinkle
        const twinkle = Math.sin(timeRef.current * star.phaseSpeed + star.phase);
        const alpha = Math.max(0.05, Math.min(1, star.opacity + twinkle * 0.3));

        // Color
        const color = star.saturation === 0
          ? `rgba(255,255,255,${alpha})`
          : `hsla(${star.hue},${star.saturation}%,85%,${alpha})`;

        // Draw the star as a smooth circle using shadowBlur for glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);

        ctx.shadowColor = star.saturation === 0
          ? `rgba(255,255,255,${alpha * 0.8})`
          : `hsla(${star.hue},${star.saturation}%,90%,${alpha * 0.7})`;
        ctx.shadowBlur = star.r * 4 + 2;  // soft glow halo

        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();

        // Drift upward
        star.y -= star.speed;
        if (star.y + star.r < 0) {
          star.y = h + star.r;
          star.x = Math.random() * w;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    init();

    const ro = new ResizeObserver(() => {
      init();
    });
    ro.observe(canvas);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
