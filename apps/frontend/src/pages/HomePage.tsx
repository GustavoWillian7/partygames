import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { getSocket, connectSocket } from '../socket/socketManager';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';
import GlowInput from '../components/ui/GlowInput';
import ToastNotification from '../components/ui/ToastNotification';

export default function HomePage() {
  const { player, token, clearAuth } = useAuthStore();
  const { currentRoom, setRoom } = useRoomStore();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    connectSocket(token);

    const socket = getSocket();
    socket.on('room:state', (room) => {
      setRoom(room);
      if (room) {
        navigate(`/room/${room.id}`);
      }
    });
    socket.on('room:error', ({ message }) => setError(message));

    return () => {
      socket.off('room:state');
      socket.off('room:error');
    };
  }, [token, navigate, setRoom]);

  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom.id}`);
    }
  }, [currentRoom, navigate]);

  const handleCreate = () => {
    if (!roomName.trim()) return;
    setError('');
    setIsCreating(true);
    const socket = getSocket();
    socket.emit('room:create', { name: roomName });
  };

  const handleJoin = () => {
    if (!roomCode.trim() || roomCode.length !== 4) {
      setError('Código deve ter 4 caracteres');
      return;
    }
    setError('');
    const socket = getSocket();
    socket.emit('room:join', { roomId: roomCode.toUpperCase() });
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">🎮</span>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-light neon-text">
              PartyGames
            </h1>
          </div>
          <p className="text-muted">
            Olá, <span className="text-text font-semibold">{player?.name || 'Jogador'}</span>! 👋
          </p>
        </motion.div>

        <div className="space-y-4">
          {/* Create Room */}
          <GlassCard variant="default" hover={true}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-xl">➕</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Criar Sala</h2>
                <p className="text-sm text-muted">Inicie uma nova partida</p>
              </div>
            </div>

            <div className="flex gap-3">
              <GlowInput
                placeholder="Nome da sala"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1"
              />
              <NeonButton
                onClick={handleCreate}
                disabled={isCreating || !roomName.trim()}
                variant="primary"
              >
                Criar
              </NeonButton>
            </div>
          </GlassCard>

          {/* Join Room */}
          <GlassCard variant="default" hover={true}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <span className="text-xl">🔗</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Entrar em Sala</h2>
                <p className="text-sm text-muted">Use o código de 4 caracteres</p>
              </div>
            </div>

            <div className="flex gap-3">
              <GlowInput
                placeholder="Código (ex: ABCD)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={4}
                className="flex-1"
              />
              <NeonButton
                onClick={handleJoin}
                disabled={!roomCode.trim()}
                variant="accent"
              >
                Entrar
              </NeonButton>
            </div>
          </GlassCard>

          <ToastNotification show={!!error} variant="error">
            {error}
          </ToastNotification>

          {/* Logout */}
          <div className="text-center pt-4">
            <NeonButton
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              glow={false}
            >
              🚪 Sair da conta
            </NeonButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
