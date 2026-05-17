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

const variantBase = {
  primary: 'border-primary/40 text-primary hover:text-white',
  accent: 'border-accent/40 text-accent hover:text-background',
  danger: 'border-danger/40 text-danger hover:text-white',
  ghost: 'border-transparent text-muted hover:text-text hover:border-white/10',
};

const variantFill = {
  primary: 'btn-fill-primary',
  accent: 'btn-fill-accent',
  danger: 'btn-fill-danger',
  ghost: '',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3 text-lg',
};

export default function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  fullWidth = false,
  className = '',
  ...props
}: NeonButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <motion.button
      whileHover={props.disabled ? {} : { scale: 1.01 }}
      whileTap={props.disabled ? {} : { scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-lg font-semibold border
        bg-transparent transition-all duration-300
        ${variantBase[variant]}
        ${!isGhost ? 'btn-fill ' + variantFill[variant] : ''}
        ${sizeClasses[size]}
        ${glow ? 'glow-' + variant : ''}
        ${fullWidth ? 'w-full' : ''}
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
