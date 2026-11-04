import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChronoStore } from '../../store/chronoStore';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

interface MistParticle {
  x: number;
  y: number;
  size: number;
  vx: number;
  alpha: number;
}

export function CircadianSkybox() {
  const { currentEpoch, solarState, activeWorld } = useChronoStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, speed: 0 });

  // Mouse vector tracking for interactive fluid deflection
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

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

    // Initialize 100 celestial stars
    const stars: Star[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.75, // Top 75% of sky
      size: Math.random() * 1.8 + 0.6,
      baseAlpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.04 + 0.015,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // Active meteors pool
    const meteors: Meteor[] = [];
    let lastMeteorTime = Date.now();

    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * width * 0.8 + width * 0.1,
        y: Math.random() * height * 0.35,
        length: Math.random() * 120 + 80,
        speed: Math.random() * 14 + 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 deg downward streak
        alpha: 1,
        active: true,
      });
    };

    // Valley drifting mist particles
    const mistParticles: MistParticle[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * width,
      y: height * 0.65 + Math.random() * height * 0.3,
      size: Math.random() * 140 + 80,
      vx: Math.random() * 0.25 + 0.08,
      alpha: Math.random() * 0.12 + 0.04,
    }));

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

      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const isNight = currentEpoch === 'night';
      const isDusk = currentEpoch === 'dusk';
      const isDawn = currentEpoch === 'dawn';

      // ── COLOR THEMATIC DEFINITIONS ──────────────────────────────
      let primaryR = 245, primaryG = 158, primaryB = 11; // Gold/Amber
      let secondaryR = 20, secondaryG = 184, secondaryB = 166; // Verdigris Patina
      if (currentEpoch === 'zenith') {
        primaryR = 6; primaryG = 182; primaryB = 212; // Polar Cyan
        secondaryR = 59; secondaryG = 130; secondaryB = 246; // Cobalt Blue
      } else if (currentEpoch === 'night') {
        primaryR = 99; primaryG = 102; primaryB = 241; // Velvet Indigo
        secondaryR = 168; secondaryG = 85; secondaryB = 247; // Cosmic Violet
      }

      const sunX = (solarState.sunXPercent / 100) * width;
      const sunY = (solarState.sunYPercent / 100) * height;

      // ── 1. VOLUMETRIC CREPUSCULAR GOD RAYS ─────────────────────────
      if (!isNight) {
        const rayCount = 9;
        ctx.save();
        for (let i = 0; i < rayCount; i++) {
          const rayAngle = ((i - rayCount / 2) * 0.14) + Math.PI / 2 + Math.sin(time * 0.5 + i) * 0.04;
          const rayLength = height * 1.2;
          const rayWidth = Math.sin(time * 0.3 + i * 1.5) * 40 + 70;

          const endX = sunX + Math.cos(rayAngle) * rayLength;
          const endY = sunY + Math.sin(rayAngle) * rayLength;

          const rayGrad = ctx.createLinearGradient(sunX, sunY, endX, endY);
          const rayAlpha = (Math.sin(time * 0.8 + i) * 0.03 + 0.06) * solarState.glowOpacity;
          rayGrad.addColorStop(0, `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${rayAlpha * 1.8})`);
          rayGrad.addColorStop(0.5, `rgba(${secondaryR}, ${secondaryG}, ${secondaryB}, ${rayAlpha * 0.8})`);
          rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          ctx.lineTo(endX - rayWidth, endY);
          ctx.lineTo(endX + rayWidth, endY);
          ctx.closePath();
          ctx.fillStyle = rayGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // ── 2. LIVING FLUID AURORA SILK RIBBONS ────────────────────────
      ctx.save();
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const waveOffset = w * 1.8;
        const waveYBase = height * (0.28 + w * 0.14);
        const waveAlpha = (isNight ? 0.14 : isDusk ? 0.22 : 0.12) - w * 0.03;

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, waveYBase);

        const segments = 24;
        const segmentWidth = width / segments;

        for (let s = 0; s <= segments; s++) {
          const x = s * segmentWidth;
          // Harmonic wave equation with cursor deflection
          const distToMouse = Math.hypot(x - mouseRef.current.x * width, waveYBase - mouseRef.current.y * height);
          const mouseDeflection = Math.max(0, 1 - distToMouse / 350) * 45;

          const y =
            waveYBase +
            Math.sin(time * 0.7 + s * 0.35 + waveOffset) * 35 +
            Math.cos(time * 0.4 + s * 0.2) * 20 -
            mouseDeflection;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, waveYBase - 60, width, waveYBase + 180);
        waveGrad.addColorStop(0, `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${waveAlpha})`);
        waveGrad.addColorStop(0.5, `rgba(${secondaryR}, ${secondaryG}, ${secondaryB}, ${waveAlpha * 0.6})`);
        waveGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = waveGrad;
        ctx.fill();
      }
      ctx.restore();

      // ── 3. CELESTIAL TWINKLING STARFIELD & CONSTELLATIONS ─────────
      if (isNight || isDusk) {
        ctx.save();
        const starOpacityMultiplier = isNight ? 1 : 0.45;

        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          star.twinklePhase += star.twinkleSpeed;
          const twinkle = Math.sin(star.twinklePhase);
          const currentAlpha = Math.max(0.08, star.baseAlpha + twinkle * 0.35) * starOpacityMultiplier;

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha.toFixed(3)})`;
          ctx.fill();

          // Subtle diamond diffraction spike for brighter stars
          if (star.size > 2.0 && isNight) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(currentAlpha * 0.3).toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(star.x - star.size * 2.5, star.y);
            ctx.lineTo(star.x + star.size * 2.5, star.y);
            ctx.moveTo(star.x, star.y - star.size * 2.5);
            ctx.lineTo(star.x, star.y + star.size * 2.5);
            ctx.stroke();
          }
        }

        // Faint Constellation Links (Between close stars)
        ctx.strokeStyle = `rgba(${secondaryR}, ${secondaryG}, ${secondaryB}, ${isNight ? 0.08 : 0.03})`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 20; i++) {
          const s1 = stars[i];
          const s2 = stars[(i + 1) % 20];
          const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // ── 4. PERIODIC CELESTIAL METEOR SHOOTING STARS ───────────────
      const now = Date.now();
      if ((isNight || isDusk) && now - lastMeteorTime > 14000) {
        spawnMeteor();
        lastMeteorTime = now;
      }

      if (meteors.length > 0) {
        ctx.save();
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += Math.cos(m.angle) * m.speed;
          m.y += Math.sin(m.angle) * m.speed;
          m.alpha -= 0.02;

          if (m.alpha <= 0 || m.x > width || m.y > height) {
            meteors.splice(i, 1);
            continue;
          }

          const tailX = m.x - Math.cos(m.angle) * m.length;
          const tailY = m.y - Math.sin(m.angle) * m.length;

          const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          meteorGrad.addColorStop(0.7, `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${m.alpha * 0.7})`);
          meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Spark head
          ctx.beginPath();
          ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // ── 5. VALLEY ROLLING FOG MIST PARTICLES ───────────────────────
      ctx.save();
      for (let i = 0; i < mistParticles.length; i++) {
        const p = mistParticles[i];
        p.x += p.vx;
        if (p.x > width + p.size) p.x = -p.size;

        const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        mistGrad.addColorStop(0, `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${p.alpha * 0.7})`);
        mistGrad.addColorStop(0.5, `rgba(${secondaryR}, ${secondaryG}, ${secondaryB}, ${p.alpha * 0.3})`);
        mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = mistGrad;
        ctx.fill();
      }
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

  const { sunXPercent, sunYPercent, glowOpacity, elevationDeg } = solarState;
  const isNight = currentEpoch === 'night';
  const isDusk = currentEpoch === 'dusk';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--canvas-ground, #06080d)',
        transition: 'background-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      {/* ── LAYER 0: Astronomical Sun/Moon Atmospheric Radial Glow Orb ── */}
      <div
        className="absolute w-[950px] h-[950px] rounded-full blur-[130px] pointer-events-none transition-all duration-700 ease-out"
        style={{
          left: `${sunXPercent}%`,
          top: `${sunYPercent}%`,
          transform: 'translate(-50%, -50%)',
          background: isNight
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(168, 85, 247, 0.16) 40%, transparent 70%)'
            : isDusk
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(255, 191, 36, 0.22) 35%, rgba(20, 184, 166, 0.10) 65%, transparent 75%)'
            : currentEpoch === 'dawn'
            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.40) 0%, rgba(245, 158, 11, 0.18) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)',
          opacity: glowOpacity,
        }}
      />

      {/* ── LAYER 1: Master Canvas (God Rays, Aurora Silk Waves, Stars, Meteors, Fog) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── LAYER 2: 4-Tier Japanese Yamato-e Mountain Landscape (High-Craft SVG) ── */}
      <div className="absolute inset-x-0 bottom-0 h-[560px] pointer-events-none">
        <svg
          viewBox="0 0 1440 560"
          className="w-full h-full object-cover preserve-3d"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Celestial Sun / Moon Specular Gradient */}
            <radialGradient id="celestial-orb-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor="var(--chrono-accent, #f59e0b)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--chrono-secondary, #ffbf24)" stopOpacity="0" />
            </radialGradient>

            {/* Tier 1: Distant Spire Gradient */}
            <linearGradient id="tier1-spires" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--chrono-accent, #f59e0b)" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#0a0e1c" stopOpacity="0.75" />
              <stop offset="100%" stopColor="var(--canvas-ground, #06080d)" stopOpacity="0.95" />
            </linearGradient>

            {/* Tier 2: Mid Alpine Ridge Gradient with Golden Edge */}
            <linearGradient id="tier2-alpine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#12182b" stopOpacity="0.92" />
              <stop offset="100%" stopColor="var(--canvas-ground, #06080d)" stopOpacity="1" />
            </linearGradient>

            {/* Tier 3: Near Ridge Urushi Black */}
            <linearGradient id="tier3-foreground" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#080a12" stopOpacity="0.98" />
              <stop offset="100%" stopColor="var(--canvas-ground, #06080d)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* ── CELESTIAL SUN / MOON DISC ── */}
          <circle
            cx={`${sunXPercent}%`}
            cy={`${sunYPercent}%`}
            r={isNight ? 22 : 36}
            className="transition-all duration-700 ease-out"
            fill={isNight ? '#f1f5f9' : 'url(#celestial-orb-grad)'}
            style={{
              filter: isNight
                ? 'drop-shadow(0 0 24px rgba(241, 245, 249, 0.85)) drop-shadow(0 0 50px rgba(99, 102, 241, 0.5))'
                : 'drop-shadow(0 0 35px var(--chrono-accent, #f59e0b)) drop-shadow(0 0 70px var(--chrono-secondary, #ffbf24))',
            }}
          />

          {/* Lunar Crater Caustics (Subtle detail when night) */}
          {isNight && (
            <g
              transform={`translate(${((sunXPercent / 100) * 1440) - 22}, ${((sunYPercent / 100) * 560) - 22})`}
              className="opacity-20 pointer-events-none"
            >
              <circle cx="16" cy="14" r="4.5" fill="#94a3b8" />
              <circle cx="28" cy="22" r="6" fill="#94a3b8" />
              <circle cx="20" cy="30" r="3.5" fill="#94a3b8" />
            </g>
          )}

          {/* ── TIER 1: Distant Alpine Spires & Mount Fuji Silhouette ── */}
          <path
            d="M0 320 
               L180 260 L240 290 
               L360 210 L440 270 
               L620 140 L700 120 L780 140 L860 260 
               L1020 180 L1100 240 
               L1260 190 L1340 250 L1440 220 
               L1440 560 L0 560 Z"
            fill="url(#tier1-spires)"
            className="transition-all duration-700"
          />

          {/* Mount Fuji Sacred Peak Hairline Gilded Crest */}
          <path
            d="M620 140 L700 120 L780 140"
            stroke="var(--chrono-accent, #f59e0b)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={isNight ? 0.3 : 0.8}
            className="transition-all duration-700"
          />

          {/* ── TIER 2: Mid Alpine Ridge with Specular Hairline Rim ── */}
          <path
            d="M0 390 
               C200 330 320 410 480 340 
               C660 260 800 370 980 310 
               C1140 260 1300 360 1440 320 
               L1440 560 L0 560 Z"
            fill="url(#tier2-alpine)"
            className="transition-all duration-700"
          />
          {/* Luminous Specular Rim Line for Tier 2 */}
          <path
            d="M0 390 
               C200 330 320 410 480 340 
               C660 260 800 370 980 310 
               C1140 260 1300 360 1440 320"
            stroke="var(--chrono-accent, #f59e0b)"
            strokeWidth="1.2"
            opacity={isNight ? 0.25 : 0.75}
            fill="none"
            className="transition-all duration-700"
          />

          {/* ── TIER 3: Near Ridge in Urushi Black ── */}
          <path
            d="M0 460 
               C160 410 320 490 520 430 
               C740 370 920 460 1120 410 
               C1280 370 1380 440 1440 420 
               L1440 560 L0 560 Z"
            fill="url(#tier3-foreground)"
            className="transition-all duration-700"
          />
        </svg>
      </div>

      {/* ── LAYER 3: Progressive Atmospheric Blur Mask ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[420px] pointer-events-none backdrop-blur-[12px]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 55%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 55%, black 100%)',
        }}
      />

      {/* ── LAYER 4: Japanese Makie 24k Gold Flake Micro-Shimmer & Film Grain ── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(245, 158, 11, 0.8) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '36px 36px, 18px 18px',
          backgroundPosition: '0 0, 9px 9px',
        }}
      />

      {/* Horizon Specular Laser Rule */}
      <div
        className="absolute inset-x-0 bottom-[260px] h-[1px] opacity-25 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent, var(--chrono-accent, #f59e0b), transparent)',
        }}
      />
    </div>
  );
}

export default CircadianSkybox;
