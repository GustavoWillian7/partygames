import type { Player, PlayerProfile } from './player';
import type { Room, RoomSettings, GameType } from './room';
import type { GameState } from './game';

export interface ClientEvents {
  'auth:login': (payload: { email: string; password: string }) => void;
  'auth:register': (payload: { name: string; email: string; password: string }) => void;
  'auth:guest': (payload: { name: string }) => void;

  'room:create': (payload: { name: string; settings?: Partial<RoomSettings> }) => void;
  'room:join': (payload: { roomId: string }) => void;
  'room:leave': () => void;
  'room:request-state': () => void;
  'room:kick': (payload: { playerId: string }) => void;
  'room:update-settings': (payload: Partial<RoomSettings>) => void;
  'room:start-game': (payload: { gameType: GameType }) => void;

  'impostor:send-clue': (payload: { word: string }) => void;
  'impostor:vote': (payload: { votedPlayerId: string | null }) => void;
  'impostor:request-state': () => void;

  'duo-chaos:send-word': (payload: { word: string }) => void;
  'duo-chaos:mark-pair': (payload: { targetPlayerId: string }) => void;
  'duo-chaos:request-state': () => void;
}

export interface ServerEvents {
  'auth:success': (payload: { player: PlayerProfile; token: string }) => void;
  'auth:error': (payload: { message: string }) => void;

  'room:state': (payload: Room) => void;
  'room:player-joined': (payload: { player: Player }) => void;
  'room:player-left': (payload: { playerId: string; newHostId?: string }) => void;
  'room:player-reconnected': (payload: { player: Player }) => void;
  'room:error': (payload: { message: string }) => void;
  'room:game-started': (payload: { gameType: GameType; initialState: GameState }) => void;
  'room:left': (payload: { success: boolean; message?: string }) => void;

  'impostor:round-start': (payload: {
    round: number;
    timeRemaining: number;
    yourWord?: string;
    yourTheme?: string;
    isImpostor?: boolean;
  }) => void;
  'impostor:clue-received': (payload: { playerId: string; word: string }) => void;
  'impostor:voting-start': (payload: { players: Player[] }) => void;
  'impostor:vote-received': (payload: { voterId: string; votedId: string | null }) => void;
  'impostor:reveal': (payload: {
    eliminatedId: string;
    wasImpostor: boolean;
    impostorIds: string[];
  }) => void;
  'impostor:state': (payload: {
    gameType: 'impostor';
    phase: 'setup' | 'playing' | 'voting' | 'reveal' | 'finished';
    currentRound: number;
    timeRemaining: number;
    players: { id: string; name: string; isEliminated: boolean }[];
    clues: Record<string, string>;
    votes: Record<string, string | null>;
    eliminatedThisRound?: string;
    yourWord?: string;
    yourTheme?: string;
    isImpostor?: boolean;
  }) => void;
  'impostor:game-over': (payload: { winnerIds: string[]; reason: string }) => void;

  'duo-chaos:turn-start': (payload: {
    turnPlayerId: string;
    timeRemaining: number;
    yourWord?: string;
    yourTheme?: string;
  }) => void;
  'duo-chaos:word-received': (payload: { playerId: string; word: string }) => void;
  'duo-chaos:pair-marked': (payload: { playerId: string; targetId: string }) => void;
  'duo-chaos:state': (payload: {
    gameType: 'duo-chaos';
    phase: 'playing' | 'finished';
    turnPlayerId: string;
    timeRemaining: number;
    players: { id: string; name: string; isEliminated: boolean }[];
    wordsGiven: Record<string, string>;
    chatHistory: { playerId: string; word: string; timestamp: Date }[];
    yourRole?: 'impostor' | 'pair' | 'solo';
    yourPartnerId?: string;
  }) => void;
  'duo-chaos:game-over': (payload: { winnerIds: string[]; reason: string }) => void;

  'server:shutdown': (payload: { message: string }) => void;

  error: (payload: { code: string; message: string }) => void;
  notification: (payload: {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
  }) => void;
}
