import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../socket/socketManager';

export default function SocketStatus() {
  const [status, setStatus] = useState<'idle' | 'connected' | 'connecting' | 'disconnected'>('idle');
  const everConnected = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      everConnected.current = true;
      setStatus('connected');
    };
    const onDisconnect = () => {
      if (everConnected.current) {
        setStatus('disconnected');
      }
    };
    const onConnecting = () => {
      if (everConnected.current) {
        setStatus('connecting');
      }
    };

    if (socket.connected) {
      everConnected.current = true;
      setStatus('connected');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onConnecting);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onConnecting);
    };
  }, []);

  const showBanner = status === 'connecting' || status === 'disconnected';

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              border shadow-lg backdrop-blur-md
              ${status === 'connecting'
                ? 'bg-warning/10 border-warning/30 text-warning'
                : 'bg-danger/10 border-danger/30 text-danger'
              }
            `}
          >
            <span
              className={`
                w-2 h-2 rounded-full animate-pulse
                ${status === 'connecting' ? 'bg-warning' : 'bg-danger'}
              `}
            />
            {status === 'connecting' ? 'Reconectando...' : 'Desconectado do servidor'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
