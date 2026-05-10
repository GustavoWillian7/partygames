import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useImpostorGame } from '../hooks/useImpostorGame';
import { useAuthStore } from '../store/useAuthStore';

export default function ImpostorGamePage() {
  const { state, error, sendClue, submitVote, isImpostor, isWinner, currentPlayerId } = useImpostorGame();
  useAuthStore();
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Jogo do Impostor</h1>
            <p className="text-muted text-sm">Rodada {state.currentRound}</p>
          </div>
          {state.timeRemaining > 0 && (
            <div className={`text-2xl font-bold tabular-nums ${state.timeRemaining <= 10 ? 'text-danger' : 'text-text'}`}>
              {state.timeRemaining}s
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-danger text-sm text-center mb-4"
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
              <div className="bg-surface rounded-2xl p-6 text-center border border-primary/20">
                <p className="text-muted text-sm mb-2">Sua palavra/tema:</p>
                <p className="text-2xl font-bold text-accent">
                  {isImpostor ? state.yourTheme : state.yourWord}
                </p>
                {isImpostor && (
                  <p className="text-danger text-xs mt-2">Você é o impostor! Não saiba a palavra.</p>
                )}
              </div>

              {!myClueGiven && (
                <div className="bg-surface rounded-2xl p-6">
                  <label className="block text-sm font-medium text-text mb-2">Envie sua dica (1 palavra)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clueInput}
                      onChange={(e) => setClueInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendClue()}
                      maxLength={50}
                      placeholder="Ex: peludo"
                      className="flex-1 px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                    />
                    <button
                      onClick={handleSendClue}
                      disabled={!clueInput.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}

              {Object.keys(state.clues).length > 0 && (
                <div className="bg-surface rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Dicas enviadas</h3>
                  <div className="space-y-2">
                    {state.players.map((p) => {
                      const clue = state.clues[p.id];
                      if (!clue) return null;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background"
                        >
                          <span className="text-text font-medium">{p.name}</span>
                          <span className="text-accent font-semibold">{clue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
              <div className="bg-surface rounded-2xl p-6 text-center">
                <h3 className="text-lg font-semibold text-text mb-2">Quem é o impostor?</h3>
                <p className="text-muted text-sm">Vote em quem você acha que é o impostor.</p>
              </div>

              {!hasVoted && (
                <div className="space-y-2">
                  {activePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleVote(p.id)}
                      disabled={p.id === currentPlayerId}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-surface border border-surface hover:border-danger transition-colors disabled:opacity-50"
                    >
                      <span className="text-text font-medium">{p.name}</span>
                      {p.id === currentPlayerId && (
                        <span className="text-xs text-muted">Você</span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => handleVote(null)}
                    className="w-full py-3 rounded-xl bg-surface/50 text-muted hover:text-text transition-colors text-sm"
                  >
                    Pular voto
                  </button>
                </div>
              )}

              {hasVoted && (
                <div className="text-center text-muted py-4">
                  Aguardando os outros votarem...
                </div>
              )}

              {Object.keys(state.votes).length > 0 && (
                <div className="bg-surface rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-muted mb-2">Votos recebidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(state.votes).map(([voterId]) => {
                      const voter = state.players.find((p) => p.id === voterId);
                      return (
                        <span
                          key={voterId}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                        >
                          {voter?.name ?? '???'} votou
                        </span>
                      );
                    })}
                  </div>
                </div>
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
              className="bg-surface rounded-2xl p-8 text-center border border-primary/20"
            >
              <h3 className="text-xl font-bold text-text mb-4">Resultado da Rodada</h3>

              {state.wasTie ? (
                <p className="text-muted">Houve um empate! Ninguém foi eliminado.</p>
              ) : eliminatedPlayer ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="mb-4"
                  >
                    <p className="text-lg text-text">
                      <span className="font-bold text-primary">{eliminatedPlayer.name}</span> foi eliminado!
                    </p>
                    {state.impostorIds?.includes(eliminatedPlayer.id) ? (
                      <p className="text-danger font-bold mt-2">Era o impostor! 🎭</p>
                    ) : (
                      <p className="text-success font-bold mt-2">Não era o impostor! 😇</p>
                    )}
                  </motion.div>
                </>
              ) : (
                <p className="text-muted">Ninguém foi eliminado.</p>
              )}

              <div className="mt-6">
                <p className="text-sm text-muted">Aguardando próxima rodada...</p>
              </div>
            </motion.div>
          )}

          {/* FIM DE JOGO */}
          {state.phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface rounded-2xl p-8 text-center border border-accent/20"
            >
              <h2 className="text-3xl font-bold text-accent mb-4">Fim de Jogo!</h2>
              <p className="text-text text-lg mb-6">{state.reason}</p>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted mb-2">Vencedores</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {state.winnerIds?.map((id) => {
                    const winner = state.players.find((p) => p.id === id);
                    return (
                      <span
                        key={id}
                        className="px-3 py-1 rounded-full bg-accent/20 text-accent font-medium"
                      >
                        {winner?.name ?? id}
                      </span>
                    );
                  })}
                </div>
              </div>

              {isWinner && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl text-success font-bold mb-4"
                >
                  Você venceu! 🎉
                </motion.p>
              )}

              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Voltar ao Início
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de jogadores */}
        <div className="mt-8 bg-surface rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-muted mb-4">Jogadores</h3>
          <div className="grid grid-cols-2 gap-2">
            {state.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  p.isEliminated ? 'bg-danger/10 opacity-50' : 'bg-background'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${p.isEliminated ? 'bg-danger' : 'bg-success'}`} />
                <span className={`text-sm ${p.isEliminated ? 'text-muted line-through' : 'text-text'}`}>
                  {p.name}
                </span>
                {p.id === currentPlayerId && (
                  <span className="text-[10px] text-primary">(você)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
