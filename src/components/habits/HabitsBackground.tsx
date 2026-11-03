import React from 'react';

export function HabitsBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#07080b]"
      style={{ transform: 'translateZ(0)' }}
      aria-hidden="true"
    >
      {/* High-End Aurora Mesh Radial Blooms (Native GPU gradients, 0ms filter overhead) */}
      <div
        className="absolute top-0 inset-x-0 h-[650px] opacity-90"
        style={{
          background: `
            radial-gradient(ellipse 65% 45% at 50% -5%, rgba(99, 102, 241, 0.22), rgba(147, 51, 234, 0.08), transparent 75%),
            radial-gradient(ellipse 45% 35% at 85% 15%, rgba(16, 185, 129, 0.16), transparent 65%),
            radial-gradient(ellipse 40% 40% at 15% 35%, rgba(6, 182, 212, 0.12), transparent 60%)
          `,
        }}
      />

      {/* Subtle luxury bottom accent bloom — naturally diffused gradient without expensive blur filter */}
      <div
        className="absolute -bottom-20 right-1/4 w-[600px] h-[350px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.20) 0%, rgba(168, 85, 247, 0.05) 45%, transparent 70%)',
        }}
      />

      {/* Crisp hairline grid texture (Lightweight background pattern without GPU mask) */}
      <div
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}

export default HabitsBackground;
