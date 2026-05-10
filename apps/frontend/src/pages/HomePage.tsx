import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { getSocket, connectSocket } from '../socket/socketManager';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">PartyGames</h1>
            <p className="text-muted text-sm">Olá, {player?.name || 'Jogador'}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-danger hover:underline"
          >
            Sair
          </button>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-xl border border-surface/50 mb-4">
          <h2 className="text-lg font-semibold text-text mb-4">Criar Sala</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Nome da sala"
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
            />
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors disabled:opacity-50"
            >
              Criar
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-xl border border-surface/50">
          <h2 className="text-lg font-semibold text-text mb-4">Entrar em Sala</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Código (ex: ABCD)"
              maxLength={4}
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
            />
            <button
              onClick={handleJoin}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-background font-medium transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-danger text-sm text-center mt-4"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
