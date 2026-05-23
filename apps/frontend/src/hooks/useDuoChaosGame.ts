import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket/socketManager';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';

export type DuoChaosPhase = 'setup' | 'playing' | 'finished';

export interface DuoChaosGameState {
  phase: DuoChaosPhase;
  turnPlayerId: string;
  timeRemaining: number;
  players: { id: string; name: string; isEliminated: boolean }[];
  wordsGiven: Record<string, string>;
  chatHistory: { playerId: string; word: string; timestamp: Date }[];
  yourWord?: string;
  yourTheme?: string;
  isImpostor?: boolean;
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
        // Resetar estado completamente para evitar dados do jogo anterior
        setState({
          phase: 'setup',
          turnPlayerId: '',
          timeRemaining: 0,
          players: payload.initialState.players.map((p) => ({ ...p, isEliminated: false })),
          wordsGiven: {},
          chatHistory: [],
          yourWord: undefined,
          yourTheme: undefined,
          isImpostor: undefined,
          winnerIds: undefined,
          reason: undefined,
        });
      }
    };

    const onState = (payload: {
      phase: DuoChaosPhase;
      turnPlayerId: string;
      timeRemaining: number;
      players: { id: string; name: string; isEliminated: boolean }[];
      wordsGiven: Record<string, string>;
      chatHistory: { playerId: string; word: string; timestamp: Date }[];
      yourWord?: string;
      yourTheme?: string;
      isImpostor?: boolean;
    }) => {
      setState((prev) => ({
        ...prev,
        phase: payload.phase,
        turnPlayerId: payload.turnPlayerId,
        timeRemaining: payload.timeRemaining,
        players: payload.players,
        wordsGiven: payload.wordsGiven,
        chatHistory: payload.chatHistory,
        yourWord: payload.yourWord ?? prev.yourWord,
        yourTheme: payload.yourTheme ?? prev.yourTheme,
        isImpostor: payload.isImpostor ?? prev.isImpostor,
      }));
      if (payload.phase === 'playing') {
        startTimer(payload.timeRemaining);
      }
    };

    const onTurnStart = (payload: {
      turnPlayerId: string;
      timeRemaining: number;
      yourWord?: string;
      yourTheme?: string;
      isImpostor?: boolean;
    }) => {
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        turnPlayerId: payload.turnPlayerId,
        wordsGiven: {},
        // Evento broadcast pode não ter dados individuais — preservar se ausente
        yourWord: payload.yourWord ?? prev.yourWord,
        yourTheme: payload.yourTheme ?? prev.yourTheme,
        isImpostor: payload.isImpostor ?? prev.isImpostor,
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
      useRoomStore.getState().addLog(`Encontre sua Dupla terminou: ${payload.reason}`);
    };

    const onError = (payload: { code: string; message: string }) => {
      if (payload.code === 'GAME_ERROR') {
        setError(payload.message);
        setTimeout(() => setError(null), 4000);
      }
    };

    const onRoomState = (room: { id: string; players: { id: string; name: string }[]; status: string }) => {
      useRoomStore.getState().setRoom(room as import('@partygames/shared').Room);
    };

    socket.on('room:game-started', onGameStarted);
    socket.on('room:state', onRoomState);
    socket.on('duo-chaos:state', onState);
    socket.on('duo-chaos:turn-start', onTurnStart);
    socket.on('duo-chaos:word-received', onWordReceived);
    socket.on('duo-chaos:pair-marked', onPairMarked);
    socket.on('duo-chaos:game-over', onGameOver);
    socket.on('error', onError);

    socket.emit('duo-chaos:request-state');

    return () => {
      socket.off('room:game-started', onGameStarted);
      socket.off('room:state', onRoomState);
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
    // Não atualizar estado otimisticamente — aguardar confirmação do backend via 'duo-chaos:pair-marked'
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
