import { Variants } from 'framer-motion'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
}

export const scaleOut: Variants = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
}

// Habit check-in completion burst
export const checkmarkBounce: Variants = {
  unchecked: { scale: 1 },
  checked: { scale: [1, 1.3, 0.95, 1.05, 1], transition: { duration: 0.4 } },
}

// Streak counter increment
export const counterPop: Variants = {
  rest: { scale: 1 },
  pop: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
}

// Modal variants
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { 
      duration: 0.2, 
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.05
    } 
  },
  exit: { opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}

// Drawer variants (slide from right)
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { 
    x: 0, 
    transition: { 
      duration: 0.3, 
      ease: [0, 0, 0.2, 1],
      when: 'beforeChildren',
      staggerChildren: 0.05
    } 
  },
  exit: { x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

// Bottom sheet variants (slide from bottom)
export const bottomSheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0, 
    transition: { 
      duration: 0.3, 
      ease: [0, 0, 0.2, 1],
      when: 'beforeChildren',
      staggerChildren: 0.05
    } 
  },
  exit: { y: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

// List item variants for staggered animations
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}

// Container variants for staggered children
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
}

// Pulse animation for loading states
export const pulse: Variants = {
  hidden: { opacity: 0.5 },
  visible: { 
    opacity: [0.5, 1, 0.5], 
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    } 
  },
}

// Shake animation for errors
export const shake: Variants = {
  hidden: { x: 0 },
  visible: { 
    x: [0, -4, 4, -4, 4, 0], 
    transition: { duration: 0.4, ease: 'easeInOut' } 
  },
}
