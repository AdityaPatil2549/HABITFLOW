import React from 'react';

interface ReviewBackgroundProps {
  score?: number;
}

export function ReviewBackground({ score = 0 }: ReviewBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">
      <div 
        className="absolute top-1/3 left-1/4 w-[600px] h-[400px] blur-[120px] rounded-full transition-all duration-1000"
        style={{
          backgroundColor: score > 70 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(99, 102, 241, 0.03)'
        }}
      />
    </div>
  );
}

export default ReviewBackground;
