import { useEffect, useRef } from 'react';

interface Star {
  x: number; y: number;
  r: number;
  opacity: number;
  drift: number;
  phase: number;
  phaseSpeed: number;
  color: string;
}

const STAR_COLORS = [
  'rgba(255,255,255,',
  'rgba(200,220,255,',
  'rgba(180,200,255,',
  'rgba(200,185,255,',
  'rgba(160,230,230,',
];

export function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const tickRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars(w, h);
    };

    const buildStars = (w: number, h: number) => {
      const count = Math.max(150, Math.floor((w * h) / 2800));
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 0.9 + 0.2,
        opacity: Math.random() * 0.5 + 0.3,
        drift: Math.random() * 0.035 + 0.008,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.01 + 0.003,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      }));
    };

    /* Draw a soft nebula blob using a radial gradient on an offscreen canvas
       so the ellipse shape is handled via transform, not coordinate math. */
    const drawNebula = (
      cx: number, cy: number,       // centre 0–1
      radiusX: number,              // horizontal radius 0–1
      radiusY: number,              // vertical radius 0–1
      r: number, g: number, b: number,
      alpha: number
    ) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const absX = cx * w;
      const absY = cy * h;
      const absRX = radiusX * w;
      const absRY = radiusY * h;

      ctx.save();
      ctx.translate(absX, absY);
      ctx.scale(absRX, absRY);           // unit circle → ellipse

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0,    `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.35, `rgba(${r},${g},${b},${(alpha * 0.55).toFixed(3)})`);
      grad.addColorStop(0.65, `rgba(${r},${g},${b},${(alpha * 0.18).toFixed(3)})`);
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      tickRef.current++;

      // ── Background ───────────────────────────────────────────
      ctx.fillStyle = '#040d18';
      ctx.fillRect(0, 0, w, h);

      // ── Nebula clouds ─────────────────────────────────────────
      // Far-back dark blue base glow
      drawNebula(0.50, 0.50, 0.80, 0.70,  10,  25, 80,  0.30);

      // Left teal / cyan nebula  (matching screenshot)
      drawNebula(0.15, 0.55, 0.45, 0.55,   0, 140, 160, 0.55);
      drawNebula(0.08, 0.40, 0.30, 0.35,  10, 170, 190, 0.35);
      drawNebula(0.20, 0.65, 0.25, 0.30,   0, 110, 130, 0.25);

      // Right purple / violet nebula (matching screenshot)
      drawNebula(0.80, 0.42, 0.42, 0.50,  100, 30, 200, 0.50);
      drawNebula(0.88, 0.60, 0.28, 0.32,   80, 20, 160, 0.30);
      drawNebula(0.72, 0.30, 0.22, 0.25,  130, 50, 220, 0.25);

      // Subtle warm glow top-right edge (depth)
      drawNebula(0.92, 0.15, 0.20, 0.20,   60, 10, 150, 0.20);

      // ── Stars ─────────────────────────────────────────────────
      for (const s of starsRef.current) {
        const twinkle = Math.sin(tickRef.current * s.phaseSpeed + s.phase);
        const alpha = Math.max(0.04, Math.min(1, s.opacity + twinkle * 0.3));

        ctx.save();
        ctx.shadowColor = `${s.color}${(alpha * 0.9).toFixed(3)})`;
        ctx.shadowBlur = s.r * 5 + 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${alpha.toFixed(3)})`;
        ctx.fill();
        ctx.restore();

        s.y -= s.drift;
        if (s.y + s.r < 0) {
          s.y = h + s.r;
          s.x = Math.random() * w;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
