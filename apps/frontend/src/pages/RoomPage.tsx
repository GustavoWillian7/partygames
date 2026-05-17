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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="text-muted text-lg">Entrando na sala...</p>
          {error && <p className="text-danger mt-4">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid noise flex flex-col lg:flex-row">
      <div className="noise-overlay" />

      {/* === MOBILE HEADER === */}
      <div className="lg:hidden relative z-20 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-gradient">PastelariaGames</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-surface/60 text-text border border-white/[0.08]"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* === SIDEBAR === */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`
              fixed lg:static inset-y-0 left-0 z-30
              w-[280px] lg:w-[260px]
              glass-strong border-r border-white/[0.08]
              flex flex-col
              ${sidebarOpen ? 'flex' : 'hidden lg:flex'}
            `}
          >
            {/* Sidebar Header */}
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="font-display text-lg font-bold text-text truncate">{currentRoom.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted">Código:</span>
                <Badge variant="accent" size="sm">
                  <span className="font-mono tracking-wider">{currentRoom.id}</span>
                </Badge>
                <Badge
                  variant={currentRoom.status === 'waiting' ? 'success' : 'primary'}
                  size="sm"
                  pulse={currentRoom.status === 'playing'}
                >
                  {currentRoom.status === 'waiting' ? 'Aguardando' : 'Em jogo'}
                </Badge>
              </div>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <p className="text-xs text-muted mb-3 uppercase tracking-wider font-medium">
                Jogadores ({currentRoom.players.length}/{currentRoom.settings.maxPlayers})
              </p>
              <div className="space-y-3">
                <AnimatePresence>
                  {currentRoom.players.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between group"
                    >
                      <AvatarOrb
                        name={p.name}
                        isHost={p.isHost}
                        isYou={p.id === player?.id}
                        status={p.status === 'disconnected' ? 'disconnected' : p.status === 'spectator' ? 'spectator' : 'online'}
                        size="sm"
                      />

                      {isHost && p.id !== player?.id && currentRoom.status === 'waiting' && (
                        <button
                          onClick={() => handleKick(p.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-danger/70 hover:text-danger transition-all px-2 py-1 rounded hover:bg-danger/10"
                        >
                          Remover
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/[0.06]">
              <button
                onClick={handleLeave}
                className="
                  w-full py-2.5 rounded-lg text-sm font-medium
                  border border-danger/30 text-danger
                  bg-transparent hover:bg-danger/10
                  transition-all duration-200
                "
              >
                🚪 Sair da Sala
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* === MAIN CONTENT === */}
      <main className="relative z-10 flex-1 p-4 lg:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto lg:mx-0 space-y-5"
        >
          {/* Host Controls */}
          {isHost && currentRoom.status === 'waiting' && (
            <>
              {/* Settings Card */}
              <GlassCard sharp>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                    ⚙️ Configurações
                  </h3>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-sm text-muted hover:text-primary transition-colors"
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
                          className="w-full px-4 py-2.5 rounded-lg bg-background/80 border border-white/[0.08] text-text focus:outline-none focus:border-primary/40 transition-colors"
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
              <GlassCard sharp>
                <h3 className="font-display text-base font-bold text-text mb-4 flex items-center gap-2">
                  🎮 Iniciar Jogo
                </h3>
                <p className="text-sm text-muted mb-4">Escolha um modo de jogo</p>

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

          {/* Non-host waiting */}
          {!isHost && currentRoom.status === 'waiting' && (
            <GlassCard className="text-center py-10" hover={false}>
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold text-text mb-2">Aguardando host...</h3>
              <p className="text-sm text-muted">O host da sala iniciará o jogo em breve.</p>
            </GlassCard>
          )}

          {/* Playing state */}
          {currentRoom.status === 'playing' && (
            <GlassCard variant="accent" className="text-center py-10" hover={false}>
              <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-accent mb-2">Jogo em andamento!</h3>
              <p className="text-muted">Aguarde o próximo jogo...</p>
            </GlassCard>
          )}

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-danger text-sm text-center bg-danger/10 rounded-lg p-3 border border-danger/20"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
