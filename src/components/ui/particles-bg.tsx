import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDir: number;
}

const PARTICLE_COUNT = 120;
const LINE_DIST_SQ  = 160 * 160;   // squared — avoids sqrt in inner loop
const GRAB_DIST_SQ  = 220 * 220;
const LINE_DIST     = 160;
const GRAB_DIST     = 220;
const BASE_SPEED    = 0.8;
const MAX_SPEED     = BASE_SPEED * 3.5;
const PARTICLE_COLOR = '0, 245, 255';  // #00f5ff
const LINE_COLOR     = '0, 217, 255';  // #00d9ff

function createParticle(w: number, h: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = BASE_SPEED * (0.4 + Math.random() * 0.8); 
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.7,
    opacityDir: Math.random() > 0.5 ? 1 : -1,
  };
}

export default function ParticlesComponent() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mouseRef     = useRef<{ x: number; y: number } | null>(null);
  const rafRef       = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // ── Sizing ─────────────────────────────────────────────────
    const setSize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.width, canvas.height)
      );
    };
    setSize();
    window.addEventListener('resize', setSize);

    // ── Mouse — use raw clientX/Y, no rect offset needed for window coords ─
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => { mouseRef.current = null; };
    const onClick = (e: MouseEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = BASE_SPEED * (1.2 + Math.random() * 1.5);
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.5 + Math.random() * 2,
          opacity: 0.9,
          opacityDir: -1,
        });
      }
      if (particlesRef.current.length > PARTICLE_COUNT + 24) {
        particlesRef.current.splice(0, 4);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('click', onClick);

    // ── Draw loop ───────────────────────────────────────────────
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Pitch-black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      // Pre-compute mouse squared distance cutoff once per frame
      const mx = mouse ? mouse.x : -9999;
      const my = mouse ? mouse.y : -9999;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // ── Opacity pulse ──
        p.opacity += p.opacityDir * 0.003;
        if (p.opacity >= 1)   { p.opacity = 1;   p.opacityDir = -1; }
        if (p.opacity <= 0.2) { p.opacity = 0.2; p.opacityDir =  1; }

        // ── Grab towards mouse (squared distance — no sqrt) ──
        const gdx = mx - p.x;
        const gdy = my - p.y;
        const gdSq = gdx * gdx + gdy * gdy;
        if (gdSq < GRAB_DIST_SQ && gdSq > 0) {
          const gd = Math.sqrt(gdSq);                 // one sqrt, only when inside radius
          const force = (1 - gd / GRAB_DIST) * 0.018;
          p.vx += gdx * force;
          p.vy += gdy * force;
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > MAX_SPEED) {
            const inv = MAX_SPEED / spd;
            p.vx *= inv;
            p.vy *= inv;
          }
        }

        // ── Move + bounce ──
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0)  { p.x = 0;  p.vx = Math.abs(p.vx); }
        if (p.x > W)  { p.x = W;  p.vx = -Math.abs(p.vx); }
        if (p.y < 0)  { p.y = 0;  p.vy = Math.abs(p.vy); }
        if (p.y > H)  { p.y = H;  p.vy = -Math.abs(p.vy); }

        // ── Draw particle — NO shadowBlur (kills perf) ──
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PARTICLE_COLOR},${p.opacity.toFixed(2)})`;
        ctx.fill();

        // ── Draw lines to closer particles ──
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < LINE_DIST_SQ) {
            const dist = Math.sqrt(dSq);
            let alpha = (1 - dist / LINE_DIST) * 0.5;

            // Boost opacity when midpoint is near mouse
            const midX = (p.x + q.x) * 0.5;
            const midY = (p.y + q.y) * 0.5;
            const mdx  = mx - midX;
            const mdy  = my - midY;
            const mdSq = mdx * mdx + mdy * mdy;
            if (mdSq < GRAB_DIST_SQ) {
              alpha = Math.min(0.9, alpha + (1 - Math.sqrt(mdSq) / GRAB_DIST) * 0.5);
            }

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${LINE_COLOR},${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
