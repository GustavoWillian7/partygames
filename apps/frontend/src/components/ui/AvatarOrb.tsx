import { motion } from 'framer-motion';

interface AvatarOrbProps {
  name: string;
  isHost?: boolean;
  isYou?: boolean;
  status?: 'online' | 'disconnected' | 'spectator' | 'eliminated';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-base',
};

const statusColors = {
  online: 'bg-accent-alt',
  disconnected: 'bg-danger',
  spectator: 'bg-warning',
  eliminated: 'bg-muted',
};

export default function AvatarOrb({
  name,
  isHost = false,
  isYou = false,
  status = 'online',
  size = 'md',
  className = '',
}: AvatarOrbProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative inline-flex flex-col items-center gap-1.5 ${className}`}
    >
      <div
        className={`
          relative flex items-center justify-center rounded-full
          ${sizeClasses[size]}
          ${status === 'eliminated' ? 'opacity-40 grayscale' : ''}
          bg-surface font-bold text-text
        `}
        style={{
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        }}
      >
        <span className="relative z-10">{initials}</span>

        {/* Gradient border ring */}
        <div
          className="absolute inset-[-2px] rounded-full -z-10"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #22D3EE)',
            opacity: status === 'eliminated' ? 0.2 : 0.5,
          }}
        />

        {/* Status dot */}
        <div
          className={`
            absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
            ${statusColors[status]} border-2 border-background
            ${status === 'disconnected' ? 'animate-pulse' : ''}
          `}
        />
      </div>

      <div className="flex items-center gap-1 min-w-0 max-w-full">
        <span className={`text-xs truncate max-w-[80px] ${isYou ? 'text-primary font-medium' : 'text-muted'}`}>
          {isYou ? 'Você' : name}
        </span>
        {isHost && (
          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full border border-primary/30 shrink-0">
            Host
          </span>
        )}
      </div>
    </motion.div>
  );
}
