import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Fingerprint,
  Check,
  Trophy,
  Sparkles,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useDuoChaosGame } from '../hooks/useDuoChaosGame';
import { useRoomStore } from '../store/useRoomStore';
import { leaveRoomAndWait } from '../socket/socketManager';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';
import GlowInput from '../components/ui/GlowInput';
import Badge from '../components/ui/Badge';

export default function DuoChaosGamePage() {
  const { state, error, sendWord, markPair, markedTarget, isMyTurn, isWinner, currentPlayerId } = useDuoChaosGame();
  const { currentRoom, clearRoom } = useRoomStore();
  const navigate = useNavigate();
  const [wordInput, setWordInput] = useState('');

  const currentTurnPlayer = state.players.find((p) => p.id === state.turnPlayerId);

  const handleSendWord = () => {
    if (!wordInput.trim()) return;
    sendWord(wordInput.trim());
    setWordInput('');
  };

  const handleLeave = async () => {
    await leaveRoomAndWait();
    clearRoom();
    navigate('/');
  };

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Target size={24} className="text-accent" />
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent neon-text">
                Encontre sua Dupla
              </h1>
            </div>
            <Badge variant="accent" size="sm">Modo Caos</Badge>
          </div>
          {state.timeRemaining > 0 && (
            <motion.div
              animate={state.timeRemaining <= 10 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={`text-3xl font-black tabular-nums ${
                state.timeRemaining <= 10 ? 'text-danger neon-text' : 'text-text'
              }`}
            >
              {state.timeRemaining}s
            </motion.div>
          )}
          {state.phase === 'playing' && (
            <NeonButton onClick={handleLeave} variant="ghost" size="sm" glow={false}>
              Sair
            </NeonButton>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-danger text-sm text-center mb-4 bg-danger/10 rounded-xl p-3 border border-danger/20"
          >
            {error}
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {/* SETUP / PLAYING */}
          {(state.phase === 'setup' || state.phase === 'playing') && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Secret Word / Impostor Card */}
              <GlassCard variant={state.isImpostor ? 'danger' : 'accent'} className="text-center">
                {state.isImpostor ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                      className="mb-3 flex justify-center"
                    >
                      <Fingerprint size={48} className="text-danger" />
                    </motion.div>
                    <p className="text-danger text-lg font-bold mb-2">Você é o impostor!</p>
                    <p className="text-muted text-sm mb-3">Você não tem palavra secreta.</p>
                    <p className="text-muted text-sm">Tema:</p>
                    <p className="text-2xl font-bold text-accent mt-1">{state.yourTheme ?? '???'}</p>
                    <p className="text-primary text-xs mt-3 bg-primary/10 rounded-lg p-2">
                      Tente fazer dupla com alguém que tenha a palavra secreta!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-muted text-sm mb-2">Sua palavra:</p>
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-black text-accent neon-text-cyan"
                    >
                      {state.yourWord ?? '???'}
                    </motion.p>
                    <p className="text-muted text-xs mt-2">Tema: {state.yourTheme ?? '???'}</p>
                    <p className="text-primary text-xs mt-3 bg-primary/10 rounded-lg p-2">
                      Dê uma dica relacionada, mas não fale a palavra!
                    </p>
                  </>
                )}
              </GlassCard>

              {/* Turn Indicator */}
              <GlassCard className={`text-center ${isMyTurn ? 'neon-border' : ''}`}>
                <p className="text-muted text-sm">Vez de</p>
                <motion.p
                  key={state.turnPlayerId}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`text-xl font-bold ${isMyTurn ? 'text-accent neon-text-cyan' : 'text-text'}`}
                >
                  {isMyTurn ? 'Você!' : currentTurnPlayer?.name ?? '...'}
                </motion.p>
                {isMyTurn && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2"
                  >
                    <Badge variant="accent" size="sm" pulse>Sua vez!</Badge>
                  </motion.div>
                )}
              </GlassCard>

              {/* Word Input */}
              {isMyTurn && (
                <GlassCard>
                  <GlowInput
                    label="Envie uma palavra"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendWord()}
                    maxLength={50}
                    placeholder="Ex: amizade"
                  />
                  <NeonButton
                    onClick={handleSendWord}
                    disabled={!wordInput.trim()}
                    variant="primary"
                    fullWidth
                    className="mt-3"
                  >
                    Enviar
                  </NeonButton>
                </GlassCard>
              )}

              {/* Chat History */}
              {state.chatHistory.length > 0 && (
                <GlassCard>
                  <h3 className="text-sm font-bold text-muted mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Palavras enviadas
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {state.chatHistory.map((msg, idx) => {
                      const sender = state.players.find((p) => p.id === msg.playerId);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-background/60 border border-glassBorder"
                        >
                          <span className="text-xs text-muted">{sender?.name ?? '???'}</span>
                          <span className="text-accent font-bold">{msg.word}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Mark Pair */}
              <GlassCard>
                <h3 className="text-sm font-bold text-muted mb-3">Quem é sua dupla?</h3>
                <div className="grid grid-cols-2 gap-2">
                  {state.players
                    .filter((p) => p.id !== currentPlayerId && !p.isEliminated)
                    .map((p) => (
                      <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => markPair(p.id)}
                        disabled={markedTarget === p.id}
                        className={`
                          p-3 rounded-xl text-sm font-medium transition-all duration-300 border
                          ${markedTarget === p.id
                            ? 'bg-accent/20 text-accent border-accent glow-accent'
                            : 'bg-background/60 text-text border-glassBorder hover:border-primary'
                          }
                          disabled:cursor-not-allowed
                        `}
                      >
                        {p.name}
                        {markedTarget === p.id && <Check size={14} className="inline ml-1" />}
                      </motion.button>
                    ))}
                </div>
                {markedTarget && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted mt-2 text-center"
                  >
                    Você marcou{' '}
                    <span className="text-accent font-medium">
                      {state.players.find((p) => p.id === markedTarget)?.name}
                    </span>
                    {' '}como dupla. Aguardando...
                  </motion.p>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* FINISHED */}
          {state.phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <GlassCard variant="accent" className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="mb-4 flex justify-center"
                >
                  <Trophy size={64} className="text-accent" />
                </motion.div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary-light neon-text mb-4">
                  Fim de Jogo!
                </h2>
                <p className="text-text text-lg mb-6">{state.reason}</p>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted mb-3">Vencedores</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {state.winnerIds?.map((id) => {
                      const winner = state.players.find((p) => p.id === id);
                      return (
                        <motion.span
                          key={id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-4 py-2 rounded-full bg-accent/20 text-accent font-bold border border-accent/30 inline-flex items-center gap-1"
                        >
                          <Sparkles size={16} />
                          {winner?.name ?? id}
                        </motion.span>
                      );
                    })}
                  </div>
                </div>

                {isWinner && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="inline-block px-6 py-3 rounded-2xl bg-success/20 border border-success/30">
                      <p className="text-xl text-success font-bold flex items-center justify-center gap-2">
                        <Sparkles size={20} />
                        Você venceu!
                        <Sparkles size={20} />
                      </p>
                    </div>
                  </motion.div>
                )}

                <NeonButton
                  onClick={() => {
                    const roomId = currentRoom?.id;
                    if (roomId) navigate(`/room/${roomId}`);
                    else navigate('/');
                  }}
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  Voltar à Sala
                </NeonButton>
                <NeonButton onClick={handleLeave} variant="ghost" size="sm" fullWidth glow={false} className="mt-2">
                  Sair da Sala
                </NeonButton>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players List */}
        <GlassCard className="mt-6">
          <h3 className="text-sm font-bold text-muted mb-4 flex items-center gap-2">
            <Users size={16} />
            Jogadores
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {state.players.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 p-2 rounded-xl ${
                  p.isEliminated ? 'bg-danger/10 opacity-50' : 'bg-background/60'
                } border border-glassBorder`}
              >
                <div className={`w-2 h-2 rounded-full ${p.isEliminated ? 'bg-danger' : 'bg-success'}`} />
                <span className={`text-sm ${p.isEliminated ? 'text-muted line-through' : 'text-text'}`}>
                  {p.name}
                </span>
                {p.id === currentPlayerId && (
                  <span className="text-[10px] text-primary font-medium">(você)</span>
                )}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
