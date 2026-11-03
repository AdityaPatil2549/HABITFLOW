import React from 'react';

export function HabitsBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#07080b]"
      aria-hidden="true"
    >
      {/* High-End Aurora Mesh Radial Blooms */}
      <div
        className="absolute top-0 inset-x-0 h-[650px] opacity-90 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 65% 45% at 50% -5%, rgba(99, 102, 241, 0.22), rgba(147, 51, 234, 0.08), transparent 75%),
            radial-gradient(ellipse 45% 35% at 85% 15%, rgba(16, 185, 129, 0.16), transparent 65%),
            radial-gradient(ellipse 40% 40% at 15% 35%, rgba(6, 182, 212, 0.12), transparent 60%)
          `,
        }}
      />

      {/* Subtle luxury bottom accent bloom */}
      <div
        className="absolute bottom-0 right-1/4 w-[700px] h-[400px] opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15), transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Crisp hairline grid texture (Static CSS, 0ms GPU overhead) */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 95%)',
        }}
      />
    </div>
  );
}

export default HabitsBackground;
