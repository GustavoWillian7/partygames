import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'accent' | 'danger' | 'success';
  hover?: boolean;
  animate?: boolean;
  sharp?: boolean;
}

const variantClasses = {
  default: 'glass',
  strong: 'glass-strong',
  accent: 'glass-card border-accent/25',
  danger: 'glass-card border-danger/25',
  success: 'glass-card border-success/25',
};

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  animate = true,
  sharp = false,
}: GlassCardProps) {
  const radius = sharp ? 'rounded-lg' : 'rounded-xl';
  const baseClasses = `${variantClasses[variant]} ${radius} p-5 ${hover ? 'card-lift' : ''} ${className}`;

  if (!animate) {
    return <div className={baseClasses}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
      className={baseClasses}
    >
      {children}
    </motion.div>
  );
}
