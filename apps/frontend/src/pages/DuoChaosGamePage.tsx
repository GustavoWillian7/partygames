import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDuoChaosGame } from '../hooks/useDuoChaosGame';

export default function DuoChaosGamePage() {
  const { state, error, sendWord, markPair, markedTarget, isMyTurn, isWinner, currentPlayerId } = useDuoChaosGame();
  const navigate = useNavigate();
  const [wordInput, setWordInput] = useState('');
  const [showRole, setShowRole] = useState(false);

  const currentTurnPlayer = state.players.find((p) => p.id === state.turnPlayerId);

  const handleSendWord = () => {
    if (!wordInput.trim()) return;
    sendWord(wordInput.trim());
    setWordInput('');
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
            <h1 className="text-2xl font-bold text-primary">Encontre sua Dupla</h1>
            <p className="text-muted text-sm">Modo Caos</p>
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
          {/* SETUP / PLAYING */}
          {(state.phase === 'setup' || state.phase === 'playing') && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Role Card */}
              <div className="bg-surface rounded-2xl p-6 text-center border border-primary/20">
                <p className="text-muted text-sm mb-2">Seu papel</p>
                <button
                  onClick={() => setShowRole(!showRole)}
                  className="text-lg font-bold text-accent hover:underline"
                >
                  {showRole ? (
                    <span>
                      {state.yourRole === 'impostor' && 'Impostor 🎭'}
                      {state.yourRole === 'pair' && `Dupla (com ${state.players.find(p => p.id === state.yourPartnerId)?.name ?? '?'}) 💕`}
                      {state.yourRole === 'solo' && 'Solo 🧍'}
                      {!state.yourRole && '???'}
                    </span>
                  ) : (
                    'Clique para revelar'
                  )}
                </button>
              </div>

              {/* Turn Indicator */}
              <div className="bg-surface rounded-2xl p-4 text-center">
                <p className="text-muted text-sm">Vez de</p>
                <p className="text-xl font-bold text-text">
                  {isMyTurn ? 'Você!' : currentTurnPlayer?.name ?? '...'}
                </p>
              </div>

              {/* Word Input */}
              {isMyTurn && (
                <div className="bg-surface rounded-2xl p-6">
                  <label className="block text-sm font-medium text-text mb-2">Envie uma palavra</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={wordInput}
                      onChange={(e) => setWordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendWord()}
                      maxLength={50}
                      placeholder="Ex: amizade"
                      className="flex-1 px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                    />
                    <button
                      onClick={handleSendWord}
                      disabled={!wordInput.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}

              {/* Chat History */}
              {state.chatHistory.length > 0 && (
                <div className="bg-surface rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-muted mb-3">Palavras enviadas</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {state.chatHistory.map((msg, idx) => {
                      const sender = state.players.find((p) => p.id === msg.playerId);
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-background">
                          <span className="text-xs text-muted">{sender?.name ?? '???'}</span>
                          <span className="text-accent font-medium">{msg.word}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mark Pair */}
              <div className="bg-surface rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-muted mb-3">Quem é sua dupla?</h3>
                <div className="grid grid-cols-2 gap-2">
                  {state.players
                    .filter((p) => p.id !== currentPlayerId && !p.isEliminated)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => markPair(p.id)}
                        disabled={markedTarget === p.id}
                        className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                          markedTarget === p.id
                            ? 'bg-accent/20 text-accent border border-accent'
                            : 'bg-background text-text border border-surface hover:border-primary'
                        }`}
                      >
                        {p.name}
                        {markedTarget === p.id && ' ✓'}
                      </button>
                    ))}
                </div>
                {markedTarget && (
                  <p className="text-xs text-muted mt-2 text-center">
                    Você marcou {state.players.find((p) => p.id === markedTarget)?.name} como dupla. Aguardando...
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* FINISHED */}
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

        {/* Players List */}
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
