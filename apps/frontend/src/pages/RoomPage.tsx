import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { getSocket } from '../socket/socketManager';
import type { RoomSettings } from '@partygames/shared';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { player, token } = useAuthStore();
  const { currentRoom, setRoom, playerJoined, playerLeft, playerReconnected, clearRoom } = useRoomStore();
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<RoomSettings>>({});

  const isHost = currentRoom?.hostId === player?.id;

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const socket = getSocket();

    socket.on('room:state', (room) => {
      setRoom(room);
      setSettingsForm(room.settings);
    });
    socket.on('room:player-joined', ({ player: p }) => playerJoined(p));
    socket.on('room:player-left', ({ playerId, newHostId }) => playerLeft(playerId, newHostId));
    socket.on('room:player-reconnected', ({ player: p }) => playerReconnected(p));
    socket.on('room:error', ({ message }) => setError(message));
    socket.on('room:game-started', ({ gameType }) => {
      navigate(`/game/${gameType}`);
    });

    // If room not loaded, try to join by URL
    if (!currentRoom && roomId) {
      socket.emit('room:join', { roomId });
    }

    return () => {
      socket.off('room:state');
      socket.off('room:player-joined');
      socket.off('room:player-left');
      socket.off('room:player-reconnected');
      socket.off('room:error');
      socket.off('room:game-started');
    };
  }, [token, navigate, roomId, currentRoom, setRoom, playerJoined, playerLeft, playerReconnected]);

  const handleLeave = () => {
    const socket = getSocket();
    socket.emit('room:leave');
    clearRoom();
    navigate('/');
  };

  const handleKick = (playerId: string) => {
    const socket = getSocket();
    socket.emit('room:kick', { playerId });
  };

  const handleUpdateSettings = () => {
    const socket = getSocket();
    socket.emit('room:update-settings', settingsForm);
    setShowSettings(false);
  };

  const handleStartGame = (gameType: 'impostor' | 'duo-chaos') => {
    const socket = getSocket();
    socket.emit('room:start-game', { gameType });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'disconnected': return 'bg-danger';
      case 'spectator': return 'bg-info';
      default: return 'bg-muted';
    }
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Entrando na sala...</p>
          {error && <p className="text-danger mt-2">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">{currentRoom.name}</h1>
            <p className="text-muted text-sm">Código: <span className="font-mono text-accent font-bold">{currentRoom.id}</span></p>
          </div>
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-sm font-medium"
          >
            Sair da Sala
          </button>
        </div>

        <div className="bg-surface rounded-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-text mb-4">Jogadores ({currentRoom.players.length}/{currentRoom.settings.maxPlayers})</h2>
          <div className="space-y-2">
            <AnimatePresence>
              {currentRoom.players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColor(p.status)}`} />
                    <span className="text-text font-medium">{p.name}</span>
                    {p.isHost && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Host</span>
                    )}
                    {p.status === 'spectator' && (
                      <span className="text-xs bg-info/20 text-info px-2 py-0.5 rounded-full">Espectador</span>
                    )}
                  </div>
                  {isHost && p.id !== player?.id && currentRoom.status === 'waiting' && (
                    <button
                      onClick={() => handleKick(p.id)}
                      className="text-danger text-sm hover:underline"
                    >
                      Expulsar
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {isHost && currentRoom.status === 'waiting' && (
          <>
            <div className="bg-surface rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text">Configurações</h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm text-primary hover:underline"
                >
                  {showSettings ? 'Fechar' : 'Editar'}
                </button>
              </div>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm text-muted mb-1">Máximo de jogadores</label>
                      <input
                        type="number"
                        min={3}
                        max={12}
                        value={settingsForm.maxPlayers ?? currentRoom.settings.maxPlayers}
                        onChange={(e) => setSettingsForm({ ...settingsForm, maxPlayers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-muted mb-1">Tempo por rodada (segundos)</label>
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={settingsForm.roundTimeSeconds ?? currentRoom.settings.roundTimeSeconds}
                        onChange={(e) => setSettingsForm({ ...settingsForm, roundTimeSeconds: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="allowReconnection"
                        checked={settingsForm.allowReconnection ?? currentRoom.settings.allowReconnection}
                        onChange={(e) => setSettingsForm({ ...settingsForm, allowReconnection: e.target.checked })}
                        className="w-5 h-5 accent-primary"
                      />
                      <label htmlFor="allowReconnection" className="text-sm text-text">Permitir reconexão</label>
                    </div>

                    <button
                      onClick={handleUpdateSettings}
                      className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                    >
                      Salvar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-surface rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Iniciar Jogo</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStartGame('impostor')}
                  disabled={currentRoom.players.length < 3}
                  className="p-4 rounded-xl bg-background border border-surface hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-semibold text-text">Jogo do Impostor</p>
                  <p className="text-xs text-muted mt-1">Min. 3 jogadores</p>
                </button>
                <button
                  onClick={() => handleStartGame('duo-chaos')}
                  disabled={currentRoom.players.length < 3}
                  className="p-4 rounded-xl bg-background border border-surface hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-semibold text-text">Encontre sua Dupla</p>
                  <p className="text-xs text-muted mt-1">Modo Caos - Min. 3</p>
                </button>
              </div>
            </div>
          </>
        )}

        {currentRoom.status === 'playing' && (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-muted">Jogo em andamento...</p>
          </div>
        )}

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
