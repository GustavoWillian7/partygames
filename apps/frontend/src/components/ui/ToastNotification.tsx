import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastNotificationProps {
  show: boolean;
  children: ReactNode;
  variant?: 'error' | 'success' | 'info';
}

const variantClasses = {
  error: 'bg-danger/10 border-danger/30 text-danger',
  success: 'bg-success/10 border-success/30 text-success',
  info: 'bg-primary/10 border-primary/30 text-primary',
};

export default function ToastNotification({
  show,
  children,
  variant = 'error',
}: ToastNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`
            rounded-xl p-4 border text-sm font-medium text-center
            ${variantClasses[variant]}
          `}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
