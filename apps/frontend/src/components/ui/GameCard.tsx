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
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl p-5 text-left
        glass border border-white/[0.08]
        transition-all duration-300
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'}
      `}
    >
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative z-10">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-base font-bold text-text mb-1 font-display">{title}</h3>
        <p className="text-sm text-muted mb-3 leading-relaxed">{description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-surface text-muted px-2.5 py-1 rounded-full border border-white/[0.06]">
            Min. {minPlayers} jogadores
          </span>
        </div>
      </div>
    </motion.button>
  );
}
