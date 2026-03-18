import { type FC } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { modalVariants } from '@/shared/utils/motionVariants'
import type { ModalProps } from '@/shared/types'

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  children,
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={closeOnBackdrop ? onClose : undefined}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg',
                  sizeClasses[size],
                  className
                )}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Dialog.Title
                  className={cn(
                    'text-lg font-semibold leading-none tracking-tight',
                    !title && 'sr-only'
                  )}
                >
                  {title}
                </Dialog.Title>
                
                {title && (
                  <Dialog.Close
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                )}

                <div className="mt-4">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  )
}
