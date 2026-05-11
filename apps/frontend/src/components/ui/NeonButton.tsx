import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface NeonButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const variantClasses = {
  primary: 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 hover:border-primary',
  accent: 'bg-accent/20 text-accent border-accent/50 hover:bg-accent/30 hover:border-accent',
  danger: 'bg-danger/20 text-danger border-danger/50 hover:bg-danger/30 hover:border-danger',
  ghost: 'bg-transparent text-muted border-transparent hover:text-text hover:bg-surface/50',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  fullWidth = false,
  className = '',
  ...props
}: NeonButtonProps) {
  return (
    <motion.button
      whileHover={props.disabled ? {} : { scale: 1.02 }}
      whileTap={props.disabled ? {} : { scale: 0.98 }}
      className={`
        rounded-xl font-semibold border transition-all duration-300
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${glow ? 'btn-glow' : ''}
        ${fullWidth ? 'w-full' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
