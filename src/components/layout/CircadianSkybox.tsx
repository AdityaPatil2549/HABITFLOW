import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChronoStore } from '../../store/chronoStore';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  colorOffset: number;
}

interface CausticRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  expansionSpeed: number;
  hue: string;
}

interface BolideMeteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
}

export function CircadianSkybox() {
  const { currentEpoch, solarState, activeWorld } = useChronoStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Interactive mouse tracking with spring easing
  const mouseRef = useRef({
    x: 0.5,
    y: 0.4,
    targetX: 0.5,
    targetY: 0.4,
    prevX: 0.5,
    prevY: 0.4,
    speed: 0,
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Master Procedural Fluid & Quantum Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 110 Quantum Stardust Particles
    const stars: Star[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 1.8 + 0.5,
      baseAlpha: Math.random() * 0.65 + 0.25,
      twinkleSpeed: Math.random() * 0.035 + 0.015,
      twinklePhase: Math.random() * Math.PI * 2,
      colorOffset: Math.random(),
    }));

    // Dynamic Iridescent Fluid Caustics pool
    const ripples: CausticRipple[] = [];
    let lastRippleTime = 0;

    // Bolide meteors pool
    const meteors: BolideMeteor[] = [];
    let lastMeteorSpawn = Date.now();

    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * width * 0.75 + width * 0.1,
        y: Math.random() * height * 0.3,
        length: Math.random() * 140 + 90,
        speed: Math.random() * 16 + 12,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
        alpha: 1,
      });
    };

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let time = 0;

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      time += 0.014;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation (spring physics)
      const mouse = mouseRef.current;
      const dx = mouse.targetX - mouse.x;
      const dy = mouse.targetY - mouse.y;
      mouse.x += dx * 0.07;
      mouse.y += dy * 0.07;
      mouse.speed = Math.hypot(dx, dy);

      // Spawn fluid caustic ripples on swift mouse movement
      const now = Date.now();
      if (mouse.speed > 0.008 && now - lastRippleTime > 120 && ripples.length < 12) {
        lastRippleTime = now;
        ripples.push({
          x: mouse.x * width,
          y: mouse.y * height,
          radius: 10,
          maxRadius: Math.min(width, height) * 0.28,
          alpha: 0.35,
          expansionSpeed: 2.8 + mouse.speed * 40,
          hue: currentEpoch === 'zenith' ? '0, 240, 255' : currentEpoch === 'dawn' ? '245, 158, 11' : currentEpoch === 'dusk' ? '249, 115, 22' : '168, 85, 247',
        });
      }

      // ── COLOR THEMES BASED ON CHRONO EPOCH ────────────────────────
      let primaryRGB = '245, 158, 11';     // Gold/Amber
      let secondaryRGB = '20, 184, 166';   // Verdigris Patina
      let tertiaryRGB = '251, 113, 133';   // Rose Dawn

      if (currentEpoch === 'zenith') {
        primaryRGB = '0, 240, 255';        // Electric Cyan
        secondaryRGB = '37, 99, 235';      // Hyper Cobalt
        tertiaryRGB = '255, 255, 255';     // Diamond White
      } else if (currentEpoch === 'dusk') {
        primaryRGB = '249, 115, 22';       // Sunset Amber
        secondaryRGB = '139, 92, 246';     // Royal Violet
        tertiaryRGB = '236, 72, 153';      // Magenta Flame
      } else if (currentEpoch === 'night') {
        primaryRGB = '99, 102, 241';       // Velvet Indigo
        secondaryRGB = '6, 182, 212';      // Bioluminescent Teal
        tertiaryRGB = '168, 85, 247';      // Cosmic Amethyst
      }

      const isNight = currentEpoch === 'night';
      const isDusk = currentEpoch === 'dusk';

      // ── 1. EXPANDING IRIDESCENT FLUID CAUSTIC RIPPLES ─────────────
      ctx.save();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.expansionSpeed;
        r.alpha -= 0.008;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        const causticGrad = ctx.createRadialGradient(r.x, r.y, Math.max(0, r.radius - 20), r.x, r.y, r.radius);
        causticGrad.addColorStop(0, `rgba(${r.hue}, 0)`);
        causticGrad.addColorStop(0.7, `rgba(${r.hue}, ${r.alpha * 0.4})`);
        causticGrad.addColorStop(1, `rgba(255, 255, 255, ${r.alpha * 0.2})`);

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = causticGrad;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      ctx.restore();

      // ── 2. VOLUMETRIC AURORA SILK MESH (MULTIPLE FREQUENCIES) ─────
      ctx.save();
      const waveLayers = [
        { yRel: 0.22, amp1: 42, amp2: 24, freq1: 0.0016, freq2: 0.003, speed: 0.8, alpha: isNight ? 0.22 : 0.28 },
        { yRel: 0.38, amp1: 56, amp2: 30, freq1: 0.0012, freq2: 0.0022, speed: 0.6, alpha: isNight ? 0.16 : 0.20 },
        { yRel: 0.55, amp1: 48, amp2: 20, freq1: 0.0018, freq2: 0.0035, speed: 1.0, alpha: isNight ? 0.12 : 0.15 },
      ];

      for (let idx = 0; idx < waveLayers.length; idx++) {
        const wl = waveLayers[idx];
        const yBase = height * wl.yRel;

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, yBase);

        const steps = 36;
        const stepWidth = width / steps;

        for (let s = 0; s <= steps; s++) {
          const x = s * stepWidth;
          // Harmonic wave equation
          const wave1 = Math.sin(time * wl.speed + x * wl.freq1 + idx) * wl.amp1;
          const wave2 = Math.cos(time * (wl.speed * 0.7) + x * wl.freq2) * wl.amp2;

          // Interactive cursor repulsion
          const distToCursor = Math.hypot(x - mouse.x * width, yBase - mouse.y * height);
          const cursorDeflection = Math.max(0, 1 - distToCursor / 320) * 55;

          const y = yBase + wave1 + wave2 - cursorDeflection;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const silkGrad = ctx.createLinearGradient(0, yBase - 80, width, yBase + 260);
        silkGrad.addColorStop(0, `rgba(${primaryRGB}, ${wl.alpha})`);
        silkGrad.addColorStop(0.45, `rgba(${secondaryRGB}, ${wl.alpha * 0.75})`);
        silkGrad.addColorStop(0.85, `rgba(${tertiaryRGB}, ${wl.alpha * 0.3})`);
        silkGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = silkGrad;
        ctx.fill();
      }
      ctx.restore();

      // ── 3. QUANTUM STARDUST PARTICLES & CONSTELLATION FILAMENTS ───
      ctx.save();
      const mousePixelX = mouse.x * width;
      const mousePixelY = mouse.y * height;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Brownian drift
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Interactive subtle gravitational pull toward mouse
        const distToMouse = Math.hypot(star.x - mousePixelX, star.y - mousePixelY);
        if (distToMouse < 180 && distToMouse > 5) {
          const force = (1 - distToMouse / 180) * 0.22;
          star.x += ((mousePixelX - star.x) / distToMouse) * force;
          star.y += ((mousePixelY - star.y) / distToMouse) * force;
        }

        // Twinkle
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase);
        const alpha = Math.max(0.08, star.baseAlpha + twinkle * 0.35);

        // Core particle
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        const particleColor = star.colorOffset > 0.6 ? primaryRGB : star.colorOffset > 0.3 ? secondaryRGB : '255, 255, 255';
        ctx.fillStyle = `rgba(${particleColor}, ${alpha.toFixed(3)})`;
        ctx.fill();

        // Specular glow for prominent nodes
        if (star.size > 1.6) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleColor}, ${(alpha * 0.18).toFixed(3)})`;
          ctx.fill();
        }
      }

      // Constellation Laser Filaments (between close star nodes)
      ctx.lineWidth = 0.6;
      for (let i = 0; i < stars.length; i += 3) {
        for (let j = i + 1; j < Math.min(stars.length, i + 8); j++) {
          const s1 = stars[i];
          const s2 = stars[j];
          const d = Math.hypot(s1.x - s2.x, s1.y - s2.y);
          if (d < 110) {
            const lineAlpha = (1 - d / 110) * (isNight ? 0.14 : 0.08);
            ctx.strokeStyle = `rgba(${primaryRGB}, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // ── 4. PERIODIC HYPER-SPEED BOLIDE METEORS ─────────────────────
      if ((isNight || isDusk) && now - lastMeteorSpawn > 11000) {
        spawnMeteor();
        lastMeteorSpawn = now;
      }

      if (meteors.length > 0) {
        ctx.save();
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += Math.cos(m.angle) * m.speed;
          m.y += Math.sin(m.angle) * m.speed;
          m.alpha -= 0.018;

          if (m.alpha <= 0 || m.x > width || m.y > height) {
            meteors.splice(i, 1);
            continue;
          }

          const tailX = m.x - Math.cos(m.angle) * m.length;
          const tailY = m.y - Math.sin(m.angle) * m.length;

          const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          meteorGrad.addColorStop(0.7, `rgba(${primaryRGB}, ${m.alpha * 0.8})`);
          meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = 2.0;
          ctx.stroke();

          // Spark head
          ctx.beginPath();
          ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // ── 5. QUANTUM UNDULATING HORIZON WAVE & LASER RAYS ───────────
      // Sleek luxury horology horizon curve instead of flat vector mountains
      ctx.save();
      const horizonY = height * 0.82;
      const gridSegments = 48;
      const gridStep = width / gridSegments;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, horizonY);

      for (let s = 0; s <= gridSegments; s++) {
        const x = s * gridStep;
        const normX = x / width;
        // Natural multi-octave harmonic undulation
        const wave =
          Math.sin(normX * Math.PI * 4 + time * 0.6) * 16 +
          Math.sin(normX * Math.PI * 8 - time * 0.3) * 8 +
          Math.cos(normX * Math.PI * 2 + time * 0.2) * 12;

        const y = horizonY + wave;
        ctx.lineTo(x, y);

        // Subtle vertical laser tick marks every 3rd node
        if (s % 3 === 0) {
          const tickHeight = 24 + Math.sin(time * 1.2 + s) * 12;
          ctx.strokeStyle = `rgba(${primaryRGB}, 0.12)`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y - tickHeight, 0.5, tickHeight);
        }
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      // Atmospheric Ground Gradient
      const groundGrad = ctx.createLinearGradient(0, horizonY - 40, 0, height);
      groundGrad.addColorStop(0, `rgba(${primaryRGB}, 0.08)`);
      groundGrad.addColorStop(0.3, `rgba(${secondaryRGB}, 0.04)`);
      groundGrad.addColorStop(1, 'rgba(3, 5, 10, 0.95)');
      ctx.fillStyle = groundGrad;
      ctx.fill();

      // Glowing Horizon Crest Laser Rule
      ctx.strokeStyle = `rgba(${primaryRGB}, 0.45)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEpoch, solarState]);

  const { sunXPercent, sunYPercent, glowOpacity } = solarState;
  const isNight = currentEpoch === 'night';
  const isDusk = currentEpoch === 'dusk';
  const isDawn = currentEpoch === 'dawn';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--canvas-ground, #04060d)',
        transition: 'background-color 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      {/* ── LAYER 0: LIVING CHROMATIC VOLUMETRIC PLASMA NODES ── */}
      {/* Node 1: Primary Celestial Diurnal Luminary (Sun/Moon focus) */}
      <div
        className="absolute w-[950px] h-[950px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ease-out will-change-transform"
        style={{
          left: `${sunXPercent}%`,
          top: `${sunYPercent}%`,
          transform: 'translate(-50%, -50%)',
          background: isNight
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.42) 0%, rgba(168, 85, 247, 0.22) 38%, transparent 70%)'
            : isDusk
            ? 'radial-gradient(circle, rgba(249, 115, 22, 0.48) 0%, rgba(217, 70, 239, 0.28) 40%, rgba(245, 158, 11, 0.15) 65%, transparent 75%)'
            : isDawn
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.46) 0%, rgba(251, 113, 133, 0.32) 35%, rgba(252, 211, 77, 0.18) 60%, transparent 72%)'
            : 'radial-gradient(circle, rgba(0, 240, 255, 0.45) 0%, rgba(37, 99, 235, 0.28) 45%, rgba(59, 130, 246, 0.12) 70%, transparent 75%)',
          opacity: glowOpacity * 1.25,
        }}
      />

      {/* Node 2: Secondary Chromatic Resonance Counter-Orb (Floating in lower quadrant) */}
      <div
        className="absolute w-[750px] h-[750px] rounded-full blur-[150px] pointer-events-none transition-all duration-1000 ease-out animate-pulse"
        style={{
          right: '8%',
          bottom: '12%',
          background: isNight
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.30) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)'
            : isDusk
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(249, 115, 22, 0.18) 50%, transparent 70%)'
            : isDawn
            ? 'radial-gradient(circle, rgba(251, 113, 133, 0.35) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37, 99, 235, 0.38) 0%, rgba(0, 240, 255, 0.18) 50%, transparent 70%)',
          animationDuration: '8s',
        }}
      />

      {/* Node 3: Deep Ambient Luminous Horizon Wash */}
      <div
        className="absolute inset-x-0 bottom-0 h-[480px] pointer-events-none blur-[100px] transition-all duration-1000 ease-out"
        style={{
          background: isNight
            ? 'radial-gradient(ellipse at 50% 100%, rgba(99, 102, 241, 0.22) 0%, rgba(3, 5, 10, 0.9) 70%)'
            : isDusk
            ? 'radial-gradient(ellipse at 50% 100%, rgba(249, 115, 22, 0.28) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(3, 5, 10, 0.9) 80%)'
            : isDawn
            ? 'radial-gradient(ellipse at 50% 100%, rgba(245, 158, 11, 0.30) 0%, rgba(251, 113, 133, 0.16) 45%, rgba(3, 5, 10, 0.9) 80%)'
            : 'radial-gradient(ellipse at 50% 100%, rgba(0, 240, 255, 0.24) 0%, rgba(37, 99, 235, 0.14) 50%, rgba(3, 5, 10, 0.9) 80%)',
        }}
      />

      {/* ── LAYER 1: MASTER HIGH-OCTAVE CANVAS (Silk Ribbons, Stardust, Caustics, Meteors) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── LAYER 2: CELESTIAL SPECULAR SUN/MOON EMBLEM ── */}
      <div
        className="absolute pointer-events-none transition-all duration-1000 ease-out"
        style={{
          left: `${sunXPercent}%`,
          top: `${sunYPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="rounded-full transition-all duration-700"
          style={{
            width: isNight ? '34px' : '52px',
            height: isNight ? '34px' : '52px',
            background: isNight
              ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)'
              : isDusk
              ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #fbbf24 40%, #f97316 100%)'
              : isDawn
              ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef08a 40%, #f59e0b 100%)'
              : 'radial-gradient(circle at 35% 35%, #ffffff 0%, #a5f3fc 40%, #00f0ff 100%)',
            boxShadow: isNight
              ? '0 0 45px rgba(255, 255, 255, 0.8), 0 0 90px rgba(99, 102, 241, 0.6), inset -2px -2px 6px rgba(0,0,0,0.4)'
              : '0 0 55px rgba(255, 255, 255, 0.9), 0 0 110px var(--chrono-accent, #00f0ff), 0 0 160px var(--chrono-secondary, #2563eb)',
          }}
        />
      </div>

      {/* ── LAYER 3: KINPAKU GOLD FLAKE / FILM GRAIN NOISE TEXTURE ── */}
      {/* Eliminates color banding on OLED screens & gives luxury tactile finish */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px), radial-gradient(var(--chrono-accent, #00f0ff) 1px, transparent 1px)`,
          backgroundSize: '28px 28px, 14px 14px',
          backgroundPosition: '0 0, 7px 7px',
        }}
      />

      {/* ── LAYER 4: VIGNETTE & PROGRESSIVE SPATIAL ATTENUATION ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.55) 100%)',
        }}
      />
    </div>
  );
}

export default CircadianSkybox;
