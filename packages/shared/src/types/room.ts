export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'paused';
export type GameType = 'impostor' | 'duo-chaos';

export interface RoomSettings {
  maxPlayers: number;
  roundTimeSeconds: number;
  allowReconnection: boolean;
  isPublic: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: import('./player').Player[];
  status: RoomStatus;
  currentGame?: GameType;
  settings: RoomSettings;
  createdAt: Date;
  updatedAt: Date;
}
