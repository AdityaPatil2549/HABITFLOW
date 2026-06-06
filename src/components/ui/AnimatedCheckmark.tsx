import { motion } from 'framer-motion';

export function AnimatedCheckmark({
  size = 24,
  strokeWidth = 2,
  color = 'currentColor',
  className = '',
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}
