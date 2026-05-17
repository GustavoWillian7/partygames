import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket/socketManager';
import { useAuthStore } from '../store/useAuthStore';

export type GamePhase = 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';

export interface ImpostorGameState {
  phase: GamePhase;
  currentRound: number;
  timeRemaining: number;
  yourWord?: string;
  yourTheme?: string;
  isImpostor?: boolean;
  clues: Record<string, string>;
  votes: Record<string, string | null>;
  players: { id: string; name: string; isEliminated: boolean }[];
  eliminatedThisRound?: string;
  impostorIds?: string[];
  winnerIds?: string[];
  reason?: string;
  wasTie?: boolean;
}

export function useImpostorGame() {
  const { player } = useAuthStore();
  const [state, setState] = useState<ImpostorGameState>({
    phase: 'setup',
    currentRound: 0,
    timeRemaining: 0,
    clues: {},
    votes: {},
    players: [],
  });
  const [error, setError] = useState<string | null>(null);
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
      if (payload.gameType === 'impostor') {
        setState((prev) => ({
          ...prev,
          players: payload.initialState.players.map((p) => ({ ...p, isEliminated: false })),
        }));
      }
    };

    const onState = (payload: {
      phase: GamePhase;
      currentRound: number;
      timeRemaining: number;
      players: { id: string; name: string; isEliminated: boolean }[];
      clues: Record<string, string>;
      votes: Record<string, string | null>;
      eliminatedThisRound?: string;
      yourWord?: string;
      yourTheme?: string;
      isImpostor?: boolean;
    }) => {
      setState((prev) => ({
        ...prev,
        phase: payload.phase,
        currentRound: payload.currentRound,
        timeRemaining: payload.timeRemaining,
        players: payload.players,
        clues: payload.clues,
        votes: payload.votes,
        eliminatedThisRound: payload.eliminatedThisRound,
        yourWord: payload.yourWord,
        yourTheme: payload.yourTheme,
        isImpostor: payload.isImpostor,
      }));
      if (payload.phase === 'playing' || payload.phase === 'voting') {
        startTimer(payload.timeRemaining);
      }
    };

    const onRoundStart = (payload: {
      round: number;
      timeRemaining: number;
      yourWord?: string;
      yourTheme?: string;
      isImpostor?: boolean;
    }) => {
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentRound: payload.round,
        yourWord: payload.yourWord,
        yourTheme: payload.yourTheme,
        isImpostor: payload.isImpostor,
        clues: {},
        votes: {},
        eliminatedThisRound: undefined,
      }));
      startTimer(payload.timeRemaining);
    };

    const onClueReceived = (payload: { playerId: string; word: string }) => {
      setState((prev) => ({
        ...prev,
        clues: { ...prev.clues, [payload.playerId]: payload.word },
      }));
    };

    const onVotingStart = (payload: { players: { id: string; name: string }[] }) => {
      setState((prev) => ({
        ...prev,
        phase: 'voting',
        votes: {},
        players: payload.players.map((p) => ({ ...p, isEliminated: prev.players.find((op) => op.id === p.id)?.isEliminated ?? false })),
      }));
      startTimer(30);
    };

    const onVoteReceived = (payload: { voterId: string; votedId: string | null }) => {
      setState((prev) => ({
        ...prev,
        votes: { ...prev.votes, [payload.voterId]: payload.votedId },
      }));
    };

    const onReveal = (payload: {
      eliminatedId: string | null;
      wasImpostor: boolean;
      impostorIds: string[];
      wasTie?: boolean;
    }) => {
      stopTimer();
      setState((prev) => ({
        ...prev,
        phase: 'reveal',
        eliminatedThisRound: payload.eliminatedId ?? undefined,
        impostorIds: payload.impostorIds,
        wasTie: payload.wasTie,
      }));
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
    socket.on('impostor:state', onState);
    socket.on('impostor:round-start', onRoundStart);
    socket.on('impostor:clue-received', onClueReceived);
    socket.on('impostor:voting-start', onVotingStart);
    socket.on('impostor:vote-received', onVoteReceived);
    socket.on('impostor:reveal', onReveal);
    socket.on('impostor:game-over', onGameOver);
    socket.on('error', onError);

    // Solicitar estado atual ao montar (útil para reconexão ou navegação tardia)
    socket.emit('impostor:request-state');

    return () => {
      socket.off('room:game-started', onGameStarted);
      socket.off('impostor:state', onState);
      socket.off('impostor:round-start', onRoundStart);
      socket.off('impostor:clue-received', onClueReceived);
      socket.off('impostor:voting-start', onVotingStart);
      socket.off('impostor:vote-received', onVoteReceived);
      socket.off('impostor:reveal', onReveal);
      socket.off('impostor:game-over', onGameOver);
      socket.off('error', onError);
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  const sendClue = useCallback((word: string) => {
    const socket = getSocket();
    socket.emit('impostor:send-clue', { word });
    setState((prev) => ({
      ...prev,
      clues: { ...prev.clues, [player?.id ?? '']: word },
    }));
  }, [player?.id]);

  const submitVote = useCallback((votedPlayerId: string | null) => {
    const socket = getSocket();
    socket.emit('impostor:vote', { votedPlayerId });
    setState((prev) => ({
      ...prev,
      votes: { ...prev.votes, [player?.id ?? '']: votedPlayerId },
    }));
  }, [player?.id]);

  const isWinner = player?.id ? state.winnerIds?.includes(player.id) : false;

  return {
    state,
    error,
    sendClue,
    submitVote,
    isWinner,
    currentPlayerId: player?.id ?? null,
  };
}
