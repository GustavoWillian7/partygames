import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import SocketStatus from '../ui/SocketStatus';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Connection status */}
      <SocketStatus />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
