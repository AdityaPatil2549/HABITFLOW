import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
};

export const checkmarkBounce: Variants = {
  unchecked: { scale: 1 },
  checked: { scale: [1, 1.3, 0.95, 1.05, 1], transition: { duration: 0.4 } },
};

export const counterPop: Variants = {
  rest: { scale: 1 },
  pop: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
};
