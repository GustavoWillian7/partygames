import { motion } from 'framer-motion';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  minPlayers: number;
  onClick: () => void;
  disabled?: boolean;
}

export default function GameCard({
  title,
  description,
  icon,
  minPlayers,
  onClick,
  disabled = false,
}: GameCardProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03, y: -4 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-2xl p-6 text-left
        glass-card border border-glassBorder
        transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'}
      `}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-text mb-1">{title}</h3>
        <p className="text-sm text-muted mb-3">{description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-surfaceSolid/50 text-muted px-2 py-1 rounded-full">
            Min. {minPlayers} jogadores
          </span>
        </div>
      </div>
    </motion.button>
  );
}
