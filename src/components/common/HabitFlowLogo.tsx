interface HabitFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  hideTextOnMedium?: boolean;
}

export function HabitFlowLogo({
  className = '',
  size = 'md',
  hideTextOnMedium = false,
}: HabitFlowLogoProps) {
  const iconSizes = {
    sm: { w: 20, h: 20, fontSize: 'text-base' },
    md: { w: 24, h: 24, fontSize: 'text-lg' },
    lg: { w: 30, h: 30, fontSize: 'text-xl' },
  };

  const current = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="flex items-center justify-center rounded-lg bg-white text-neutral-950 p-1.5 flex-shrink-0">
        <svg
          width={current.w}
          height={current.h}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12C6.5 6 10 6 12 12C14 18 17.5 18 20 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className={`items-center gap-2 min-w-0 ${hideTextOnMedium ? 'hidden xl:flex' : 'flex'}`}>
        <span className={`${current.fontSize} font-bold tracking-tight flex items-baseline leading-none text-white`}>
          HabitFlow
        </span>
      </div>
    </div>
  );
}

export default HabitFlowLogo;
