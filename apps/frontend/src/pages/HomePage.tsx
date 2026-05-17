import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { getSocket, connectSocket, disconnectSocket } from '../socket/socketManager';
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
    socket.on('room:error', ({ message }) => {
      setError(message);
      setIsCreating(false);
    });

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
    disconnectSocket();
    clearAuth();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background bg-grid noise flex flex-col">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* === HEADER === */}
      <header className="relative z-10 px-6 py-5 lg:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl">🎮</span>
            <h1 className="font-display text-xl font-bold text-gradient tracking-tight">
              PartyGames
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <span className="hidden sm:inline text-sm text-muted">
              Olá, <span className="text-text font-medium">{player?.name || 'Jogador'}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-muted hover:text-danger transition-colors duration-200"
            >
              Sair
            </button>
          </motion.div>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8 lg:px-10">
        <div className="w-full max-w-4xl">
          {/* Welcome text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-text mb-2">
              Bora jogar?
            </h2>
            <p className="text-muted">
              Crie uma sala ou entre em uma existente.
            </p>
          </motion.div>

          {/* Asymmetric Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Create Room — larger column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="glass-strong rounded-xl p-6 h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-xl">➕</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text font-display">Criar Sala</h3>
                    <p className="text-sm text-muted">Inicie uma nova partida</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <GlowInput
                    placeholder="Nome da sala"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="flex-1"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !roomName.trim()}
                    className="
                      py-3 px-5 rounded-lg font-semibold text-sm
                      border border-primary/40 text-primary
                      bg-transparent btn-fill btn-fill-primary
                      transition-all duration-300
                      hover:text-white
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando...
                      </span>
                    ) : 'Criar'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Join Room — smaller column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="glass-strong rounded-xl p-6 h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <span className="text-xl">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text font-display">Entrar</h3>
                    <p className="text-sm text-muted">Use o código</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <GlowInput
                    placeholder="Código (ex: ABCD)"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    maxLength={4}
                    className="flex-1 font-mono tracking-widest text-center"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!roomCode.trim()}
                    className="
                      py-3 px-5 rounded-lg font-semibold text-sm
                      border border-accent/40 text-accent
                      bg-transparent btn-fill btn-fill-accent
                      transition-all duration-300
                      hover:text-background
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Error toast */}
          <div className="mt-4">
            <ToastNotification show={!!error} variant="error">
              {error}
            </ToastNotification>
          </div>
        </div>
      </main>
    </div>
  );
}
