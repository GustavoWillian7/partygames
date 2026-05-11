import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const variantClasses = {
  primary: 'bg-primary/15 text-primary border-primary/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  pulse = false,
}: BadgeProps) {
  return (
    <motion.span
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </motion.span>
  );
}
