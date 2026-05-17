import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { getSocket } from '../socket/socketManager';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';
import GlowInput from '../components/ui/GlowInput';
import AvatarOrb from '../components/ui/AvatarOrb';
import Badge from '../components/ui/Badge';
import GameCard from '../components/ui/GameCard';
import SectionTitle from '../components/ui/SectionTitle';
import type { RoomSettings } from '@partygames/shared';

const THEME_GROUPS = [
  { id: 'all', name: 'Aleatório' },
  { id: 'harry-potter', name: 'Harry Potter' },
  { id: 'animais', name: 'Animais' },
  { id: 'esportes', name: 'Esportes' },
  { id: 'comidas', name: 'Comidas' },
  { id: 'filmes', name: 'Filmes' },
  { id: 'animes', name: 'Animes' },
  { id: 'jogos', name: 'Jogos' },
  { id: 'series', name: 'Séries' },
  { id: 'futebol', name: 'Futebol' },
  { id: 'musica', name: 'Música' },
  { id: 'tecnologia', name: 'Tecnologia' },
  { id: 'livros', name: 'Livros' },
  { id: 'mitologia', name: 'Mitologia' },
];

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

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-muted text-lg">Entrando na sala...</p>
          {error && <p className="text-danger mt-4">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent neon-text">
              {currentRoom.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted text-sm">Código:</span>
              <Badge variant="accent" size="sm">{currentRoom.id}</Badge>
              <Badge
                variant={currentRoom.status === 'waiting' ? 'success' : 'primary'}
                size="sm"
                pulse={currentRoom.status === 'playing'}
              >
                {currentRoom.status === 'waiting' ? 'Aguardando' : 'Em jogo'}
              </Badge>
            </div>
          </div>
          <NeonButton onClick={handleLeave} variant="danger" size="sm">
            🚪 Sair
          </NeonButton>
        </div>

        {/* Players */}
        <GlassCard className="mb-4">
          <SectionTitle
            title="Jogadores"
            subtitle={`${currentRoom.players.length}/${currentRoom.settings.maxPlayers} jogadores`}
            icon="👥"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {currentRoom.players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-xl bg-background/40 border border-glassBorder"
                >
                  <AvatarOrb
                    name={p.name}
                    isHost={p.isHost}
                    isYou={p.id === player?.id}
                    status={p.status === 'disconnected' ? 'disconnected' : p.status === 'spectator' ? 'spectator' : 'online'}
                    size="lg"
                  />
                  {isHost && p.id !== player?.id && currentRoom.status === 'waiting' && (
                    <button
                      onClick={() => handleKick(p.id)}
                      className="absolute top-1 right-1 text-[10px] text-danger/70 hover:text-danger transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Host Controls */}
        {isHost && currentRoom.status === 'waiting' && (
          <>
            {/* Settings */}
            <GlassCard className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle title="Configurações" icon="⚙️" />
                <NeonButton
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  size="sm"
                  glow={false}
                >
                  {showSettings ? 'Fechar' : 'Editar'}
                </NeonButton>
              </div>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <GlowInput
                      label="Máximo de jogadores"
                      type="number"
                      min={3}
                      max={12}
                      value={settingsForm.maxPlayers ?? currentRoom.settings.maxPlayers}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxPlayers: parseInt(e.target.value) })}
                    />

                    <GlowInput
                      label="Tempo por rodada (segundos)"
                      type="number"
                      min={10}
                      max={300}
                      value={settingsForm.roundTimeSeconds ?? currentRoom.settings.roundTimeSeconds}
                      onChange={(e) => setSettingsForm({ ...settingsForm, roundTimeSeconds: parseInt(e.target.value) })}
                    />

                    <div>
                      <label className="block text-sm text-muted mb-2">Grupo de temas</label>
                      <select
                        value={settingsForm.themeGroup ?? currentRoom.settings.themeGroup ?? 'all'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, themeGroup: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-background/80 border border-glassBorder text-text focus:outline-none focus:border-primary"
                      >
                        {THEME_GROUPS.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-muted mt-1">
                        Define o conjunto de palavras usado no jogo.
                      </p>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.allowReconnection ?? currentRoom.settings.allowReconnection}
                        onChange={(e) => setSettingsForm({ ...settingsForm, allowReconnection: e.target.checked })}
                        className="w-5 h-5 accent-primary rounded"
                      />
                      <span className="text-sm text-text">Permitir reconexão</span>
                    </label>

                    <NeonButton onClick={handleUpdateSettings} variant="primary" fullWidth>
                      Salvar Configurações
                    </NeonButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Game Selection */}
            <GlassCard>
              <SectionTitle
                title="Iniciar Jogo"
                subtitle="Escolha um modo de jogo"
                icon="🎮"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GameCard
                  title="Jogo do Impostor"
                  description="Descubra quem está mentindo! Um jogador é o impostor e não sabe a palavra secreta."
                  icon="🎭"
                  minPlayers={3}
                  onClick={() => handleStartGame('impostor')}
                  disabled={currentRoom.players.length < 3}
                />
                <GameCard
                  title="Encontre sua Dupla"
                  description="Encontre quem tem a mesma palavra que você no Modo Caos!"
                  icon="🎯"
                  minPlayers={3}
                  onClick={() => handleStartGame('duo-chaos')}
                  disabled={currentRoom.players.length < 3}
                />
              </div>
            </GlassCard>
          </>
        )}

        {currentRoom.status === 'playing' && (
          <GlassCard variant="accent" className="text-center">
            <div className="py-8">
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-accent mb-2">Jogo em andamento!</h3>
              <p className="text-muted">Aguarde o próximo jogo...</p>
            </div>
          </GlassCard>
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
