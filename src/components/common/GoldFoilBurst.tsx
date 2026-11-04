import React, { useEffect, useRef } from 'react';

interface GoldFoilParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  alpha: number;
  flutter: number;
  flutterSpeed: number;
}

type BurstListener = () => void;
const listeners = new Set<BurstListener>();

/**
 * Universal singleton trigger for the Kinpaku Gold Leaf Foil burst.
 * Call this from anywhere (habit completion milestone, XP level-up, review finish).
 */
export function triggerGoldFoilBurst() {
  listeners.forEach(fn => fn());
}

export function GoldFoilBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: GoldFoilParticle[] = [];

    const colors = [
      '#f59e0b', // Kinpaku Gold
      '#fbbf24', // Amber Flame
      '#fcd34d', // Pale Gold Glint
      '#d97706', // Rich Oxide
      '#14b8a6', // Verdigris Accent
    ];

    const spawnBurst = () => {
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      // Spawn 38 gold foil flakes from top-center/screen center
      const newParticles: GoldFoilParticle[] = [];
      for (let i = 0; i < 38; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;

        newParticles.push({
          x: width / 2 + (Math.random() - 0.5) * 200,
          y: height * 0.35 + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4, // Upward initial velocity
          size: Math.random() * 8 + 4,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          flutter: 0,
          flutterSpeed: Math.random() * 0.08 + 0.04,
        });
      }

      particles = [...particles, ...newParticles];
    };

    listeners.add(spawnBurst);

    const render = () => {
      if (particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physical drag and gravity
        p.vx *= 0.96;
        p.vy += 0.18; // gravity
        p.vy *= 0.98;

        // Leaf flutter physics (air resistance sideways wobble)
        p.flutter += p.flutterSpeed;
        p.x += p.vx + Math.sin(p.flutter) * 1.5;
        p.y += p.vy;

        p.rotation += p.rotSpeed;
        p.alpha -= 0.008; // gradual fade over 2-3s

        if (p.alpha <= 0 || p.y > canvas.height) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Realistic gold foil rectangular shard geometry
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);

        // Specular glint line on leaf
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      listeners.delete(spawnBurst);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    />
  );
}

export default GoldFoilBurst;
