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
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

const statusColors = {
  online: 'bg-success',
  disconnected: 'bg-danger',
  spectator: 'bg-info',
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
      whileHover={{ scale: 1.1 }}
      className={`relative inline-flex flex-col items-center gap-1 ${className}`}
    >
      <div
        className={`
          avatar-orb ${sizeClasses[size]}
          ${status === 'eliminated' ? 'opacity-50 grayscale' : ''}
        `}
      >
        <span className="relative z-10 text-text font-bold">{initials}</span>
        {/* Status dot */}
        <div
          className={`
            absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
            ${statusColors[status]} border-2 border-background
            ${status === 'disconnected' ? 'animate-pulse' : ''}
          `}
        />
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs ${isYou ? 'text-primary font-medium' : 'text-muted'}`}>
          {isYou ? 'Você' : name}
        </span>
        {isHost && (
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
            Host
          </span>
        )}
      </div>
    </motion.div>
  );
}
