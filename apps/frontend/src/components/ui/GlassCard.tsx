import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'accent' | 'danger' | 'success';
  hover?: boolean;
  animate?: boolean;
}

const variantClasses = {
  default: 'glass',
  strong: 'glass-strong',
  accent: 'glass-card border-accent/30',
  danger: 'glass-card border-danger/30',
  success: 'glass-card border-success/30',
};

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  animate = true,
}: GlassCardProps) {
  const baseClasses = `${variantClasses[variant]} rounded-2xl p-6 ${hover ? 'card-lift' : ''} ${className}`;

  if (!animate) {
    return <div className={baseClasses}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
      className={baseClasses}
    >
      {children}
    </motion.div>
  );
}
