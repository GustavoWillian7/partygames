import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket/socketManager';
import { useAuthStore } from '../store/useAuthStore';

export type DuoChaosPhase = 'setup' | 'playing' | 'finished';
export type DuoChaosRole = 'impostor' | 'pair' | 'solo';

export interface DuoChaosGameState {
  phase: DuoChaosPhase;
  turnPlayerId: string;
  timeRemaining: number;
  players: { id: string; name: string; isEliminated: boolean }[];
  wordsGiven: Record<string, string>;
  chatHistory: { playerId: string; word: string; timestamp: Date }[];
  yourRole?: DuoChaosRole;
  yourPartnerId?: string;
  winnerIds?: string[];
  reason?: string;
}

export function useDuoChaosGame() {
  const { player } = useAuthStore();
  const [state, setState] = useState<DuoChaosGameState>({
    phase: 'setup',
    turnPlayerId: '',
    timeRemaining: 0,
    players: [],
    wordsGiven: {},
    chatHistory: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [markedTarget, setMarkedTarget] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = seconds;
    setState((prev) => ({ ...prev, timeRemaining: remaining }));
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setState((prev) => ({ ...prev, timeRemaining: Math.max(0, remaining) }));
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onGameStarted = (payload: { gameType: string; initialState: { players: { id: string; name: string }[] } }) => {
      if (payload.gameType === 'duo-chaos') {
        setState((prev) => ({
          ...prev,
          players: payload.initialState.players.map((p) => ({ ...p, isEliminated: false })),
        }));
      }
    };

    const onState = (payload: {
      phase: DuoChaosPhase;
      turnPlayerId: string;
      timeRemaining: number;
      players: { id: string; name: string; isEliminated: boolean }[];
      wordsGiven: Record<string, string>;
      chatHistory: { playerId: string; word: string; timestamp: Date }[];
      yourRole?: DuoChaosRole;
      yourPartnerId?: string;
    }) => {
      setState((prev) => ({
        ...prev,
        phase: payload.phase,
        turnPlayerId: payload.turnPlayerId,
        timeRemaining: payload.timeRemaining,
        players: payload.players,
        wordsGiven: payload.wordsGiven,
        chatHistory: payload.chatHistory,
        yourRole: payload.yourRole,
        yourPartnerId: payload.yourPartnerId,
      }));
      if (payload.phase === 'playing') {
        startTimer(payload.timeRemaining);
      }
    };

    const onTurnStart = (payload: {
      turnPlayerId: string;
      timeRemaining: number;
      yourRole?: DuoChaosRole;
      yourPartnerId?: string;
    }) => {
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        turnPlayerId: payload.turnPlayerId,
        wordsGiven: {},
        yourRole: payload.yourRole ?? prev.yourRole,
        yourPartnerId: payload.yourPartnerId ?? prev.yourPartnerId,
      }));
      startTimer(payload.timeRemaining);
    };

    const onWordReceived = (payload: { playerId: string; word: string }) => {
      setState((prev) => ({
        ...prev,
        wordsGiven: { ...prev.wordsGiven, [payload.playerId]: payload.word },
        chatHistory: [
          ...prev.chatHistory,
          { playerId: payload.playerId, word: payload.word, timestamp: new Date() },
        ],
      }));
    };

    const onPairMarked = (payload: { playerId: string; targetId: string }) => {
      if (payload.playerId === player?.id) {
        setMarkedTarget(payload.targetId);
      }
    };

    const onGameOver = (payload: { winnerIds: string[]; reason: string }) => {
      stopTimer();
      setState((prev) => ({
        ...prev,
        phase: 'finished',
        winnerIds: payload.winnerIds,
        reason: payload.reason,
      }));
    };

    const onError = (payload: { code: string; message: string }) => {
      if (payload.code === 'GAME_ERROR') {
        setError(payload.message);
        setTimeout(() => setError(null), 4000);
      }
    };

    socket.on('room:game-started', onGameStarted);
    socket.on('duo-chaos:state', onState);
    socket.on('duo-chaos:turn-start', onTurnStart);
    socket.on('duo-chaos:word-received', onWordReceived);
    socket.on('duo-chaos:pair-marked', onPairMarked);
    socket.on('duo-chaos:game-over', onGameOver);
    socket.on('error', onError);

    socket.emit('duo-chaos:request-state');

    return () => {
      socket.off('room:game-started', onGameStarted);
      socket.off('duo-chaos:state', onState);
      socket.off('duo-chaos:turn-start', onTurnStart);
      socket.off('duo-chaos:word-received', onWordReceived);
      socket.off('duo-chaos:pair-marked', onPairMarked);
      socket.off('duo-chaos:game-over', onGameOver);
      socket.off('error', onError);
      stopTimer();
    };
  }, [startTimer, stopTimer, player?.id]);

  const sendWord = useCallback((word: string) => {
    const socket = getSocket();
    socket.emit('duo-chaos:send-word', { word });
  }, []);

  const markPair = useCallback((targetPlayerId: string) => {
    const socket = getSocket();
    socket.emit('duo-chaos:mark-pair', { targetPlayerId });
    setMarkedTarget(targetPlayerId);
  }, []);

  const isMyTurn = player?.id === state.turnPlayerId;
  const isWinner = player?.id ? state.winnerIds?.includes(player.id) : false;

  return {
    state,
    error,
    sendWord,
    markPair,
    markedTarget,
    isMyTurn,
    isWinner,
    currentPlayerId: player?.id ?? null,
  };
}
