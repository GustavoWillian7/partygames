import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
  align?: 'left' | 'center';
}

export default function SectionTitle({
  title,
  subtitle,
  icon,
  align = 'left',
}: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 ${align === 'center' ? 'text-center' : ''}`}
    >
      <div className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-2xl font-bold text-text neon-text">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-muted text-sm mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}
