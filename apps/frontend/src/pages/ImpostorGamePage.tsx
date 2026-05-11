import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useImpostorGame } from '../hooks/useImpostorGame';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { getSocket } from '../socket/socketManager';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';
import GlowInput from '../components/ui/GlowInput';
import AvatarOrb from '../components/ui/AvatarOrb';
import Badge from '../components/ui/Badge';

export default function ImpostorGamePage() {
  const { state, error, sendClue, submitVote, isWinner, currentPlayerId } = useImpostorGame();
  useAuthStore();
  const { clearRoom } = useRoomStore();
  const navigate = useNavigate();
  const [clueInput, setClueInput] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (state.phase === 'voting') {
      setHasVoted(false);
    }
  }, [state.phase]);

  const activePlayers = state.players.filter((p) => !p.isEliminated);
  const eliminatedPlayer = state.players.find((p) => p.id === state.eliminatedThisRound);
  const myClueGiven = currentPlayerId ? state.clues[currentPlayerId] !== undefined : false;

  const handleSendClue = () => {
    if (!clueInput.trim()) return;
    sendClue(clueInput.trim());
    setClueInput('');
  };

  const handleVote = (id: string | null) => {
    submitVote(id);
    setHasVoted(true);
  };

  const handleLeave = () => {
    const socket = getSocket();
    socket.emit('room:leave');
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
              <span className="text-2xl">🎭</span>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent neon-text">
                Jogo do Impostor
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" size="sm">Rodada {state.currentRound}</Badge>
              {state.isImpostor && <Badge variant="danger" size="sm" pulse>Impostor</Badge>}
            </div>
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
          {/* FASE DE DICAS */}
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
                      className="text-5xl mb-3">
                      🎭
                    </motion.div>
                    <p className="text-danger text-lg font-bold mb-2">Você é o impostor!</p>
                    <p className="text-muted text-sm mb-3">Você não sabe a palavra secreta.</p>
                    <p className="text-muted text-sm">Tema:</p>
                    <p className="text-2xl font-bold text-accent mt-1">{state.yourTheme}</p>
                    <p className="text-primary text-xs mt-3 bg-primary/10 rounded-lg p-2">
                      Dê uma dica que combine com o tema sem parecer suspeito!
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
                      {state.yourWord}
                    </motion.p>
                    <p className="text-muted text-xs mt-2">Tema: {state.yourTheme}</p>
                    <p className="text-primary text-xs mt-3 bg-primary/10 rounded-lg p-2">
                      Dê uma dica relacionada, mas não fale a palavra!
                    </p>
                  </>
                )}
              </GlassCard>

              {/* Clue Input */}
              {!myClueGiven && (
                <GlassCard>
                  <GlowInput
                    label="Envie sua dica (1 palavra)"
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendClue()}
                    maxLength={50}
                    placeholder="Ex: peludo"
                  />
                  <NeonButton
                    onClick={handleSendClue}
                    disabled={!clueInput.trim()}
                    variant="primary"
                    fullWidth
                    className="mt-3"
                  >
                    Enviar Dica
                  </NeonButton>
                </GlassCard>
              )}

              {myClueGiven && (
                <GlassCard variant="success" className="text-center">
                  <span className="text-2xl">✅</span>
                  <p className="text-success font-medium">Dica enviada! Aguarde os outros jogadores...</p>
                </GlassCard>
              )}

              {/* Clues */}
              {Object.keys(state.clues).length > 0 && (
                <GlassCard>
                  <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                    📝 Dicas enviadas
                  </h3>
                  <div className="space-y-2">
                    {state.players.map((p) => {
                      const clue = state.clues[p.id];
                      if (!clue) return null;
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-glassBorder"
                        >
                          <div className="flex items-center gap-2">
                            <AvatarOrb name={p.name} size="sm" />
                            <span className="text-text font-medium">{p.name}</span>
                          </div>
                          <span className="text-accent font-bold text-lg">{clue}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}

          {/* FASE DE VOTAÇÃO */}
          {state.phase === 'voting' && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <GlassCard className="text-center">
                <span className="text-4xl">🗳️</span>
                <h3 className="text-xl font-bold text-text mt-2">Quem é o impostor?</h3>
                <p className="text-muted text-sm">Vote em quem você acha que é o impostor.</p>
              </GlassCard>

              {!hasVoted && (
                <div className="space-y-2">
                  {activePlayers.map((p) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVote(p.id)}
                      disabled={p.id === currentPlayerId}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-xl
                        glass border border-glassBorder
                        transition-all duration-300
                        ${p.id === currentPlayerId ? 'opacity-50 cursor-not-allowed' : 'hover:border-danger/50 hover:shadow-lg hover:shadow-danger/10'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <AvatarOrb name={p.name} size="md" />
                        <span className="text-text font-medium">{p.name}</span>
                      </div>
                      {p.id === currentPlayerId && <span className="text-xs text-muted">Você</span>}
                    </motion.button>
                  ))}
                  <NeonButton
                    onClick={() => handleVote(null)}
                    variant="ghost"
                    fullWidth
                    glow={false}
                  >
                    Pular voto
                  </NeonButton>
                </div>
              )}

              {hasVoted && (
                <GlassCard variant="accent" className="text-center">
                  <div className="py-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-accent font-medium">Aguardando os outros votarem...</p>
                  </div>
                </GlassCard>
              )}

              {Object.keys(state.votes).length > 0 && (
                <GlassCard>
                  <h3 className="text-sm font-semibold text-muted mb-2">Votos recebidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(state.votes).map(([voterId]) => {
                      const voter = state.players.find((p) => p.id === voterId);
                      return (
                        <Badge key={voterId} variant="primary" size="sm">
                          {voter?.name ?? '???'} votou
                        </Badge>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}

          {/* FASE DE REVELAÇÃO */}
          {state.phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <GlassCard className="text-center">
                <h3 className="text-xl font-bold text-text mb-4">Resultado da Rodada</h3>

                {state.wasTie ? (
                  <div className="py-4">
                    <span className="text-4xl">🤝</span>
                    <p className="text-muted mt-2">Houve um empate! Ninguém foi eliminado.</p>
                  </div>
                ) : eliminatedPlayer ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="py-4"
                  >
                    <AvatarOrb name={eliminatedPlayer.name} size="lg" className="mx-auto mb-3" />
                    <p className="text-lg text-text">
                      <span className="font-bold text-primary">{eliminatedPlayer.name}</span> foi eliminado!
                    </p>
                    {state.impostorIds?.includes(eliminatedPlayer.id) ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-danger font-bold mt-2 text-xl"
                      >
                        Era o impostor! 🎭
                      </motion.p>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-success font-bold mt-2 text-xl"
                      >
                        Não era o impostor! 😇
                      </motion.p>
                    )}
                  </motion.div>
                ) : (
                  <p className="text-muted">Ninguém foi eliminado.</p>
                )}

                <div className="mt-6">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted">Aguardando próxima rodada...</p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* FIM DE JOGO */}
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
                  className="text-6xl mb-4"
                >
                  🏆
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
                          className="px-4 py-2 rounded-full bg-accent/20 text-accent font-bold border border-accent/30"
                        >
                          🎉 {winner?.name ?? id}
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
                      <p className="text-xl text-success font-bold">🎊 Você venceu! 🎊</p>
                    </div>
                  </motion.div>
                )}

                <NeonButton onClick={handleLeave} variant="primary" size="lg" fullWidth>
                  Voltar ao Início
                </NeonButton>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players List */}
        <GlassCard className="mt-6">
          <h3 className="text-sm font-bold text-muted mb-4 flex items-center gap-2">
            👥 Jogadores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
